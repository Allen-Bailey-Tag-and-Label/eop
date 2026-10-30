<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Form, Input, Textarea, Select, Checkbox, Button, Div, H2, P } from '$lib/components';
	import type { PublicFormDefinition } from '$lib/forms/context';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onsubmit'> & {
		definition: PublicFormDefinition;
		version?: number;
		preview?: boolean;
		onSubmit?: (fields: FormData) => Promise<{ success?: string; error?: string }>;
		class?: string;
		variants?: string[];
	};
	let {
		definition,
		version = 0,
		preview = false,
		onSubmit = async () => ({ error: 'No submission handler is configured.' }),
		class: className,
		variants = [],
		...restProps
	}: Props = $props();
	let busy = $state(false),
		error = $state(''),
		success = $state('');
	let token = $state(crypto.randomUUID());
	const uid = $props.id();
	async function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		if (busy || preview || !definition.open) return;
		const fields = new FormData(event.currentTarget);
		fields.set('version', String(version));
		fields.set('token', token);
		busy = true;
		error = '';
		try {
			const result = await onSubmit(fields);
			if (result.error) error = result.error;
			else success = result.success ?? definition.thanks;
		} catch {
			error = 'Could not submit your response. Please retry.';
		} finally {
			busy = false;
		}
	}
</script>

<Div
	{...restProps}
	class={twMerge(
		$theme.FormRenderer.default,
		...variants.map((variant) => $theme.FormRenderer[variant]),
		className
	)}
>
	<H2 class="text-lg">{definition.title}</H2>
	{#if definition.description}<P class="whitespace-pre-wrap">{definition.description}</P>{/if}
	<P class="text-sm opacity-70"
		>{definition.anonymous
			? 'Responses are anonymous. Only include contact information if you want to be identified.'
			: 'Employee sign-in is required. Your signed-in employee account will be recorded with this response.'}</P
	>
	{#if preview}<P class="text-sm opacity-70">Preview: submissions are disabled.</P>{/if}
	{#if success}<P role="status">{success}</P>
	{:else if !definition.open && !preview}<P role="status">This form is closed.</P>
	{:else}
		<Form
			isEnhanced={false}
			class="max-w-none space-y-5"
			onsubmit={submit}
			aria-label={definition.title}
		>
			<Input
				name="website"
				aria-label="Leave this field empty"
				class="hidden"
				tabindex={-1}
				autocomplete="off"
			/>
			{#each definition.questions as question (question.id)}
				<Div class="space-y-1">
					{#if question.type === 'checkbox'}<Checkbox
							name={`answer:${question.id}`}
							label={question.label}
							required={question.required}
							disabled={busy || preview}
						/>
					{:else if question.type === 'textarea'}<Textarea
							id={`${uid}-${question.id}`}
							name={`answer:${question.id}`}
							label={question.label}
							aria-label={question.label}
							required={question.required}
							maxlength={question.maxLength}
							disabled={busy || preview}
							rows={4}
						/>
					{:else if question.type === 'select' || question.type === 'rating'}<Select
							value=""
							id={`${uid}-${question.id}`}
							name={`answer:${question.id}`}
							label={question.label}
							aria-label={question.label}
							required={question.required}
							disabled={busy || preview}
							options={[
								{ value: '', label: 'Choose an option' },
								...(question.type === 'rating'
									? [1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: String(value) }))
									: question.options.map((value) => ({ value, label: value })))
							]}
						/>
					{:else}<Input
							id={`${uid}-${question.id}`}
							type={question.type}
							name={`answer:${question.id}`}
							label={question.label}
							aria-label={question.label}
							required={question.required}
							maxlength={question.maxLength}
							disabled={busy || preview}
						/>{/if}
					{#if question.help}<P class="text-sm opacity-70">{question.help}</P>{/if}
				</Div>
			{/each}
			{#if error}<P role="alert" class="text-red-600 dark:text-red-400">{error}</P>{/if}
			<Button type="submit" disabled={busy || preview}
				>{busy ? 'Submitting...' : 'Submit response'}</Button
			>
		</Form>
	{/if}
</Div>
