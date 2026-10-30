<script lang="ts">
	import { untrack } from 'svelte';
	import type { ActionResult } from '@sveltejs/kit';
	import {
		A,
		Button,
		Card,
		Datatable,
		Div,
		Form,
		H2,
		Input,
		Modal,
		P,
		Select,
		Textarea
	} from '$lib/components';
	import type { Column } from '$lib/components/Datatable/types';
	import { defaultDataSource } from '$lib/slides/types';
	import { validateWorkflow } from './workflows';
	import WorkflowGraph from './WorkflowGraph.svelte';
	import type { WorkflowDefinition, WorkflowNode, WorkflowResult, ApiConnection } from './types';
	let {
		data,
		form,
		action = '?/dataSave',
		previewAction = '?/dataPreview',
		deleteAction = '?/dataDelete',
		scopeId = '',
		scope = 'slide',
		onBack = () => {},
		onResult = () => {},
		allowDelete = true
	}: {
		data: {
			source: {
				id: string;
				title: string;
				version: number;

				draft: WorkflowDefinition;
			};
			connections: { id: string; title: string; config: ApiConnection }[];
			usage: { title: string; slug: string; published: boolean; draft: boolean }[];
		};
		form?: { error?: string; success?: string; preview?: WorkflowResult } | null;
		action?: string;
		previewAction?: string;
		deleteAction?: string;
		scopeId?: string;
		scope?: string;
		onBack?: () => void;
		onResult?: (value: Record<string, unknown>) => void;
		allowDelete?: boolean;
	} = $props();
	let draft = $state<WorkflowDefinition>(
		untrack(() => structuredClone($state.snapshot(data.source.draft)) as WorkflowDefinition)
	);
	let title = $state(untrack(() => data.source.title));
	let configText = $state<Record<string, string>>(
		untrack(() =>
			Object.fromEntries(draft.nodes.map((node) => [node.id, JSON.stringify(node.config, null, 2)]))
		)
	);
	let configErrors = $state<Record<string, string>>({});
	let parameters = $state(untrack(() => JSON.stringify(draft.parameters ?? {}, null, 2)));
	let previewParameters = $state('{}');
	let previewNode = $state('');
	let deleting = $state(false);
	let busy = $state(false);
	let workflowFile = $state<HTMLInputElement | null>(null);
	let importError = $state('');
	async function importWorkflow(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		if (!file) return;
		try {
			if (file.size > 200000) throw new Error('Workflow files must be under 200 KB.');
			const next = validateWorkflow(JSON.parse(await file.text()));
			draft = next;
			parameters = JSON.stringify(next.parameters, null, 2);
			previewParameters = '{}';
			configText = Object.fromEntries(
				next.nodes.map((node) => [node.id, JSON.stringify(node.config, null, 2)])
			);
			configErrors = {};
			previewNode = '';
			importError = '';
		} catch (cause) {
			importError = cause instanceof Error ? cause.message : 'Could not import workflow.';
		} finally {
			input.value = '';
		}
	}
	const types: WorkflowNode['type'][] = [
		'database',
		'api',
		'literal',
		'join',
		'filter',
		'map',
		'sort',
		'group'
	];
	const defaults = (type: WorkflowNode['type']): Record<string, unknown> =>
		({
			database: {
				query: { ...defaultDataSource(), model: 'Holiday', select: 'name date', sort: '{"date":1}' }
			},
			api: {
				connectionId: data.connections[0]?.id ?? '',
				path: data.connections[0]?.config.paths[0] ?? '/rows',
				query: {},
				itemsPath: 'data.rows',
				fields: { id: 'id', name: 'name' }
			},
			literal: { rows: [{ id: 'example', name: 'Example' }] },
			join: { leftKey: 'id', rightKey: 'id', mode: 'left', prefix: 'right' },
			filter: { match: 'all', rules: [{ field: 'name', operator: 'neq', value: '' }] },
			map: {
				fields: {
					id: { field: 'id' },
					name: { op: 'concat', args: [{ field: 'firstName' }, ' ', { field: 'lastName' }] }
				}
			},
			sort: { fields: { name: 1 } },
			group: { key: '', fields: { count: { op: 'count' } } }
		})[type];
	let addType = $state<WorkflowNode['type']>('database');
	const definition = $derived.by(() => {
		try {
			return { ...draft, parameters: JSON.parse(parameters) };
		} catch {
			return draft;
		}
	});
	const error = $derived.by(() => {
		try {
			JSON.parse(parameters);
			JSON.parse(previewParameters);
			if (Object.values(configErrors).some(Boolean))
				return 'Correct invalid node configuration JSON.';
			validateWorkflow(definition);
			return '';
		} catch (cause) {
			return cause instanceof Error ? cause.message : 'Invalid workflow.';
		}
	});
	function config(node: WorkflowNode, value: string) {
		configText[node.id] = value;
		try {
			node.config = JSON.parse(value);
			configErrors[node.id] = '';
		} catch {
			configErrors[node.id] = 'Invalid JSON';
		}
	}
	function add() {
		const id = `node_${crypto.randomUUID().slice(0, 8)}`;
		const count = ['database', 'api', 'literal'].includes(addType) ? 0 : addType === 'join' ? 2 : 1;
		const node: WorkflowNode = {
			id,
			type: addType,
			inputs: Array.from({ length: count }, () => draft.nodes.at(-1)?.id ?? ''),
			config: defaults(addType)
		};
		draft.nodes.push(node);
		configText[id] = JSON.stringify(node.config, null, 2);
	}
	const previewRows = $derived(
		previewNode
			? (form?.preview?.nodes[previewNode] ?? [])
			: form?.preview
				? (Object.values(form.preview.outputs)[0] ?? [])
				: []
	);
	const columns = $derived<Column[]>(
		[...new Set(previewRows.flatMap((row) => Object.keys(row)))].map((key) => ({
			key,
			label: key,
			type: 'string'
		}))
	);
	const submit = () => {
		busy = true;
		return async ({
			update,
			result
		}: {
			update: (options?: { reset?: boolean }) => Promise<void>;
			result: ActionResult;
		}) => {
			try {
				await update({ reset: false });
				if (result.type === 'success' || result.type === 'failure')
					onResult((result.data ?? {}) as Record<string, unknown>);
			} finally {
				busy = false;
			}
		};
	};
