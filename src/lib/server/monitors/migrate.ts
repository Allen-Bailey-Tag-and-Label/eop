import { MonitorSession } from './model';

let migration: Promise<unknown> | undefined;

// Preserve existing approvals before the old TTL index can remove them.
// The update is idempotent and runs once per server process, retrying on failure.
export function preserveMonitorApprovals() {
	return (migration ??= MonitorSession.updateMany(
		{ status: 'approved', expiresAt: { $exists: true } },
		{ $unset: { expiresAt: 1 } }
	)
		.exec()
		.catch((error) => {
			migration = undefined;
			throw error;
		}));
}
