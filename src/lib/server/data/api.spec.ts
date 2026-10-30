import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { apiRows, publicAddress, validateConnection } from './api';

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));
vi.mock('node:https', () => ({ request: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { DATA_API_TEST: 'test-credential' } }));
const connection = () => ({
	baseUrl: 'https://api.example.com',
	paths: ['/rows'],
	auth: 'bearer' as const,
	secretEnv: 'DATA_API_TEST',
	headerName: '',
	timeoutMs: 1000
});
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never);
});
function response(
	status = 200,
	type = 'application/json',
	body = JSON.stringify({
		data: { rows: [{ id: 'one', profile: { name: 'Alice' }, hidden: 'private' }] }
	})
) {
	vi.mocked(request).mockImplementation(((
		_url: URL,
		_options: unknown,
		callback: (response: unknown) => void
	) => {
		const message = Object.assign(new EventEmitter(), {
			statusCode: status,
			headers: { 'content-type': type },
			destroy: vi.fn()
		});
		const req = Object.assign(new EventEmitter(), {
			end: () =>
				queueMicrotask(() => {
					callback(message);
					message.emit('data', Buffer.from(body));
					message.emit('end');
				})
		});
		return req;
	}) as never);
}
const config = () => ({
	path: '/rows',
	query: { department: { $param: 'department' } },
	itemsPath: 'data.rows',
	fields: { id: 'id', name: 'profile.name' }
});
describe('server API data nodes', () => {
	it('uses explicit endpoints, server credentials, pinned DNS, selected JSON fields, and no redirects', async () => {
		response();
		const rows = await apiRows(
			connection(),
			config(),
			{ department: 'press' },
			new AbortController().signal
		);
		expect(rows).toEqual([{ id: 'one', name: 'Alice' }]);
		const call = vi.mocked(request).mock.calls[0] as unknown as [
			URL,
			{
				headers: Record<string, string>;
				lookup: (
					host: string,
					options: unknown,
					callback: (error: unknown, address: string, family: number) => void
				) => void;
			}
		];
		expect(call[0].searchParams.get('department')).toBe('press');
		expect(call[1].headers.authorization).toBe('Bearer test-credential');
		const callback = vi.fn();
		call[1].lookup('api.example.com', {}, callback);
		expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4);
		expect(JSON.stringify(rows)).not.toContain('credential');
		expect(JSON.stringify(rows)).not.toContain('private');
	});
	it('rejects private destinations, unsafe credential references and endpoints outside the connection', async () => {
		for (const address of [
			'127.0.0.1',
			'10.0.0.1',
			'172.16.0.1',
			'169.254.169.254',
			'192.168.0.1',
			'100.100.100.200',
			'::1',
			'fc00::1',
			'::ffff:127.0.0.1'
		])
			expect(publicAddress(address)).toBe(false);
		for (const change of [
			{ baseUrl: 'http://api.example.com' },
			{ baseUrl: 'https://user:pass@api.example.com' },
			{ baseUrl: 'https://api.example.com/path' },
			{ secretEnv: 'MONGODB_URL' }
		])
			expect(() => validateConnection({ ...connection(), ...change })).toThrow();
		await expect(
			apiRows(connection(), { ...config(), path: '/other' }, {}, new AbortController().signal)
		).rejects.toThrow('not allowed');
		vi.mocked(lookup).mockResolvedValue([{ address: '127.0.0.1', family: 4 }] as never);
		await expect(
			apiRows(connection(), { ...config(), query: {} }, {}, new AbortController().signal)
		).rejects.toThrow('public addresses');
		expect(request).not.toHaveBeenCalled();
	});
	it('rejects redirects, oversized responses, invalid JSON and nonarray response paths', async () => {
		for (const [status, type, body] of [
			[302, 'application/json', '{}'],
			[200, 'text/html', '<html>'],
			[200, 'application/json', 'invalid'],
			[200, 'application/json', 'x'.repeat(1024 * 1024 + 1)],
			[200, 'application/json', '{}']
		] as const) {
			response(status, type, body);
			await expect(
				apiRows(connection(), { ...config(), query: {} }, {}, new AbortController().signal)
			).rejects.toThrow();
		}
	});
});
