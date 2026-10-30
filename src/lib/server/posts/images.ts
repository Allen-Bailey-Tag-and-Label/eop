import { Schema, type Types } from 'mongoose';
import { fail, error } from '@sveltejs/kit';
import { defineModel } from '../mongoose/defineModel';
import { Post } from '../mongoose/models/Post';
import { idPattern, FormValidationError } from '$lib/forms/definition';
import type { UploadedPostImage } from '$lib/rich-text/images';
export const MAX_POST_IMAGE_BYTES = 3 * 1024 * 1024;
type ImageRecord = {
	_id: Types.ObjectId;
	postId: Types.ObjectId;
	name: string;
	contentType: string;
	data: Buffer;
};
// Keep binary data out of generic CRUD and operation logs.
export const PostImage = defineModel<ImageRecord>(
	'PostImage',
	{
		postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
		name: { type: String, required: true },
		contentType: { type: String, required: true },
		data: { type: Buffer, required: true, select: false }
	},
	{ log: false }
);
export function imageOption(postId: string, id: string, name: string): UploadedPostImage {
	return {
		id,
		name,
		url: `/posts/images/${postId}/${id}`,
		previewUrl: `/post/manage/${postId}/images/${id}`
	};
}
export async function listPostImages(postId?: string) {
	if (!postId) return [];
	const rows = await PostImage.find({ postId })
		.select('_id name')
		.sort({ createdAt: -1 })
		.limit(200)
		.lean();
	return rows.map((row) => imageOption(postId, String(row._id), row.name));
}
export function validateImageBytes(bytes: Buffer, contentType: string) {
	if (!bytes.length || bytes.length > MAX_POST_IMAGE_BYTES)
		throw new FormValidationError('Choose an image under 3 MB.');
	const valid =
		contentType === 'image/png'
			? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
			: contentType === 'image/jpeg'
				? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
				: contentType === 'image/webp'
					? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
					: false;
	if (!valid)
		throw new FormValidationError('Upload a PNG, JPEG, or WebP image with a matching file type.');
}
export async function uploadPostImage(
	request: Request,
	postId: string | undefined,
	userId: string
) {
	try {
		if (!postId || !idPattern.test(postId) || !(await Post.exists({ _id: postId })))
			throw new FormValidationError('Save the post before uploading images.');
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || file.size > MAX_POST_IMAGE_BYTES)
			throw new FormValidationError('Choose an image under 3 MB.');
		const bytes = Buffer.from(await file.arrayBuffer());
		validateImageBytes(bytes, file.type);
		const image = await PostImage.create({
			postId,
			name: file.name.slice(0, 160) || 'Image',
			contentType: file.type,
			data: bytes,
			_createdById: userId
		});
		return { image: imageOption(postId, String(image._id), image.name) };
	} catch (cause) {
		if (cause instanceof FormValidationError) return fail(400, { error: cause.message });
		throw cause;
	}
}
export async function servePostImage(postId: string, imageId: string) {
	if (!idPattern.test(postId) || !idPattern.test(imageId)) error(404, 'Image not found.');
	const image = await PostImage.findOne({ _id: imageId, postId }).select('+data');
	if (!image) error(404, 'Image not found.');
	return new Response(new Uint8Array(image.data), {
		headers: {
			'content-type': image.contentType,
			'content-length': String(image.data.length),
			'cache-control': 'private, no-store',
			'x-content-type-options': 'nosniff',
			'content-disposition': 'inline'
		}
	});
}
