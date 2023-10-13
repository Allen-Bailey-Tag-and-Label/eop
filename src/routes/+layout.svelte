<script>
	import { page } from '$app/stores';
	import { Pwa } from '$components';
	import { init } from '$lib/theme';
	import '../app.postcss';

	init();

	$: title = `${$page.url.pathname
		.split('/')
		.filter((_, i) => i > 0)
		.reverse()
		.map((directory) =>
			directory
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		)
		.join(' - ')} - EOP (Employee Online Portal) - Allen-Bailey Tag & Label`;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<Pwa />
<div class="flex flex-col min-h-[100dvh] overflow-auto">
	<slot />
</div>
