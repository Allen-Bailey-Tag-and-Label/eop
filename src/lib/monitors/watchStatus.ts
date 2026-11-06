import { MAX_MONITOR_COMMANDS, type MonitorNavigationCommand } from './types';

type MonitorState = 'pending' | 'approved' | 'unpaired';

// Called on mount. Poll serially so slow connections never accumulate requests.
export function watchMonitorStatus(
	onState: (state: MonitorState) => void,
	onConnectionChange: (connected: boolean) => void,
	interval: number,
	refresh?: {
		version: number;
		onRefresh: (version: number) => void;
		navigation?: {
			monitorId: string;
			onNavigate: (command: MonitorNavigationCommand) => Promise<boolean> | boolean;
		};
	}
) {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout>;
	let refreshing = false;
	const storageKey = `monitor-navigation:${refresh?.navigation?.monitorId}`;
	const handled = new Set<string>();
	try {
		const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
		if (Array.isArray(saved))
			for (const id of saved.slice(-MAX_MONITOR_COMMANDS))
				if (typeof id === 'string') handled.add(id);
	} catch {
		/* Storage can be disabled on kiosk browsers. */
	}
	const remember = (id: string) => {
		handled.add(id);
		while (handled.size > MAX_MONITOR_COMMANDS) handled.delete(handled.values().next().value!);
		try {
			sessionStorage.setItem(storageKey, JSON.stringify([...handled]));
		} catch {
			/* Keep in memory. */
		}
	};
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
			const {
				state,
				refreshVersion,
				playlistId,
				navigationCommands
			}: {
				state: MonitorState;
				refreshVersion?: number;
				playlistId?: string;
				navigationCommands?: MonitorNavigationCommand[];
			} = await response.json();
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
			if (
				state === 'approved' &&
				!refreshing &&
				refresh?.navigation &&
				Array.isArray(navigationCommands)
			) {
				const ids: string[] = [];
				for (const command of navigationCommands.slice(0, MAX_MONITOR_COMMANDS)) {
					if (controller.signal.aborted) return;
					if (
						!command ||
						!/^[a-f\d]{32}$/.test(command.id) ||
						!/^[a-f\d]{24}$/.test(command.playlistId) ||
						(command.direction !== 'prev' && command.direction !== 'next')
					)
						continue;
					if (!handled.has(command.id)) {
						// Discard commands for assignments that have since changed.
						if (
							command.playlistId === playlistId &&
							!(await refresh.navigation.onNavigate(command))
						)
							break;
						remember(command.id);
					}
					ids.push(command.id);
				}
				if (ids.length && !controller.signal.aborted) {
					const ack = await fetch('/monitors/commands', {
						method: 'POST',
						credentials: 'same-origin',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ ids }),
						signal: request.signal
					});
					if (!ack.ok) throw new Error('Could not acknowledge monitor commands.');
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
