import type { QuoteRateOption, QuoteRateService } from '$lib/components/QuoteResults/types';
import { UPS_SERVICES } from '$lib/ups/quote';
import type { PricedRate, QuoteView, ShippingService } from './types';

const serviceKey = (rate: PricedRate) =>
	rate.service === 'UPS'
		? `UPS:${rate.code}`
		: `LTL:${rate.comparisonKey ?? rate.providerReference ?? `${rate.code}:${rate.description}`}`;

export function shippingResultOptions(quote: QuoteView): QuoteRateOption[] {
	if (!quote.request) return [];
	if (quote.request.packingInputs?.length) {
		const ltlServices = [
			...new Set(quote.rates.filter((rate) => rate.service === 'LTL').map(serviceKey))
		];
		return quote.request.packingInputs.map((input) => {
			const ups = quote.request!.upsScenarios?.find((scenario) => scenario.id === input.id);
			const ltl = quote.request!.ltlScenarios?.find((scenario) => scenario.id === input.id);
			const primary = input.shipping?.basis === 'LTL' ? ltl?.freight : ups?.packageGroups;
			const rates = quote.rates.filter((rate) => rate.scenarioId === input.id);
			return {
				id: input.id,
				label: input.label,
				...(input.unitQuantity ? { unitQuantity: Number(input.unitQuantity) } : {}),
				services: [
					...(ups?.services.map((code) => `UPS:${code}`) ?? []),
					...(ltl ? ltlServices : [])
				],
				rates: rates.map((rate) => ({
					serviceCode: serviceKey(rate),
					rate: rate.priceCents / 100
				})),
				status: rates.length
					? ('complete' as const)
					: [ups?.status, ltl?.status].includes('pending')
						? ('pending' as const)
						: ('failed' as const),
				message: [ups?.message, ltl?.message].filter(Boolean).join(' '),
				packageGroups: primary,
				...(input.weightMode === 'cartons'
					? {
							casePacking: {
								unitsPerCarton: Number(input.unitsPerCarton),
								cartonWeight: Number(input.cartonWeight)
							}
						}
					: {}),
				handlingUnit: input.shipping?.basis === 'LTL' ? ('pallet' as const) : ('carton' as const),
				packageTotalCount: primary?.reduce((sum, group) => sum + group.quantity, 0),
				packageTotalWeight: primary?.reduce((sum, group) => sum + group.quantity * group.weight, 0)
			};
		});
	}
	const status = (service: ShippingService) => {
		const tasks = quote.generation?.tasks.filter((task) => task.service === service);
		if (tasks?.length) {
			if (tasks.some((task) => task.status === 'running')) return 'running' as const;
			if (tasks.some((task) => task.status === 'pending')) return 'pending' as const;
			return tasks.some((task) => task.status === 'complete')
				? ('complete' as const)
				: ('failed' as const);
		}
		return quote.attempts.find((attempt) => attempt.service === service)?.status === 'success'
			? ('complete' as const)
			: ('failed' as const);
	};
	const options: QuoteRateOption[] = [];
	if (quote.request.services !== 'LTL') {
		if (quote.request.upsScenarios?.length) {
			options.push(
				...quote.request.upsScenarios.map((scenario) => ({
					...scenario,
					services: scenario.services.map((code) => `UPS:${code}`),
					rates: quote.rates
						.filter((rate) => rate.service === 'UPS' && rate.scenarioId === scenario.id)
						.map((rate) => ({ serviceCode: `UPS:${rate.code}`, rate: rate.priceCents / 100 }))
				}))
			);
		} else {
			options.push({
				id: 'ups',
				label: 'UPS shipment',
				status: status('UPS'),
				message: '',
				services: quote.rates
					.filter((rate) => rate.service === 'UPS')
					.map((rate) => `UPS:${rate.code}`),
				rates: quote.rates
					.filter((rate) => rate.service === 'UPS')
					.map((rate) => ({ serviceCode: `UPS:${rate.code}`, rate: rate.priceCents / 100 })),
				packageTotalCount: quote.request.packages.reduce((sum, item) => sum + item.quantity, 0),
				packageTotalWeight: quote.request.packages.reduce(
					(sum, item) => sum + item.quantity * item.weight,
					0
				),
				packageGroups: quote.request.packages
			});
		}
	}
	if (quote.request.services !== 'UPS') {
		const rates = quote.rates.filter((rate) => rate.service === 'LTL');
		options.push({
			id: 'ltl',
			handlingUnit: 'pallet',
			label: 'LTL shipment',
			status: status('LTL'),
			message: '',
			services: rates.map(serviceKey),
			rates: rates.map((rate) => ({
				serviceCode: serviceKey(rate),
				rate: rate.priceCents / 100
			})),
			packageTotalCount: quote.request.freight.reduce((sum, item) => sum + item.quantity, 0),
			packageTotalWeight: quote.request.freight.reduce(
				(sum, item) => sum + item.quantity * item.weight,
				0
			),
			packageGroups: quote.request.freight
		});
	}
	return options;
}

export function shippingResultServices(quote: QuoteView): QuoteRateService[] {
	const options = new Map(
		UPS_SERVICES.map((service) => [
			`UPS:${service.code}`,
			{ code: `UPS:${service.code}`, title: `UPS ${service.title}` }
		])
	);
	for (const rate of quote.rates)
		options.set(serviceKey(rate), {
			code: serviceKey(rate),
			title:
				rate.service === 'UPS' ? `UPS ${rate.description}` : `${rate.carrier} - ${rate.description}`
		});
	return [...options.values()];
}
