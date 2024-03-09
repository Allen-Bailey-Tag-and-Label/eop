<script lang="ts">
import { Button, Card, Icon, Select, Tooltip } from '$components';
import { ChevronDoubleLeft, ChevronLeft } from '$icons';
import type { DataTableRow } from '$lib/types';

// handlers
const firstClickHandler = () => {
	currentPage = 0;
};
const lastClickHandler = () => {
	currentPage = totalPages - 1;
};
const nextClickHandler = () => {
	currentPage = currentPage + 1;
};
const previousClickHandler = () => {
	currentPage = currentPage - 1;
};

// props (external)
export let currentPage: number;
export let rows: DataTableRow[];
export let rowsPerPage: number;

// props (reactive)
$: totalPages = Math.ceil(rows.length / rowsPerPage);
$: if (currentPage > totalPages - 1) currentPage = totalPages - 1;
$: pageOptions = [...Array(totalPages)].map((_, i) => {
	const startRow = i * rowsPerPage + 1;
	const endRow = Math.min(rows.length, (i + 1) * rowsPerPage);
	return { label: `${startRow} - ${endRow}`, value: i };
});
</script>

<Card class="flex-row items-center justify-center rounded-none px-6 py-2 lg:justify-end">
	<div class="flex flex-grow items-center justify-between space-x-2 lg:flex-grow-0">
		<Tooltip tooltip="First">
			<Button
				class="px-2 py-2 lg:flex"
				disabled={currentPage <= 0 ? 'disabled' : undefined}
				on:click={firstClickHandler}
				variants={['icon', 'xs']}
			>
				<Icon class="h-4 w-4" src={ChevronDoubleLeft} />
			</Button>
		</Tooltip>
		<Tooltip tooltip="Previous">
			<Button
				class="px-2 py-2"
				disabled={currentPage <= 0 ? 'disabled' : undefined}
				on:click={previousClickHandler}
				variants={['icon', 'xs']}
			>
				<Icon class="h-4 w-4" src={ChevronLeft} />
			</Button>
		</Tooltip>
		<div class="flex flex-grow justify-center">
			<Select bind:value={currentPage} class="min-h-[2rem] px-4 text-right" options={pageOptions} />
		</div>
		<Tooltip tooltip="Next">
			<Button
				class="px-2 py-2"
				disabled={currentPage >=pageOptions.length-1 ? 'disabled' : undefined}
				on:click={nextClickHandler}
				variants={['icon', 'xs']}
			>
				<Icon class="h-4 w-4 rotate-180" src={ChevronLeft} />
			</Button>
		</Tooltip>
		<Tooltip tooltip="Last">
			<Button
				class="px-2 py-2"
				disabled={currentPage >=pageOptions.length-1 ? 'disabled' : undefined}
				on:click={lastClickHandler}
				variants={['icon', 'xs']}
			>
				<Icon class="h-4 w-4 rotate-180" src={ChevronDoubleLeft} />
			</Button>
		</Tooltip>
	</div>
</Card>
