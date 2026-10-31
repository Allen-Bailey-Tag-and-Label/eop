<script lang="ts">
	import { Button, DialogActions, Div, Modal } from '$lib/components';

	let isOpen = $state(false);
</script>

<Div class="flex flex-col items-start p-4">
	<Button onclick={() => (isOpen = true)}>Show Modal</Button>
</Div>

<Modal title="Dialog" bind:isOpen>
	{isOpen}

	<DialogActions onClose={() => (isOpen = false)} />
</Modal>
