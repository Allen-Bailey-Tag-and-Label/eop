export type Error = {
	error: string;
	key: string;
};
export type FindManyParamaters = {
	include: { [key: string]: boolean };
};
export type GetColumnsOptions = {
	columnOverrides?: Map<string, { [key: string]: any }>;
	fieldFilterNames?: string[];
};