</script>

<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-3"
		><H2 class="text-lg">{data.source.id ? 'Edit data link' : 'New data link'}</H2><Div
			class="flex items-center gap-2"
			><Button disabled={busy} onclick={() => workflowFile?.click()}>Import workflow</Button><Button
				onclick={onBack}>All data links</Button
			></Div
		></Div
	>
	<Input
		type="file"
		class="sr-only"
		accept="application/json,.json"
		aria-label="Import workflow file"
		bind:element={workflowFile}
		onchange={importWorkflow}
	/>
	<P class="text-xs opacity-60"
		>Import replaces this workflow draft. Review its API connections and preview before saving or
		publishing.</P
	>
	{#if importError}<P role="alert" class="text-red-600 dark:text-red-400">{importError}</P>{/if}
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status">{form.success}</P>{/if}
	<Form {action} class="max-w-none space-y-5" submitFunction={submit}>
		<Input type="hidden" name="assetScopeId" value={scopeId} /><Input
			type="hidden"
			name="scope"
			value={scope}
		/><Input type="hidden" name="id" value={data.source.id} /><Input
			type="hidden"
			name="version"
			value={String(data.source.version)}
		/>
		<Input type="hidden" name="definition" value={JSON.stringify(definition)} /><Input
			type="hidden"
			name="parameters"
			value={previewParameters}
		/>
		<Input label="Title" name="title" bind:value={title} required maxlength={160} />
		<Card class="space-y-3"
			><H2 class="text-base">Parameters and freshness</H2>
			<Textarea label="Parameter defaults (JSON object)" bind:value={parameters} rows={3} />
			<P class="text-sm"
				>Database JSON uses {JSON.stringify({ $param: 'name' })}; transform expressions use {JSON.stringify(
					{ param: 'name' }
				)}. Override parameters in a slide without changing this source.</P
			>
			<Div class="grid gap-4 md:grid-cols-2"
				><Input
					label="Refresh interval (seconds; 0 = every visit)"
					type="number"
					min={0}
					max={86400}
					value={String(draft.refreshSeconds)}
					oninput={(event) => (draft.refreshSeconds = event.currentTarget.valueAsNumber)}
				/><Input
					label="Use last successful result after failure (seconds; 0 = off)"
					type="number"
					min={0}
					max={86400}
					value={String(draft.staleSeconds)}
					oninput={(event) => (draft.staleSeconds = event.currentTarget.valueAsNumber)}
				/></Div
			>
		</Card>
		<Card class="space-y-4"
			><H2 class="text-base">Workflow</H2><P
				>Connect inputs by node ID. Execution follows dependencies, so independent database/API
				nodes can run together. Each node preview shows its first 20 rows.</P
			>
			<WorkflowGraph nodes={draft.nodes} bind:selected={previewNode} />
			{#each draft.nodes as node, index (node.id)}
				<Card class="space-y-3">
					<Div class="flex flex-wrap items-center justify-between gap-2"
						><P class="font-semibold">{index + 1}. {node.type} — {node.id}</P><Button
							variants={['error']}
							disabled={draft.nodes.some((other) => other.inputs.includes(node.id)) ||
								Object.values(draft.outputs).some((output) => output.nodeId === node.id)}
							onclick={() => {
								draft.nodes = draft.nodes.filter((item) => item.id !== node.id);
								delete configErrors[node.id];
							}}>Remove node</Button
						></Div
					>
					{#each node.inputs as input, inputIndex (inputIndex)}<Select
							label={`${node.type === 'join' ? (inputIndex === 0 ? 'Left' : 'Right') : 'Input'} node`}
							value={input}
							options={[
								{ value: '', label: 'Choose input' },
								...draft.nodes
									.filter((item) => item.id !== node.id)
									.map((item) => ({ value: item.id, label: `${item.type}: ${item.id}` }))
							]}
							onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
								(node.inputs[inputIndex] = event.currentTarget.value)}
						/>{/each}
					{#if node.type === 'api'}<Select
							label="API connection"
							value={String(node.config.connectionId ?? '')}
							options={data.connections.map((connection) => ({
								value: connection.id,
								label: connection.title
							}))}
							onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
								config(
									node,
									JSON.stringify(
										{ ...node.config, connectionId: event.currentTarget.value },
										null,
										2
									)
								)}
						/>{/if}
					<Textarea
						label={`${node.id} configuration (JSON)`}
						aria-label={`Configuration ${node.id}`}
						rows={8}
						value={configText[node.id]}
						oninput={(event) => config(node, event.currentTarget.value)}
					/>
					{#if configErrors[node.id]}<P role="alert" class="text-red-600 dark:text-red-400"
							>{configErrors[node.id]}</P
						>{/if}
				</Card>
			{/each}
			<Div class="flex flex-wrap items-end gap-3"
				><Select
					label="New node type"
					aria-label="New node type"
					bind:value={addType}
					options={types.map((value) => ({ value, label: value }))}
				/><Button disabled={draft.nodes.length >= 30} onclick={add}>Add node</Button></Div
			>
		</Card>
		<Card class="space-y-4"
			><H2 class="text-base">Named outputs</H2><P
				>Only selected output fields reach slides. Set a stable ID field to preserve repeated item
				identity between refreshes.</P
			>
			{#each Object.entries(draft.outputs) as [name, output] (name)}<Card class="space-y-2"
					><Input
						label="Output name"
						value={name}
						onblur={(event) => {
							const nextName = event.currentTarget.value.trim();
							if (
								nextName !== name &&
								/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(nextName) &&
								!draft.outputs[nextName]
							) {
								const next = { ...draft.outputs, [nextName]: output };
								delete next[name];
								draft.outputs = next;
							} else event.currentTarget.value = name;
						}}
					/>
					<Select
						label={`${name} output node`}
						bind:value={output.nodeId}
						options={draft.nodes.map((node) => ({
							value: node.id,
							label: `${node.type}: ${node.id}`
						}))}
					/>
					<Input
						label={`${name} fields (space separated)`}
						value={output.fields.join(' ')}
						oninput={(event) =>
							(output.fields = event.currentTarget.value.trim().split(/\s+/).filter(Boolean))}
					/>
					<Input label={`${name} stable ID field`} bind:value={output.idField} />
					<Button
						variants={['error']}
						onclick={() => {
							const next = { ...draft.outputs };
							delete next[name];
							draft.outputs = next;
						}}>Remove output</Button
					>
				</Card>{/each}
			<Button
				disabled={Object.keys(draft.outputs).length >= 10}
				onclick={() => {
					let index = 1;
					while (draft.outputs[`output${index}`]) index++;
					draft.outputs[`output${index}`] = {
						nodeId: draft.nodes.at(-1)?.id ?? '',
						fields: ['name'],
						idField: ''
					};
				}}>Add output</Button
			>
		</Card>
		{#if error}<P role="alert" class="text-red-600 dark:text-red-400">{error}</P>{/if}
		<Div class="flex flex-wrap gap-3"
			><Button type="submit" name="intent" value="draft" disabled={!!error || busy}
				>Save draft</Button
			><Button type="submit" name="intent" value="publish" disabled={!!error || busy}
				>Publish source</Button
			><Button type="submit" formaction={previewAction} disabled={!!error || busy}
				>Preview workflow</Button
			></Div
		>
		<Textarea label="Preview parameter overrides (JSON)" bind:value={previewParameters} rows={3} />
	</Form>
	{#if form?.preview}<Card class="space-y-3"
			><H2 class="text-base">Preview results</H2><P>Updated {form.preview.updatedAt}</P>
			<Select
				label="Preview node"
				aria-label="Preview node"
				bind:value={previewNode}
				options={[
					{ value: '', label: 'First named output' },
					...Object.keys(form.preview.nodes).map((value) => ({ value, label: value }))
				]}
			/>
			{#if previewRows.length}<Datatable
					rows={previewRows}
					{columns}
					isCreatable={false}
					isDeletable={false}
					isEditable={false}
					isImportable={false}
					isExportable={false}
					isSelectable={false}
				/>{:else}<P>No rows.</P>{/if}
			<P class="text-sm"
				>Sample output field types: {Object.entries(form.preview.outputs)
					.map(
						([name, rows]) =>
							`${name}: ${Object.entries(rows[0] ?? {})
								.filter(([key]) => key !== '_rowId')
								.map(([key, value]) => `${key} (${value === null ? 'null' : typeof value})`)
								.join(', ')}`
					)
					.join('; ')}</P
			>
		</Card>{/if}
	<Card class="space-y-3"
		><H2 class="text-base">Used by slides</H2>{#each data.usage as usage (usage.slug)}<A
				href={`/admin/monitors/slides/${usage.slug}`}
				class="block underline">{usage.title} ({usage.published ? 'published' : 'draft'})</A
			>{:else}<P>No slide references yet.</P>{/each}
		{#if data.source.id}<Button
				variants={['error']}
				disabled={!allowDelete}
				title={allowDelete
					? 'Delete data link'
					: 'Remove this data link from the canvas and save first'}
				onclick={() => (deleting = true)}>Delete source</Button
			>{/if}
	</Card>
</Div>
<Modal bind:isOpen={deleting} role="dialog" aria-label="Delete data source?"
	><Div class="space-y-4"
		><H2 class="text-lg">Delete data source?</H2><P
			>Remove references from draft and published slides first. This deletes the source and its
			cached results.</P
		><Form action={deleteAction} submitFunction={submit}
			><Input type="hidden" name="assetScopeId" value={scopeId} /><Input
				type="hidden"
				name="scope"
				value={scope}
			/><Input type="hidden" name="id" value={data.source.id} /><Input
				type="hidden"
				name="version"
				value={String(data.source.version)}
			/><Input type="hidden" name="confirm" value="delete" /><Button
				type="submit"
				variants={['error']}>Confirm delete</Button
			></Form
		><Button onclick={() => (deleting = false)}>Cancel</Button></Div
	></Modal
>
