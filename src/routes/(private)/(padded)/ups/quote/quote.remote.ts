import { command, getRequestEvent } from '$app/server';
import { connect } from '$lib/server/mongoose';
import { createPendingUpsQuote, advancePendingUpsQuote } from '$lib/server/ups/quotes';

// Inputs are validated by the service; route access remains centralized in hooks.server.ts.
export const createUpsQuote = command('unchecked', async (input: unknown) => {
	const { locals } = getRequestEvent();
	await connect();
	return createPendingUpsQuote(input, locals.user);
});
export const advanceUpsQuote = command('unchecked', async (input: unknown) => {
	await connect();
	return advancePendingUpsQuote(input);
});
