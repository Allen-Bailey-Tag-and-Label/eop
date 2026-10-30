<script lang="ts">
	import { setContext } from 'svelte';
	import { postFormContext, type FormPreview } from '$lib/forms/context';
	import { dateTime } from '$lib/formats';
	import { mdToTokens } from '$lib/marked';
	import { Div, H1, MarkdownToken } from '..';

	type Props = {
		postId?: string;
		preview?: boolean;
		formPreview?: FormPreview;
		date: Date;
		firstName: string;
		lastName: string;
		md: string;
		title: string;
	};
	let {
		postId,
		preview = false,
		formPreview,
		date,
		firstName = $bindable(''),
		lastName = $bindable(''),
		md = $bindable(''),
		title = $bindable('')
	}: Props = $props();

	setContext(postFormContext, {
		get postId() {
			return postId;
		},
		get preview() {
			return preview;
		},
		get formPreview() {
			return formPreview;
		}
	});

	// $derives
	const tokens = $derived.by(() =>
		mdToTokens(md).map((token) => {
			// Marked treats custom tags as inline HTML. Render standalone forms as blocks.
			if (
				token.type === 'paragraph' &&
				/^<PublishedForm\b[^>]*(?:\/>|>\s*<\/PublishedForm>)\s*$/.test(token.text)
			)
				return { ...token, type: 'html', block: true };
			return token;
		})
	);
</script>

<Div class="flex max-h-full flex-col space-y-6">
	<H1 class="lg:text-6xl">{title}</H1>
	<Div class="flex space-x-2 opacity-50">
		<Div>By - {firstName} {lastName}</Div>
		<Div>{dateTime(date)}</Div>
	</Div>
	<MarkdownToken {tokens} />
</Div>
