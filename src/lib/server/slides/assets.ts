import { error, fail } from '@sveltejs/kit';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Asset, Slide } from './models';
import { isId, SlideValidationError } from '$lib/slides/validation';

export const MAX_ASSET_BYTES = 3 * 1024 * 1024;
export function sanitizeSvg(source: string) {
	if (Buffer.byteLength(source) > 300000)
		throw new SlideValidationError('SVGs must be under 300 KB.');
	const dom = new JSDOM('');
	try {
		const purifier = createDOMPurify(dom.window);
		const clean = purifier.sanitize(source, {
			USE_PROFILES: { svg: true, svgFilters: true },
			FORBID_TAGS: ['style', 'foreignObject', 'image', 'a', 'animate', 'animateTransform', 'set'],
			FORBID_ATTR: ['style']
		});
		const document = new dom.window.DOMParser().parseFromString(clean, 'image/svg+xml');
		if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg')
			throw new SlideValidationError('Upload a valid SVG document.');
		for (const element of document.querySelectorAll('*')) {
			for (const attribute of Array.from(element.attributes)) {
				if (
					(attribute.localName === 'href' && !attribute.value.startsWith('#')) ||
					(/url\s*\(/i.test(attribute.value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(attribute.value))
				)
					element.removeAttributeNode(attribute);
			}
		}
		return new dom.window.XMLSerializer().serializeToString(document.documentElement);
	} finally {
		dom.window.close();
	}
}
export function prepareAsset(bytes: Buffer, contentType: string) {
	if (!bytes.length || bytes.length > MAX_ASSET_BYTES)
		throw new SlideValidationError('Choose a file under 3 MB.');
	if (contentType === 'image/svg+xml') return Buffer.from(sanitizeSvg(bytes.toString('utf8')));
	const valid =
		contentType === 'image/png'
			? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
			: contentType === 'image/jpeg'
				? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
				: contentType === 'image/webp'
					? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
					: false;
	if (!valid)
		throw new SlideValidationError(
			'Upload a PNG, JPEG, WebP, or SVG file with a matching file type.'
		);
	return bytes;
}
export async function uploadAsset(request: Request, userId: string) {
	try {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || file.size > MAX_ASSET_BYTES)
			throw new SlideValidationError('Choose a file under 3 MB.');
		const bytes = prepareAsset(Buffer.from(await file.arrayBuffer()), file.type);
		await Asset.create({
			name: file.name.slice(0, 160),
			contentType: file.type,
			data: bytes,
			_createdById: userId
		});
		return { success: 'Asset uploaded. Choose it for an image or SVG element.' };
	} catch (cause) {
		if (cause instanceof SlideValidationError) return fail(400, { error: cause.message });
		throw cause;
	}
}
export async function serveAsset(id: string, publishedOnly = false) {
	if (!isId(id)) error(404, 'Asset not found.');
	if (
		publishedOnly &&
		!(await Slide.exists({
			$or: [
				{ 'published.elements.assetId': id },
				{ 'published.elements.repeater.template.elements.assetId': id }
			]
		}))
	)
		error(404, 'Asset not found.');
	const asset = await Asset.findById(id).select('+data');
	if (!asset) error(404, 'Asset not found.');
	return new Response(new Uint8Array(asset.data), {
		headers: {
			'content-type': asset.contentType,
			'x-content-type-options': 'nosniff',
			'content-security-policy': "default-src 'none'; sandbox",
			'content-disposition': 'inline'
		}
	});
}
