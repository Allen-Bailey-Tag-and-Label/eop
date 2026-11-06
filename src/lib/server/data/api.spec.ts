import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { gzipSync } from 'node:zlib';
import { apiRows, apiRequest, publicAddress, validateConnection } from './api';

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
	body: string | Buffer = JSON.stringify({
		data: { rows: [{ id: 'one', profile: { name: 'Alice' }, hidden: 'private' }] }
	}),
	responseHeaders: Record<string, string> = {}
) {
	vi.mocked(request).mockImplementation(((
		_url: URL,
		_options: unknown,
		callback: (response: unknown) => void
	) => {
		const message = Object.assign(new EventEmitter(), {
			statusCode: status,
			headers: { 'content-type': type, ...responseHeaders },
			destroy: vi.fn()
		});
		const req = Object.assign(new EventEmitter(), {
			end: vi.fn(() =>
				queueMicrotask(() => {
					callback(message);
					message.emit('data', Buffer.from(body));
					message.emit('end');
				})
			)
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
	it('preserves the original response bytes and non-success payloads while dropping cookies and redirects', async () => {
		const body = ' {"metadata":{"page":2},"rows":[{"nested":[1,null,true]}],"error":false} ';
		response(422, 'application/problem+json', body, {
			'set-cookie': 'session=upstream',
			location: 'https://other.example',
			'retry-after': '30'
		});
		const result = await apiRequest(
			connection(),
			{ path: '/rows', query: new URLSearchParams('tag=a&tag=b&$select=name') },
			new AbortController().signal
		);
		expect(result.status).toBe(422);
		expect(result.body.toString()).toBe(body);
		expect(result.headers).toEqual({
			'content-type': 'application/problem+json',
			'retry-after': '30'
		});
		expect((vi.mocked(request).mock.calls[0][0] as URL).searchParams.getAll('tag')).toEqual([
			'a',
			'b'
		]);
		expect((vi.mocked(request).mock.calls[0][0] as URL).searchParams.get('$select')).toBe('name');
	});
	it('forwards explicitly allowed POST bodies with server authentication and supports binary responses', async () => {
		const bytes = Buffer.from([137, 80, 78, 71, 0, 255]);
		response(200, 'image/png', bytes);
		const body = Buffer.from('{"query":"weather"}');
		const result = await apiRequest(
			{ ...connection(), methods: ['POST'] },
			{ path: '/rows', method: 'POST', body, contentType: 'application/json' },
			new AbortController().signal
		);
		expect(result.body).toEqual(bytes);
		const options = vi.mocked(request).mock.calls[0][1] as unknown as {
			method: string;
			headers: Record<string, string>;
		};
		expect(options.method).toBe('POST');
		expect(options.headers.authorization).toBe('Bearer test-credential');
		expect(options.headers['content-type']).toBe('application/json');
		expect((vi.mocked(request).mock.results[0].value as { end: unknown }).end).toHaveBeenCalledWith(
			body
		);
	});
	it('keeps existing connections read-only and validates method and monitor exposure settings', async () => {
		expect(validateConnection(connection())).toEqual(connection());
		expect(
			validateConnection({ ...connection(), paths: ["/v1/Orders('123')", '/v1/items:search'] })
		).toMatchObject({ paths: ["/v1/Orders('123')", '/v1/items:search'] });
		expect(
			validateConnection({ ...connection(), methods: ['GET', 'POST'], monitorProxy: true })
		).toMatchObject({ methods: ['GET', 'POST'], monitorProxy: true });
		for (const change of [{ methods: [] }, { methods: ['CONNECT'] }, { monitorProxy: 'yes' }])
			expect(() => validateConnection({ ...connection(), ...change })).toThrow();
		await expect(
			apiRequest(connection(), { path: '/rows', method: 'POST' }, new AbortController().signal)
		).rejects.toMatchObject({ status: 405 });
		await expect(
			apiRequest(
				connection(),
				{ path: '/rows', body: new Uint8Array(1) },
				new AbortController().signal
			)
		).rejects.toMatchObject({ status: 400 });
		await expect(
			apiRequest(
				{ ...connection(), methods: ['POST'] },
				{ path: '/rows', method: 'POST', body: new Uint8Array(1024 * 1024 + 1) },
				new AbortController().signal
			)
		).rejects.toMatchObject({ status: 413 });
		expect(request).not.toHaveBeenCalled();
	});
	it('supports parameterized query APIs in data links without changing row mapping', async () => {
		response();
		const rows = await apiRows(
			{ ...connection(), methods: ['POST'] },
			{
				...config(),
				method: 'POST',
				body: { department: { $param: 'department' } },
				query: { $select: 'name' }
			},
			{ department: 'press' },
			new AbortController().signal
		);
		expect(rows).toEqual([{ id: 'one', name: 'Alice' }]);
		expect((vi.mocked(request).mock.results[0].value as { end: unknown }).end).toHaveBeenCalledWith(
			Buffer.from('{"department":"press"}')
		);
	});
	it('cancels a pending DNS request on timeout without opening a connection', async () => {
		vi.useFakeTimers();
		try {
			vi.mocked(lookup).mockImplementation(() => new Promise(() => {}) as never);
			const pending = apiRequest(connection(), { path: '/rows' }, new AbortController().signal);
			const assertion = expect(pending).rejects.toMatchObject({ status: 504 });
			await vi.advanceTimersByTimeAsync(1000);
			await assertion;
			expect(request).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});

	it('decodes compressed workflow JSON but preserves compressed proxy bytes', async () => {
		const compressed = gzipSync(
			Buffer.from('{"data":{"rows":[{"id":"one","profile":{"name":"Alice"}}]}}')
		);
		response(200, 'application/json', compressed, { 'content-encoding': 'gzip' });
		expect(
			(await apiRequest(connection(), { path: '/rows' }, new AbortController().signal)).body
		).toEqual(compressed);
		expect(
			await apiRows(connection(), { ...config(), query: {} }, {}, new AbortController().signal)
		).toEqual([{ id: 'one', name: 'Alice' }]);
	});
	it('rejects cancelled requests before DNS resolution', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			apiRequest(connection(), { path: '/rows' }, controller.signal)
		).rejects.toMatchObject({ status: 504 });
		expect(lookup).not.toHaveBeenCalled();
		expect(request).not.toHaveBeenCalled();
	});
	it('supports NWS grid paths and application identification without allowing traversal or header injection', async () => {
		response(
			200,
			'application/geo+json',
			JSON.stringify({
				properties: { periods: [{ number: 1, name: 'Today', temperature: 57, isDaytime: true }] }
			})
		);
		const settings = {
			...connection(),
			auth: 'none' as const,
			paths: ['/gridpoints/BUF/71,54/forecast'],
			userAgent: 'EmployeeOnlinePortal/1.0'
		};
		const rows = await apiRows(
			settings,
			{
				path: settings.paths[0],
				query: { units: 'us' },
				itemsPath: 'properties.periods',
				fields: { id: 'number', name: 'name', high: 'temperature', daytime: 'isDaytime' }
			},
			{},
			new AbortController().signal
		);
		expect(rows).toEqual([{ id: 1, name: 'Today', high: 57, daytime: true }]);
		const call = vi.mocked(request).mock.calls[0] as unknown as [
			URL,
			{ headers: Record<string, string> }
		];
		expect(call[0].pathname).toBe('/gridpoints/BUF/71,54/forecast');
		expect(call[1].headers['user-agent']).toBe('EmployeeOnlinePortal/1.0');
		for (const path of [
			'/../secret',
			'/v1/./secret',
			'//other.example/path',
			'/%2e%2e/secret',
			'/ok?secret=x',
			'/ok#fragment'
		])
			expect(() => validateConnection({ ...settings, paths: [path] })).toThrow();
		expect(() =>
			validateConnection({ ...settings, userAgent: 'EOP\r\nAuthorization: injected' })
		).toThrow('single printable line');
	});
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
