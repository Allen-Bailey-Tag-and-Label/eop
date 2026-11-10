import {
	ShippingQuote,
	ShippingQuoteSequence,
	type ShippingQuoteRecord
} from '../mongoose/models/ShippingQuote';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import {
	selectedServices,
	type ShippingRequest,
	type PricedRate,
	type ProviderAttempt,
	type QuoteView
} from '$lib/shipping/types';
import { ShippingError } from '$lib/shipping/validation';
import { priceRate } from '$lib/shipping/markups';
import { getMarkupConfigs } from './markups';
import { getUpsShippingRates } from './ups';
import { legacyQuoteView } from '$lib/shipping/legacy';

export async function collectRates(request: ShippingRequest) {
	// Snapshot rule revisions before calling either provider.
	const configs = await getMarkupConfigs();
	const results = await Promise.all(
		selectedServices(request.services).map(async (service) => {
			if (service === 'LTL')
				return {
					rates: [],
					attempt: {
						service,
						status: 'not-configured',
						message:
							'Unishippers rating is not connected yet. LTL details have been saved; no LTL price was returned.'
					} as ProviderAttempt
				};
			try {
				const rates = (await getUpsShippingRates(request)).map((rate) =>
					priceRate(rate, configs.find((config) => config.service === service)!)
				);
				return {
					rates,
					attempt: {
						service,
						status: 'success',
						message: `${rates.length} UPS service options returned.`
					} as ProviderAttempt
				};
			} catch (error) {
				return {
					rates: [],
					attempt: {
						service,
						status: 'error',
						message:
							error instanceof ShippingError
								? error.message
								: 'UPS rates are temporarily unavailable. Create a new quote to retry.'
					} as ProviderAttempt
				};
			}
		})
	);
	return {
		rates: results.flatMap((result) => result.rates) as PricedRate[],
		attempts: results.map((result) => result.attempt)
	};
}

async function nextNumber() {
	const increment = () =>
		ShippingQuoteSequence.findOneAndUpdate(
			{ _id: 'shipping' },
			{ $inc: { value: 1 } },
			{ upsert: true, new: true }
		).lean();
	let sequence;
	try {
		sequence = await increment();
	} catch (error) {
		if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000))
			throw error;
		sequence = await increment();
	}
	if (!sequence || !Number.isSafeInteger(sequence.value))
		throw new ShippingError('Could not allocate a quote number.', 503);
	return `S-${String(sequence.value).padStart(6, '0')}`;
}

export async function createShippingQuote(
	request: ShippingRequest,
	requestId: string,
	userId: string
) {
	if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(requestId))
		throw new ShippingError('Invalid quote request. Reload the form and try again.');
	const requestKey = `${userId}:${requestId}`;
	await ShippingQuote.init();
	const existing = await ShippingQuote.findOne({ requestKey }).select('number').lean();
	if (existing) return existing.number;
	const result = await collectRates(request);
	const number = await nextNumber();
	try {
		await ShippingQuote.create({
			number,
			requestKey,
			_createdById: userId,
			_branchId: request.branchId,
			request,
			...result
		});
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
			const saved = await ShippingQuote.findOne({ requestKey }).select('number').lean();
			if (saved) return saved.number;
		}
		throw error;
	}
	return number;
}

export function shippingQuoteView(row: ShippingQuoteRecord): QuoteView {
	return {
		number: row.number,
		origin: 'shipping',
		createdAt: row.createdAt?.toISOString() ?? null,
		branchId: row._branchId.toString(),
		request: row.request,
		shipFrom: row.request.shipFrom,
		shipTo: row.request.shipTo,
		rates: row.rates,
		attempts: row.attempts,
		legacyRates: []
	};
}

export async function findShippingQuote(number: string): Promise<QuoteView | null> {
	if (/^S-\d{6,15}$/.test(number)) {
		const row = await ShippingQuote.findOne({ number }).lean();
		return row ? shippingQuoteView(row) : null;
	}
	if (!/^\d{1,12}$/.test(number)) return null;
	const row = await UpsQuote.findOne({ quote: Number(number) }).lean();
	return row ? legacyQuoteView(row as unknown as Parameters<typeof legacyQuoteView>[0]) : null;
}
