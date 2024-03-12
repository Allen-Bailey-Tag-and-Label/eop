<script lang="ts">
import { enhance } from '$app/forms';
import {
	Button,
	Card,
	Fieldset,
	Form,
	Icon,
	Input,
	Modal,
	Select,
	Table,
	Tbody,
	Td,
	Textarea,
	Th,
	Thead,
	Tooltip,
	Tr
} from '$components';
import * as format from '$lib/format';
import {
	ArrowUpOnSquare,
	ClipboardDocumentList,
	MagnifyingGlass
} from 'sveltewind/components/icons';

// handlers
const findEnhanceHandler = () => {
	return async ({ result }) => {
		prismaMethod = result.data.prismaMethod;
		rows = result.data.rows;
	};
};
const submitHandler = (e: CustomEvent<any>) => {
	e.preventDefault();
	const importPrices = textArea
		.trim()
		.split('\n')
		.map((string: string, index: number) => {
			const quantity = (index + 1) * 1000;
			const price = string.replace(/(\$|\s|\/|\\|M)/g, '');
			rows[index] = { ...rows?.[index], quantity, price };
		});
	close();
};

// props (internal)
let close: () => boolean;
let isOpen: boolean;
let open: () => boolean;
let options: {
	material?: string;
} = {};
let prismaMethod: string;
let rows: { id?: string; quantity: number; price: string }[] = [];
const tagMaterialOptions = ['', 'Paper', 'Polyart', 'Tyvek'].map((label) => ({
	label,
	value: label
}));
let textArea = '';
let toggle: () => boolean;
let type = '';
const typeOptions = ['', 'Collar', 'Label', 'Tag'].map((label) => ({ label, value: label }));

// props (reactive)
$: isValid = type === 'Tag' && options?.material !== '' && options?.material !== undefined;
$: if (!isValid) {
	prismaMethod = undefined;
	rows = [];
}
$: dataString = JSON.stringify(rows);
$: optionsString = JSON.stringify(options);
$: optionsFindString = JSON.stringify({ equals: options });
</script>

<div class="grid max-h-full flex-grow grid-cols-[fit-content(0px)_1fr] overflow-visible">
	<Card class="rounded-none">
		<Form>
			<Fieldset legend="Type">
				<Select bind:value={type} on:change={() => {
					options = {};
				}} options={typeOptions} />
			</Fieldset>
			{#if type === 'Tag'}
				<Fieldset legend="Material">
					<Select bind:value={options.material} options={tagMaterialOptions} />
				</Fieldset>
			{/if}
		</Form>
	</Card>
	<div class="grid max-h-full flex-grow overflow-auto" style="grid-template-rows:min-content 1fr">
		<Card class="flex-row space-x-2 rounded-none p-2">
			<Tooltip position="bottom" tooltip="Search">
				<Form action="?/find" use={[[enhance, findEnhanceHandler]]}>
					<Button
						class="px-2 py-2"
						disabled={isValid ? undefined:'disabled'}
						type="submit"
						variants={['icon']}
					>
						<Icon class="h-4 w-4" src={MagnifyingGlass} />
					</Button>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="optionsFindString"
						type="hidden"
						value={optionsFindString}
					/>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="type"
						type="hidden"
						value={type}
					/>
				</Form>
			</Tooltip>
			<Tooltip position="bottom" tooltip="Import">
				<Button
					class="px-2 py-2"
					disabled={rows.length > 0 ? undefined : 'disabled'}
					on:click={open}
					variants={['icon']}
				>
					<Icon class="h-4 w-4" src={ClipboardDocumentList} />
				</Button>
			</Tooltip>
			<Tooltip position="bottom" tooltip="Upload">
				<Form action="?/update" use={[enhance]}>
					<Button
						class="px-2 py-2"
						disabled={rows.length > 0 ? undefined : 'disabled'}
						type="submit"
						variants={['icon']}
					>
						<Icon class="h-4 w-4" src={ArrowUpOnSquare} />
					</Button>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="dataString"
						type="hidden"
						value={dataString}
					/>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="optionsString"
						type="hidden"
						value={optionsString}
					/>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="prismaMethod"
						type="hidden"
						value={prismaMethod}
					/>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="type"
						type="hidden"
						value={type}
					/>
				</Form>
			</Tooltip>
		</Card>
		<Card class="items-start overflow-auto rounded-none p-0">
			{#if isValid}
				<Table>
					<Thead>
						<Th>Quantity</Th>
						<Th>$ / M</Th>
					</Thead>
					<Tbody>
						{#each rows as row, index}
							{@const quantity = (index+1)*1000}
							<Tr>
								<Td class="text-right">{format.quantity(quantity)}</Td>
								<Td class="p-0">
									<Input bind:value={row.price} class="rounded-none text-right" type="number" />
								</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			{/if}
		</Card>
	</div>
</div>

<Modal bind:close={close} bind:isOpen={isOpen} bind:open={open} bind:toggle={toggle} class="pt-16">
	<Form on:submit={submitHandler}>
		<Textarea bind:value={textArea} />
		<Button type="submit">Import</Button>
	</Form>
</Modal>
