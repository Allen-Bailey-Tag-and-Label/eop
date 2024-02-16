<script lang="ts">
import { afterNavigate, beforeNavigate } from '$app/navigation';
import { Modal, ProgressIndicator, Pwa, Title } from '$components';
import * as config from '$lib/config';
import { theme } from '$stores';
import '../app.pcss';

// props (internal)
let close: () => boolean;
let isOpen: boolean;
let open: () => boolean;
let toggle: () => boolean;

beforeNavigate(() => {
	open();
});
afterNavigate(() => {
	close();
});
</script>

<svelte:head>
	<meta name="description" content={config.head.description} />
</svelte:head>
<Pwa>
	<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
	<link rel="alternate icon" href="/icons/icon-16x16.png" />
	<link rel="apple-touch-icon" href="/icons/icon-apple-touch.png" />
	<link rel="manifest" href="/manifest.json" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover"
	/>
	<slot name="theme">
		<meta name="theme-color" content={config.pwa.themeColor} />
	</slot>
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</Pwa>
<Title base={config.head.title} />
<slot />
<Modal
	bind:close={close}
	bind:isOpen={isOpen}
	bind:open={open}
	bind:toggle={toggle}
	class="bg-transparent text-violet-500 shadow-[inset] ring-0 dark:bg-transparent dark:shadow-none"
	isCloseable={false}
>
	<ProgressIndicator />
</Modal>
