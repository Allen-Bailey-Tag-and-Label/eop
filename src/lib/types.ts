export type Branch = { _id: string; label: string; number: number };
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
	branches: Branch[];
	defaultBranch: Branch;
	isActive: boolean;
	profile: {
		_id: string;
		email: string;
		firstName: string;
		lastName: string;
		phone: number;
	};
	settings: {
		_id: string;
		magnification: number;
	};
	username: string;
};
