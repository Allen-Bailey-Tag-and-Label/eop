<script lang="ts">
	import { Div, H1, P } from '$lib/components';
	import { ThumbsUp } from '@lucide/svelte';
	import Layout from '../+page.svelte';
</script>

<Layout>
	<Div class="flex flex-col items-center space-y-6">
		<ThumbsUp class="text-primary-500" size={80} />
		<H1>Thank You!</H1>
		<P class="text-center">We've received your sign up and will follow up with you.</P>
	</Div>
</Layout>
