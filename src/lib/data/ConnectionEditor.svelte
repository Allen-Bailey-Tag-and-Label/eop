<script lang="ts">
	import {
		Button,
		Datatable,
		DialogActions,
		Div,
		Form,
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
	let editing = $state(false);
	let error = $state('');
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
		error = '';
	}
	function create() {
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
		error = '';
		editing = true;
	}
</script>

<Div class="space-y-4">
	<Div class="flex items-center justify-between gap-4"
		><H2 class="text-base">API connections</H2><Button onclick={create}>Add API connection</Button
		></Div
	>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status">{form.success}</P>{/if}

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
{#if editing}
	<Modal
		closeAriaLabel="Close API connection"
		title={id ? 'Edit API connection' : 'New API connection'}
		bind:isOpen={editing}
		role="dialog"
		aria-label={id ? 'Edit API connection' : 'New API connection'}
		class="flex max-h-[85svh] w-full max-w-2xl flex-col gap-4 overflow-hidden p-5"
	>
		<Div class="-m-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-1">
			<P
				>Configure an HTTPS origin and explicit endpoint paths. Authentication values come from
				DATA_API_ server environment variables. Saving connection settings applies to all workflows
				that use it.</P
			>
			{#if error}<P role="alert" class="text-red-600 dark:text-red-400">{error}</P>{/if}

			<Form
				action="?/connectionSave"
				class="w-full max-w-none"
				submitFunction={() =>
					async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') editing = false;
						else
							error =
								'data' in result
									? String(result.data?.error ?? 'Could not save connection.')
									: 'Could not save connection.';
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
					aria-label="Connection title"
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
				<Input
					label="User-Agent (application identification)"
					value={config.userAgent ?? ''}
					maxlength={240}
					placeholder="EmployeeOnlinePortal/1.0 (company website or contact email)"
					oninput={(event) => (config.userAgent = event.currentTarget.value)}
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
				<DialogActions
					><Button type="submit">Save connection</Button><Button onclick={() => (editing = false)}
						>Cancel</Button
					></DialogActions
				>
			</Form>
		</Div>
	</Modal>
{/if}

{#snippet actions({ object }: TdSnippet)}<Td
		><Div class="flex gap-2"
			><Button
				onclick={() => {
					edit(object as (typeof data.connections)[number]);
					editing = true;
				}}>Edit</Button
			><Button
				variants={['error']}
				onclick={() => {
					edit(object as (typeof data.connections)[number]);
					deleting = true;
				}}>Delete</Button
			></Div
		></Td
	>{/snippet}
<Modal
	closeAriaLabel="Close delete API connection"
	title="Delete API connection?"
	bind:isOpen={deleting}
	role="dialog"
	aria-label="Delete API connection?"
	class="w-full max-w-lg p-5"
	><Div class="space-y-4"
		>{#if error}<P role="alert">{error}</P>{/if}<P
			>Connections used by a draft or published workflow cannot be deleted.</P
		><Form
			class="w-full max-w-none"
			action="?/connectionDelete"
			submitFunction={() =>
				async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						deleting = false;
						id = '';
						title = '';
						version = 0;
					} else
						error =
							'data' in result
								? String(result.data?.error ?? 'Could not delete connection.')
								: 'Could not delete connection.';
				}}
			><Input type="hidden" name="assetScopeId" value={scopeId} /><Input
				type="hidden"
				name="id"
				value={id}
			/><Input type="hidden" name="version" value={String(version)} /><Input
				type="hidden"
				name="confirm"
				value="delete"
			/><DialogActions
				><Button onclick={() => (deleting = false)}>Cancel</Button><Button
					type="submit"
					variants={['error']}>Confirm delete</Button
				></DialogActions
			></Form
		></Div
	></Modal
>
