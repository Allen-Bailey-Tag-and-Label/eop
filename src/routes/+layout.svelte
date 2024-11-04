<script lang="ts">
	import { theme } from 'sveltewind';
	import { sveltewind } from 'sveltewind/themes';
	import { Div } from '$lib/components';
	import '../app.css';

	let { children } = $props();

	theme.set(sveltewind);
	theme.updateComponentVariant('a', 'default', 'text-primary-500 hover:text-primary-500');
	theme.updateComponentVariant('card', 'default', 'rounded-[1rem] dark:bg-slate-50/[.025]');
	theme.updateComponentVariant(
		'input',
		'default',
		'border-none bg-slate-950/10 ring-offset-transparent hover:ring-offset-primary-500 focus:ring-offset-primary-500 focus:ring-primary-500/30 dark:bg-slate-50/5'
	);
</script>

<Div class="flex max-h-[100dvh] min-h-[100dvh] flex-col overflow-auto">
	{@render children()}
</Div>
