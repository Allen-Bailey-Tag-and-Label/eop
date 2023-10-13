<script>
	import { Card } from '$components';
</script>

<div class="flex flex-col flex-grow min-h-[100dvh] overflow-auto">
	<Card class="flex-grow overflow-auto justify-center">
		<slot />
	</Card>
</div>
