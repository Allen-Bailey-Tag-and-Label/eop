<script lang="ts">
	import { theme } from 'sveltewind';
	import { sveltewind } from 'sveltewind/themes';
	import { Div, Pwa, Title } from '$lib/components';
	import type { Snippet } from 'svelte';
	import type { LayoutServerData } from './$types.js';
	import '../app.css';

	type Props = {
		children: Snippet;
		data: LayoutServerData;
	};

	let { children, data }: Props = $props();

	theme.set(sveltewind);
	theme.updateComponentVariant(
		'a',
		'default',
		'text-primary-500 hover:text-primary-500 focus:shadow-[0_2px_0px_0px_var(--tw-shadow-color)]'
	);
	theme.setComponentVariant(
		'button',
		'contrast',
		'bg-slate-900 hover:bg-slate-950 focus:bg-slate-950 focus:ring-slate-900/30 text-slate-50 dark:bg-slate-50 dark:hover:bg-slate-100 dark:focus:bg-slate-100 dark:focus:ring-slate-50/30 dark:text-slate-950'
	);
	theme.updateComponentVariant('button', 'default', 'disabled:opacity-50 disabled:bg-primary-500');
	theme.setComponentVariant(
		'button',
		'error',
		'bg-red-500 focus:bg-red-600 hover:bg-red-600 focus:ring-red-500/30 disabled:bg-red-500'
	);
	theme.setComponentVariant('button', 'icon', 'p-3 aspect-[1_/_1]');
	theme.setComponentVariant(
		'button',
		'ghost',
		'bg-transparent hover:bg-slate-950/10 focus:bg-slate-950/10 dark:hover:bg-slate-50/5 dark:focus:bg-slate-50/5 text-current dark:shadow-none'
	);
	theme.setComponentVariant(
		'button',
		'success',
		'bg-green-500 focus:bg-green-600 hover:bg-green-600 focus:ring-green-500/30 disabled:bg-green-500'
	);
	theme.updateComponentVariant('card', 'default', 'rounded-[1rem] dark:bg-slate-800');
	theme.updateComponentVariant('checkbox', 'default', 'text-white');
	theme.updateComponentVariant('checkbox', 'checked', 'text-white');
	theme.updateComponentVariant(
		'input',
		'default',
		'border-none bg-slate-950/5 ring-offset-transparent dark:ring-offset-transparent hover:ring-offset-primary-500 focus:ring-offset-1 focus:ring-offset-primary-500 focus:ring-primary-500/30 dark:bg-slate-50/[.025] focus:ring'
	);
	theme.updateComponentVariant(
		'input',
		'error',
		'ring-offset-red-500 dark:ring-offset-red-500 hover:ring-offset-red-500 focus:ring-offset-red-500 dark:hover:ring-offset-red-500 dark:focus:ring-offset-red-500 focus:ring-red-500/30 dark:focus:ring-red-500/30'
	);
	theme.updateComponentVariant(
		'select',
		'default',
		'pr-8 border-none bg-slate-950/5 ring-offset-transparent dark:ring-offset-transparent hover:ring-offset-primary-500 focus:ring-offset-1 focus:ring-offset-primary-500 focus:ring-primary-500/30 dark:bg-slate-50/[.025] focus:ring'
	);
	theme.updateComponentVariant('table', 'default', 'bg-transparent dark:bg-transparent');
	theme.updateComponentVariant('tr', 'default', 'even:bg-slate-50 dark:even:bg-slate-900');
</script>

<Pwa>
	<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
	<link rel="alternate icon" href="/icons/icon-16x16.png" />
	<link rel="apple-touch-icon" href="/icons/icon-apple-touch.png" />
	<link rel="manifest" href="/manifest.json" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover"
	/>
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</Pwa>
<Title base="EOP" />
<Div class="flex max-h-[100dvh] min-h-[100dvh] flex-col overflow-auto">
	{@render children(data)}
</Div>
