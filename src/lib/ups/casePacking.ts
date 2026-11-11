import { MAX_QUOTE_PACKAGES, type CasePacking, type QuotePackageGroup } from './quote';

export function calculateCases(
	units: number,
	packing: CasePacking,
	limits = { maxWeight: 150, maxCount: MAX_QUOTE_PACKAGES }
) {
	if (
		!Number.isSafeInteger(units) ||
		units < 1 ||
		!Number.isSafeInteger(packing.unitsPerCarton) ||
		packing.unitsPerCarton < 1
	)
		throw new Error('Enter positive whole numbers for units and units per case.');
	if (
		!Number.isFinite(packing.cartonWeight) ||
		packing.cartonWeight < 0.001 ||
		packing.cartonWeight > limits.maxWeight ||
		Math.abs(packing.cartonWeight * 1000 - Math.round(packing.cartonWeight * 1000)) > 1e-7
	)
		throw new Error(
			limits.maxWeight === 150
				? 'Full case weight must be 0.001–150 lbs, with at most three decimal places.'
				: `Full pallet weight must be 0.001–${limits.maxWeight} lbs, with at most three decimal places.`
		);
	if (
		!Number.isFinite(packing.tareWeight) ||
		packing.tareWeight < 0 ||
		packing.tareWeight > packing.cartonWeight
	)
		throw new Error('Empty carton weight must be between zero and the full case weight.');
	if (packing.partialCase !== 'prorate' && packing.partialCase !== 'full')
		throw new Error('Choose how to weigh a partial case.');
	const fullCases = Math.floor(units / packing.unitsPerCarton),
		remainder = units % packing.unitsPerCarton;
	const count = fullCases + (remainder ? 1 : 0);
	if (count > limits.maxCount)
		throw new Error(
			`This quantity requires more than ${limits.maxCount} ${limits.maxCount === MAX_QUOTE_PACKAGES ? 'cartons' : 'pallets'}. Adjust the packing or split the shipment.`
		);
	const groups: QuotePackageGroup[] = fullCases
		? [{ quantity: fullCases, weight: packing.cartonWeight }]
		: [];
	if (remainder) {
		const weight =
			packing.partialCase === 'full'
				? packing.cartonWeight
				: Math.max(
						0.001,
						Math.ceil(
							(packing.tareWeight +
								((packing.cartonWeight - packing.tareWeight) * remainder) /
									packing.unitsPerCarton) *
								1000 -
								1e-9
						) / 1000
					);
		groups.push({ quantity: 1, weight });
	}
	return {
		packageGroups: groups,
		packageTotalCount: count,
		packageTotalWeight: Number(
			groups.reduce((sum, group) => sum + group.quantity * group.weight, 0).toFixed(3)
		)
	};
}
