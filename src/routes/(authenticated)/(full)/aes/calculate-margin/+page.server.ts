import { redirect, type Actions } from '@sveltejs/kit';
import { DateTime, type DateTime as DateTimeType } from 'luxon';
import format from '$lib/format';
import { prisma } from '$lib/prisma';

const getMonthlyIncreasePercent = (annualPercent: number) =>
	12 * (Math.pow(1 + annualPercent, 1 / 12) - 1);

export const _calculate = (
	materialAmount: number,
	previousLaborAmount: number,
	previousMarginAmount: number,
	previousMaterialAmount: number,
	previousQuoteDate: DateTimeType,
	previousSellPrice: number,
	quoteDate: DateTimeType,
	totalCostAmount: number
) => {
	const yearlyIncreasePercent = {
		min: 0.05,
		max: 0.12
	};
	const monthlyIncreasePercent = {
		min: getMonthlyIncreasePercent(yearlyIncreasePercent.min),
		max: getMonthlyIncreasePercent(yearlyIncreasePercent.max)
	};

	const dateDiff = quoteDate.diff(previousQuoteDate, ['months']).toObject();
	const months = Math.floor(dateDiff.months || 0);

	const laborIncreasePercent = {
		min: Math.max(1, Math.pow(1 + monthlyIncreasePercent.min / 12, months)) - 1,
		max: Math.max(1, Math.pow(1 + monthlyIncreasePercent.max / 12, months)) - 1
	};

	const sellPriceBasedOnLabor = {
		min:
			previousSellPrice +
			Math.max(0, materialAmount - previousMaterialAmount) +
			previousLaborAmount * laborIncreasePercent.min,
		max:
			previousSellPrice +
			Math.max(0, materialAmount - previousMaterialAmount) +
			previousLaborAmount * laborIncreasePercent.max
	};
	const sellPriceBasedOnTime = {
		min: previousSellPrice * Math.max(1, Math.pow(1 + monthlyIncreasePercent.min / 12, months)),
		max: previousSellPrice * Math.max(1, Math.pow(1 + monthlyIncreasePercent.max / 12, months))
	};

	const sellPrice = {
		min: Math.max(previousSellPrice, sellPriceBasedOnLabor.min, sellPriceBasedOnTime.min),
		max: Math.max(sellPriceBasedOnLabor.max, sellPriceBasedOnTime.max),
		final: 0
	};

	const marginAmount = {
		min: sellPrice.min - totalCostAmount,
		max: sellPrice.max - totalCostAmount,
		final: 0
	};

	const marginPercent = {
		min: 1 - totalCostAmount / sellPrice.min,
		max: 1 - totalCostAmount / sellPrice.max,
		final: 0
	};

	if (marginPercent.min >= 0.35) marginPercent.final = marginPercent.min;
	if (marginPercent.max <= 0) marginPercent.final = marginPercent.max;
	if (marginPercent.min < 0.35 && marginPercent.max > 0)
		marginPercent.final = (marginPercent.min + marginPercent.max) / 2;

	sellPrice.final = totalCostAmount / (1 - marginPercent.final);

	// const increasePercent = sellPrice.final / previousSellPrice - 1;

	// if (increasePercent < yearlyIncreasePercent.min)
	// 	sellPrice.final = previousSellPrice * (1 + yearlyIncreasePercent.min);
	// if (increasePercent > yearlyIncreasePercent.max)
	// 	sellPrice.final = previousSellPrice * (1 + yearlyIncreasePercent.max);

	marginAmount.final = sellPrice.final - totalCostAmount;

	return {
		marginAmount: format.float(marginAmount.final),
		sellPrice: format.float(sellPrice.final)
	};
};

export const _upsert = async (request: Request) => {
	const formData = <{ [k: string]: string }>Object.fromEntries(await request.formData());

	const customerType = formData.customerType;
	const materialAmount = parseFloat(formData.materialAmount);
	const previousQuoteNumber = +formData.previousQuoteNumber;
	const previousQuoteDate = DateTime.fromFormat(formData.previousQuoteDate, 'yyyy-MM-dd', {
		zone: 'America/New_York'
	});
	const previousMaterialAmount = parseFloat(formData.previousMaterialAmount);
	const previousTotalCostAmount = parseFloat(formData.previousTotalCostAmount);
	const previousSellPrice = parseFloat(formData.previousSellPrice);
	const productType = formData.productType;
	const quoteNumber = +formData.quoteNumber;
	const quoteDate = DateTime.fromFormat(formData.quoteDate, 'yyyy-MM-dd', {
		zone: 'America/New_York'
	});
	const totalCostAmount = parseFloat(formData.totalCostAmount);
	const type = 'have-aes-quote';

	const previousLaborAmount = previousTotalCostAmount - previousMaterialAmount;
	const laborAmount = totalCostAmount - materialAmount;
	const previousMarginAmount = previousSellPrice - previousTotalCostAmount;

	const { marginAmount, sellPrice } = _calculate(
		materialAmount,
		previousLaborAmount,
		previousMarginAmount,
		previousMaterialAmount,
		previousQuoteDate,
		previousSellPrice,
		quoteDate,
		totalCostAmount
	);

	const quote = await prisma.quoteMarginQuote.upsert({
		where: {
			quoteNumber
		},
		update: {
			customerType,
			previousQuoteDate: previousQuoteDate.toJSDate(),
			previousQuoteNumber: +previousQuoteNumber,
			previousMaterialAmount: format.float(previousMaterialAmount),
			previousLaborAmount: format.float(previousLaborAmount),
			previousTotalCostAmount: format.float(previousTotalCostAmount),
			previousMarginAmount: format.float(previousMarginAmount),
			previousSellPrice: format.float(previousSellPrice),
			productType,
			quoteDate: quoteDate.toJSDate(),
			quoteNumber: quoteNumber,
			marginAmount: format.float(marginAmount),
			materialAmount: format.float(materialAmount),
			laborAmount: format.float(laborAmount),
			totalCostAmount: format.float(totalCostAmount),
			sellPrice: format.float(sellPrice),
			type
		},
		create: {
			customerType,
			previousQuoteDate: previousQuoteDate.toJSDate(),
			previousQuoteNumber: +previousQuoteNumber,
			previousMaterialAmount: format.float(previousMaterialAmount),
			previousLaborAmount: format.float(previousLaborAmount),
			previousTotalCostAmount: format.float(previousTotalCostAmount),
			previousMarginAmount: format.float(previousMarginAmount),
			previousSellPrice: format.float(previousSellPrice),
			productType,
			quoteDate: quoteDate.toJSDate(),
			quoteNumber: +quoteNumber,
			marginAmount: format.float(marginAmount),
			materialAmount: format.float(materialAmount),
			laborAmount: format.float(laborAmount),
			totalCostAmount: format.float(totalCostAmount),
			sellPrice: format.float(sellPrice),
			type
		}
	});
	return quote;
};

export const actions: Actions = {
	default: async ({ request }) => {
		const { quoteNumber } = await _upsert(request);
		return redirect(303, `/aes/calculate-margin/${quoteNumber}`);
	}
};
