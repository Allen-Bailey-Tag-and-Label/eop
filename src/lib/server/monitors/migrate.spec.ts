import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MonitorSession } from './model';

vi.mock('./model', () => ({ MonitorSession: { updateMany: vi.fn() } }));

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

describe('permanent monitor approval migration', () => {
	it('removes only approved record expiries and shares one migration between requests', async () => {
		const exec = vi.fn().mockResolvedValue({ modifiedCount: 2 });
		vi.mocked(MonitorSession.updateMany).mockReturnValue({ exec } as unknown as ReturnType<
			typeof MonitorSession.updateMany
		>);
		const { preserveMonitorApprovals } = await import('./migrate');
		await Promise.all([preserveMonitorApprovals(), preserveMonitorApprovals()]);
		await preserveMonitorApprovals();
		expect(MonitorSession.updateMany).toHaveBeenCalledExactlyOnceWith(
			{ status: 'approved', expiresAt: { $exists: true } },
			{ $unset: { expiresAt: 1 } }
		);
		expect(exec).toHaveBeenCalledTimes(1);
	});

	it('retries if the database update fails', async () => {
		const exec = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue({ modifiedCount: 0 });
		vi.mocked(MonitorSession.updateMany).mockReturnValue({ exec } as unknown as ReturnType<
			typeof MonitorSession.updateMany
		>);
		const { preserveMonitorApprovals } = await import('./migrate');
		await expect(preserveMonitorApprovals()).rejects.toThrow('offline');
		await expect(preserveMonitorApprovals()).resolves.toEqual({ modifiedCount: 0 });
		expect(exec).toHaveBeenCalledTimes(2);
	});
});
