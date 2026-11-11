import type { FreightItem } from './types';

// NMFTA standard 13-subprovision density scale, effective July 19, 2025.
// https://nmfta.org/news/decoding-density-the-freight-factor-you-cant-afford-to-overlook/
const bands = [
	[50, '50'],
	[35, '55'],
	[30, '60'],
	[22.5, '65'],
	[15, '70'],
	[12, '85'],
	[10, '92.5'],
	[8, '100'],
	[6, '125'],
	[4, '175'],
	[2, '250'],
	[1, '300'],
	[0, '400']
] as const;

export function freightDensity(
	item: Pick<FreightItem, 'quantity' | 'weight' | 'length' | 'width' | 'height'>
) {
	if (
		![item.quantity, item.weight, item.length, item.width, item.height].every(
			(value) => typeof value === 'number' && Number.isFinite(value) && value > 0
		) ||
		!Number.isSafeInteger(item.quantity)
	)
		return null;
	const cubicFeet = (item.length * item.width * item.height) / 1728;
	const totalCubicFeet = cubicFeet * item.quantity;
	const density = item.weight / cubicFeet;
	if (![cubicFeet, totalCubicFeet, density].every((value) => Number.isFinite(value) && value > 0))
		return null;
	// Do not round before choosing a band: e.g. 7.999 PCF remains class 125.
	const freightClass = bands.find(([minimum]) => density >= minimum)![1];
	return { cubicFeet, totalCubicFeet, density, freightClass };
}
