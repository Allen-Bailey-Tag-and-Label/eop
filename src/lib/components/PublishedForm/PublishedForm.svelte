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
		resolve('/(public)/(padded)/forms/[slug]/data', { slug }) +
			(context?.postId ? `?post=${encodeURIComponent(context.postId)}` : '')
	);
	$effect(() => {
		void revision;
		if (context?.preview) return;
		const url = endpoint,
			controller = new AbortController();
		definition = null;
		error = '';
		needsLogin = false;
		void fetch(url, { signal: controller.signal })
			.then(async (response) => {
				const result = await response.json().catch(() => ({}));
				if (controller.signal.aborted) return;
				if (!response.ok) {
					needsLogin = response.status === 401;
					throw new Error(result.error ?? 'This form is unavailable.');
				}
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
	{#if context?.preview}<P>Embedded form: {slug}. Use Forms to preview its questions.</P>
	{:else if error}<P role="alert">{error}</P>{#if needsLogin}<A href={resolve('/(public)/sign-in')}
				>Sign in</A
			>{/if}<Button variants={['ghost']} onclick={() => revision++}>Reload form</Button>
	{:else if definition}<FormRenderer {definition} {version} onSubmit={submit} />
	{:else}<P role="status">Loading form...</P>{/if}
</Div>
