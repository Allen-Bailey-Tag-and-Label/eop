// Exact allowlisted paths may contain API versions, coordinates, and grid identifiers.
// Reject URL control characters, encoded paths, and traversal before URL normalization.
export function apiEndpointPath(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.length <= 500 &&
		/^\/(?!\/)[a-zA-Z0-9/_,.-]*$/.test(value) &&
		!value.split('/').some((segment) => segment === '.' || segment === '..')
	);
}
