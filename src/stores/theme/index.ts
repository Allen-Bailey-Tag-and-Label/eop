import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';

theme.set(sveltewind);

theme.set({
  buttonDelete: 'bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/30',
  buttonTransparent:
    'bg-transparent text-current hover:bg-transparent focus:bg-transparent focus:ring-slate-900/30 dark:focus:ring-white/30',
  buttonSm: 'px-2 py-2 text-[.7295rem]',
  buttonXs: 'px-1 py-1 text-[.5835rem]',
  form: 'space-y-8',
  icon: 'w-[calc(16_*_1.5em_/_14)] h-[calc(16_*1.5em_/_14)]',
  inputGroup: 'space-y-4',
  modalIsClosed: 'pointer-events-none opacity-0 scale-[.97]',
  modalIsOpen: 'pointer-events-auto opacity-100 scale-100',
  nav: 'fixed top-0 right-0 min-h-[100dvh] max-h-[100dvh] overflow-auto transition duration-200 bg-white dark:bg-slate-950 min-w-[calc(100dvw_-_1.5rem)] pb-[3rem] lg:right-auto lg:left-0 lg:pb-0 lg:pl-[3rem] lg:min-w-0',
  responsiveTable: 'p-0 rounded-lg',
  table: 'rounded-lg',
  th: '[&:first-child]:rounded-tl-lg [&:last-child]:rounded-tr-lg',
  tr: 'even:bg-slate-50 dark:even:bg-slate-800 [&:last-child_>_td:first-child]:rounded-bl-lg [&:last-child_>_td:last-child]:rounded-br-lg'
});

theme.set({
  navToggleButton: 'z-[2] relative px-0 py-0 w-[3rem] h-[3rem]'
});
export { theme };
