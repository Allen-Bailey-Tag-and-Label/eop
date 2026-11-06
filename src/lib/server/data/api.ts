import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';
import { env } from '$env/dynamic/private';
import {
	apiMethods,
	DataWorkflowError,
	type ApiConnection,
	type ApiMethod,
	type DataRecord
} from '$lib/data/types';
import { dataRecord, readField, record, substituteParameters } from '$lib/data/workflows';
import { apiEndpointPath } from '$lib/data/api-path';

export function publicAddress(address: string): boolean {
	if (isIP(address) === 4) {
		const [a, b] = address.split('.').map(Number);
		return !(
			a === 0 ||
			a === 10 ||
			a === 127 ||
			a >= 224 ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && [0, 168].includes(b)) ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 198 && [18, 19, 51].includes(b)) ||
			(a === 203 && b === 0)
		);
	}
	// Global-unicast IPv6 only, excluding documentation ranges and IPv4 mappings.
	return (
		isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(?:db8|0):/i.test(address)
	);
}

export const API_REQUEST_LIMIT = 1024 * 1024;
export const API_RESPONSE_LIMIT = 5 * 1024 * 1024;
export class ApiRequestError extends DataWorkflowError {
	constructor(
		message: string,
		public status = 502,
		public allow?: string
	) {
		super(message);
	}
}
export type ApiRequest = {
	path: string;
	method?: string;
	query?: URLSearchParams;
	body?: Uint8Array;
	accept?: string;
	contentType?: string;
	maxResponseBytes?: number;
};
export type ApiResponse = { status: number; headers: Record<string, string>; body: Buffer };

// The raw proxy and workflow nodes share the same origin, credentials, and DNS protections.
export async function apiRequest(
	connection: ApiConnection,
	input: ApiRequest,
	signal: AbortSignal
): Promise<ApiResponse> {
	const settings = validateConnection(connection);
	if (!apiEndpointPath(input.path) || !settings.paths.includes(input.path))
		throw new ApiRequestError('The endpoint is not allowed by this connection.', 403);
	const method = input.method ?? 'GET';
	if (!(settings.methods ?? ['GET', 'HEAD']).includes(method as ApiMethod))
		throw new ApiRequestError(
			'The HTTP method is not allowed by this connection.',
			405,
			(settings.methods ?? ['GET', 'HEAD']).join(', ')
		);
	if (input.body?.byteLength && ['GET', 'HEAD'].includes(method))
		throw new ApiRequestError('GET and HEAD requests cannot include a body.', 400);
	if ((input.body?.byteLength ?? 0) > API_REQUEST_LIMIT)
		throw new ApiRequestError('API request body exceeds 1 MB.', 413);
	if ((input.query?.toString().length ?? 0) > 8192)
		throw new ApiRequestError('API query string exceeds 8 KB.', 400);
	const url = new URL(input.path, settings.baseUrl);
	url.search = input.query?.toString() ?? '';
	const headers: Record<string, string> = {
		accept: input.accept || 'application/json',
		'accept-encoding': 'identity',
		'user-agent': settings.userAgent || 'EmployeeOnlinePortal/1.0'
	};
	if (input.contentType) headers['content-type'] = input.contentType;
	if (Object.values(headers).some((value) => /[\r\n]/.test(value) || value.length > 1000))
		throw new ApiRequestError('Invalid API request header.', 400);
	if (settings.auth !== 'none') {
		const secret = env[settings.secretEnv];
		if (!secret || /[\r\n]/.test(secret))
			throw new ApiRequestError('The API connection credential is not configured.', 503);
		headers[settings.auth === 'bearer' ? 'authorization' : settings.headerName] =
			settings.auth === 'bearer' ? `Bearer ${secret}` : secret;
	}
	const controller = new AbortController();
	const abort = () => controller.abort();
	signal.addEventListener('abort', abort, { once: true });
	if (signal.aborted) controller.abort();
	const timeout = setTimeout(abort, settings.timeoutMs);
	try {
		if (controller.signal.aborted) throw new ApiRequestError('API request was cancelled.', 504);
		const addresses = await Promise.race([
			lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true, verbatim: true }),
			new Promise<never>((_resolve, reject) =>
				controller.signal.addEventListener(
					'abort',
					() => reject(new ApiRequestError('API request timed out.', 504)),
					{ once: true }
				)
			)
		]);
		if (!addresses.length || addresses.some((item) => !publicAddress(item.address)))
			throw new ApiRequestError('API destination must resolve to public addresses.', 403);
		if (controller.signal.aborted) throw new ApiRequestError('API request timed out.', 504);
		const chosen = addresses[0];
		return await new Promise<ApiResponse>((resolve, reject) => {
			const req = request(
				url,
				{
					method,
					headers,
					agent: false,
					family: chosen.family,
					signal: controller.signal,
					lookup: (_host, _options, callback) => callback(null, chosen.address, chosen.family)
				},
				(response) => {
					const status = response.statusCode ?? 502;
					// A browser must never follow a proxy response onto an external origin.
					if (status >= 300 && status < 400 && status !== 304) {
						response.destroy();
						reject(new ApiRequestError(`API returned HTTP ${status}; redirects are not followed.`));
						return;
					}
					let bytes = 0;
					const chunks: Buffer[] = [];
					response.on('data', (chunk: Buffer) => {
						bytes += chunk.length;
						if (bytes > (input.maxResponseBytes ?? API_RESPONSE_LIMIT)) {
							response.destroy();
							reject(
								new ApiRequestError(
									`API response exceeds ${(input.maxResponseBytes ?? API_RESPONSE_LIMIT) / (1024 * 1024)} MB.`
								)
							);
						} else chunks.push(chunk);
					});
					response.on('error', () => reject(new ApiRequestError('Unable to read API response.')));
					response.on('aborted', () =>
						reject(new ApiRequestError('API response was interrupted.'))
					);
					response.on('end', () => {
						const allowedHeaders = [
							'content-type',
							'content-encoding',
							'content-language',
							'etag',
							'last-modified',
							'retry-after'
						];
						const headers: Record<string, string> = {};
						for (const name of allowedHeaders) {
							const value = response.headers[name];
							if (typeof value === 'string') headers[name] = value;
						}
						resolve({ status, headers, body: Buffer.concat(chunks) });
					});
				}
			);
			req.on('error', () =>
				reject(
					new ApiRequestError(
						'API request failed or timed out.',
						controller.signal.aborted ? 504 : 502
					)
				)
			);
			req.end(input.body);
		});
	} catch (cause) {
		if (cause instanceof DataWorkflowError) throw cause;
		throw new ApiRequestError('Unable to resolve or connect to the API host.');
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener('abort', abort);
	}
}

