import { ShippingQuote, ShippingQuoteSequence } from '../mongoose/models/ShippingQuote';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import { ShippingError } from '$lib/shipping/validation';

let initialFloor: Promise<number> | undefined;

function checkedFloor(value: unknown) {
	if (
		typeof value !== 'number' ||
		!Number.isSafeInteger(value) ||
		value < 0 ||
		value >= Number.MAX_SAFE_INTEGER
	)
		throw new ShippingError('Existing quote numbers exceed the supported numbering range.', 503);
	return value;
}

async function readInitialFloor() {
	const [ups, shipping] = await Promise.all([
		UpsQuote.findOne().sort({ quote: -1 }).select('quote').lean<{ quote?: unknown } | null>(),
		ShippingQuote.aggregate<{ value: number }>([
			{ $match: { number: { $regex: '^(S-)?[0-9]+$' } } },
			{
				$project: {
					value: {
						$convert: {
							input: { $replaceOne: { input: '$number', find: 'S-', replacement: '' } },
							to: 'double',
							onError: null,
							onNull: null
						}
					}
				}
			},
			{ $group: { _id: null, value: { $max: '$value' } } }
		])
	]);
	return Math.max(checkedFloor(ups?.quote ?? 0), checkedFloor(shipping[0]?.value ?? 0));
}

// Both quote writers reserve from this same document. Never derive a number from the last saved row.
export async function nextQuoteNumber(): Promise<number> {
	// Once migrated, reserve directly from the durable shared counter, including on cold starts.
	const ready = await ShippingQuoteSequence.findOneAndUpdate(
		{ _id: 'shipping', initialized: true, value: { $gte: 0, $lt: Number.MAX_SAFE_INTEGER } },
		{ $inc: { value: 1 } },
		{ new: true }
	).lean();
	if (ready) return checkedFloor(ready.value - 1) + 1;
	const minimum = await (initialFloor ??= readInitialFloor().catch((error) => {
		initialFloor = undefined;
		throw error;
	}));
	const reserve = (upsert: boolean) =>
		ShippingQuoteSequence.findOneAndUpdate(
			{
				_id: 'shipping',
				$or: [{ value: { $lt: Number.MAX_SAFE_INTEGER } }, { value: { $exists: false } }]
			},
			[
				{
					$set: {
						initialized: true,
						value: { $add: [{ $max: [{ $ifNull: ['$value', 0] }, minimum] }, 1] }
					}
				}
			],
			{ upsert, new: true }
		).lean();
	let sequence;
	try {
		sequence = await reserve(true);
	} catch (error) {
		// Concurrent first requests can race to create the document. Retry the existing row only.
		if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000))
			throw error;
		sequence = await reserve(false);
	}
	if (!sequence || !Number.isSafeInteger(sequence.value) || sequence.value <= 0)
		throw new ShippingError('Could not allocate a quote number. Try again.', 503);
	return sequence.value;
}
