// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { type Navigation, type User } from '$lib/types';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			contentActor?: import('$lib/server/forms/access').ContentActor;
			authorizedForm?: import('$lib/server/forms/access').AuthorizedForm;
			authorizedPost?: {
				_id: string;
				_createdById?: string;
				title: string;
				md: string;
				content?: import('$lib/rich-text/document').RichTextDocument;
				year: number;
				month: number;
				day: number;
				slug: string;
				createdAt?: string;
				audience?: string;
				formIds?: string[];
			};
			monitor: {
				id: string;
				location: string;
				colorMode: 'light' | 'dark' | 'system';
				refreshVersion?: number;
			};
			navigation: Navigation[];
			user: User;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
