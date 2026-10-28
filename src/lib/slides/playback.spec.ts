import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchPlayback } from './playback';
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
describe('monitor content refresh', () => {
	it('retains content during failures, retries, and aborts pending fetches on teardown', async () => {
		vi.useFakeTimers();
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(new Response('null', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetch);
		const receive = vi.fn();
		const connected = vi.fn();
		const stop = watchPlayback(receive, connected);
		await vi.advanceTimersByTimeAsync(0);
		expect(connected).toHaveBeenLastCalledWith(false);
		expect(receive).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(30000);
		expect(receive).toHaveBeenCalledWith(null);
		expect(connected).toHaveBeenLastCalledWith(true);
		stop();
		await vi.advanceTimersByTimeAsync(30000);
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});
