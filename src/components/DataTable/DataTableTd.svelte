<script lang="ts">
import type { DataTableRow } from '$lib/types';
import Boolean from './DataTableTdTypes/Boolean.svelte';
import DateTime from './DataTableTdTypes/DateTime.svelte';
import Float from './DataTableTdTypes/Float.svelte';
import Int from './DataTableTdTypes/Int.svelte';
import ManyToMany from './DataTableTdTypes/ManyToMany.svelte';
import OneToOne from './DataTableTdTypes/OneToOne.svelte';
import String from './DataTableTdTypes/String.svelte';

// handlers
const blurHandler = (e) => {
	// if (e.target.innerHTML !== row[key]) {
	// 	row[key] = e.target.innerHTML;
	// }
};
const focusHandler = (e) => {
	selectRange(e.target);
};
const keydownHandler = (e) => {
	if (keydownMap.has(e.code)) {
		try {
			const tbodyElem = e.target.closest('tbody');
			const trElems = tbodyElem.querySelectorAll('tr');
			const trElem = e.target.closest('tr');
			const inputElemsQuery =
				'button:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), td[contenteditable="true"]:not([tabindex="-1"]), textarea:not([tabindex="-1"])';
			const inputElems = trElem.querySelectorAll(inputElemsQuery);
			const trIndex = [].indexOf.call(trElems, trElem);
			const inputIndex = [].indexOf.call(inputElems, e.target);
			const nextInputElems =
				trElems[trIndex + keydownMap.get(e.code).y].querySelectorAll(inputElemsQuery);
			nextInputElems[inputIndex + keydownMap.get(e.code).x].focus();
		} catch (e) {}
	}
};
// utilities
const selectRange = (target) => {
	const range = document.createRange();
	range.selectNodeContents(target);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
};

// props (external)
export let isEditable: boolean;
export let key: string;
export let row: DataTableRow;
export let type: string;
export let updateHandler: ((id: string, key: string, type: string, value: any) => void) | undefined;

// props (internal)
const keydownMap = new Map([
	[
		'ArrowDown',
		{
			x: 0,
			y: 1
		}
	],
	[
		'ArrowUp',
		{
			x: 0,
			y: -1
		}
	],
	[
		'ArrowLeft',
		{
			x: -1,
			y: 0
		}
	],
	[
		'ArrowRight',
		{
			x: 1,
			y: 0
		}
	]
]);
</script>

{#if type === 'boolean'}
	<Boolean
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
{#if type === 'dateTime'}
	<DateTime
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
{#if type === 'float'}
	<Float
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
{#if type === 'int'}
	<Int
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
{#if type === 'one-to-one'}
	<OneToOne
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
{#if type === 'many-to-many'}
	<ManyToMany
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
{#if type === 'string'}
	<String
		bind:row={row}
		blurHandler={blurHandler}
		focusHandler={focusHandler}
		isEditable={isEditable}
		key={key}
		keydownHandler={keydownHandler}
		updateHandler={updateHandler}
		{...$$restProps}
	/>
{/if}
