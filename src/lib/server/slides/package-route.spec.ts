import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../routes/(private)/(unpadded)/admin/monitors/slides/[slug]/package/+server';
import { exportSlidePackage, reviewSlidePackage, importSlidePackage } from './packages';
vi.mock('./packages', () => ({
	exportSlidePackage: vi.fn(),
	reviewSlidePackage: vi.fn(),
	importSlidePackage: vi.fn()
}));
beforeEach(() => vi.clearAllMocks());
async function send(operation: string, fields: Record<string, string> = {}) {
	const data = new FormData();
	data.set('operation', operation);
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	if (operation !== 'export')
		data.set('file', new File(['zip'], 'slide.zip', { type: 'application/zip' }));
	return POST({
		request: new Request('https://example.com/admin/monitors/slides/new/package', {
			method: 'POST',
			body: data
		}),
		locals: { user: { _id: 'a'.repeat(24) } }
	} as Parameters<typeof POST>[0]);
}
describe('slide package endpoint', () => {
	it('returns downloadable ZIP bytes without action serialization', async () => {
		vi.mocked(exportSlidePackage).mockResolvedValue(Buffer.from('zip'));
		const response = await send('export', { title: 'Weather', slug: 'weather', definition: '{}' });
		expect(response.headers.get('content-type')).toBe('application/zip');
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.text()).toBe('zip');
	});
	it('reviews without importing, then forwards the chosen title, slug and reuse mappings', async () => {
		vi.mocked(reviewSlidePackage).mockResolvedValue({} as never);
		expect((await send('review')).status).toBe(200);
		expect(importSlidePackage).not.toHaveBeenCalled();
		const choices = { assets: {}, sources: {}, connections: {} };
		vi.mocked(importSlidePackage).mockResolvedValue({ slug: 'weather-live' });
		const response = await send('import', {
			title: 'Weather',
			slug: 'weather-live',
			choices: JSON.stringify(choices)
		});
		expect(await response.json()).toEqual({ slug: 'weather-live' });
		expect(importSlidePackage).toHaveBeenCalledWith(
			expect.any(Buffer),
			'Weather',
			'weather-live',
			choices,
			'a'.repeat(24)
		);
	});
	it('returns a validation response for invalid JSON', async () => {
		expect((await send('export', { definition: '{' })).status).toBe(400);
		expect(exportSlidePackage).not.toHaveBeenCalled();
	});
});
