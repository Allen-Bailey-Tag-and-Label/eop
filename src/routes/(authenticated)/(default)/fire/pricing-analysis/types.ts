export type Feature = {
	setupHours: Map<string, (value: boolean | number) => number>;
	setupSheets: Map<string, (value: boolean | number) => number>;
};
export type Material = {
	conversionFactor: number;
	cost: (quantity: number, featureValues: Map<string, any>) => number;
	unitCost: number;
};
export type Materials = Material[];
