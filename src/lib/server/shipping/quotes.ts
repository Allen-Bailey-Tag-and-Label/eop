import { ShippingQuote, type ShippingQuoteRecord } from '../mongoose/models/ShippingQuote';
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
import { getUnishippersShippingRates, unishippersStatus } from './unishippers';
import { legacyQuoteView } from '$lib/shipping/legacy';
import { nextQuoteNumber } from './numbering';
import { validateShippingDestination } from './addresses';

export async function collectRates(request: ShippingRequest) {
	// Snapshot rule revisions before calling either provider.
	const configs = await getMarkupConfigs();
	const results = await Promise.all(
		selectedServices(request.services).map(async (service) => {
			if (service === 'LTL') {
				if (!unishippersStatus().configured)
					return {
						rates: [],
						attempt: {
							service,
							status: 'not-configured',
							message:
								'Unishippers LTL is not configured on this server. The freight details have been saved.'
						} as ProviderAttempt
					};
				try {
					const rates = (await getUnishippersShippingRates(request)).map((rate) =>
						priceRate(rate, configs.find((config) => config.service === 'LTL')!)
					);
					const warnings = [
						...new Set(
							rates.flatMap((rate) =>
								rate.classificationWarning ? [rate.classificationWarning] : []
							)
						)
					];
					return {
						rates,
						attempt: {
							service,
							status: 'success',
							message: `${rates.length} Unishippers LTL offers returned.${rates.some((rate) => rate.staging) ? ' Staging test prices; not live-account rates.' : ''}${warnings.length ? ' ' + warnings.join(' ') : ''}`
						} as ProviderAttempt
					};
				} catch (cause) {
					return {
						rates: [],
						attempt: {
							service,
							status: 'error',
							message:
								cause instanceof ShippingError
									? cause.message
									: 'Unishippers rates are temporarily unavailable. Quote again to retry.'
						} as ProviderAttempt
					};
				}
			}
			if (request.upsScenarios?.length) {
				const rows = await Promise.all(
					request.upsScenarios.map(async (scenario, index) => {
						const scenarioLabel =
							scenario.label ||
							(scenario.unitQuantity
								? `${scenario.unitQuantity.toLocaleString('en-US')} units`
								: `Rate row ${index + 1}`);
						try {
							const packages = scenario.packageGroups.map((group) => ({
								...group,
								id: crypto.randomUUID()
							}));
							const rates = (await getUpsShippingRates({ ...request, packages }))
								.filter((rate) => scenario.services.includes(rate.code))
								.map((rate) =>
									priceRate(
										{
											...rate,
											scenarioId: scenario.id,
											scenarioLabel,
											...(scenario.unitQuantity ? { unitQuantity: scenario.unitQuantity } : {})
										},
										configs.find((config) => config.service === service)!
									)
								);
							return {
								rates,
								scenario: {
									...scenario,
									status: rates.length ? ('complete' as const) : ('failed' as const),
									rates: rates.map((rate) => ({
										description: rate.description,
										rate: rate.priceCents / 100,
										serviceCode: rate.code
									})),
									unavailableServices: scenario.services.filter(
										(code) => !rates.some((rate) => rate.code === code)
									),
									message: rates.length ? '' : 'No selected UPS services were returned.'
								}
							};
						} catch (cause) {
							return {
								rates: [] as PricedRate[],
								scenario: {
									...scenario,
									status: 'failed' as const,
									rates: [],
									unavailableServices: [...scenario.services],
									message:
										cause instanceof ShippingError
											? cause.message
											: 'UPS rates are temporarily unavailable. Quote again to retry.'
								}
							};
						}
					})
				);
				const rates = rows.flatMap((row) => row.rates);
				const failed = rows.filter((row) => row.scenario.status === 'failed').length;
				return {
					rates,
					upsScenarios: rows.map((row) => row.scenario),
					attempt: {
						service,
						status: rates.length ? 'success' : 'error',
						message: `${rates.length} UPS service options returned across ${rows.length} rate rows.${failed ? ` ${failed} rate rows could not return prices.` : ''}`
					} as ProviderAttempt
				};
			}
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
		attempts: results.map((result) => result.attempt),
		upsScenarios: results.flatMap((result) =>
			'upsScenarios' in result ? (result.upsScenarios ?? []) : []
		)
	};
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
	const validated = await validateShippingDestination(request);
	const { upsScenarios, ...result } = await collectRates(validated);
	const number = String(await nextQuoteNumber());
	try {
		await ShippingQuote.create({
			number,
			requestKey,
			_createdById: userId,
			_branchId: request.branchId,
			request: upsScenarios.length ? { ...validated, upsScenarios } : validated,
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
	const numeric = /^\d{1,16}$/.test(number) && Number.isSafeInteger(Number(number));
	if (/^S-\d{6,16}$/.test(number) || numeric) {
		// Numeric URLs can belong to either format; prefixed historical numbers stay unchanged.
		const key = numeric ? String(Number(number)) : number;
		const row = await ShippingQuote.findOne({ number: key }).lean();
		if (row) return shippingQuoteView(row);
	}
	if (!numeric) return null;
	const row = await UpsQuote.findOne({ quote: Number(number) }).lean();
	return row ? legacyQuoteView(row as unknown as Parameters<typeof legacyQuoteView>[0]) : null;
}
