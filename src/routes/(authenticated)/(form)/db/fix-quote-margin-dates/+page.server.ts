import { prisma } from '$lib/prisma/index.js';
import { DateTime } from 'luxon';

export const actions = {
	default: async () => {
		const quotes = (
			await prisma.quoteMarginQuote.findMany({ orderBy: [{ quoteNumber: 'desc' }] })
		).map((quote) => {
			quote.previousQuoteDate = DateTime.fromJSDate(quote.previousQuoteDate, {
				zone: 'America/New_York'
			})
				.startOf('day')
				.plus({ hours: 5 })
				.toJSDate();
			quote.quoteDate = DateTime.fromJSDate(quote.quoteDate, { zone: 'America/New_York' })
				.startOf('day')
				.plus({ hours: 5 })
				.toJSDate();
			return quote;
		});
		for (let quoteIndex = 0; quoteIndex < 1; quoteIndex++) {
			const { id, ...data } = quotes[quoteIndex];
			await prisma.quoteMarginQuote.update({ where: { id }, data });
			console.log(`updated quoteIndex=${quoteIndex}`);
		}
		return { success: true };
	}
};
