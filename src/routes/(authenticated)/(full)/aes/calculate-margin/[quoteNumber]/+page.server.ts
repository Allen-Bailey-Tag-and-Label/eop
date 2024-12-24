import { prisma } from '$lib/prisma/index.js';
import { redirect } from '@sveltejs/kit';
import { _upsert } from '../+page.server';

export const actions = {
	default: async ({ request }) => {
		const quote = await _upsert(request);
		return { quote };
	}
};

export const load = async ({ params }) => {
	const { quoteNumber } = params;
	const quote = await prisma.quoteMarginQuote.findUnique({
		where: { quoteNumber: +quoteNumber }
	});
	if (quote === null) return redirect(303, '/');
	return { quote };
};
