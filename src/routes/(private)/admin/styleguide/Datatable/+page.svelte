<script lang="ts">
	import { generate } from 'random-words';
	import { Datatable, Div } from '$lib/components';

	let columns = $state(
		[
			...['boolean', 'currency', 'number', 'string', 'timestamp'].map((key) => ({
				key,
				type: key
			})),
			{
				key: 'select',
				options: Array(100)
					.fill(0)
					.map((_, i) => ({ label: `Option ${i + 1}`, value: i })),
				type: 'select'
			},
			{
				key: 'multiSelect',
				options: Array(100)
					.fill(0)
					.map((_, i) => ({ label: `Option ${i + 1}`, value: i })),
				type: 'multiSelect'
			}
		].sort((a, b) => a.key.localeCompare(b.key))
	);
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
</script>

<Div class="flex flex-col items-start p-4">
	<Datatable bind:columns bind:rows />
</Div>
