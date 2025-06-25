<script lang="ts">
	import { Datatable, Div } from '$lib/components';
	import { type Column } from '$lib/components/Datatable';

	type Row = {
		boolean: boolean;
		currency: number;
		function: Function;
		number: number;
		object: object;
		string: string;
		symbol: symbol;
		undefined: undefined;
	};
	type Rows = Row[];

	let columns: Column[] = $state([
		{ isEditable: false, key: 'boolean' },
		{ key: 'currency', type: 'currency' },
		'function',
		'number',
		'object',
		'string',
		'symbol',
		'undefined'
	]);
	let rows: Rows = $state(
		Array(Math.floor(Math.random() * 500) + 500)
			.fill(0)
			.map(() => {
				return {
					boolean: Math.floor(Math.random() * 2) === 0,
					currency: parseFloat((Math.random() * 9700 + 300).toFixed(2)),
					function: () => {},
					number: Math.floor(Math.random() * 100),
					object: {},
					string: (Math.random() + 1).toString(36).substring(7),
					symbol: Symbol('foo'),
					undefined: undefined
				};
			})
	);
</script>

<Div class="flex flex-grow flex-col overflow-auto p-6">
	<Datatable bind:columns bind:rows />
</Div>
