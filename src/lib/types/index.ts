export type DataTableColumn = {
	isEditable: boolean;
	label: string;
	key: string;
	props?: { [key: string]: any };
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
