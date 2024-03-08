<script lang="ts">
import {
	Button,
	Card,
	Checkbox,
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
import { ArrowUpOnSquare, ClipboardDocumentList } from 'sveltewind/components/icons';

// handlers
const submitHandler = (e: CustomEvent<any>) => {
	e.preventDefault();
	const importPrices = textArea
		.trim()
		.split('\n')
		.map((string) => string.replace(/(\$|\s|\/|\\|M)/g, ''));
	rows = importPrices;
	close();
};

// props (internal)
let close: () => boolean;
let isOpen: boolean;
let open: () => boolean;
let options: {
	eyelet?: boolean;
	material?: string;
	wired?: boolean;
} = {};
let rows: string[] = [...Array(50)].map((_) => '0.00');
const tagMaterialOptions = ['', 'Paper', 'Polyart', 'Tyvek'].map((label) => ({
	label,
	value: label
}));
let textArea = '';
let toggle: () => boolean;
let type = '';
const typeOptions = ['', 'Collar', 'Label', 'Tag'].map((label) => ({ label, value: label }));

// props (reactive)
$: if (type === 'Tag' && (options?.material === 'Polyart' || options?.material === 'Tyvek'))
	options.eyelet = true;
$: isValid = type === 'Tag' && options?.material !== '' && options?.material !== undefined;
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
				<Fieldset legend="Eyelet">
					<Checkbox bind:checked={options.eyelet} />
				</Fieldset>
				<Fieldset legend="Wired">
					<Checkbox bind:checked={options.wired} />
				</Fieldset>
			{/if}
		</Form>
	</Card>
	<div class="grid max-h-full flex-grow overflow-auto" style="grid-template-rows:min-content 1fr">
		<Card class="flex-row space-x-2 rounded-none p-2">
			<Tooltip class="z-[2]" position="bottom" tooltip="Import">
				<Button
					class="px-2 py-2"
					disabled={isValid ? undefined : 'disabled'}
					on:click={open}
					variants={['icon']}
				>
					<Icon class="h-4 w-4" src={ClipboardDocumentList} />
				</Button>
			</Tooltip>
			<Tooltip class="z-[2]" position="bottom" tooltip="Upload">
				<Button class="px-2 py-2" disabled={isValid ? undefined : 'disabled'} variants={['icon']}>
					<Icon class="h-4 w-4" src={ArrowUpOnSquare} />
				</Button>
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
						{#each rows as price, index}
							{@const quantity = (index+1)*1000}
							<Tr>
								<Td class="text-right">{format.quantity(quantity)}</Td>
								<Td class="p-0">
									<Input bind:value={price} class="rounded-none text-right" type="number" />
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
