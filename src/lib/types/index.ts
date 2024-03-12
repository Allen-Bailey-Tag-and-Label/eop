export type DataTableColumn = {
	isEditable: boolean;
	label: string;
	key: string;
	options?: { label: string; value: string }[];
	type?: 'boolean' | 'dateTime' | 'float' | 'int' | 'many-to-many' | 'one-to-one' | 'string';
};
export type DataTableOrderBy = { [key: string]: 'asc' | 'desc' }[];
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
