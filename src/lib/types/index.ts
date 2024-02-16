export type Role = {
	label: string;
	routeIds?: string[];
	routes?: Route[];
};
export type Route = {
	href: string;
	label: string;
	roleIds?: string[];
	roles?: Role[];
};
