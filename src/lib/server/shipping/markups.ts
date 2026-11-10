import { ShippingMarkup } from '../mongoose/models/ShippingMarkup';
import { parseMarkupRange, validateRanges } from '$lib/shipping/markups';
import { ShippingError } from '$lib/shipping/validation';
import type { MarkupConfig, ShippingService } from '$lib/shipping/types';

export async function getMarkupConfigs(): Promise<MarkupConfig[]> {
	const records = await ShippingMarkup.find().select('service revision ranges -_id').lean();
	return (['UPS', 'LTL'] as const).map((service) => {
		const entry = records.find((row) => row.service === service);
		return {
			service,
			revision: entry?.revision ?? 0,
			ranges:
				entry?.ranges.map((range) => ({
					id: range.id,
					label: range.label,
					minCents: range.minCents,
					maxCents: range.maxCents ?? null,
					percentBps: range.percentBps
				})) ?? []
		};
	});
}

export async function manageMarkup(fields: FormData, userId: string, action: 'save' | 'delete') {
	const service = fields.get('service');
	if (service !== 'UPS' && service !== 'LTL') throw new ShippingError('Select UPS or LTL.');
	const revisionText = fields.get('revision');
	if (typeof revisionText !== 'string' || !/^\d{1,9}$/.test(revisionText))
		throw new ShippingError('Invalid rule revision.');
	const revision = Number(revisionText);
	// Await unique service indexes before the first concurrent configuration inserts.
	await ShippingMarkup.init();
	const current = (await getMarkupConfigs()).find((entry) => entry.service === service)!;
	if (current.revision !== revision)
		throw new ShippingError(
			'Another editor changed these rules. Close the dialog and try again with the latest list.',
			409
		);
	const id = fields.get('id');
	if (typeof id !== 'string') throw new ShippingError('Invalid markup rule.');
	const exists = current.ranges.some((range) => range.id === id);
	if ((action === 'delete' || fields.get('editing') === 'true') && !exists)
		throw new ShippingError('This rule no longer exists. Refresh the list.', 409);
	if (action === 'save' && fields.get('editing') !== 'true' && exists)
		throw new ShippingError('This rule already exists. Refresh the list.', 409);
	const remaining = current.ranges.filter((range) => range.id !== id);
	const ranges = validateRanges(
		action === 'delete' ? remaining : [...remaining, parseMarkupRange(Object.fromEntries(fields))]
	);
	if (ranges.length > 100) throw new ShippingError('Each service supports up to 100 cost ranges.');
	const options = { upsert: revision === 0, runValidators: true, _createdById: userId };
	try {
		const result = await ShippingMarkup.updateOne(
			{ service: service as ShippingService, revision },
			{ $set: { ranges }, $inc: { revision: 1 }, $setOnInsert: { _createdById: userId } },
			options
		);
		if (!result.matchedCount && !result.upsertedCount)
			throw new ShippingError('Another editor changed these rules. Refresh and try again.', 409);
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 11000)
			throw new ShippingError('Another editor changed these rules. Refresh and try again.', 409);
		throw error;
	}
}
