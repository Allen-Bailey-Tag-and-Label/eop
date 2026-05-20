import type { Actions } from '@sveltejs/kit';
import { validateAddress } from '$lib/ups';
import { type Candidate } from './types';

export const actions: Actions = {
	default: async ({ request }) => {
		const { address, city, state, zip } = <Record<string, string>>(
			Object.fromEntries(await request.formData())
		);

		const result = await validateAddress({ address, city, state, zip });

		const {
			XAVResponse: { Candidate }
		}: { XAVResponse: { Candidate: Candidate[] } } = result;

		return Candidate;
	}
};
