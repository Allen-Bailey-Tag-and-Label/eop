import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataConnection } from './models';
import { apiRequest, ApiRequestError } from './api';
import { serveDataApi } from './proxy';
import { GET as monitorGet } from '../../../routes/(monitors)/monitors/(approved)/api/[connectionId]/[...path]/+server';
import { POST as adminPost } from '../../../routes/(private)/(padded)/admin/monitors/slides/api/[connectionId]/[...path]/+server';

vi.mock('./models', () => ({ DataConnection: { findById: vi.fn() } }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('./api', async (importOriginal) => ({
	...(await importOriginal<typeof import('./api')>()),
	apiRequest: vi.fn()
}));
const id = 'a'.repeat(24);
const config = {
	baseUrl: 'https://api.example.com',
	paths: ['/forecast'],
	auth: 'none' as const,
	secretEnv: '',
	headerName: '',
	timeoutMs: 1000
};
function connection(value: unknown = { config }) {
	vi.mocked(DataConnection.findById).mockReturnValue({
		select: () => ({ lean: async () => value })
	} as never);
}
function event(method = 'GET', body?: Uint8Array | string) {
	const url = new URL(`https://eop.example/monitors/api/${id}/forecast?day=1&day=2`);
	return {
		url,
		params: { connectionId: id, path: 'forecast' },
		request: new Request(url, {
			method,
			body: typeof body === 'string' || body === undefined ? body : new Uint8Array(body),
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				cookie: 'employee=private',
				authorization: 'browser-secret',
				'x-api-key': 'client-key'
			}
		})
	};
}
beforeEach(() => {
	vi.clearAllMocks();
	connection();
	vi.mocked(apiRequest).mockResolvedValue({
		status: 200,
		headers: { 'content-type': 'application/json' },
		body: Buffer.from('{"nested":{"values":[1,null,true]}}')
	});
});
describe('same-origin API proxy', () => {
	it.each([
		{ meta: { page: 1 }, data: [{ values: [1, 2] }] },
		[1, { nested: true }],
		null,
		'value',
		12
	])('returns the original JSON structure without a wrapper: %j', async (body) => {
		vi.mocked(apiRequest).mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			body: Buffer.from(JSON.stringify(body))
		});
		const result = await serveDataApi(event());
		expect(await result.json()).toEqual(body);
		expect(result.headers.get('cache-control')).toBe('private, no-store');
		expect(result.headers.get('x-content-type-options')).toBe('nosniff');
	});
	it('passes POST content, repeated query values, and cancellation without forwarding browser credentials', async () => {
		const input = event('POST', '{"query":"forecast"}');
		const result = await adminPost(input as unknown as Parameters<typeof adminPost>[0]);
		expect(result.status).toBe(200);
		const [, request, signal] = vi.mocked(apiRequest).mock.calls[0];
		expect(request).toMatchObject({
			path: '/forecast',
			method: 'POST',
			contentType: 'application/json',
			accept: 'application/json'
		});
		expect(Buffer.from(request.body!).toString()).toBe('{"query":"forecast"}');
		expect(request.query?.getAll('day')).toEqual(['1', '2']);
		expect(signal).toBe(input.request.signal);
		expect(JSON.stringify(request)).not.toContain('browser-secret');
		expect(JSON.stringify(request)).not.toContain('employee=private');
		expect(JSON.stringify(request)).not.toContain('client-key');
	});
	it('requires explicit exposure for the approved-monitor endpoint', async () => {
		const input = event();
		expect((await monitorGet(input as unknown as Parameters<typeof monitorGet>[0])).status).toBe(
			403
		);
		expect(apiRequest).not.toHaveBeenCalled();
		connection({ config: { ...config, monitorProxy: true } });
		expect((await monitorGet(input as unknown as Parameters<typeof monitorGet>[0])).status).toBe(
			200
		);
	});
	it('preserves binary and upstream error responses, and handles bodyless statuses', async () => {
		const bytes = Buffer.from([137, 80, 0, 255]);
		vi.mocked(apiRequest).mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'image/png' },
			body: bytes
		});
		expect(Buffer.from(await (await serveDataApi(event())).arrayBuffer())).toEqual(bytes);
		vi.mocked(apiRequest).mockResolvedValue({
			status: 429,
			headers: { 'content-type': 'application/problem+json', 'retry-after': '30' },
			body: Buffer.from('{"errors":[{"code":"limited"}]}')
		});
		const limited = await serveDataApi(event());
		expect(limited.status).toBe(429);
		expect(limited.headers.get('retry-after')).toBe('30');
		expect(await limited.json()).toEqual({ errors: [{ code: 'limited' }] });
		vi.mocked(apiRequest).mockResolvedValue({ status: 204, headers: {}, body: Buffer.alloc(0) });
		expect((await serveDataApi(event())).body).toBeNull();
		vi.mocked(apiRequest).mockResolvedValue({ status: 200, headers: {}, body: Buffer.alloc(0) });
		expect((await serveDataApi(event('HEAD'))).body).toBeNull();
	});
	it('rejects missing connections and bounded uploads without contacting an API', async () => {
		const missing = event();
		missing.params.connectionId = 'invalid';
		expect((await serveDataApi(missing)).status).toBe(404);
		expect(DataConnection.findById).not.toHaveBeenCalled();
		connection(null);
		expect((await serveDataApi(event())).status).toBe(404);
		connection();
		expect((await serveDataApi(event('POST', new Uint8Array(1024 * 1024 + 1)))).status).toBe(413);
		expect(apiRequest).not.toHaveBeenCalled();
		vi.mocked(apiRequest).mockRejectedValue(
			new ApiRequestError('Method not allowed.', 405, 'GET, HEAD')
		);
		const disallowed = await serveDataApi(event('POST'));
		expect(disallowed.status).toBe(405);
		expect(disallowed.headers.get('allow')).toBe('GET, HEAD');
		expect((await serveDataApi(event('HEAD'))).body).toBeNull();
		vi.mocked(apiRequest).mockRejectedValue(new ApiRequestError('API request timed out.', 504));
		expect((await serveDataApi(event())).status).toBe(504);
	});
});
