<script lang="ts">
	import { generate } from 'random-words';
	import { Button, Checkbox, Datatable, Div, Modal } from '$lib/components';
	import { Settings } from '@lucide/svelte';

	let columns = $state(
		[
			...['boolean', 'currency', 'number', 'string', 'timestamp'].map((key) => ({
				key,
				type: key
			})),
			{
				key: 'function',
				type: 'function',
				valueFn: () => Math.random()
			},
			{
				key: 'select',
				compareFn: (a: string, b: string, dir: -1 | 1) => {
					const aNumber = Number(a.replace(/\D/g, ''));
					const bNumber = Number(b.replace(/\D/g, ''));
					return (aNumber - bNumber) * dir;
				},
				options: Array(100)
					.fill(0)
					.map((_, i) => ({ label: `Option ${i + 1}`, value: i })),
				type: 'select'
			},
			{
				key: 'multiSelect',
				compareFn: (a: number[], b: number[], dir: -1 | 1) => {
					return (a.length - b.length) * dir;
				},
				options: Array(100)
					.fill(0)
					.map((_, i) => ({ label: `Option ${i + 1}`, value: i })),
				type: 'multiSelect'
			}
		].sort((a, b) => a.key.localeCompare(b.key))
	);
	let isColumnsReorderable = $state(false);
	let isCreatable = $state(false);
	let isDeletable = $state(true);
	let isEditable = $state(false);
	let isExportable = $state(false);
	let isFilterable = $state(false);
	let isPaginateable = $state(false);
	let isSelectable = $state(false);
	let isSortable = $state(false);
	let rows = $state(
		Array(50)
			.fill(0)
			.map((_) => {
				const boolean = Math.random() < 0.5;
				const currency = Math.floor(Math.random() * 500000) / 100;
				const multiSelect = Array(Math.floor(Math.random() * 100))
					.fill(0)
					.map((_) => Math.floor(Math.random() * 100));
				const number = Math.floor(Math.random() * 500000) / 100;
				const select = Math.floor(Math.random() * 100);
				const string = generate();
				const timestamp = new Date(
					new Date(1969, 0, 1).getTime() + Math.random() * new Date().getTime()
				);

				return { boolean, currency, multiSelect, number, select, string, timestamp };
			})
	);
	let settingsModal = $state({
		isOpen: false,
		open: () => (settingsModal.isOpen = true)
	});
</script>

<Div class="flex flex-col items-start space-y-6 overflow-auto p-4">
	<Button onclick={settingsModal.open} variants={['icon']}>
		<Settings />
	</Button>
	<Datatable
		bind:columns
		bind:isColumnsReorderable
		bind:isCreatable
		bind:isDeletable
		bind:isEditable
		bind:isExportable
		bind:isFilterable
		bind:isPaginateable
		bind:isSelectable
		bind:isSortable
		bind:rows
	/>
</Div>

<Modal bind:isOpen={settingsModal.isOpen}>
	<Checkbox bind:checked={isColumnsReorderable} label="isColumnsReorderable" />
	<Checkbox bind:checked={isCreatable} label="isCreatable" />
	<Checkbox bind:checked={isDeletable} label="isDeletable" />
	<Checkbox bind:checked={isEditable} label="isEditable" />
	<Checkbox bind:checked={isExportable} label="isExportable" />
	<Checkbox bind:checked={isFilterable} label="isFilterable" />
	<Checkbox bind:checked={isPaginateable} label="isPaginateable" />
	<Checkbox bind:checked={isSelectable} label="isSelectable" />
	<Checkbox bind:checked={isSortable} label="isSortable" />
</Modal>
