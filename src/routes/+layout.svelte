<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const title = $derived.by(() => {
		return [
			...page.url.pathname
				.slice(1)
				.split('/')
				.map((route: string) =>
					route
						.split('-')
						.map((string: string) =>
							string === '' ? 'Home' : string[0].toUpperCase() + string.slice(1)
						)
						.join(' ')
				)
				.reverse(),
			'EOP'
		].join(' - ');
	});
</script>

{@render children()}

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
	<link rel="alternate icon" href="/icons/icon-16x16.png" />
	<link rel="apple-touch-icon" href="/icons/icon-apple-touch.png" />
	<link rel="manifest" href="/manifest.json" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover"
	/>
	<meta name="theme-color" content="#09090C" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<title>{title}</title>
</svelte:head>
