export type Branch = { _id: string; label: string; number: number };
export type Locals = {
	navigation: Navigation[];
	user: User;
};
export type Navigation = Omit<Route, '_id' | 'label'> & {
	children: Navigation[];
	isOpen: boolean;
	label: string;
};
export type Route = {
	_id: string;
	label: string | null;
	href: string;
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
		theme: string;
	};
	username: string;
};
