<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { twMerge } from 'tailwind-merge';
import { Button, Checkbox, Form, Icon, Modal } from '$components';
import { ChevronDown } from '$icons';
import { theme } from '$stores';

// handlers
const buttonClickHandler = () => {
	if (!Array.isArray(value)) value = [];
	values = [...options].map((option) => ({
		checked: value.includes(option.value),
		label: option.label,
		value: option.value
	}));
	open();
};
const submitHandler = (e) => {
	e.preventDefault();
	value = values.filter((modalValue) => modalValue.checked).map((modalValue) => modalValue.value);
	dispatch('change', { value });
	close();
};

// props (external)
export let options: { label: string; value: string }[];
export let readonly: 'readonly' | undefined = undefined;
export let value: string[];

// props (internal)
let close: () => boolean;
const dispatch = createEventDispatcher();
let isOpen: boolean;
let open: () => boolean;
let toggle: () => boolean;
let values: { checked: boolean; label: string; value: any }[] = [];
</script>

<div
	class={twMerge($theme.input, "relative flex min-h-[3rem] w-full items-center pr-16", $$props.class)}
>
	<div class="flex items-center space-x-2">
		{#if Array.isArray(value)}
			{#each value as id}
				<div class="bg-primary-500 rounded-lg px-2 py-1">
					{options.find(option=>option.value === id)?.label}
				</div>
			{/each}
		{/if}
	</div>
	{#if readonly === undefined}
		<Button
			class="hover:ring-primary-500/30 focus:ring-primary-500 absolute left-0 top-0 h-full w-full justify-end rounded-none ring-1 ring-inset ring-transparent"
			on:blur
			on:click={buttonClickHandler}
			on:focus
			on:keydown
			variants={['transparent']}
		>
			<Icon class="h-[1rem] w-[1rem]" src={ChevronDown} />
		</Button>
	{/if}
</div>

<Modal
	bind:close={close}
	bind:isOpen={isOpen}
	bind:open={open}
	bind:toggle={toggle}
	class="p-0 pt-10"
>
	<Form class="flex flex-col space-y-0 overflow-auto" on:submit={submitHandler}>
		<div class="flex flex-col space-y-2 overflow-auto p-6">
			{#each values as modalValue}
				<Checkbox bind:checked={modalValue.checked}>{modalValue.label}</Checkbox>
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-4 p-6 pt-0 lg:flex lg:justify-end lg:gap-2">
			<Button on:click={close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</Form>
</Modal>
