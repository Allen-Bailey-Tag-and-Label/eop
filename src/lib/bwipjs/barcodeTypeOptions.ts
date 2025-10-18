import { barcodeTypes } from './barcodeTypes';

export const barcodeTypeOptions = Array.from(barcodeTypes)
	.map(([value, label]: [string, string]) => ({ label, value }))
	.sort((a, b) => a.label.localeCompare(b.label));
