import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	exportSlidePackage,
	reviewSlidePackage,
	importSlidePackage
} from '$lib/server/slides/packages';
import { SlideValidationError } from '$lib/slides/validation';
import { DataWorkflowError } from '$lib/data/types';
import { MAX_PACKAGE_BYTES, type PackageChoices } from '$lib/slides/package';
export const config = { maxDuration: 30 };
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (Number(request.headers.get('content-length')) > MAX_PACKAGE_BYTES + 100000)
			throw new SlideValidationError('Package request is too large (4 MB maximum).');
		const fields = await request.formData();
		const operation = fields.get('operation');
		if (operation === 'export') {
			const definition = String(fields.get('definition') ?? '');
			if (definition.length > 250000)
				throw new SlideValidationError('Slide definition is too large.');
			const bytes = await exportSlidePackage(
				String(fields.get('title') ?? ''),
				String(fields.get('slug') ?? ''),
				JSON.parse(definition)
			);
			return new Response(new Uint8Array(bytes), {
				headers: {
					'content-type': 'application/zip',
					'content-disposition': 'attachment; filename="slide.zip"',
					'cache-control': 'no-store'
				}
			});
		}
		const file = fields.get('file');
		if (!(file instanceof File) || file.size > MAX_PACKAGE_BYTES)
			throw new SlideValidationError('Choose a slide ZIP package under 4 MB.');
		const bytes = Buffer.from(await file.arrayBuffer());
		if (operation === 'review')
			return json(await reviewSlidePackage(bytes), { headers: { 'cache-control': 'no-store' } });
		if (operation === 'import')
			return json(
				await importSlidePackage(
					bytes,
					String(fields.get('title') ?? ''),
					String(fields.get('slug') ?? ''),
					JSON.parse(String(fields.get('choices') ?? '{}')) as PackageChoices,
					locals.user._id
				)
			);
		throw new SlideValidationError('Unknown package operation.');
	} catch (cause) {
		if (
			cause instanceof SlideValidationError ||
			cause instanceof DataWorkflowError ||
			cause instanceof SyntaxError
		)
			return json({ error: cause.message }, { status: 400 });
		throw cause;
	}
};
