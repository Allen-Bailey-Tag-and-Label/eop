type MonitorState = 'pending' | 'approved' | 'unpaired';

// Called on mount. Poll serially so slow connections never accumulate requests.
export function watchMonitorStatus(
	onState: (state: MonitorState) => void,
	onConnectionChange: (connected: boolean) => void,
	interval: number
) {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout>;
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
			const { state }: { state: MonitorState } = await response.json();
			if (controller.signal.aborted) return;
			onConnectionChange(true);
			onState(state);
		} catch {
			if (!controller.signal.aborted) onConnectionChange(false);
		} finally {
			clearTimeout(timeout);
			controller.signal.removeEventListener('abort', abortRequest);
			if (!controller.signal.aborted) timer = setTimeout(poll, interval);
		}
	};
	void poll();
	return () => {
		controller.abort();
		clearTimeout(timer);
	};
}
