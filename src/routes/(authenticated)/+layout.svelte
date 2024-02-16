<script lang="ts">
import { Header } from '$components';

// props (external)
export let data;
</script>

<div
	class="pwa:min-h-[100vh] pwa:max-h-[100vh] flex max-h-[100dvh] min-h-[100dvh] flex-col lg:flex-row"
>
	<Header data={data} />
	<div
		class="flex flex-grow flex-col overflow-auto p-6 pt-[calc(1.5rem_+_env(safe-area-inset-top))]"
	>
		<slot />
	</div>
</div>
