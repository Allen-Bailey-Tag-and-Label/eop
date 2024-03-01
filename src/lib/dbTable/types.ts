export type Error = {
	error: string;
	key: string;
};
export type GetColumnsOptions = {
	columnOverrides?: Map<string, { [key: string]: any }>;
	fieldFilterNames?: string[];
	findManyParamaters?: {
		include: Include;
		orderBy: { [key: string]: 'asc' | 'desc' }[];
	};
};
export type Include = { [key: string]: boolean };
