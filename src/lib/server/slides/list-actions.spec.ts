import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions } from '../../../routes/(private)/(padded)/admin/monitors/slides/+page.server';
import { duplicateSlide, manageSlide } from './content';
import { SlideValidationError } from '$lib/slides/validation';

vi.mock('./content', () => ({
	listSlides: vi.fn(),
	duplicateSlide: vi.fn(),
	manageSlide: vi.fn()
}));
beforeEach(() => vi.resetAllMocks());
function event(confirm?: string) {
	const body = new FormData();
	body.set('id', 'a'.repeat(24));
	body.set('version', '1');
	body.set('slug', 'welcome');
	if (confirm) body.set('confirm', confirm);
	return {
		request: new Request('http://localhost/admin/monitors/slides', { method: 'POST', body }),
		locals: { user: { _id: 'user' } }
	} as Parameters<typeof actions.delete>[0];
}
describe('slide list actions', () => {
	it('requires confirmation before delegating deletion', async () => {
		expect(await actions.delete(event())).toMatchObject({ status: 400 });
		expect(manageSlide).not.toHaveBeenCalled();
	});
	it('returns fresh playlist references when deletion is blocked', async () => {
		const references = [{ slug: 'live', title: 'Live', draft: false, published: true }];
		vi.mocked(manageSlide).mockResolvedValue(references);
		expect(await actions.delete(event('delete'))).toMatchObject({
			status: 409,
			data: { references }
		});
		expect(manageSlide).toHaveBeenCalledWith('delete', 'welcome', expect.any(FormData), 'user');
	});
	it('reports deletion success only after persistence succeeds', async () => {
		vi.mocked(manageSlide).mockResolvedValue([]);
		expect(await actions.delete(event('delete'))).toMatchObject({ success: 'Slide deleted.' });
		vi.mocked(manageSlide).mockRejectedValue(new SlideValidationError('Stale slide'));
		expect(await actions.delete(event('delete'))).toMatchObject({
			status: 400,
			data: { error: 'Stale slide' }
		});
	});
	it('opens the new draft after duplication and forwards validation failures', async () => {
		vi.mocked(duplicateSlide).mockResolvedValue('welcome-copy');
		await expect(actions.duplicate(event())).rejects.toMatchObject({
			status: 303,
			location: '/admin/monitors/slides/welcome-copy'
		});
		vi.mocked(duplicateSlide).mockRejectedValue(new SlideValidationError('Stale slide'));
		expect(await actions.duplicate(event())).toMatchObject({
			status: 400,
			data: { error: 'Stale slide' }
		});
	});
});
