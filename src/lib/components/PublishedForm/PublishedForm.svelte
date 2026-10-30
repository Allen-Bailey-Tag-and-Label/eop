<script lang="ts">
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div, P, Button, A, FormRenderer } from '$lib/components';
	import {
		postFormContext,
		type PostFormContext,
		type PublicFormDefinition
	} from '$lib/forms/context';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		slug: string;
		class?: string;
		variants?: string[];
	};
	let { slug, class: className, variants = [], ...restProps }: Props = $props();
	const context = getContext<PostFormContext | undefined>(postFormContext);
	let definition = $state<PublicFormDefinition | null>(null),
		version = $state(0),
		error = $state(''),
		revision = $state(0),
		needsLogin = $state(false);
	const endpoint = $derived(
		context?.postId
			? resolve('/(public)/(padded)/posts/submissions/[postId]/[formSlug]', {
					postId: context.postId,
					formSlug: slug
				})
			: ''
	);
	$effect(() => {
		void revision;
		const url = endpoint,
			controller = new AbortController();
		const preview = context?.preview;
		const loader = context?.formPreview;
		if (preview) void loader?.revision;
		definition = null;
		error = '';
		needsLogin = false;
		const result = preview
			? loader
				? loader.load(slug, controller.signal)
				: Promise.reject(new Error('Form preview is unavailable in this editor.'))
			: (url
					? fetch(url, { signal: controller.signal })
					: Promise.reject(new Error('Open the post to view these questions.'))
				).then(async (response) => {
					const result = await response.json().catch(() => ({}));
					if (!response.ok) {
						needsLogin = response.status === 401;
						throw new Error(result.error ?? 'This form is unavailable.');
					}
					return result;
				});
		void result
			.then((result) => {
				if (controller.signal.aborted) return;
				definition = result.definition;
				version = result.version;
			})
			.catch((cause) => {
				if (!controller.signal.aborted)
					error = cause instanceof Error ? cause.message : 'Could not load form.';
			});
		return () => controller.abort();
	});
	async function submit(fields: FormData) {
		if (context?.preview) return { error: 'Submissions are disabled in preview.' };
		const response = await fetch(endpoint, { method: 'POST', body: fields });
		const result = await response.json().catch(() => ({ error: 'Could not submit response.' }));
		return response.ok ? result : { error: result.error ?? 'Could not submit response.' };
	}
</script>

<Div
	{...restProps}
	class={twMerge(
		$theme.PublishedForm.default,
		...variants.map((variant) => $theme.PublishedForm[variant]),
		className
	)}
>
	{#if error}<P role="alert">{error}</P>{#if needsLogin}<A href={resolve('/(public)/sign-in')}
				>Sign in</A
			>{/if}<Button variants={['ghost']} onclick={() => revision++}>Reload form</Button>
	{:else if definition}<FormRenderer
			{definition}
			{version}
			preview={context?.preview ?? false}
			onSubmit={submit}
		/>
	{:else}<P role="status">Loading form...</P>{/if}
</Div>
