import { prisma } from '$lib';

export const load = async ({ params }) => {
	return {
		quote: prisma.uPSQuote.findUnique({
			include: { createdBy: true },
			where: { number: +params.number }
		})
	};
};
