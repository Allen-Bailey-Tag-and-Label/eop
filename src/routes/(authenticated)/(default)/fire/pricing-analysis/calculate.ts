import { materials } from './materials';
import { routings } from './routings';

export const cost = (
	quantity: number,
	materialItemNumbers: string[],
	routingDescriptions: string[],
	featureValues: Map<string, any>
) => {
	const materialCost = materialItemNumbers.reduce((total, materialItemNumber) => {
		const cost = materials[materialItemNumber].cost(quantity, featureValues);
		return total + cost;
	}, 0);

	const routingCost = routingDescriptions.reduce((total, routingDescription) => {
		const cost = routings[routingDescription](quantity, featureValues);
		return total + cost;
	}, 0);

	const totalCost = materialCost + routingCost;

	return totalCost;
};
export const price = (cost: number, margin: number) => {
	const totalSell = cost / (1 - margin);
	return totalSell;
};
