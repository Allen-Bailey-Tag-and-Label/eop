<script lang="ts">
import { DateTime } from 'luxon';
import { twMerge } from 'tailwind-merge';
import { enhance } from '$app/forms';
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
import { format } from '$lib';

// utilities
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
const updateEntryTotal = (entryIndex: number) =>
	(entries[entryIndex].total = format.hours(
		DateTime.fromFormat(entries[entryIndex].end, 'hh:mm')
			.diff(DateTime.fromFormat(entries[entryIndex].start, 'hh:mm'), 'hours')
			.toObject().hours
	));

// props (external)
export let data;

// props (internal)
let date = DateTime.now().toFormat('yyyy-MM-dd');
let ennisId = '';
let entries = [...Array(10)].map((_, i) => ({
	workOrder: '',
	sequence: 0,
	start: '',
	end: '',
	total: '0.0',
	completed: '',
	status: 20
}));
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

<Form class="" use={[enhance]}>
	<div class="flex space-x-4">
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
	</div>
	{#if ennisIdIsValid}
		<Table>
			<Thead>
				<Th class="flex flex-col items-center py-1">
					<div>Work Order #</div>
					<div class="text-xs">Indirect #6755818</div>
				</Th>
				<Th class="w-full">Operation Sequence</Th>
				<Th>Start</Th>
				<Th>End</Th>
				<!-- <Th>Total</Th> -->
				<Th class="flex flex-col items-center space-y-[.0rem] py-1 pb-[.4375rem] text-xs">
					<div>Amount</div>
					<div>Completed</div>
				</Th>
				<Th>Status</Th>
			</Thead>
			<Tbody>
				{#each entries as entry, entryIndex}
					<Tr>
						<Td class="p-0">
							<Input
								bind:value={entry.workOrder}
								class={twMerge("w-[10rem] rounded-none text-right")}
								name="workOrder"
								pattern="[0-9]*"
								type="number"
							/>
						</Td>
						<Td class="p-0">
							<Select
								bind:value={entry.sequence}
								class="w-full rounded-none"
								name="sequence"
								options={getSequenceOptions(entry.workOrder)}
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={entry.start}
								class={twMerge("rounded-none")}
								name="start"
								on:change={() => updateEntryTotal(entryIndex)}
								type="time"
							/>
						</Td>
						<Td class="p-0">
							<Input
								bind:value={entry.end}
								class={twMerge("rounded-none")}
								name="end"
								on:change={() => updateEntryTotal(entryIndex)}
								type="time"
							/>
						</Td>
						<!-- <Td>
							{entry.total}
						</Td> -->
						<Td class="p-0">
							<Input
								bind:value={entry.completed}
								class={twMerge("w-[10rem] rounded-none text-right")}
								name="completed"
								type="number"
							/>
						</Td>
						<Td class="p-0">
							<Select
								bind:value={entry.status}
								class={twMerge("rounded-none")}
								name="status"
								options={statusOptions}
							/>
						</Td>
					</Tr>
				{/each}
			</Tbody>
		</Table>
		<Button class="self-end" style="align-self: flex-end;" type="submit">Submit</Button>
	{/if}
</Form>
