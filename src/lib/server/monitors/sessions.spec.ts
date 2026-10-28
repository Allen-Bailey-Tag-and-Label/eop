import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { MonitorPairingLimit, MonitorSession, type MonitorRecord } from './model';
import {
	approveMonitor,
	getMonitorSession,
	hashToken,
	listMonitors,
	normalizePairingCode,
	PAIRING_DURATION_MS,
	PairingLimitError,
	requestPairing,
	revokeMonitor,
	setMonitorColorMode
} from './sessions';

vi.mock('./model', () => ({
	MonitorSession: {
		create: vi.fn(),
		findOne: vi.fn(),
		findOneAndUpdate: vi.fn(),
		find: vi.fn(),
		updateOne: vi.fn()
	},
	MonitorPairingLimit: { findOneAndUpdate: vi.fn() }
}));

const model = MonitorSession as unknown as Record<
	'create' | 'findOne' | 'findOneAndUpdate' | 'find' | 'updateOne',
	ReturnType<typeof vi.fn>
>;
const limiter = MonitorPairingLimit as unknown as { findOneAndUpdate: ReturnType<typeof vi.fn> };
const now = new Date('2026-10-28T12:00:00Z');
const userId = 'a'.repeat(24);
let records: MonitorRecord[];
let attempts: number;
type Filter = {
	tokenHash?: string;
	pairingCode?: string;
	_id?: Types.ObjectId;
	status?: string | { $in: string[] };
	expiresAt?: { $gt: Date };
	$or?: Filter[];
};
type Update = { $set?: Partial<MonitorRecord>; $unset?: Record<string, unknown> };

function matches(record: MonitorRecord, filter: Filter): boolean {
	return (
		(!filter.tokenHash || record.tokenHash === filter.tokenHash) &&
		(!filter.pairingCode || record.pairingCode === filter.pairingCode) &&
		(!filter._id || record._id.toString() === filter._id.toString()) &&
		(!filter.expiresAt || (!!record.expiresAt && record.expiresAt > filter.expiresAt.$gt)) &&
		(!filter.$or || filter.$or.some((branch) => matches(record, branch))) &&
		(!filter.status ||
			(typeof filter.status === 'string'
				? record.status === filter.status
				: filter.status.$in.includes(record.status)))
	);
}

function query<T>(value: T) {
	return {
		select: () => query(value),
		sort: () => query(value),
		limit: () => query(value),
		lean: async () => value
	};
}

function updateRecord(filter: Filter, update: Update) {
	const record = records.find((entry) => matches(entry, filter));
	if (!record) return null;
	Object.assign(record, update.$set);
	if (update.$unset?.pairingCode) delete record.pairingCode;
	if (update.$unset?.expiresAt) delete record.expiresAt;
	return { ...record };
}

beforeEach(() => {
	vi.clearAllMocks();
	records = [];
	attempts = 0;
	limiter.findOneAndUpdate.mockImplementation(() => query({ attempts: ++attempts }));
	model.create.mockImplementation(async (data: Partial<MonitorRecord>) => {
		const record = { _id: new Types.ObjectId(), location: '', ...data } as MonitorRecord;
		records.push(record);
		return { ...record };
	});
	model.findOne.mockImplementation((filter: Filter) => {
		const record = records.find((entry) => matches(entry, filter));
		return query(record ? { ...record } : null);
	});
	model.findOneAndUpdate.mockImplementation((filter: Filter, update: Update) =>
		query(updateRecord(filter, update))
	);
	model.updateOne.mockImplementation(async (filter: Filter, update: Update) => ({
		modifiedCount: updateRecord(filter, update) ? 1 : 0
	}));
	model.find.mockImplementation((filter: Filter) =>
		query(records.filter((entry) => matches(entry, filter)))
	);
});

