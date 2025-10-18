import { Barcode } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { Types } from 'mongoose';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const formData = <Record<string, string>>Object.fromEntries(await request.formData());

		const total = await Barcode.countDocuments();
		const quoteNumber = total + 63;
		const barcode = await Barcode.create({
			_createdById: new Types.ObjectId(locals.user._id),
			barcodeExtendedCost: parseFloat(formData.barcodeExtendedCost),
			barcodeUnitCost: parseFloat(formData.barcodeUnitCost),
			bcid: formData.bcid,
			from: parseInt(formData.from),
			height: parseFloat(formData.height),
			includetext: formData?.includetext === 'on' ? true : false,
			maxLength: parseInt(formData.maxLength),
			quoteNumber,
			setupExtendedCost: parseFloat(formData.setupExtendedCost),
			setupUnitCost: parseFloat(formData.setupUnitCost),
			to: parseInt(formData.to),
			totalExtendedCost: parseFloat(formData.totalExtendedCost),
			width: parseFloat(formData.width)
		});

		redirect(303, `/barcode/${barcode._id}`);
	}
};
