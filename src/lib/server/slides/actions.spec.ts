import { beforeEach, describe, expect, it, vi } from 'vitest';
import { manageSlideEditor } from './actions';
import { manageSlide } from './content';
import { SlideValidationError } from '$lib/slides/validation';

vi.mock('./content', () => ({ manageSlide: vi.fn(), saveContent: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const request = () =>
	new Request('http://localhost/admin/monitors/slides/welcome', {
		method: 'POST',
		body: new FormData()
	});

describe('slide management actions', () => {
	it('returns fresh playlist references when deletion is blocked', async () => {
		const references = [{ slug: 'live', title: 'Live playlist', draft: false, published: true }];
		vi.mocked(manageSlide).mockResolvedValue(references);
		const result = await manageSlideEditor('delete', request(), 'user', 'welcome');
		expect(result).toMatchObject({ status: 409, data: { references } });
	});
	it('redirects to the slide list after successful deletion', async () => {
		vi.mocked(manageSlide).mockResolvedValue([]);
		await expect(manageSlideEditor('delete', request(), 'user', 'welcome')).rejects.toMatchObject({
			status: 303,
			location: '/admin/monitors/slides'
		});
	});
	it('stays in the editor after unpublishing and forwards the route slug', async () => {
		vi.mocked(manageSlide).mockResolvedValue([]);
		expect(await manageSlideEditor('unpublish', request(), 'user', 'welcome')).toHaveProperty(
			'success'
		);
		expect(manageSlide).toHaveBeenCalledWith('unpublish', 'welcome', expect.any(FormData), 'user');
	});
	it('returns validation errors without reporting success', async () => {
		vi.mocked(manageSlide).mockRejectedValue(new SlideValidationError('Reload the editor.'));
		expect(await manageSlideEditor('unpublish', request(), 'user', 'welcome')).toMatchObject({
			status: 400,
			data: { error: 'Reload the editor.' }
		});
	});
});
