import { fail, redirect } from '@sveltejs/kit';
import { duplicateSlide, listSlides, manageSlide } from '$lib/server/slides/content';
import { slug, SlideValidationError } from '$lib/slides/validation';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async () => ({ slides: await listSlides() });

export const actions: Actions = {
	duplicate: async ({ request, locals }) => {
		let key;
		try {
			key = await duplicateSlide(await request.formData(), locals.user._id);
		} catch (cause) {
			if (cause instanceof SlideValidationError)
				return fail(400, { error: cause.message, references: [] });
			throw cause;
		}
		redirect(303, `/admin/monitors/slides/${key}`);
	},
	delete: async ({ request, locals }) => {
		try {
			const fields = await request.formData();
			if (fields.get('confirm') !== 'delete')
				throw new SlideValidationError('Confirm deletion before deleting this slide.');
			const references = await manageSlide(
				'delete',
				slug(fields.get('slug')),
				fields,
				locals.user._id
			);
			if (references.length)
				return fail(409, {
					error: 'Remove this slide from all draft and published playlists before deleting it.',
					references
				});
			return { success: 'Slide deleted.' };
		} catch (cause) {
			if (cause instanceof SlideValidationError)
				return fail(400, { error: cause.message, references: [] });
			throw cause;
		}
	}
};
