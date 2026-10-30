<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button, Card, Div, H2, Input, P, Tabs } from '$lib/components';
	import SourceEditor from './SourceEditor.svelte';
	import ConnectionEditor from './ConnectionEditor.svelte';
	import {
		blankWorkflow,
		type ApiConnection,
		type WorkflowDefinition,
		type WorkflowResult
	} from './types';
	let {
		sources = [],
		connections = [],
		scopeId,
		form,
		usedSourceIds = []
	}: {
		sources?: {
			id: string;
			title: string;
			version: number;
			scope: string;
			publishedAt: string | null;
		}[];
		connections?: { id: string; title: string; version: number; config: ApiConnection }[];
		scopeId: string;
		usedSourceIds?: string[];
		form?: { error?: string; success?: string } | null;
	} = $props();
	type Source = { id: string; title: string; version: number; draft: WorkflowDefinition };
	let tab = $state('slide');
	let search = $state('');
	let selected = $state<Source | null>(null);
	let usage = $state<{ title: string; slug: string; draft: boolean; published: boolean }[]>([]);
	let result = $state<{ error?: string; success?: string; preview?: WorkflowResult }>({});
	let busy = $state(false);
	let pendingOperation = $state<'move' | 'delete'>('move');
	let pending = $state<(typeof sources)[number] | null>(null);
	const tabs = [
		['slide', 'This slide'],
		['shared', 'Shared library'],
		['connections', 'API connections']
	];
	const visible = $derived(
		sources.filter(
			(source) => source.scope === tab && source.title.toLowerCase().includes(search.toLowerCase())
		)
	);
	function accept(value: Record<string, unknown>) {
		result = value as typeof result;
		if (value.source) selected = value.source as Source;
		if (value.usage) usage = value.usage as typeof usage;
		if (value.deleted) {
			selected = null;
			pending = null;
		}
	}
	async function request(
		operation: string,
		source: (typeof sources)[number],
		extra: Record<string, string> = {}
	) {
		busy = true;
		try {
			const fields = new FormData();
			for (const [key, value] of Object.entries({
				operation,
				id: source.id,
				version: String(source.version),
				assetScopeId: scopeId,
				...extra
			}))
				fields.set(key, value);
			const response = await fetch('?/dataManage', {
				method: 'POST',
				body: fields,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const action = deserialize(await response.text());
			if (action.type === 'success' || action.type === 'failure') {
				accept((action.data ?? {}) as Record<string, unknown>);
				if (action.type === 'success') {
					pending = null;
					await invalidateAll();
				}
			} else result = { error: 'Unable to manage this data link.' };
		} catch {
			result = { error: 'Unable to manage this data link. Retry.' };
		} finally {
			busy = false;
		}
	}
</script>

{#if selected}
	{#key `${selected.id}:${selected.version}`}
		<SourceEditor
			data={{ source: selected, connections, usage }}
			form={result}
			{scopeId}
			scope={tab}
			onBack={() => {
				selected = null;
				result = {};
			}}
			onResult={accept}
			allowDelete={!usedSourceIds.includes(selected.id)}
		/>
	{/key}
{:else if pending}
	<Div
		role="alertdialog"
		aria-label={pendingOperation === 'delete' ? 'Delete data link?' : 'Move data link?'}
		class="space-y-4"
	>
		<H2 class="text-lg"
			>{pendingOperation === 'delete' ? 'Delete data link?' : 'Move data link?'}</H2
		>
		<P
			>{pendingOperation === 'delete'
				? 'Permanently delete this data link? Saved draft and published slide references must be removed first.'
				: pending.scope === 'shared'
					? 'Remove this link from the shared library and move it to this slide? Existing slide references keep working.'
					: 'Make this link available in the shared library for all slides?'}</P
		>
		{#if result.error}<P role="alert">{result.error}</P>{/if}
		<Div class="flex gap-2"
			><Button
				disabled={busy}
				onclick={() =>
					request(pendingOperation, pending!, {
						confirm: pendingOperation,
						scope: pending!.scope === 'shared' ? 'slide' : 'shared'
					})}>{pendingOperation === 'delete' ? 'Confirm delete' : 'Confirm move'}</Button
			><Button disabled={busy} onclick={() => (pending = null)}>Cancel</Button></Div
		>
	</Div>
{:else}
	<Div class="space-y-4">
		<Tabs
			bind:value={tab}
			aria-label="Data library sections"
			tabs={tabs.map(([value, title]) => ({ value, title }))}
			onValueChange={() => (result = {})}
		/>
		{#if tab === 'connections'}
			<ConnectionEditor data={{ connections }} {form} {scopeId} />
		{:else}
			<Div class="flex flex-wrap items-center gap-3"
				><Input label="Search data links" bind:value={search} /><Button
					onclick={() => {
						result = {};
						usage = [];
						selected = { id: '', title: '', version: 0, draft: blankWorkflow() };
					}}>Create data link</Button
				></Div
			>
			{#if result.error}<P role="alert" class="text-red-600 dark:text-red-400">{result.error}</P
				>{/if}
			{#each visible as source (source.id)}
				<Card class="flex flex-wrap items-center justify-between gap-3">
					<Div
						><P class="font-semibold">{source.title}</P><P class="text-xs opacity-60"
							>{source.publishedAt ? 'Published' : 'Draft'}</P
						></Div
					>
					<Div class="flex shrink-0 items-center gap-2"
						><Button disabled={busy} onclick={() => request('get', source)}>Edit</Button><Button
							disabled={busy}
							variants={['ghost']}
							onclick={() => {
								pendingOperation = 'move';
								pending = source;
								result = {};
							}}>{source.scope === 'shared' ? 'Move to this slide' : 'Share'}</Button
						><Button
							disabled={busy || usedSourceIds.includes(source.id)}
							variants={['error']}
							onclick={() => {
								pendingOperation = 'delete';
								pending = source;
								result = {};
							}}>Delete</Button
						></Div
					>
				</Card>
			{:else}<P>No data links in this library.</P>{/each}
		{/if}
	</Div>
{/if}
