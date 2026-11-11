import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, RouteSettings } from './models';
import { getSettings } from './getSettings';
import { actions } from '../../../routes/(private)/api/mongooseTable/+page.server';

vi.mock('./models', () => ({
	Route: { findOne: vi.fn(), findOneAndUpdate: vi.fn() },
	RouteSettings: { findOne: vi.fn(), findOneAndUpdate: vi.fn() }
}));
vi.mock('../../../routes/(private)/api/mongooseTable', () => ({
	modelCache: new Map(),
	sanitizeDataFromSchema: vi.fn(),
	sanitizeUiFilters: vi.fn()
}));
const userId = 'a'.repeat(24);
const routeId = 'b'.repeat(24);
const query = (value: unknown) => ({ lean: () => ({ exec: async () => value }) });
const input = {
	url: new URL('https://eop.example/shipping/quote-finder'),
	locals: { user: { _id: userId } }
};
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(Route.findOne).mockReturnValue(query({ _id: routeId }) as never);
	vi.mocked(Route.findOneAndUpdate).mockReturnValue(query({ _id: routeId }) as never);
	vi.mocked(RouteSettings.findOne).mockReturnValue(query(null) as never);
});
describe('table route settings', () => {
	it('creates a missing exact route record and returns a usable ID for the first sort', async () => {
		vi.mocked(Route.findOne).mockReturnValue(query(null) as never);
		const settings = await getSettings(input);
		expect(settings._routeId).toBe(routeId);
		expect(Route.findOneAndUpdate).toHaveBeenCalledWith(
			{ href: '/shipping/quote-finder' },
			{ $setOnInsert: { href: '/shipping/quote-finder', _createdById: userId } },
			expect.objectContaining({ upsert: true, new: true })
		);
		const form = new FormData();
		form.set('_routeId', settings._routeId);
		form.set('sortKey', 'number');
		form.set('sortDirection', 'desc');
		await actions.find!({
			locals: input.locals,
			request: new Request('https://eop.example/api/mongooseTable?/find', {
				method: 'POST',
				body: form
			})
		} as never);
		expect(RouteSettings.findOneAndUpdate).toHaveBeenCalledWith(
			{ _routeId: routeId, _userId: userId },
			expect.objectContaining({ sortKey: 'number', sortDirection: 'desc' }),
			expect.objectContaining({ upsert: true })
		);
	});
	it('reuses existing exact route settings including saved sort and column order', async () => {
		vi.mocked(RouteSettings.findOne).mockReturnValue(
			query({
				sortKey: 'number',
				sortDirection: 'desc',
				columnsOrder: ['number', 'createdAt']
			}) as never
		);
		expect(await getSettings(input)).toMatchObject({
			_routeId: routeId,
			sortKey: 'number',
			sortDirection: 'desc',
			columnsOrder: ['number', 'createdAt']
		});
		expect(Route.findOneAndUpdate).not.toHaveBeenCalled();
		expect(RouteSettings.findOne).toHaveBeenCalledWith({ _routeId: routeId, _userId: userId });
	});
	it.each(['', 'undefined', 'not-an-id'])(
		'rejects invalid route ID %j without attempting an ObjectId database query',
		async (id) => {
			const form = new FormData();
			form.set('_routeId', id);
			const result = await actions.find!({
				locals: input.locals,
				request: new Request('https://eop.example/api/mongooseTable?/find', {
					method: 'POST',
					body: form
				})
			} as never);
			expect(result).toMatchObject({
				status: 400,
				data: { error: expect.stringContaining('Reload') }
			});
			expect(RouteSettings.findOneAndUpdate).not.toHaveBeenCalled();
		}
	);
});
