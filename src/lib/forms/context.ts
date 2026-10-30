export const postFormContext = Symbol('post-form-context');
export type PostFormContext = { readonly postId?: string; readonly preview: boolean };
export type PublicFormDefinition = Pick<
	import('./definition').FormDefinition,
	'title' | 'description' | 'questions' | 'open' | 'anonymous' | 'thanks'
>;
