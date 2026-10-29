import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions } from '../../../routes/(private)/(padded)/admin/monitors/playlists/+page.server';
import { deletePlaylist, duplicatePlaylist } from './content';
import { SlideValidationError } from '$lib/slides/validation';
vi.mock('./content', () => ({
	listPlaylists: vi.fn(),
	deletePlaylist: vi.fn(),
	duplicatePlaylist: vi.fn()
}));
beforeEach(() => vi.resetAllMocks());
function event() {
	return {
		request: new Request('http://localhost/admin/monitors/playlists', {
			method: 'POST',
			body: new FormData()
		}),
		locals: { user: { _id: 'user' } }
	} as Parameters<typeof actions.delete>[0];
}
describe('playlist list actions', () => {
	it('opens the new unpublished copy in its playlist editor', async () => {
		vi.mocked(duplicatePlaylist).mockResolvedValue('live-copy');
		await expect(actions.duplicate(event())).rejects.toMatchObject({
			status: 303,
			location: '/admin/monitors/playlists/live-copy'
		});
		expect(duplicatePlaylist).toHaveBeenCalledWith(expect.any(FormData), 'user');
	});
	it('returns assigned monitor locations instead of deletion success', async () => {
		const monitors = [{ id: 'monitor', location: 'Break room' }];
		vi.mocked(deletePlaylist).mockResolvedValue(monitors);
		expect(await actions.delete(event())).toMatchObject({ status: 409, data: { monitors } });
	});
	it('reports success after an unassigned playlist is deleted', async () => {
		vi.mocked(deletePlaylist).mockResolvedValue([]);
		expect(await actions.delete(event())).toMatchObject({ success: 'Playlist deleted.' });
	});
	it('forwards validation and stale version errors for both actions', async () => {
		vi.mocked(deletePlaylist).mockRejectedValue(new SlideValidationError('Confirm deletion'));
		vi.mocked(duplicatePlaylist).mockRejectedValue(new SlideValidationError('Stale playlist'));
		expect(await actions.delete(event())).toMatchObject({
			status: 400,
			data: { error: 'Confirm deletion' }
		});
		expect(await actions.duplicate(event())).toMatchObject({
			status: 400,
			data: { error: 'Stale playlist' }
		});
	});
});
