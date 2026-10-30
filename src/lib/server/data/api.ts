import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import { env } from '$env/dynamic/private';
import { DataWorkflowError, type ApiConnection, type DataRecord } from '$lib/data/types';
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
	return {
		...(value.userAgent ? { userAgent: String(value.userAgent) } : {}),
		baseUrl: url.origin,
		paths: value.paths as string[],
		auth: value.auth as ApiConnection['auth'],
		secretEnv: value.auth === 'none' ? '' : String(value.secretEnv),
		headerName: value.auth === 'header' ? String(value.headerName) : '',
		timeoutMs
	};
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
	const url = new URL(String(config.path), settings.baseUrl);
	const query = record(substituteParameters(config.query ?? {}, params));
	for (const [key, value] of Object.entries(query)) {
		if (value === null) continue;
		if (
			!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key) ||
			/password|secret|token|credential|authorization|api.?key/i.test(key) ||
			!['string', 'number', 'boolean'].includes(typeof value) ||
			String(value).length > 500
		)
			throw new DataWorkflowError(
				'API query parameters must be short primitive values; credentials belong in the connection.'
			);
		url.searchParams.set(key, String(value));
	}
	const headers: Record<string, string> = {
		accept: 'application/json',
		'user-agent': settings.userAgent || 'EmployeeOnlinePortal/1.0'
	};
	if (settings.auth !== 'none') {
		const secret = env[settings.secretEnv];
		if (!secret || /[\r\n]/.test(secret))
			throw new DataWorkflowError('The API connection credential is not configured.');
		headers[settings.auth === 'bearer' ? 'authorization' : settings.headerName] =
			settings.auth === 'bearer' ? `Bearer ${secret}` : secret;
	}
	const controller = new AbortController();
	const abort = () => controller.abort();
	signal.addEventListener('abort', abort, { once: true });
	if (signal.aborted) controller.abort();
	const timeout = setTimeout(abort, settings.timeoutMs);
	try {
		if (controller.signal.aborted) throw new DataWorkflowError('API request was cancelled.');
		const addresses = await Promise.race([
			lookup(url.hostname, { all: true, verbatim: true }),
			new Promise<never>((_resolve, reject) =>
				controller.signal.addEventListener(
					'abort',
					() => reject(new DataWorkflowError('API request timed out.')),
					{ once: true }
				)
			)
		]);
		if (
			!addresses.length ||
			addresses.some((item) => !publicAddress(item.address)) ||
			controller.signal.aborted
		)
			throw new DataWorkflowError('API destination must resolve to public addresses.');
		const chosen = addresses[0];
		const json = await new Promise<unknown>((resolve, reject) => {
			const req = request(
				url,
				{
					method: 'GET',
					headers,
					agent: false,
					family: chosen.family,
					signal: controller.signal,
					lookup: (_host, _options, callback) => callback(null, chosen.address, chosen.family)
				},
				(response) => {
					if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
						response.destroy();
						reject(
							new DataWorkflowError(
								`API returned HTTP ${response.statusCode ?? 'error'}; redirects are not followed.`
							)
						);
						return;
					}
					if (
						!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:;|$)/i.test(
							String(response.headers['content-type'])
						)
					) {
						response.destroy();
						reject(new DataWorkflowError('API response must be JSON.'));
						return;
					}
					let bytes = 0;
					const chunks: Buffer[] = [];
					response.on('data', (chunk: Buffer) => {
						bytes += chunk.length;
						if (bytes > 1024 * 1024) {
							response.destroy();
							reject(new DataWorkflowError('API response exceeds 1 MB.'));
						} else chunks.push(chunk);
					});
					response.on('error', () => reject(new DataWorkflowError('Unable to read API response.')));
					response.on('end', () => {
						try {
							resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
						} catch {
							reject(new DataWorkflowError('API returned invalid JSON.'));
						}
					});
				}
			);
			req.on('error', () => reject(new DataWorkflowError('API request failed or timed out.')));
			req.end();
		});
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
	} catch (cause) {
		if (cause instanceof DataWorkflowError) throw cause;
		throw new DataWorkflowError('Unable to resolve or connect to the API host.');
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener('abort', abort);
	}
}
