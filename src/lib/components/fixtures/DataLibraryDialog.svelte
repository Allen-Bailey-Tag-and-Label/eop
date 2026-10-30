<script lang="ts">
	import { Modal } from '../index';
	import DataLibrary from '$lib/data/DataLibrary.svelte';
	import type { ComponentProps } from 'svelte';
	let props: ComponentProps<typeof DataLibrary> = $props();
</script>

<Modal isOpen={true} role="dialog" aria-label="Data links"><DataLibrary {...props} /></Modal>
