import { features } from './features';
const machineRates = new Map([
	['Offline Wiring', 56.43],
	['Tag Press Passes', 73.39]
]);

export const routings: { [key: string]: (one: any, two: any) => number } = {
	'Offline Wiring': (quantity: number, featureValues: Map<string, any>) => {
		const setupHours = Object.keys(features).reduce((total, feature) => {
			let featureSetupHours = 0;
			if (features[feature].setupHours.has('Offline Wiring')) {
				featureSetupHours = features[feature].setupHours.get('Offline Wiring')(
					featureValues.get(feature)
				);
			}
			total += featureSetupHours;
			return total;
		}, 0);
		const runHours = quantity / 4500;
		const totalHours = setupHours + runHours;
		const machineRate = machineRates.get('Offline Wiring');
		const wiringCost = machineRate ? totalHours * machineRate : 0;
		return wiringCost;
	},
	'Tag Press Passes': (quantity: number, featureValues: Map<string, any>) => {
		const setupHours = Object.keys(features).reduce((total, feature) => {
			let featureSetupHours = 0;
			if (features[feature].setupHours.has('Tag Press Passes')) {
				featureSetupHours = features[feature].setupHours.get('Tag Press Passes')(
					featureValues.get(feature)
				);
			}
			total += featureSetupHours;
			return total;
		}, 0.2);
		const maximumColors = featureValues.get('Maximum Colors');
		const runHours = quantity / (maximumColors < 1 ? 24500 : 21560);
		const totalHours = setupHours + runHours;
		const machineRate = machineRates.get('Tag Press Passes');
		const printingCost = machineRate ? totalHours * machineRate : 0;
		return printingCost;
	}
};
