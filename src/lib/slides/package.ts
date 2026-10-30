import type { ApiConnection, WorkflowDefinition } from '$lib/data/types';
import type { SlideDefinition } from './types';

export const MAX_PACKAGE_BYTES = 4 * 1024 * 1024;
export type SlidePackage = {
	format: 'eop-slide';
	version: 1;
	slide: { title: string; slug: string; definition: SlideDefinition };
	assets: {
		id: string;
		name: string;
		contentType: string;
		path: string;
		scope: 'slide' | 'shared';
	}[];
	sources: {
		id: string;
		title: string;
		scope: 'slide' | 'shared';
		draft: WorkflowDefinition;
		published?: WorkflowDefinition;
	}[];
	connections: { id: string; title: string; config: ApiConnection }[];
};
export type PackageChoices = {
	assets: Record<string, string>;
	sources: Record<string, string>;
	connections: Record<string, string>;
};
export type PackageReview = {
	package: SlidePackage;
	existing: {
		assets: { id: string; title: string }[];
		sources: { id: string; title: string }[];
		connections: { id: string; title: string }[];
	};
};
