<script lang="ts">
	import {
		Button,
		Card,
		Datatable,
		Div,
		Form,
		H1,
		H2,
		Input,
		Modal,
		P,
		Select,
		Td,
		Textarea
	} from '$lib/components';
	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import type { ApiConnection } from '$lib/data/types';
	let { data, form, scopeId = '' } = $props();
	let id = $state(''),
		title = $state(''),
		version = $state(0),
		deleting = $state(false);
	let config = $state<ApiConnection>({
		baseUrl: '',
		paths: ['/rows'],
		auth: 'none',
		headerName: 'X-API-Key',
		secretEnv: '',
		timeoutMs: 4000
	});
	const columns: Column[] = [
		{ key: 'title', label: 'Title', type: 'string' },
		{ key: 'actions', label: 'Actions', snippet: actions, isSortable: false }
	];
	function edit(row: (typeof data.connections)[number]) {
		id = row.id;
		title = row.title;
		version = row.version;
		config = structuredClone($state.snapshot(row.config));
	}
</script>

<Div class="space-y-6"
	><Div class="flex items-center justify-between gap-4"><H1>API connections</H1></Div>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status">{form.success}</P>{/if}
	<Card class="space-y-4"
		><H2>{id ? 'Edit connection' : 'New connection'}</H2>
		<P
			>Configure an HTTPS origin and explicit endpoint paths. Authentication values come from
			DATA_API_ server environment variables. Saving connection settings applies to all workflows
			that use it.</P
		>
		<Form
			action="?/connectionSave"
			class="max-w-none"
			submitFunction={() =>
				async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						id = '';
						title = '';
						version = 0;
						config = {
							baseUrl: '',
							paths: ['/rows'],
							auth: 'none',
							headerName: 'X-API-Key',
							secretEnv: '',
							timeoutMs: 4000
						};
					}
				}}
		>
			<Input type="hidden" name="assetScopeId" value={scopeId} /><Input
				type="hidden"
				name="id"
				value={id}
			/><Input type="hidden" name="version" value={String(version)} /><Input
				type="hidden"
				name="definition"
				value={JSON.stringify(config)}
			/>
			<Input
				name="title"
				label="Connection title"
				bind:value={title}
				required
				maxlength={160}
			/><Input
				label="Base URL (HTTPS origin)"
				bind:value={config.baseUrl}
				placeholder="https://api.example.com"
				required
			/>
			<Textarea
				label="Allowed endpoint paths (one per line)"
				value={config.paths.join('\n')}
				oninput={(event) =>
					(config.paths = event.currentTarget.value
						.split('\n')
						.map((path) => path.trim())
						.filter(Boolean))}
				rows={4}
			/>
			<Select
				label="Authentication"
				bind:value={config.auth}
				options={['none', 'bearer', 'header'].map((value) => ({ value, label: value }))}
			/>
			{#if config.auth === 'header'}<Input
					label="API-key header name"
					bind:value={config.headerName}
				/>{/if}
			{#if config.auth !== 'none'}<Input
					label="Server credential environment variable"
					bind:value={config.secretEnv}
					placeholder="DATA_API_PRODUCTION_KEY"
				/><P class="text-sm">Enter the variable name, never its secret value.</P>{/if}
			<Input
				label="Timeout (ms)"
				type="number"
				min={1000}
				max={10000}
				step={100}
				value={String(config.timeoutMs)}
				oninput={(event) => (config.timeoutMs = event.currentTarget.valueAsNumber)}
			/>
			<Button type="submit">Save connection</Button><Button
				onclick={() => {
					id = '';
					title = '';
					version = 0;
					config = {
						baseUrl: '',
						paths: ['/rows'],
						auth: 'none',
						headerName: 'X-API-Key',
						secretEnv: '',
						timeoutMs: 4000
					};
				}}>New connection</Button
			>
		</Form>
	</Card>
	<Datatable
		rows={data.connections}
		{columns}
		isCreatable={false}
		isDeletable={false}
		isEditable={false}
		isImportable={false}
		isExportable={false}
		isSelectable={false}
	/>
</Div>
{#snippet actions({ object }: TdSnippet)}<Td
		><Div class="flex gap-2"
			><Button onclick={() => edit(object as (typeof data.connections)[number])}>Edit</Button
			><Button
				variants={['error']}
				onclick={() => {
					edit(object as (typeof data.connections)[number]);
					deleting = true;
				}}>Delete</Button
			></Div
		></Td
	>{/snippet}
<Modal bind:isOpen={deleting} role="dialog" aria-label="Delete API connection?"
	><Div class="space-y-4"
		><H2>Delete API connection?</H2><P
			>Connections used by a draft or published workflow cannot be deleted.</P
		><Form
			action="?/connectionDelete"
			submitFunction={() =>
				async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						deleting = false;
						id = '';
						title = '';
						version = 0;
					}
				}}
			><Input type="hidden" name="assetScopeId" value={scopeId} /><Input
				type="hidden"
				name="id"
				value={id}
			/><Input type="hidden" name="version" value={String(version)} /><Input
				type="hidden"
				name="confirm"
				value="delete"
			/><Button type="submit" variants={['error']}>Confirm delete</Button></Form
		><Button onclick={() => (deleting = false)}>Cancel</Button></Div
	></Modal
>