export async function apiRows(
	connection: ApiConnection,
	config: Record<string, unknown>,
	params: DataRecord,
	signal: AbortSignal
): Promise<DataRecord[]> {
	const settings = validateConnection(connection);
	if (!settings.paths.includes(String(config.path)))
		throw new DataWorkflowError('The endpoint is not allowed by this connection.');
	const query = record(substituteParameters(config.query ?? {}, params));
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value === null) continue;
		if (
			!/^[a-zA-Z_$][a-zA-Z0-9_.$-]{0,127}$/.test(key) ||
			/password|secret|credential|authorization|api.?key/i.test(key) ||
			!['string', 'number', 'boolean'].includes(typeof value) ||
			String(value).length > 2000
		)
			throw new DataWorkflowError(
				'API query parameters must be short primitive values; credentials belong in the connection.'
			);
		search.set(key, String(value));
	}
	const response = await apiRequest(
		settings,
		{
			path: String(config.path),
			method: String(config.method ?? 'GET'),
			query: search,
			...(config.body !== undefined
				? {
						body: Buffer.from(JSON.stringify(substituteParameters(config.body, params))),
						contentType: 'application/json'
					}
				: {}),
			maxResponseBytes: API_REQUEST_LIMIT
		},
		signal
	);
	if (response.status < 200 || response.status >= 300)
		throw new DataWorkflowError(`API returned HTTP ${response.status}.`);
	if (
		!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:;|$)/i.test(
			response.headers['content-type'] ?? ''
		)
	)
		throw new DataWorkflowError('API response must be JSON.');
	let json: unknown;
	try {
		const encoding = response.headers['content-encoding'];
		const decode =
			encoding === 'gzip'
				? gunzipSync
				: encoding === 'deflate'
					? inflateSync
					: encoding === 'br'
						? brotliDecompressSync
						: undefined;
		if (encoding && encoding !== 'identity' && !decode)
			throw new Error('Unsupported response encoding');
		json = JSON.parse(
			(decode
				? decode(response.body, { maxOutputLength: API_REQUEST_LIMIT })
				: response.body
			).toString('utf8')
		);
	} catch {
		throw new DataWorkflowError('API returned invalid or oversized JSON.');
	}
	const items = config.itemsPath ? readField(record(json), String(config.itemsPath)) : json;
	if (!Array.isArray(items) || items.length > 500)
		throw new DataWorkflowError(
			'The selected response path must contain an array of at most 500 rows.'
		);
	return items.map((item) =>
		dataRecord(
			Object.fromEntries(
				Object.entries(record(config.fields)).map(([key, path]) => [
					key,
					readField(record(item), String(path)) ?? null
				])
			)
		)
	);
}
export function validateConnection(input: unknown): ApiConnection {
	const value = record(input);
	let url: URL;
	try {
		url = new URL(String(value.baseUrl));
	} catch {
		throw new DataWorkflowError('Enter a valid HTTPS base URL.');
	}
	if (
		url.protocol !== 'https:' ||
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		url.pathname !== '/' ||
		(url.port && url.port !== '443') ||
		url.hostname === 'localhost' ||
		(isIP(url.hostname.replace(/^\[|\]$/g, '')) &&
			!publicAddress(url.hostname.replace(/^\[|\]$/g, '')))
	)
		throw new DataWorkflowError(
			'Use an HTTPS origin on port 443 without credentials, path, or private IP addresses.'
		);
	if (
		!Array.isArray(value.paths) ||
		!value.paths.length ||
		value.paths.length > 30 ||
		value.paths.some((path) => !apiEndpointPath(path))
	)
		throw new DataWorkflowError(
			'List explicit allowed endpoint paths (no wildcards or query strings).'
		);
	if (!['none', 'bearer', 'header'].includes(String(value.auth)))
		throw new DataWorkflowError('Choose none, bearer, or header authentication.');
	if (
		value.auth !== 'none' &&
		(typeof value.secretEnv !== 'string' || !/^DATA_API_[A-Z0-9_]+$/.test(value.secretEnv))
	)
		throw new DataWorkflowError(
			'Credentials must reference a server environment variable beginning DATA_API_.'
		);
	if (
		value.auth === 'header' &&
		(typeof value.headerName !== 'string' ||
			!/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/.test(value.headerName) ||
			/^(host|connection|content-length|transfer-encoding|cookie|set-cookie)$/i.test(
				value.headerName
			))
	)
		throw new DataWorkflowError('Choose a valid API-key header name.');
	const timeoutMs = Number(value.timeoutMs);
	if (
		value.userAgent !== undefined &&
		value.userAgent !== '' &&
		(typeof value.userAgent !== 'string' || !/^[\x20-\x7e]{1,240}$/.test(value.userAgent))
	)
		throw new DataWorkflowError('User-Agent must be a single printable line up to 240 characters.');
	if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 10000)
		throw new DataWorkflowError('API timeout must be 1000–10000ms.');
	if (
		value.methods !== undefined &&
		(!Array.isArray(value.methods) ||
			!value.methods.length ||
			value.methods.some((method) => !apiMethods.includes(method as ApiMethod)))
	)
		throw new DataWorkflowError('Choose at least one supported HTTP method.');
	if (value.monitorProxy !== undefined && typeof value.monitorProxy !== 'boolean')
		throw new DataWorkflowError('Choose whether approved monitors may use this connection.');
	return {
		...(value.methods !== undefined ? { methods: [...new Set(value.methods as ApiMethod[])] } : {}),
		...(value.monitorProxy !== undefined ? { monitorProxy: value.monitorProxy as boolean } : {}),
		...(value.userAgent ? { userAgent: String(value.userAgent) } : {}),
		baseUrl: url.origin,
		paths: value.paths as string[],
		auth: value.auth as ApiConnection['auth'],
		secretEnv: value.auth === 'none' ? '' : String(value.secretEnv),
		headerName: value.auth === 'header' ? String(value.headerName) : '',
		timeoutMs
	};
}
