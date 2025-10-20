import { SignUp } from '$lib/server/mongoose/models';
import { redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const { campaign, firstName, lastName } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		await SignUp.create({ campaign, firstName, lastName });

		redirect(303, `/sign-up/${campaign}/success`);
	}
};
