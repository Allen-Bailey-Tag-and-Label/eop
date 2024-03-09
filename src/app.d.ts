// See https://kit.svelte.dev/docs/types#app

import type { Role, Route } from '$lib/types';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				isActive: boolean;
				isOnboarded: boolean;
				passwordHash?: string;
				profile: {
					id: string;
					firstName: string;
					lastName: string;
					userId: string;
				} | null;
				roles: Role[];
				username: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
