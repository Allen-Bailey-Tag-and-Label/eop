<script lang="ts">
	import { Button, Checkbox, Dialog, Div, Input, Radio, Select, Textarea } from '../index';
	let { oncancel, onclose }: { oncancel?: () => void; onclose?: () => void } = $props();
	let text = $state('Allen-Bailey');
	let checked = $state(false);
	let group = $state('a');
	let selected = $state<string | number>(1);
	let notes = $state('Initial notes');
	let html = $state('<b>Initial</b>');
	let open = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);

	export function values() {
		return { text, checked, group, selected, notes, html, open, button, input };
	}

	export function showDialog() {
		open = true;
	}
</script>

<Button bind:element={button}>Action</Button>
<Input label="Employee" name="employee" bind:value={text} bind:element={input} />
<Checkbox label="Active" bind:checked />
<Radio name="group" value="a" bind:group>A</Radio>
<Radio name="group" value="b" bind:group>B</Radio>
<Select
	label="Branch"
	options={[
		{ label: 'One', value: 1 },
		{ label: 'Two', value: 2 }
	]}
	bind:value={selected}
/>
<Textarea label="Notes" bind:value={notes} />
<Div contenteditable bind:innerHTML={html} data-testid="editor" />
<Dialog bind:open {oncancel} {onclose}><span>Dialog content</span></Dialog>
