<script lang="ts">
	import {
		Card,
		Checkbox,
		Datatable,
		Div,
		Input,
		Label,
		Table,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import Tbody from '$lib/components/Tbody/Tbody.svelte';

	type Holiday = string;
	type Modifier = {
		businessDays: number;
		checked: boolean;
		description: string;
	};
	type ProductType = {
		businessDays: number;
		description: string;
	};

	let { data } = $props();

	const dateToDateString = (date: Date) => {
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	};
	const dateToHumanReadable = (date: Date) => {
		const { format } = new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric'
		});

		return format(date);
	};
	const updateHolidays = async (promise: Promise<{ date: Date }[]>) => {
		const result = await promise;
		holidays = result.map(({ date }) => dateToDateString(new Date(date)));
	};
	const updateModifiers = async (promise: Promise<Omit<Modifier, 'checked'>[]>) => {
		const result = await promise;
		modifiers = result
			.map((modifier) => ({ checked: false, ...modifier }))
			.sort((a, b) => a.description.localeCompare(b.description));
	};
	const updateProductTypes = async (promise: Promise<ProductType[]>) => {
		const result = await promise;
		productTypes = result.sort((a, b) => a.description.localeCompare(b.description));
	};
	const workday = (startDate: Date, days: number): Date => {
		let endDate = new Date(startDate);
		while (days > 0) {
			endDate.setDate(endDate.getDate() + 1);
			days--;
			const endDateString = dateToDateString(endDate);
			const dayOfWeek = endDate.getDay();
			if (dayOfWeek === 0) days++;
			if (dayOfWeek === 6) days++;
			if (holidays.includes(endDateString)) days++;
		}
		return endDate;
	};

	// $state
	let dateString = $state(dateToDateString(new Date()));
	let holidays: Holiday[] = $state([]);
	let initialized = $state(false);
	let modifiers: Modifier[] = $state([]);
	let productTypes: ProductType[] = $state([]);

	// $derives
	const date = $derived.by(() => {
		const [year, month, day] = dateString.split('-').map(Number);
		return new Date(year, month - 1, day);
	});
	const modifierBusinessDays = $derived.by(() =>
		modifiers
			.filter(({ checked }) => checked)
			.reduce((total, modifier) => total + modifier.businessDays, 0)
	);

	// $effects
	$effect(() => {
		if (holidays.length > 0 && modifiers.length > 0 && productTypes.length > 0) initialized = true;
	});
	$effect(() => {
		updateHolidays(data.holidays);
	});
	$effect(() => {
		updateModifiers(data.modifiers);
	});
	$effect(() => {
		updateProductTypes(data.productTypes);
	});
</script>

<Div class="flex flex-col lg:items-start">
	{#if initialized}
		<Div class="flex flex-col space-y-6 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-4">
			<Card class="overflow-hidden p-0 lg:flex">
				<Table class="w-full">
					<Thead>
						<Tr>
							<Th>Modifier</Th>
							<Th>Business Days</Th>
							<Th></Th>
						</Tr>
					</Thead>
					<Tbody>
						{#each modifiers as modifier}
							<Tr>
								<Td>{modifier.description}</Td>
								<Td class="text-right">{modifier.businessDays}</Td>
								<Td class="py-0">
									<Checkbox bind:checked={modifier.checked} />
								</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Card>
			<Card class="overflow-hidden p-0">
				<Table class="w-full">
					<Thead>
						<Tr>
							<Th>Product Type</Th>
							<Th>Business Days</Th>
							<Th class="px-0 py-0">
								As Of:
								<Input
									bind:value={dateString}
									class="rounded-none bg-transparent pl-0 shadow-none dark:bg-transparent dark:shadow-none"
									type="date"
								/>
							</Th>
						</Tr>
					</Thead>
					<Tbody>
						{#each productTypes as productType}
							<Tr>
								<Td>{productType.description}</Td>
								<Td class="text-right">
									{productType.businessDays + modifierBusinessDays}
								</Td>
								<Td class="text-right">
									{dateToHumanReadable(
										workday(date, productType.businessDays + modifierBusinessDays)
									)}
								</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Card>
		</Div>
	{:else}
		Loading...
	{/if}
</Div>
