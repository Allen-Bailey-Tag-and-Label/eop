import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';

theme.set(sveltewind);

theme.set({
	a: 'transition duration-200 shadow-[inset] decoration-violet-500 underline underline-offset-4 decoration-1 hover:text-violet-500 focus:text-violet-500',
	buttonDelete: 'bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/30',
	buttonIcon: 'aspect-square',
	buttonOutline:
		'bg-transparent hover:bg-transparent focus:bg-transparent text-current ring-offset-1 ring-offset-slate-300 ring-transparent focus:ring-offset-violet-500 hover:ring-offset-violet-500 focus:ring-violet-500/30 dark:ring-offset-white/5 shadow-none',
	buttonSm: 'px-4 py-2',
	buttonTransparent:
		'bg-transparent hover:bg-transparent focus:bg-transparent shadow-[inset] text-current',
	buttonXs: 'px-2 py-1',
	checkbox: 'text-white',
	header: 'z-[1] pwa:order-2 pwa:pb-[env(safe-area-inset-bottom)]',
	nav: 'max-h-[100dvh] pwa:max-h-[100vh] min-h-[100dvh] pwa:min-h-[100vh] overflow-y-auto w-[calc(100dvw_-_3rem)] lg:w-auto bg-slate-50 dark:bg-slate-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
	navItem: 'px-6 lg:px-16 py-3 no-underline whitespace-nowrap',
	navItemIsCurrent: 'bg-violet-500 text-white hover:text-white focus:text-white cursor-default',
	modal: 'min-w-0 transform-none top-auto left-auto relative max-w-none',
	overlay: 'rounded-none hover:bg-black/70 focus:bg-black/70 p-0 h-[100dvh] pwa:h-[100vh]',
	select: 'min-h-[3rem]',
	tr: 'dark:even:bg-white/5 dark:last:border-b-0 even:bg-black/5'
});

export { theme };
