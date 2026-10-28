// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { type Navigation, type User } from '$lib/types';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			monitor: { id: string; location: string; expiresAt: string };
			navigation: Navigation[];
			user: User;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
