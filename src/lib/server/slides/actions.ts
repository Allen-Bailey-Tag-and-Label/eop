import { fail, redirect } from '@sveltejs/kit';
import { manageSlide, saveContent } from './content';
import { SlideValidationError } from '$lib/slides/validation';

export async function manageSlideEditor(
	operation: 'unpublish' | 'delete',
	request: Request,
	userId: string,
	currentSlug: string
) {
	try {
		const references = await manageSlide(operation, currentSlug, await request.formData(), userId);
		if (references.length)
			return fail(409, {
				error: 'Remove this slide from all draft and published playlists before deleting it.',
				references
			});
	} catch (cause) {
		if (cause instanceof SlideValidationError) return fail(400, { error: cause.message });
		throw cause;
	}
	if (operation === 'delete') redirect(303, '/admin/monitors/slides');
	return { success: 'Slide unpublished. Monitors skip it after their next update between slides.' };
}

export async function saveEditor(
	kind: 'slide' | 'playlist',
	request: Request,
	userId: string,
	currentSlug: string
) {
	let saved;
	try {
		saved = await saveContent(kind, await request.formData(), userId);
	} catch (cause) {
		if (cause instanceof SlideValidationError) return fail(400, { error: cause.message });
		throw cause;
	}
	if (currentSlug !== saved.slug)
		redirect(303, `/admin/monitors/${kind === 'slide' ? 'slides' : 'playlists'}/${saved.slug}`);
	return {
		success: saved.published
			? 'Published. Monitors receive updates between slides.'
			: 'Draft saved. Published content is unchanged.'
	};
}
