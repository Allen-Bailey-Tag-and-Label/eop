import type { LayoutServerLoad } from './$types';

// Authentication is enforced for this route group in hooks.server.ts.
export const load: LayoutServerLoad = ({ locals }) => ({ monitor: locals.monitor });
