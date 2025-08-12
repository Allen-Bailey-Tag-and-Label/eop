<script lang="ts">
	import { Button, Div, Modal } from '$lib/components';

	let isOpen = $state(false);
</script>

<Div class="flex flex-col items-start p-4">
	<Button onclick={() => (isOpen = true)}>Show Modal</Button>
</Div>

<Modal bind:isOpen>
	{isOpen}
</Modal>
