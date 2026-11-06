export const MONITOR_STATUS_INTERVAL_MS = 2000;
export const MAX_MONITOR_COMMANDS = 100;

export type MonitorNavigationCommand = {
	id: string;
	direction: 'prev' | 'next';
	playlistId: string;
};
