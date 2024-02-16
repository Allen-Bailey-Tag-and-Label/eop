export type DataTableColumn = {
	label: string;
	key: string;
	type?: 'string' | 'int';
};
export type DataTableRow = { [key: string]: any };
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
