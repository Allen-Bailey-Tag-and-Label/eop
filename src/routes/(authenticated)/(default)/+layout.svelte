<script lang="ts">
// props (external)
export let data;
</script>

<div class="flex flex-grow flex-col overflow-auto p-6 pt-[calc(1.5rem_+_env(safe-area-inset-top))]">
	<slot />
</div>
