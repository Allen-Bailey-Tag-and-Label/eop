<script lang="ts">
	import { theme } from 'sveltewind';
	import { sveltewind } from 'sveltewind/themes';
	import { Div, Title } from '$lib/components';
	import '../app.css';

	let { children } = $props();

	theme.set(sveltewind);
	theme.updateComponentVariant(
		'a',
		'default',
		'text-primary-500 hover:text-primary-500 focus:shadow-[0_2px_0px_0px_var(--tw-shadow-color)]'
	);
	theme.setComponentVariant('button', 'icon', 'py-6');
	theme.setComponentVariant(
		'button',
		'ghost',
		'bg-transparent hover:bg-slate-950/10 focus:bg-slate-950/10 dark:hover:bg-slate-50/5 dark:focus:bg-slate-50/5'
	);
	theme.updateComponentVariant('card', 'default', 'rounded-[1rem] dark:bg-slate-800');
	theme.updateComponentVariant(
		'input',
		'default',
		'border-none bg-slate-950/10 ring-offset-transparent hover:ring-offset-primary-500 focus:ring-offset-primary-500 focus:ring-primary-500/30 dark:bg-slate-50/5'
	);
</script>

<Title base="EOP" />
<Div class="flex max-h-[100dvh] min-h-[100dvh] flex-col overflow-auto">
	{@render children()}
</Div>
