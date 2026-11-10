import { fail } from '@sveltejs/kit';
import { connect } from '$lib/server/mongoose/connect';
import { getMarkupConfigs, manageMarkup } from '$lib/server/shipping/markups';
import { ShippingError } from '$lib/shipping/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	await connect();
	return { configs: await getMarkupConfigs() };
};
const manage =
	(action: 'save' | 'delete'): NonNullable<Actions[string]> =>
	async ({ request, locals }) => {
		try {
			await connect();
			await manageMarkup(await request.formData(), locals.user._id, action);
			return {
				success:
					action === 'save'
						? 'Markup rule saved. Future quotes will use it.'
						: 'Markup rule deleted. Saved quotes are unchanged.'
			};
		} catch (error) {
			if (error instanceof ShippingError) return fail(error.status, { error: error.message });
			throw error;
		}
	};
export const actions: Actions = { save: manage('save'), delete: manage('delete') };
