type MonitorState = 'pending' | 'approved' | 'unpaired';

// Called on mount. Poll serially so slow connections never accumulate requests.
export function watchMonitorStatus(
	onState: (state: MonitorState) => void,
	onConnectionChange: (connected: boolean) => void,
	interval: number,
	refresh?: { version: number; onRefresh: (version: number) => void }
) {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout>;
	let refreshing = false;
	const poll = async () => {
		const request = new AbortController();
		const abortRequest = () => request.abort();
		controller.signal.addEventListener('abort', abortRequest, { once: true });
		const timeout = setTimeout(abortRequest, 10_000);
		try {
			const response = await fetch('/monitors/status', {
				cache: 'no-store',
				credentials: 'same-origin',
				signal: request.signal
			});
			if (!response.ok) throw new Error('Could not check monitor status.');
			const { state, refreshVersion }: { state: MonitorState; refreshVersion?: number } =
				await response.json();
			if (controller.signal.aborted) return;
			onConnectionChange(true);
			onState(state);
			if (
				state === 'approved' &&
				refresh &&
				typeof refreshVersion === 'number' &&
				Number.isSafeInteger(refreshVersion) &&
				refreshVersion >= 0 &&
				refreshVersion !== refresh.version &&
				!refreshing
			) {
				refreshing = true;
				try {
					refresh.onRefresh(refreshVersion);
				} catch (error) {
					refreshing = false;
					throw error;
				}
			}
		} catch {
			if (!controller.signal.aborted) onConnectionChange(false);
		} finally {
			clearTimeout(timeout);
			controller.signal.removeEventListener('abort', abortRequest);
			if (!controller.signal.aborted && !refreshing) timer = setTimeout(poll, interval);
		}
	};
	void poll();
	return () => {
		controller.abort();
		clearTimeout(timer);
	};
}

export function monitorRefreshUrl(href: string, version: number) {
	const url = new URL(href);
	url.searchParams.set('_monitorRefresh', String(version));
	return url.href;
}
