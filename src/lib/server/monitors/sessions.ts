import { createHash, randomBytes, randomInt } from 'node:crypto';
import { Types } from 'mongoose';
import { MonitorPairingLimit, MonitorSession } from './model';
import { MAX_MONITOR_COMMANDS } from '$lib/monitors/types';

export const MONITOR_COOKIE = 'monitorSession';
export const PAIRING_DURATION_MS = 10 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PAIRING_LIMIT = 30;

export class PairingLimitError extends Error {
	constructor() {
		super('Too many pairing requests. Please try again in 10 minutes.');
	}
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function normalizePairingCode(value: unknown) {
	if (typeof value !== 'string' || value.length > 32) return null;
	const code = value.toUpperCase().replace(/[\s-]/g, '');
	return /^[A-HJ-NP-Z2-9]{8}$/.test(code) ? code : null;
}

function isDuplicateKey(error: unknown) {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

async function limitPairingRequests(address: string, now: Date) {
	const windowStart = Math.floor(now.getTime() / PAIRING_DURATION_MS) * PAIRING_DURATION_MS;
	const id = `${windowStart}:${hashToken(address)}`;
	const increment = () =>
		MonitorPairingLimit.findOneAndUpdate(
			{ _id: id },
			{
				$inc: { attempts: 1 },
				$setOnInsert: { expiresAt: new Date(windowStart + PAIRING_DURATION_MS) }
			},
			{ upsert: true, new: true }
		).lean();
	let limit;
	try {
		limit = await increment();
	} catch (error) {
		if (!isDuplicateKey(error)) throw error;
		limit = await increment();
	}
	if (!limit || limit.attempts > PAIRING_LIMIT) throw new PairingLimitError();
}

export async function getMonitorSession(token: string | undefined, now = new Date()) {
	if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
	return MonitorSession.findOne({
		tokenHash: hashToken(token),
		$or: [{ status: 'approved' }, { status: 'pending', expiresAt: { $gt: now } }]
	})
		.select('+pairingCode')
		.lean();
}

export async function requestPairing(token: string | undefined, address: string, now = new Date()) {
	const existing = await getMonitorSession(token, now);
	if (existing) return { session: existing, token: token! };
	await limitPairingRequests(address, now);
	for (let attempt = 0; attempt < 3; attempt++) {
		const newToken = randomBytes(32).toString('hex');
		const pairingCode = Array.from(
			{ length: 8 },
			() => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
		).join('');
		try {
			const session = await MonitorSession.create({
				tokenHash: hashToken(newToken),
				pairingCode,
				status: 'pending',
				expiresAt: new Date(now.getTime() + PAIRING_DURATION_MS)
			});
			return { session, token: newToken };
		} catch (error) {
			if (!isDuplicateKey(error)) throw error;
		}
	}
	throw new Error('Could not generate a unique monitor code. Please retry.');
}

export async function approveMonitor(
	rawCode: unknown,
	rawLocation: unknown,
	userId: string,
	now = new Date()
) {
	const pairingCode = normalizePairingCode(rawCode);
	const location = typeof rawLocation === 'string' ? rawLocation.trim().replace(/\s+/g, ' ') : '';
	if (!pairingCode || location.length < 2 || location.length > 160) return null;
	return MonitorSession.findOneAndUpdate(
		{ pairingCode, status: 'pending', expiresAt: { $gt: now } },
		{
			$set: {
				status: 'approved',
				location,
				approvedAt: now,
				approvedById: new Types.ObjectId(userId)
			},
			$unset: { pairingCode: 1, expiresAt: 1 }
		},
		{ new: true, runValidators: true }
	).lean();
}

export async function touchMonitor(id: Types.ObjectId, now = new Date()) {
	await MonitorSession.updateOne(
		{
			_id: id,
			status: 'approved',
			$or: [
				{ lastSeenAt: { $exists: false } },
				{ lastSeenAt: { $lt: new Date(now.getTime() - 60_000) } }
			]
		},
		{ $set: { lastSeenAt: now } }
	);
}

export async function listMonitors() {
	const sessions = await MonitorSession.find({ status: 'approved' })
		.select('location approvedAt lastSeenAt playlistId colorMode')
		.sort({ approvedAt: -1 })
		.limit(200)
		.lean();
	return sessions.map((session) => ({
		id: session._id.toString(),
		location: session.location,
		approvedAt: session.approvedAt?.toISOString() ?? null,
		lastSeenAt: session.lastSeenAt?.toISOString() ?? null,
		playlistId: session.playlistId?.toString() ?? '',
		colorMode: session.colorMode ?? 'dark'
	}));
}

export async function setMonitorColorMode(id: unknown, mode: unknown) {
	if (
		typeof id !== 'string' ||
		!/^[a-f\d]{24}$/i.test(id) ||
		(mode !== 'light' && mode !== 'dark' && mode !== 'system')
	)
		return false;
	const result = await MonitorSession.updateOne(
		{ _id: new Types.ObjectId(id), status: 'approved' },
		{ $set: { colorMode: mode } }
	);
	return result.matchedCount === 1;
}

export async function requestMonitorNavigation(
	id: unknown,
	direction: unknown,
	playlistId: unknown
) {
	if (
		typeof id !== 'string' ||
		!/^[a-f\d]{24}$/i.test(id) ||
		typeof playlistId !== 'string' ||
		!/^[a-f\d]{24}$/i.test(playlistId) ||
		(direction !== 'prev' && direction !== 'next')
	)
		return false;
	const result = await MonitorSession.updateOne(
		{
			_id: new Types.ObjectId(id),
			status: 'approved',
			playlistId: new Types.ObjectId(playlistId),
			[`navigationCommands.${MAX_MONITOR_COMMANDS - 1}`]: { $exists: false }
		},
		{
			$push: {
				navigationCommands: {
					id: randomBytes(16).toString('hex'),
					direction,
					playlistId: playlistId.toLowerCase()
				}
			}
		}
	);
	return result.modifiedCount === 1;
}

export async function acknowledgeMonitorNavigation(id: string, ids: unknown) {
	if (
		!/^[a-f\d]{24}$/i.test(id) ||
		!Array.isArray(ids) ||
		!ids.length ||
		ids.length > MAX_MONITOR_COMMANDS ||
		ids.some((value) => typeof value !== 'string' || !/^[a-f\d]{32}$/.test(value))
	)
		return false;
	const result = await MonitorSession.updateOne(
		{ _id: new Types.ObjectId(id), status: 'approved' },
		{ $pull: { navigationCommands: { id: { $in: ids } } } }
	);
	return result.matchedCount === 1;
}

export async function requestMonitorRefresh(id: unknown) {
	if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return false;
	const result = await MonitorSession.updateOne(
		{ _id: new Types.ObjectId(id), status: 'approved' },
		{ $inc: { refreshVersion: 1 }, $set: { navigationCommands: [] } }
	);
	return result.modifiedCount === 1;
}

export async function revokeMonitor(id: unknown, now = new Date()) {
	if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return false;
	const result = await MonitorSession.updateOne(
		{ _id: new Types.ObjectId(id), status: 'approved' },
		{ $set: { status: 'revoked', expiresAt: now }, $unset: { pairingCode: 1 } }
	);
	return result.modifiedCount === 1;
}
