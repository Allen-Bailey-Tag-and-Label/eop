<script lang="ts">
	import { Button, Datatable, DialogActions, Div, Modal, P, Td } from '$lib/components';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import { blankForm } from '$lib/forms/definition';
	import FormEditor, { type EditorForm } from './FormEditor.svelte';
	type Summary = { id: string; slug: string; title: string; version: number; published: boolean };
	type ResponseRow = {
		id: string;
		submittedAt: string;
		version: number;
		respondent: string;
		answers: { question: string; answer: string | number | boolean }[];
	};
	let {
		open = $bindable(false),
		forms,
		onInsert
	}: {
		open?: boolean;
		forms: Summary[];
		onInsert: (slug: string) => void;
	} = $props();
	let selected = $state<EditorForm | null>(null),
		pending = $state<Summary | null>(null),
		responses = $state<ResponseRow[] | null>(null),
		error = $state(''),
		busy = $state(false);
	const columns: Column[] = [
		{ key: 'slug', label: 'Question set', type: 'string' },
		{ key: 'status', label: 'Status', snippet: status, isSortable: false },
		{ key: 'actions', label: 'Actions', snippet: actions, isSortable: false }
	];
	const responseColumns: Column[] = [
		{ key: 'submittedAt', label: 'Submitted', type: 'string' },
		{ key: 'version', label: 'Version', type: 'number' },
		{ key: 'respondent', label: 'Respondent', type: 'string' },
		{ key: 'answers', label: 'Answers', snippet: answers, isSortable: false }
	];
	async function request(action: string, fields: Record<string, string>) {
		const data = new FormData();
		for (const [key, value] of Object.entries(fields)) data.set(key, value);
		const response = await fetch(`?/${action}`, {
			method: 'POST',
			body: data,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		if (result.type !== 'success')
			throw new Error(
				result.type === 'failure'
					? String(result.data?.error ?? 'Could not manage form.')
					: 'Could not manage form.'
			);
		return result.data as { formRecord?: EditorForm; responses?: ResponseRow[] };
	}
	async function manage(action: string, form: Summary) {
		busy = true;
		error = '';
		try {
			const result = await request(action === 'responses' ? 'formResponses' : 'formManage', {
				id: form.id,
				operation: 'get'
			});
			if (action === 'responses') responses = result.responses ?? [];
			else selected = result.formRecord!;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not load form.';
		} finally {
			busy = false;
		}
	}
	async function save(record: EditorForm, intent: string) {
		const editing = selected;
		try {
			const result = await request('formSave', {
				id: record.id,
				slug: record.slug,
				version: String(record.version),
				definition: JSON.stringify(record.draft),
				intent
			});
			if (selected === editing) selected = result.formRecord!;
			await invalidateAll();
			return '';
		} catch (cause) {
			return cause instanceof Error ? cause.message : 'Could not save form.';
		}
	}
	async function remove() {
		if (!pending) return;
		busy = true;
		error = '';
		try {
			await request('formManage', {
				id: pending.id,
				version: String(pending.version),
				operation: 'delete',
				confirm: 'delete'
			});
			pending = null;
			await invalidateAll();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not delete form.';
		} finally {
			busy = false;
		}
	}
</script>

{#if open}
	<Modal
		closeAriaLabel="Close forms"
		title="Forms"
		bind:isOpen={open}
		role="dialog"
		aria-label="Forms"
		class="flex max-h-[90svh] w-full max-w-6xl flex-col gap-4 overflow-hidden p-5"
	>
		<Div class="-m-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-1">
			<P
				>Manage questions and responses for this post. Publish a question set, insert it into
				content, then save the post. Share the post URL with readers.</P
			>
			<Button
				onclick={() =>
					(selected = {
						id: '',
						slug: '',
						title: 'New form',
						version: 0,
						draft: blankForm(),
						published: false
					})}>Create form</Button
			>
			{#if error}<P role="alert">{error}</P>{/if}
			<Datatable
				rows={forms}
				{columns}
				isCreatable={false}
				isEditable={false}
				isDeletable={false}
				isSelectable={false}
				isImportable={false}
			/>
		</Div>
		{#if selected}{#key `${selected.id}:${selected.version}`}<FormEditor
					record={selected}
					onClose={() => (selected = null)}
					onSave={save}
				/>{/key}{/if}
		{#if pending}<Modal
				closeAriaLabel="Close delete form"
				title="Delete form?"
				onDismiss={() => (pending = null)}
				isOpen={true}
				role="dialog"
				aria-label="Delete form?"
				class="w-full max-w-lg space-y-4 p-5"
				><P>Delete {pending.title}? Forms with posts or responses must be closed instead.</P
				>{#if error}<P role="alert">{error}</P>{/if}<DialogActions
					><Button variants={['error']} disabled={busy} onclick={remove}>Confirm delete</Button
					><Button onclick={() => (pending = null)}>Cancel</Button></DialogActions
				></Modal
			>{/if}
		{#if responses}<Modal
				closeAriaLabel="Close responses"
				title="Form responses"
				onDismiss={() => (responses = null)}
				isOpen={true}
				role="dialog"
				aria-label="Form responses"
				class="flex max-h-[85svh] w-full max-w-6xl flex-col gap-4 overflow-hidden p-5"
				><P>Latest 500 responses. Question wording is preserved from the submitted form version.</P
				><Div class="min-h-0 overflow-auto"
					><Datatable
						rows={responses}
						columns={responseColumns}
						isCreatable={false}
						isEditable={false}
						isDeletable={false}
						isSelectable={false}
						isImportable={false}
						isExportable={false}
					/></Div
				>
				<DialogActions onClose={() => (responses = null)} />
			</Modal>{/if}

		<DialogActions onClose={() => (open = false)} />
	</Modal>
{/if}
{#snippet status({ object }: TdSnippet)}<Td>{object.published ? 'Published' : 'Draft'}</Td
	>{/snippet}
{#snippet actions({ object }: TdSnippet)}<Td
		><Div class="flex flex-wrap items-center gap-2"
			><Button disabled={busy} onclick={() => manage('edit', object as Summary)}>Edit</Button
			><Button
				disabled={busy || !object.published}
				onclick={() => {
					onInsert(String(object.slug));
					open = false;
				}}>Insert</Button
			><Button disabled={busy} onclick={() => manage('responses', object as Summary)}
				>Responses</Button
			><Button
				variants={['error']}
				disabled={busy}
				onclick={() => {
					error = '';
					pending = object as Summary;
				}}>Delete</Button
			></Div
		></Td
	>{/snippet}
{#snippet answers({ object }: TdSnippet)}<Td
		><Div class="space-y-2"
			>{#each object.answers as answer, index (index)}<P class="break-words whitespace-pre-wrap"
					><strong>{answer.question}:</strong> {String(answer.answer)}</P
				>{/each}</Div
		></Td
	>{/snippet}
