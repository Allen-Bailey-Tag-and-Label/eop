import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchMonitorStatus, monitorRefreshUrl } from './watchStatus';

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('monitor status polling', () => {
	it('refreshes once after reconnection and does not replay the command after a fresh page load', async () => {
		vi.useFakeTimers();
		let version = 0;
		const fetch = vi.fn().mockImplementation(async () => ({
			ok: true,
			json: async () => ({ state: 'approved', refreshVersion: version })
		}));
		vi.stubGlobal('fetch', fetch);
		const onRefresh = vi.fn();
		let stop = watchMonitorStatus(vi.fn(), vi.fn(), 1000, { version: 0, onRefresh });
		await vi.advanceTimersByTimeAsync(0);
		expect(onRefresh).not.toHaveBeenCalled();
		fetch.mockRejectedValueOnce(new Error('offline'));
		version = 2;
		await vi.advanceTimersByTimeAsync(1000);
		expect(onRefresh).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1000);
		expect(onRefresh).toHaveBeenCalledExactlyOnceWith(2);
		const count = fetch.mock.calls.length;
		await vi.advanceTimersByTimeAsync(5000);
		expect(fetch).toHaveBeenCalledTimes(count);
		stop();
		onRefresh.mockClear();
		stop = watchMonitorStatus(vi.fn(), vi.fn(), 1000, { version: 2, onRefresh });
		await vi.advanceTimersByTimeAsync(0);
		expect(onRefresh).not.toHaveBeenCalled();
		version = 3;
		await vi.advanceTimersByTimeAsync(1000);
		expect(onRefresh).toHaveBeenCalledExactlyOnceWith(3);
		stop();
	});
	it('ignores refresh metadata for unapproved states and invalid versions', async () => {
		vi.useFakeTimers();
		const values = [
			{ state: 'pending', refreshVersion: 3 },
			{ state: 'approved', refreshVersion: -1 },
			{ state: 'approved' },
			{ state: 'approved', refreshVersion: '3' }
		];
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				ok: true,
				json: async () => values.shift() ?? { state: 'approved', refreshVersion: 0 }
			}))
		);
		const onRefresh = vi.fn();
		const stop = watchMonitorStatus(vi.fn(), vi.fn(), 1000, { version: 0, onRefresh });
		await vi.advanceTimersByTimeAsync(4000);
		expect(onRefresh).not.toHaveBeenCalled();
		stop();
	});
	it('builds a same-origin document URL with a new cache-busting generation', () => {
		const url = new URL(
			monitorRefreshUrl('https://eop.example/monitors/display?existing=yes&_monitorRefresh=1', 2)
		);
		expect(url.origin).toBe('https://eop.example');
		expect(url.pathname).toBe('/monitors/display');
		expect(url.searchParams.get('existing')).toBe('yes');
		expect(url.searchParams.getAll('_monitorRefresh')).toEqual(['2']);
	});
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
