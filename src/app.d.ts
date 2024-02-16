// See https://kit.svelte.dev/docs/types#app

import type { Role, Route } from '$lib/types';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				profile: {
					id: string;
					firstName: string;
					lastName: string;
					userId: string;
				} | null;
			} & {
				id: string;
				email: string;
				isActive: boolean;
				passwordHash: string;
			} & {
				roles: Role[];
				routes: Route[];
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
