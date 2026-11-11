import { fail, redirect, isHttpError } from '@sveltejs/kit';
import { parseScenarios } from '$lib/server/ups/quotes';
import { connect } from '$lib/server/mongoose/connect';
import { createShippingQuote } from '$lib/server/shipping/quotes';
import { findShippingQuote } from '$lib/server/shipping/quotes';
import { parseShipment, shipmentFromForm, ShippingError } from '$lib/shipping/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const source = url.searchParams.get('from');
	await connect();
	const previous = source ? await findShippingQuote(source) : null;
	return {
		requestId: crypto.randomUUID(),
		shipDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()),
		initialRequest: previous?.request
			? {
					...previous.request,
					branchId: locals.user.branches.some((branch) => branch._id === previous.branchId)
						? previous.branchId
						: ''
				}
			: null
	};
};
export const actions: Actions = {
	default: async ({ request, locals }) => {
		let number;
		try {
			const fields = await request.formData();
			const input = shipmentFromForm(fields);
			const upsScenarios =
				input.services !== 'LTL' && fields.has('rateScenarios')
					? parseScenarios(fields.get('rateScenarios'))
					: undefined;
			const shipment = parseShipment({
				...input,
				...(upsScenarios
					? {
							packages: upsScenarios[0].packageGroups.map((group) => ({
								...group,
								id: crypto.randomUUID()
							}))
						}
					: {})
			});
			if (upsScenarios) shipment.upsScenarios = upsScenarios;
			if (!locals.user.branches.some((branch) => branch._id.toString() === shipment.branchId))
				throw new ShippingError('Choose one of your branches.');
			await connect();
			number = await createShippingQuote(
				shipment,
				String(fields.get('requestId') ?? ''),
				locals.user._id
			);
		} catch (error) {
			if (error instanceof ShippingError) return fail(error.status, { error: error.message });
			if (isHttpError(error) && error.status === 400)
				return fail(400, { error: error.body.message });
			throw error;
		}
		redirect(303, `/shipping/quotes/${number}`);
	}
};
