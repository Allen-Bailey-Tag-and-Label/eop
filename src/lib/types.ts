export type Navigation = Route & { children: Navigation[]; isOpen: boolean };
export type Route = {
	id: number;
	label: string;
	href: string | null;
	isDirectory: boolean;
	parentId: number | null;
};

export type User = {
	_id: number;
	isActive: boolean;
	username: string;
};
