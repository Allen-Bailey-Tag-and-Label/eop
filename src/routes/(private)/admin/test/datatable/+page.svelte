<script lang="ts">
	import { Datatable, Div } from '$lib/components';

	let columns = $state([
		{ key: 'bigint', type: 'bigint' },
		{ key: 'boolean', type: 'boolean' },
		{ key: 'currency', type: 'currency' },
		{ key: 'function', type: 'function' },
		{ key: 'number', type: 'number' },
		{ key: 'object', type: 'object' },
		{
			key: 'select',
			options: [
				...Array(3)
					.fill(0)
					.map((_, i) => `Option ${i + 1}`)
			].map((label, value) => ({ label, value })),
			type: 'select'
		},
		{ key: 'string', type: 'string' },
		{ key: 'symbol', type: 'symbol' },
		{ key: 'timestamp', type: 'timestamp' },
		{ key: 'undefined', type: 'undefined' }
	]);
	const initRows = () => {
		const numberOfRows = Math.floor(Math.random() * 100) + 50;
		const rows = Array(numberOfRows)
			.fill(0)
			.map((_) => {
				const row: {
					bigint?: bigint;
					boolean?: boolean;
					currency?: number;
					func?: Function;
					number?: number;
					object?: {};
					select?: number;
					string?: string;
					symbol?: symbol;
					timestamp?: Date;
				} = {};

				const bigint = BigInt(0);
				const boolean = Math.random() < 0.5;
				const currency = parseFloat((Math.random() * 10000 + 5000).toFixed(2));
				const func = () => {};
				const number = Math.floor(Math.random() * 1000000) + 500000;
				const object = {};
				const select = Math.floor(Math.random() * 3);
				const string = (Math.random() + 1).toString(36).substring(7);
				const symbol = Symbol();
				const timestamp = new Date();

				if (Math.random() < 0.5) row.bigint = bigint;
				if (Math.random() < 0.5) row.boolean = boolean;
				if (Math.random() < 0.5) row.currency = currency;
				if (Math.random() < 0.5) row.func = func;
				if (Math.random() < 0.5) row.number = number;
				if (Math.random() < 0.5) row.object = object;
				if (Math.random() < 0.5) row.select = select;
				if (Math.random() < 0.5) row.string = string;
				if (Math.random() < 0.5) row.symbol = symbol;
				if (Math.random() < 0.5) row.timestamp = timestamp;

				return row;
			});

		return rows;
	};
	let rows = $state(initRows());
</script>

<Div class="flex flex-col p-4">
	<Datatable bind:columns bind:rows />
</Div>
