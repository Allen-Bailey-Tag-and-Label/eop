import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchMonitorStatus } from './watchStatus';

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('monitor status polling', () => {
	it('retries connection failures and reports approval without overlapping polls', async () => {
		vi.useFakeTimers();
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue({ ok: true, json: async () => ({ state: 'approved' }) });
		vi.stubGlobal('fetch', fetch);
		const state = vi.fn();
		const connection = vi.fn();
		const stop = watchMonitorStatus(state, connection, 5000);
		await vi.advanceTimersByTimeAsync(0);
		expect(connection).toHaveBeenCalledWith(false);
		await vi.advanceTimersByTimeAsync(5000);
		expect(state).toHaveBeenCalledWith('approved');
		expect(connection).toHaveBeenLastCalledWith(true);
		stop();
		await vi.advanceTimersByTimeAsync(30_000);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('aborts an in-flight request on unmount and never restarts polling', async () => {
		vi.useFakeTimers();
		let signal: AbortSignal | undefined;
		vi.stubGlobal(
			'fetch',
			vi.fn((_url, options: RequestInit) => {
				signal = options.signal as AbortSignal;
				return new Promise(() => {});
			})
		);
		const state = vi.fn();
		const stop = watchMonitorStatus(state, vi.fn(), 5000);
		stop();
		expect(signal?.aborted).toBe(true);
		await vi.advanceTimersByTimeAsync(30_000);
		expect(state).not.toHaveBeenCalled();
	});
});
