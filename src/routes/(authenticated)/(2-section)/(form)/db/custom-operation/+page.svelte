<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import {
		Button,
		Div,
		Fieldset,
		Form,
		H1,
		Input,
		Modal,
		P,
		ProgressIndicator,
		Select,
		Textarea
	} from '$lib/components';
	import type { ActionData, PageData } from './$types';

	let { data: pageData, form }: { data: PageData; form: ActionData } = $props();
	let create = $state('{\r  \r}');
	const createOperations = ['upsert'];
	let data = $state('{\r  \r}');
	const dataOperations = ['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany'];
	let disabled: boolean = $state(false);
	const enhanceHandler = async () => {
		disabled = true;
		return async ({
			result,
			update
		}: {
			result: { data: { result: Record<string, any> } };
			update: any;
		}) => {
			disabled = false;
			form = {
				result: result.data.result,
				success: true
			};
			if (toggle) toggle();
			// update();
		};
	};
	let operation = $state('');
	const operationOptions = [
		'',
		'create',
		'createMany',
		'createManyAndReturn',
		'delete',
		'deleteMany',
		'findFirst',
		'findMany',
		'findUnique',
		'update',
		'updateMany',
		'upsert'
	]
		.sort((a, b) => a.localeCompare(b))
		.map((label) => ({
			label,
			value: label
		}));
	let toggle: (() => void) | undefined = $state();
	let update = $state('{\r  \r}');
	const updateOperations = ['upsert'];
	let where = $state('{\r  \r}');
	const whereOperations = [
		'delete',
		'deleteMany',
		'findFirst',
		'findMany',
		'findUnique',
		'update',
		'updateMany',
		'upsert'
	];

	// $derives
	const modelOptions = $derived([
		{ label: '', value: '' },
		...pageData.modelNames.map((name) => ({ label: name, value: name }))
	]);
</script>

<Form class="space-y-8" use={[[enhance, enhanceHandler]]}>
	<Div class="flex flex-col items-center space-y-2">
		<H1>Custom Operation</H1>
		<P class="opacity-50">Run a custom Prisma operation</P>
	</Div>
	<Div class="flex flex-col space-y-4">
		<Fieldset legend="Model Name">
			<Select name="modelName" options={modelOptions} required />
		</Fieldset>
		<Fieldset legend="Operation">
			<Select bind:value={operation} name="operation" options={operationOptions} required />
		</Fieldset>
		<Fieldset
			legend="Where"
			isVisible={whereOperations.includes(operation)}
			transition={[slide, { duration: 200 }]}
		>
			<Textarea bind:value={where} name="where" />
		</Fieldset>
		<Fieldset
			legend="Data"
			isVisible={dataOperations.includes(operation)}
			transition={[slide, { duration: 200 }]}
		>
			<Textarea bind:value={data} name="data" />
		</Fieldset>
		<Fieldset
			legend="Update"
			isVisible={updateOperations.includes(operation)}
			transition={[slide, { duration: 200 }]}
		>
			<Textarea bind:value={update} name="update" />
		</Fieldset>
		<Fieldset
			legend="Create"
			isVisible={createOperations.includes(operation)}
			transition={[slide, { duration: 200 }]}
		>
			<Textarea bind:value={create} name="create" />
		</Fieldset>
	</Div>
	<Button
		class="w-full"
		isVisible={form?.result !== undefined}
		onclick={toggle}
		transition={[slide, { duration: 200 }]}>Result</Button
	>
	<Button class="relative" {disabled} type="submit">
		{#if disabled}
			<ProgressIndicator
				class="h-6 w-6"
				transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}
			/>
		{:else}
			<Div transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}>
				Run
			</Div>
		{/if}
	</Button>
</Form>

<Modal bind:toggle>
	<pre>{JSON.stringify(form?.result, null, 2)}</pre>
</Modal>
