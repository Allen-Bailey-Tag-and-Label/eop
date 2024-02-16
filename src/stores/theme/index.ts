import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';

theme.set(sveltewind);

theme.set({
	a: 'transition duration-200 shadow-[inset] decoration-violet-500 underline underline-offset-4 decoration-1 hover:text-violet-500 focus:text-violet-500',
	buttonIcon: 'px-3',
	buttonTransparent: 'bg-transparent hover:bg-transparent focus:bg-transparent shadow-[inset]',
	nav: 'max-h-[100dvh] pwa:max-h-[100vh] min-h-[100dvh] pwa:min-h-[100vh] overflow-y-auto w-[calc(100dvw_-_3rem)] lg:w-auto bg-slate-50 dark:bg-slate-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
	navItem: 'px-6 lg:px-16 py-3 no-underline whitespace-nowrap',
	navItemIsCurrent: 'bg-violet-500 text-white hover:text-white focus:text-white cursor-default',
	modal: 'min-w-0',
	overlay: 'rounded-none hover:bg-black/70 focus:bg-black/70 p-0 h-[100dvh] pwa:h-[100vh]'
});

export { theme };
