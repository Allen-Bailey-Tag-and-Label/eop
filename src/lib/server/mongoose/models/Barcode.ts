import { defineModel } from '../defineModel';

export const Barcode = defineModel('Barcode', {
	barcodeExtendedCost: { type: Number, required: true },
	barcodeUnitCost: { type: Number, required: true },
	bcid: { type: String, required: true },
	from: { type: Number, required: true },
	height: { type: Number, required: true },
	includetext: { type: Boolean, required: true },
	maxLength: { type: Number, required: true },
	quoteNumber: { type: Number, required: true },
	setupExtendedCost: { type: Number, required: true },
	setupUnitCost: { type: Number, required: true },
	to: { type: Number, required: true },
	totalExtendedCost: { type: Number, required: true },
	width: { type: Number, required: true }
});
