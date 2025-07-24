export type Navigation = Route & { children: Navigation[]; isOpen: boolean };
export type Route = {
	_id: string;
	_parentId: string | null;
	label: string;
	href: string | null;
	isDirectory: boolean;
};

export type User = {
	_id: string;
	isActive: boolean;
	username: string;
};
