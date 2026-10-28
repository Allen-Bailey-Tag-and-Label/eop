import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchPlayback } from './playback';
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
describe('monitor content refresh', () => {
	it('fetches without caching on demand and ignores an older poll that finishes afterward', async () => {
		vi.useFakeTimers();
		let finishOld!: (response: Response) => void;
		const fetch = vi
			.fn()
			.mockReturnValueOnce(new Promise<Response>((resolve) => (finishOld = resolve)))
			.mockImplementation(
				async () => new Response('null', { headers: { 'content-type': 'application/json' } })
			);
		vi.stubGlobal('fetch', fetch);
		const receive = vi.fn();
		const source = watchPlayback(receive, vi.fn());
		const oldSignal = fetch.mock.calls[0][1].signal as AbortSignal;
		await source.refresh();
		expect(oldSignal.aborted).toBe(true);
		expect(receive).toHaveBeenCalledExactlyOnceWith(null);
		finishOld(new Response('null', { headers: { 'content-type': 'application/json' } }));
		await vi.advanceTimersByTimeAsync(0);
		expect(receive).toHaveBeenCalledOnce();
		await source.refresh();
		expect(fetch).toHaveBeenCalledTimes(3);
		for (const call of fetch.mock.calls)
			expect(call).toEqual(['/monitors/playback', expect.objectContaining({ cache: 'no-store' })]);
		source.stop();
	});
	it('aborts a boundary request on teardown without applying its late response', async () => {
		vi.useFakeTimers();
		let finish!: (response: Response) => void;
		const fetch = vi.fn<typeof globalThis.fetch>(
			() => new Promise<Response>((resolve) => (finish = resolve))
		);
		vi.stubGlobal('fetch', fetch);
		const receive = vi.fn();
		const source = watchPlayback(receive, vi.fn());
		const signal = fetch.mock.calls[0][1]?.signal;
		source.stop();
		expect(signal?.aborted).toBe(true);
		finish(new Response('null', { headers: { 'content-type': 'application/json' } }));
		await vi.advanceTimersByTimeAsync(30000);
		expect(receive).not.toHaveBeenCalled();
		expect(fetch).toHaveBeenCalledOnce();
	});
	it('retains content during failures, retries, and aborts pending fetches on teardown', async () => {
		vi.useFakeTimers();
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(new Response('null', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetch);
		const receive = vi.fn();
		const connected = vi.fn();
		const source = watchPlayback(receive, connected);
		await vi.advanceTimersByTimeAsync(0);
		expect(connected).toHaveBeenLastCalledWith(false);
		expect(receive).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(30000);
		expect(receive).toHaveBeenCalledWith(null);
		expect(connected).toHaveBeenLastCalledWith(true);
		source.stop();
		await vi.advanceTimersByTimeAsync(30000);
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});
