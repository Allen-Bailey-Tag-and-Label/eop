<script lang="ts">
	import {
		Button,
		Card,
		Checkbox,
		DialogActions,
		Div,
		FormRenderer,
		H2,
		Input,
		Modal,
		P,
		Select,
		Textarea
	} from '$lib/components';
	import { untrack } from 'svelte';

	import { fieldTypes, validateForm, type FormDefinition } from '$lib/forms/definition';
	export type EditorForm = {
		id: string;
		slug: string;
		title: string;
		version: number;
		draft: FormDefinition;
		published: boolean;
	};
	let {
		record,
		onClose,
		onSave
	}: {
		record: EditorForm;
		onClose: () => void;
		onSave: (record: EditorForm, intent: string) => Promise<string>;
	} = $props();
	let draft = $state(untrack(() => structuredClone($state.snapshot(record.draft))));
	let slug = $state(untrack(() => record.slug));
	let error = $state(''),
		busy = $state(false),
		preview = $state(false);
	async function save(intent: string) {
		try {
			const definition = validateForm({
				...$state.snapshot(draft),
				title: slug,
				description: '',
				questions: draft.questions.map((question) => ({
					...question,
					options: question.options.map((option) => option.trim()).filter(Boolean)
				}))
			});
			busy = true;
			error = await onSave({ ...record, slug, draft: definition }, intent);
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not save form.';
		} finally {
			busy = false;
		}
	}
</script>

<Modal
	closeAriaLabel="Close form editor"
	title={record.id ? 'Edit form' : 'Create form'}
	bind:isOpen={
		() => true,
		(open) => {
			if (!open) onClose();
		}
	}
	role="dialog"
	aria-label={record.id ? 'Edit form' : 'Create form'}
	class="flex max-h-[90svh] w-full max-w-3xl flex-col gap-4 overflow-hidden p-5"
>
	<Div class="-m-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-1">
		{#if error}<P role="alert">{error}</P>{/if}
		<Input
			label="Question set key"
			aria-label="Form slug"
			bind:value={slug}
			readonly={!!record.id}
		/>
		<P class="text-sm opacity-70"
			>Use the post's content editor for headings and introductory text. Access follows the post's
			audience.</P
		>
		<Checkbox label="Accept responses" bind:checked={draft.open} />
		<Checkbox label="Anonymous responses" bind:checked={draft.anonymous} />
		<P class="text-sm" role="status">
			{#if !draft.anonymous}
				Employee sign-in is required. Each response records the signed-in employee's account.
			{:else}
				Responses do not record an employee account. Visitors can respond without signing in when
				the post is public.
			{/if}
		</P>
		<P class="text-sm opacity-70"
			>Saving a draft does not change the published form. Publish to apply changes, including
			closing responses. Clicking outside or Cancel discards unsaved edits.</P
		>
		{#each draft.questions as question, index (question.id)}
			<Card class="space-y-3">
				<Div class="flex items-center justify-between gap-2"
					><H2 class="text-base">Question {index + 1}</H2><Div class="flex gap-2"
						><Button
							variants={['ghost']}
							disabled={index === 0}
							onclick={() => {
								const previous = draft.questions[index - 1];
								draft.questions[index - 1] = question;
								draft.questions[index] = previous;
							}}>Up</Button
						><Button
							variants={['ghost']}
							disabled={draft.questions.length === 1}
							onclick={() => draft.questions.splice(index, 1)}>Remove</Button
						></Div
					></Div
				>
				<Input
					label="Question label"
					aria-label={`Question ${index + 1} label`}
					bind:value={question.label}
				/>
				<Select
					label="Type"
					aria-label={`Question ${index + 1} type`}
					bind:value={question.type}
					options={fieldTypes.map((value) => ({ value, label: value }))}
				/>
				<Input
					label="Help text"
					aria-label={`Question ${index + 1} help`}
					bind:value={question.help}
				/>
				<Checkbox label="Required" bind:checked={question.required} />
				{#if question.type === 'select'}<Textarea
						label="Choices (one per line)"
						aria-label={`Question ${index + 1} choices`}
						value={question.options.join('\n')}
						oninput={(event) => (question.options = event.currentTarget.value.split('\n'))}
						rows={4}
					/>{/if}
				{#if ['text', 'email', 'textarea'].includes(question.type)}<Input
						label="Maximum characters"
						type="number"
						min={1}
						max={10000}
						value={String(question.maxLength)}
						oninput={(event) => (question.maxLength = event.currentTarget.valueAsNumber)}
					/>{/if}
			</Card>
		{/each}
		<Button
			disabled={draft.questions.length >= 50}
			onclick={() =>
				draft.questions.push({
					id: crypto.randomUUID(),
					type: 'text',
					label: 'New question',
					help: '',
					required: false,
					options: [],
					maxLength: 1000
				})}>Add question</Button
		>
		<Textarea
			label="Confirmation message"
			aria-label="Confirmation message"
			bind:value={draft.thanks}
			rows={2}
		/>
		<Button variants={['ghost']} onclick={() => (preview = !preview)}
			>{preview ? 'Hide preview' : 'Preview form'}</Button
		>
		{#if preview}<Card class="p-4"><FormRenderer definition={draft} preview /></Card>{/if}
	</Div>
	<DialogActions
		><Button disabled={busy} onclick={() => save('draft')}>Save draft</Button><Button
			disabled={busy}
			onclick={() => save('publish')}>Publish form</Button
		><Button variants={['ghost']} onclick={onClose}>Cancel</Button></DialogActions
	></Modal
>
