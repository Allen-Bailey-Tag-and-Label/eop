import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';

theme.set(sveltewind);

theme.set({
  buttonIcon: 'px-0 py-0 h-[3rem] w-[3rem]',
  buttonTransparent:
    'bg-transparent text-current hover:bg-transparent focus:bg-transparent focus:ring-slate-900/30 dark:focus:ring-white/30',
  form: 'space-y-8',
  inputGroup: 'space-y-4',
  nav: 'fixed top-0 right-0 min-h-[100dvh] max-h-[100dvh] overflow-auto transition duration-200 bg-white dark:bg-slate-950 min-w-[calc(100dvw_-_1.5rem)] pb-[3rem] lg:right-auto lg:left-0 lg:pb-0 lg:pl-[3rem] lg:min-w-0'
});

theme.set({
  navToggleButton: 'z-[2] relative'
});
export { theme };
