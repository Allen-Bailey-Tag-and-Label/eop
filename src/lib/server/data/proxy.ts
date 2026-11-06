import { json, type RequestEvent } from '@sveltejs/kit';
import { DataConnection } from './models';
import { API_REQUEST_LIMIT, ApiRequestError, apiRequest } from './api';
import { DataWorkflowError } from '$lib/data/types';

const responseHeaders = {
	'cache-control': 'private, no-store',
	'x-content-type-options': 'nosniff',
	'cross-origin-resource-policy': 'same-origin',
	'content-security-policy': "sandbox; default-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

async function requestBody(request: Request): Promise<Uint8Array | undefined> {
	if (!request.body) return;
	if (Number(request.headers.get('content-length')) > API_REQUEST_LIMIT)
		throw new ApiRequestError('API request body exceeds 1 MB.', 413);
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let bytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			bytes += value.byteLength;
			if (bytes > API_REQUEST_LIMIT) {
				await reader.cancel();
				throw new ApiRequestError('API request body exceeds 1 MB.', 413);
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	return new Uint8Array(Buffer.concat(chunks));
}

// Route groups enforce employee permissions or monitor approval in hooks.server.ts.
// Monitor exposure is a connection setting, separate from route authentication.
export async function serveDataApi(
	event: Pick<RequestEvent, 'params' | 'request' | 'url'>,
	monitor = false
): Promise<Response> {
	try {
		if (!/^[a-f0-9]{24}$/i.test(event.params.connectionId ?? ''))
			throw new ApiRequestError('API connection not found.', 404);
		const connection = await DataConnection.findById(event.params.connectionId)
			.select('config')
			.lean();
		if (!connection) throw new ApiRequestError('API connection not found.', 404);
		if (monitor && connection.config.monitorProxy !== true)
			throw new ApiRequestError(
				'This API connection is not enabled for monitor proxy access.',
				403
			);
		const result = await apiRequest(
			connection.config,
			{
				path: '/' + (event.params.path ?? ''),
				method: event.request.method,
				query: event.url.searchParams,
				accept: event.request.headers.get('accept') ?? undefined,
				contentType: event.request.headers.get('content-type') ?? undefined,
				body: await requestBody(event.request)
			},
			event.request.signal
		);
		return new Response(
			event.request.method === 'HEAD' || [204, 205, 304].includes(result.status)
				? null
				: new Uint8Array(result.body),
			{
				status: result.status,
				headers: {
					'content-type': 'application/octet-stream',
					...result.headers,
					...responseHeaders
				}
			}
		);
	} catch (cause) {
		const status =
			cause instanceof ApiRequestError
				? cause.status
				: cause instanceof DataWorkflowError
					? 400
					: 502;
		const headers = {
			...responseHeaders,
			...(cause instanceof ApiRequestError && cause.allow ? { allow: cause.allow } : {})
		};
		if (event.request.method === 'HEAD') return new Response(null, { status, headers });
		return json(
			{
				message:
					cause instanceof DataWorkflowError
						? cause.message
						: 'Unable to complete API proxy request.'
			},
			{ status, headers }
		);
	}
}
