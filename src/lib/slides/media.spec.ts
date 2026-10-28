import { afterEach, describe, expect, it, vi } from 'vitest';
import { SlideMediaCache } from './media';
afterEach(() => vi.unstubAllGlobals());
describe('monitor media cache', () => {
	it('reuses loaded media without networking and bounds memory while protecting the current slide', async () => {
		const revoke = vi.fn();
		vi.stubGlobal('URL', {
			createObjectURL: vi.fn(() => `blob:${Math.random()}`),
			revokeObjectURL: revoke
		});
		const fetch = vi.fn(
			async () =>
				new Response(new Blob(['1234'], { type: 'image/png' }), {
					headers: { 'content-type': 'image/png' }
				})
		);
		vi.stubGlobal('fetch', fetch);
		const cache = new SlideMediaCache(8);
		const signal = new AbortController().signal;
		await cache.load('a', signal);
		await cache.load('b', signal);
		cache.protectedIds = new Set(['a']);
		await cache.load('a', signal);
		expect(fetch).toHaveBeenCalledTimes(2);
		await cache.load('c', signal);
		expect(Object.keys(cache.urls(['a', 'b', 'c']))).toEqual(['a', 'c']);
		expect(revoke).toHaveBeenCalledTimes(1);
		cache.destroy();
		expect(revoke).toHaveBeenCalledTimes(3);
	});
	it('does not cache a sign-in redirect or other non-image response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response('<html>Sign in</html>', { headers: { 'content-type': 'text/html' } })
			)
		);
		const cache = new SlideMediaCache();
		await expect(cache.load('a', new AbortController().signal)).rejects.toThrow(
			'Image unavailable'
		);
		expect(cache.urls(['a'])).toEqual({});
	});
});
