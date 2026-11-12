import { command } from '$app/server';
import { connect } from '$lib/server/mongoose/connect';
import { advanceShippingQuote as advance } from '$lib/server/shipping/progress';

// Authentication and route permissions remain centralized in hooks.server.ts.
export const advanceShippingQuote = command('unchecked', async (input: unknown) => {
	await connect();
	return advance(input);
});
