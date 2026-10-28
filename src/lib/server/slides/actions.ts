import { fail, redirect } from '@sveltejs/kit';
import { saveContent } from './content';
import { SlideValidationError } from '$lib/slides/validation';

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
