<script lang="ts">
	import {
		MongooseTable,
		Div,
		Td,
		Button,
		Dialog,
		Form,
		Select,
		Card,
		Input,
		MultiSelect
	} from '$lib/components';
	import { type TdSnippet } from '$lib/components/MongooseTable/types';
	import { localState } from '$lib/localState';
	import { Pencil } from '@lucide/svelte';

	let { data } = $props();
	let columns = $state([
		{
			isEditable: false,
			isCreatable: false,
			key: 'routes',
			label: ' ',
			snippet: routesSnippet
		},
		'label'
	]);
	let doc = $state({ routes: [] });
	let isRoutesDialogOpen = $state(false);
	let routes = $state([]);
	let rows = $state([]);
	let settings = localState('admin/roles', {
		sort: { direction: 'asc', key: 'label' }
	});
	const updateRoutes = async (routesPromise: Promise<any[]>) => {
		const resolved = await routesPromise;
		routes = resolved;
	};
	const updateRows = async (rowsPromise: Promise<any[]>) => {
		const resolved = await rowsPromise;
		rows = resolved;
	};

	const routeOptions = $derived.by(() =>
		routes.map(({ _id, isDirectory, href, label }) => ({
			label: isDirectory ? label : href,
			value: _id
		}))
	);

	$effect(() => {
		updateRoutes(data.routes);
	});
	$effect(() => {
		updateRows(data.rows);
	});
</script>

<Div class="flex flex-col p-4">
	{#if rows.length === 0}
		<Div>Loading...</Div>
	{:else}
		<MongooseTable bind:columns bind:rows bind:sort={settings.sort} modelName={'Role'} />
	{/if}
</Div>

<Dialog bind:open={isRoutesDialogOpen}>
	<Form
		action="/api/mongooseTable?/update"
		class="max-w-full"
		submitFunction={() => {
			return async ({ update }) => {
				await update();
				isRoutesDialogOpen = false;
			};
		}}
	>
		<Input name="modelName" type="hidden" value="Role" />
		<Input name="_id" type="hidden" value={doc._id} />
		{#each doc.routes as _routeId}
			<Input name="routes" type="hidden" value={_routeId} />
		{/each}
		<Card class="space-y-6">
			<Div class="space-y-4">
				<MultiSelect bind:value={doc.routes} label="Routes" options={routeOptions} />
			</Div>
			<Div class="flex justify-end space-x-2">
				<Button type="submit">Update</Button>
				<Button
					type="button"
					onclick={() => {
						isRoutesDialogOpen = false;
					}}
					variants={['ghost']}>Cancel</Button
				>
			</Div>
		</Card>
	</Form>
</Dialog>

{#snippet routesSnippet({ object }: TdSnippet)}
	<Td class="py-0">
		<Button
			onclick={() => {
				doc = object;
				isRoutesDialogOpen = true;
			}}
			variants={['small']}
		>
			Roles
		</Button>
	</Td>
{/snippet}
