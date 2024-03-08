import { features } from './features';
import type { Material } from './types';

const getStockLbs = (quantity: number, material: Material, featureValues: Map<string, any>) => {
	const setupSheets = Object.keys(features).reduce((total, feature) => {
		let featureSetupSheets = 0;
		if (features[feature].setupSheets.has('Tag Press Passes')) {
			try {
				featureSetupSheets = features[feature].setupSheets.get('Tag Press Passes')(
					featureValues.get(feature)
				);
			} catch (error) {
				console.log(feature, error);
			}
		}
		total += featureSetupSheets;
		return total;
	}, 0); // TODO fix for combo / program
	const setupFeet = (setupSheets * 2.63) / 12; // 438.33333
	const setupLbs = setupFeet * material.conversionFactor; // 12.0815625
	const runFeet = (quantity * 2.63) / 12; // 219.1666666666667
	const runLbs = runFeet * material.conversionFactor; // 6.04078125
	const scrapPercent =
		quantity <= 2500 ? 0.7 : quantity <= 5000 ? 0.4 : quantity <= 10000 ? 0.1 : 0.08;
	const scrapLbs = (setupLbs + runLbs) * scrapPercent; // 12.685640625
	const totalLbs = setupLbs + runLbs + scrapLbs;
	return totalLbs;
};

export const materials: { [key: string]: Material } = {
	'50513150 05.2500': {
		conversionFactor: 0.0275625,
		cost: (quantity: number, featureValues: Map<string, any>) => {
			const totalLbs = getStockLbs(quantity, materials['50513150 05.2500'], featureValues);
			const stockCost = totalLbs * materials['50513150 05.2500'].unitCost;
			return stockCost;
		},
		unitCost: 1.3037
	},
	'82081168 00.2500': {
		conversionFactor: 1,
		cost: (quantity: number, _: Map<string, any>) => {
			const totalQuantity = quantity * 1.03;
			const eyeletCost = totalQuantity * materials['82081168 00.2500'].unitCost;
			return eyeletCost;
		},
		unitCost: 0.0048
	},
	'83000417 00.8750': {
		conversionFactor: 0.294,
		cost: (quantity: number, _: Map<string, any>) => {
			const runMSI = (quantity * 0.875 * 0.875) / 1000;
			const runLbs = runMSI * materials['83000417 00.8750'].conversionFactor;
			const patchCost = runLbs * materials['83000417 00.8750'].unitCost;
			return patchCost;
		},
		unitCost: 2.4615
	},
	'87084026 00.0000': {
		conversionFactor: 0.00084,
		cost: (quantity: number, featureValues: Map<string, any>) => {
			const runLbs = quantity * materials['87084026 00.0000'].conversionFactor;
			const scrapLbs = runLbs * 0.06;
			const totalQuantity = runLbs + scrapLbs;
			const wireCost = totalQuantity * materials['87084026 00.0000'].unitCost;
			return wireCost;
		},
		unitCost: 1.66
	}
};