describe('monitor pairing', () => {
	it('sets only valid color modes on approved monitors', async () => {
		for (const [id, mode] of [
			[{ $ne: null }, 'dark'],
			['a'.repeat(24), 'invalid']
		])
			expect(await setMonitorColorMode(id, mode)).toBe(false);
		expect(model.updateOne).not.toHaveBeenCalled();
		model.updateOne.mockResolvedValueOnce({ matchedCount: 1 });
		expect(await setMonitorColorMode('a'.repeat(24), 'system')).toBe(true);
		expect(model.updateOne).toHaveBeenCalledWith(
			{ _id: new Types.ObjectId('a'.repeat(24)), status: 'approved' },
			{ $set: { colorMode: 'system' } }
		);
		model.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
		expect(await setMonitorColorMode('a'.repeat(24), 'light')).toBe(false);
	});
	it('creates a short-lived code and a separate cryptographically random browser secret', async () => {
		const pairing = await requestPairing(undefined, '192.0.2.1', now);
		expect(pairing.token).toMatch(/^[a-f0-9]{64}$/);
		expect(pairing.session.pairingCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
		expect(records[0].tokenHash).toBe(hashToken(pairing.token));
		expect(records[0].tokenHash).not.toBe(pairing.token);
		expect(pairing.session.expiresAt!.getTime() - now.getTime()).toBe(PAIRING_DURATION_MS);
		expect(await getMonitorSession(pairing.session.pairingCode, now)).toBeNull();
		expect(await getMonitorSession('f'.repeat(64), now)).toBeNull();
	});

	it('reuses a pending browser session without creating more codes or consuming the rate limit', async () => {
		const first = await requestPairing(undefined, '192.0.2.1', now);
		const repeated = await requestPairing(first.token, '192.0.2.1', now);
		expect(repeated.token).toBe(first.token);
		expect(repeated.session.pairingCode).toBe(first.session.pairingCode);
		expect(model.create).toHaveBeenCalledTimes(1);
		expect(attempts).toBe(1);
	});

	it('normalizes readable codes and atomically allows only one approval', async () => {
		const pairing = await requestPairing(undefined, '192.0.2.1', now);
		const code = pairing.session.pairingCode!;
		const formatted = `${code.slice(0, 4)}-${code.slice(4)}`.toLowerCase();
		const approvals = await Promise.all([
			approveMonitor(formatted, ' Break room ', userId, now),
			approveMonitor(code, 'Another room', userId, now)
		]);
		expect(approvals.filter(Boolean)).toHaveLength(1);
		const session = await getMonitorSession(pairing.token, now);
		expect(session?.status).toBe('approved');
		expect(session?.location).toBe('Break room');
		expect(session?.pairingCode).toBeUndefined();
		expect(session?.approvedById?.toString()).toBe(userId);
		expect(session).not.toHaveProperty('expiresAt');
	});

	it('rejects expired codes even when MongoDB has not deleted the document yet', async () => {
		const pairing = await requestPairing(undefined, '192.0.2.1', now);
		const expired = new Date(now.getTime() + PAIRING_DURATION_MS);
		expect(
			await approveMonitor(pairing.session.pairingCode, 'Break room', userId, expired)
		).toBeNull();
		expect(await getMonitorSession(pairing.token, expired)).toBeNull();
		const replacement = await requestPairing(pairing.token, '192.0.2.1', expired);
		expect(replacement.token).not.toBe(pairing.token);
	});

	it('rejects malformed codes, injected values, and invalid descriptions', async () => {
		for (const code of ['123', 'IIII-OOOO', { $ne: null }, null]) {
			expect(await approveMonitor(code, 'Break room', userId, now)).toBeNull();
		}
		expect(await approveMonitor('ABCD-EFGH', 'x', userId, now)).toBeNull();
		expect(await approveMonitor('ABCD-EFGH', 'x'.repeat(161), userId, now)).toBeNull();
		expect(model.findOneAndUpdate).not.toHaveBeenCalled();
		expect(normalizePairingCode(' abcd efgh ')).toBe('ABCDEFGH');
	});

	it('retries code collisions and limits creation attempts through shared database state', async () => {
		model.create.mockRejectedValueOnce({ code: 11000 });
		await requestPairing(undefined, '192.0.2.1', now);
		expect(model.create).toHaveBeenCalledTimes(2);
		for (let attempt = 1; attempt < 30; attempt++)
			await requestPairing(undefined, '192.0.2.1', now);
		await expect(requestPairing(undefined, '192.0.2.1', now)).rejects.toBeInstanceOf(
			PairingLimitError
		);
		expect(records).toHaveLength(30);
	});

	it('revokes a session and excludes credentials from the admin list', async () => {
		const pairing = await requestPairing(undefined, '192.0.2.1', now);
		const approved = await approveMonitor(pairing.session.pairingCode, 'Break room', userId, now);
		const list = await listMonitors();
		expect(list).toHaveLength(1);
		expect(list[0]).not.toHaveProperty('tokenHash');
		expect(list[0]).not.toHaveProperty('pairingCode');
		expect(await revokeMonitor(approved!._id.toString(), now)).toBe(true);
		expect(await getMonitorSession(pairing.token, now)).toBeNull();
		expect(await listMonitors()).toEqual([]);
		expect(await revokeMonitor({ $ne: null }, now)).toBe(false);
	});

	it('keeps approved sessions valid years later and still allows revocation', async () => {
		const pairing = await requestPairing(undefined, '192.0.2.1', now);
		const approved = await approveMonitor(pairing.session.pairingCode, 'Break room', userId, now);
		const later = new Date('2046-10-28T12:00:00Z');
		expect(await getMonitorSession(pairing.token, later)).toMatchObject({ status: 'approved' });
		expect(await listMonitors()).toHaveLength(1);
		expect(await revokeMonitor(approved!._id.toString(), later)).toBe(true);
		expect(await getMonitorSession(pairing.token, later)).toBeNull();
	});
});
