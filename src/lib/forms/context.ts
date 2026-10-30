export const postFormContext = Symbol('post-form-context');
export type FormPreview = {
	revision: string;
	load: (
		slug: string,
		signal: AbortSignal
	) => Promise<{ definition: PublicFormDefinition; version: number }>;
};
export type PostFormContext = {
	readonly postId?: string;
	readonly preview: boolean;
	readonly formPreview?: FormPreview;
};
export type PublicFormDefinition = Pick<
	import('./definition').FormDefinition,
	'title' | 'description' | 'questions' | 'open' | 'anonymous' | 'thanks'
>;
