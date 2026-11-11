<script lang="ts">
	import SharedFormSections from '$lib/ups/FormSections.svelte';
	import type { ComponentProps } from 'svelte';
	type SharedProps = ComponentProps<typeof SharedFormSections>;
	type Props = Omit<SharedProps, 'formData'> & { formData: NonNullable<SharedProps['formData']> };
	let { formData = $bindable(), ...props }: Props = $props();
</script>

<SharedFormSections {...props} bind:formData />
