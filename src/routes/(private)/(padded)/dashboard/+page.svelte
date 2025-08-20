<script>
	import { Card, Div, H1 } from '$lib/components';

	let { data } = $props();
</script>

<Div class="flex flex-col items-start space-y-6">
	<H1>Welcome {data.locals.user.profile.firstName}!</H1>
	<Div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card>Test</Card>
	</Div>
</Div>
