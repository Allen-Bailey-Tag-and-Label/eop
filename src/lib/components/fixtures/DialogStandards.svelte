<script lang="ts">
	import { Button, DialogActions, Modal, P } from '../index';
	let parentOpen = $state(true);
	let confirmationOpen = $state(false);
</script>

<Modal bind:isOpen={parentOpen} title="Parent dialog">
	<Button onclick={() => (confirmationOpen = true)}>Open confirmation</Button>
	<DialogActions onClose={() => (parentOpen = false)} closeLabel="Done" />
	{#if confirmationOpen}
		<Modal bind:isOpen={confirmationOpen} title="Confirmation">
			<P>Review this action.</P>
			<DialogActions onClose={() => (confirmationOpen = false)} closeLabel="Cancel">
				<Button>Confirm</Button>
			</DialogActions>
		</Modal>
	{/if}
</Modal>
