<script lang="ts">
import { Header } from '$components';

// props (external)
export let data;
</script>

<div
	class="flex max-h-[100dvh] min-h-[100dvh] flex-col pwa:max-h-[100vh] pwa:min-h-[100vh] lg:flex-row"
>
	<Header data={data} />
	<slot />
</div>
