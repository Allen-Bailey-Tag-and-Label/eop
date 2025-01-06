// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			navigation: Map<string, Map<string, string>>;
			user: Record<string, any> & { id: string };
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
