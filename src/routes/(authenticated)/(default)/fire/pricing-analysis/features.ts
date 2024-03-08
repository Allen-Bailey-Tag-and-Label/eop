import type { Feature } from './types';

export const features: { [key: string]: Feature } = {
	'Additional Colors': {
		setupHours: new Map([['Tag Press Passes', (value: number): number => value * 0.15]]),
		setupSheets: new Map([['Tag Press Passes', (value: number): number => value * 250]])
	},
	'Additional Plates': {
		setupHours: new Map([['Tag Press Passes', (value: number): number => value * 0.15]]),
		setupSheets: new Map([['Tag Press Passes', (value: number): number => value * 150]])
	},
	'Corner Cutting': {
		setupHours: new Map([
			['Tag Press Passes', (value: boolean): number => (value === true ? 0.1 : 0)]
		]),
		setupSheets: new Map([['Tag Press Passes', (value: number): number => 0]])
	},
	'Inline Eyelets': {
		setupHours: new Map([
			['Tag Press Passes', (value: boolean): number => (value === true ? 0.1 : 0)]
		]),
		setupSheets: new Map([
			['Tag Press Passes', (value: boolean): number => (value === true ? 500 : 0)]
		])
	},
	'Inline Patching': {
		setupHours: new Map([['Tag Press Passes', (value: number): number => value * 0.25]]),
		setupSheets: new Map([['Tag Press Passes', (value: number): number => 0]])
	},
	'Maximum Colors': {
		setupHours: new Map([['Tag Press Passes', (): number => 0]]),
		setupSheets: new Map([['Tag Press Passes', (value: number): number => 0]])
	}
};
