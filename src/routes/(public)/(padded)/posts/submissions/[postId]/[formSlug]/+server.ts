import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitForm } from '$lib/server/forms/service';
import { FormValidationError } from '$lib/forms/definition';
export const GET: RequestHandler = ({ locals }) => {
	const form = locals.authorizedForm!;
	const { title, description, questions, open, anonymous, thanks } = form.definition;
	return json({
		id: form.id,
		version: form.version,
		definition: { title, description, questions, open, anonymous, thanks }
	});
};
export const POST: RequestHandler = async ({ locals, request }) => {
	try {
		if (Number(request.headers.get('content-length')) > 65536)
			return json({ error: 'Response is too large.' }, { status: 413 });
		return json(
			await submitForm(locals.authorizedForm!, locals.contentActor, await request.formData())
		);
	} catch (cause) {
		if (cause instanceof FormValidationError)
			return json({ error: cause.message }, { status: 400 });
		throw cause;
	}
};
