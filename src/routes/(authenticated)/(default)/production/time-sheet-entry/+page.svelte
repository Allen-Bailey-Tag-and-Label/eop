<script lang="ts">
import { DateTime } from 'luxon';
import { twMerge } from 'tailwind-merge';
import { deserialize } from '$app/forms';
import {
	Button,
	Fieldset,
	Form,
	Icon,
	Input,
	Select,
	Table,
	Tbody,
	Td,
	Th,
	Thead,
	Tr
} from '$components';
import { Check, XMark } from '$icons';

// utilities
const clearTimeSheet = () => {
	ennisId = '';
	entries = [];
};
const findEntries = async (e: CustomEvent) => {
	e.preventDefault();
	const formData = new FormData();
	formData.append('date', date);
	formData.append('ennisId', ennisId);
	const response = await fetch('?/find', {
		method: 'POST',
		body: formData
	});
	const result: any = deserialize(await response.text());
	entries = result.data;
};
const getSequenceOptions = (workOrder: string) =>
	workOrder === '6755818'
		? indirectCodeOptions
		: [
				{ label: '- Choose Operation Sequence', value: 0 },
				...data.workOrderRoutings
					.filter((workOrderRouting: any) => workOrderRouting.workOrder === +workOrder)
					.map((workOrderRouting: any) => ({
						label: `${workOrderRouting.sequence} - ${workOrderRouting.description}`,
						value: workOrderRouting.sequence
					}))
			].sort((a: any, b: any) => a.label.localeCompare(b.label));
const updateTimeSheet = async (e: CustomEvent) => {
	e.preventDefault();
	const formData = new FormData();
	formData.append('date', date);
	formData.append('ennisId', ennisId);
	formData.append('entries', JSON.stringify(entries));
	await fetch('?/update', {
		method: 'POST',
		body: formData
	});
};

// props (external)
export let data;

// props (internal)
let date = DateTime.now().toFormat('yyyy-MM-dd');
let ennisId = '';
let entries: any[] = [];
const statusOptions = [
	{ label: '20 - Partial', value: 20 },
	{ label: '95 - Complete', value: 95 }
];

// props (reactive)
$: userProfile = data.userProfiles.find((userProfile: any) => userProfile.ennisId === +ennisId);
$: ennisIdIsValid = ennisId !== '' && userProfile !== undefined;
$: indirectCodeOptions = [
	{ label: ' - Choose Indirect Code', value: 0 },
	...[
		{ code: '009', description: 'Maintainance' },
		{ code: '010', description: 'Training' },
		{ code: '305', description: 'Material Handling' },
		{ code: '407', description: 'Waiting for Stock' },
		{ code: '409', description: 'Waiting for Plates' },
		{ code: '700', description: 'Specification Questions' },
		{ code: '900', description: 'Miscellaneous' }
	].map(({ code, description }) => ({ label: `${code} - ${description}`, value: code }))
];
</script>

<div class="flex flex-grow flex-col space-y-4">
	<Form
		class="flex flex-row items-end space-x-4"
		on:submit={entries.length === 0 ? findEntries : clearTimeSheet}
	>
		{#if entries.length == 0}
			<Fieldset legend="Date">
				<Input bind:value={date} name="date" required="required" type="date" />
			</Fieldset>
			<Fieldset class="items-start" legend="Ennis ID">
				<div class="flex items-center space-x-2">
					<Input
						bind:value={ennisId}
						class="w-[8rem] text-right"
						name="ennisId"
						required="required"
						type="number"
					/>
					{#if ennisId !== ''}
						{#if ennisIdIsValid}
							<Icon class="text-green-500" src={Check} />
							<div>{userProfile?.firstName} {userProfile?.lastName}</div>
						{:else}
							<Icon class="text-red-500" src={XMark} />
						{/if}
					{/if}
				</div>
			</Fieldset>
			<Button disabled={ennisIdIsValid ? undefined:'disabled'} on:click={findEntries} type="button">
				Search
			</Button>
		{:else}
			<Fieldset legend="Date">
				<div class="flex min-h-[3rem] w-[11.5625rem] items-center">
					{DateTime.fromFormat(date, 'yyyy-MM-dd').toFormat('M/d/yyyy')}
				</div>
			</Fieldset>
			<Fieldset legend="Ennis ID">
				<div class="flex items-center space-x-2">
					<div class="flex min-h-[3rem] w-[8rem] items-center text-right">
						{ennisId}
					</div>
					<div class="flex min-h-[3rem] items-center">
						{userProfile?.firstName}
						{userProfile?.lastName}
					</div>
				</div>
			</Fieldset>
			<Button on:click={clearTimeSheet} type="button">Close</Button>
		{/if}
	</Form>
	{#if entries.length > 0}
		<Table>
			<Thead>
				<Th class="flex flex-col items-center py-1">
					<div>Work Order #</div>
					<div class="text-xs">Indirect #6755818</div>
				</Th>
				<Th class="w-full">Operation Sequence</Th>
				<Th>Start</Th>
				<Th>End</Th>
				<Th class="flex flex-col items-center space-y-[.0rem] py-1 pb-[.4375rem] text-xs">
					<div>Amount</div>
					<div>Completed</div>
				</Th>
				<Th>Status</Th>
			</Thead>
			<Tbody>
				{#each entries as entry}
					<Tr>
						<Td class="p-0">
							<Input
								bind:value={entry.workOrder}
								class={twMerge("w-[10rem] rounded-none text-right")}
								inputmode="numeric"
								on:change={updateTimeSheet}
								pattern="[0-9]*"
								type="text"
							/>
						</Td>
						<Td class="p-0">
							<Select
								bind:value={entry.sequence}
								class="w-full rounded-none"
								on:change={updateTimeSheet}
								options={getSequenceOptions(entry.workOrder)}
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={entry.start}
								class={twMerge("rounded-none")}
								on:change={updateTimeSheet}
								type="time"
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={entry.end}
								class={twMerge("rounded-none")}
								on:change={updateTimeSheet}
								type="time"
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={entry.completed}
								class={twMerge("w-[10rem] rounded-none text-right")}
								inputmode="numeric"
								on:change={updateTimeSheet}
								type="number"
							/>
						</Td>
						<Td class="p-0">
							<Select
								bind:value={entry.status}
								class={twMerge("rounded-none")}
								on:change={updateTimeSheet}
								options={statusOptions}
							/>
						</Td>
					</Tr>
				{/each}
			</Tbody>
		</Table>
	{/if}
</div>
