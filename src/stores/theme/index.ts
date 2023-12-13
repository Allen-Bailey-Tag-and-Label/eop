import { get } from 'svelte/store';
import { theme } from 'sveltewind/stores';
import { sveltewind } from 'sveltewind/themes';
import { twMerge } from 'tailwind-merge';

theme.set(sveltewind);

theme.set({
  buttonDelete: 'bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/30',
  buttonTransparent:
    'bg-transparent text-current hover:bg-transparent focus:bg-transparent focus:ring-slate-900/30 dark:focus:ring-white/30 shadow-[inset]',
  buttonSm: 'px-2 py-2 text-[.7295rem]',
  buttonXs: 'px-1 py-1 text-[.5835rem]',
  form: 'space-y-8',
  header: 'lg:order-1',
  icon: 'w-[calc(16_*_1.5em_/_14)] h-[calc(16_*1.5em_/_14)]',
  inputGroup: 'space-y-4',
  modal: 'min-w-0',
  modalIsClosed: 'pointer-events-none opacity-0 scale-[.97]',
  modalIsOpen: 'pointer-events-auto opacity-100 scale-100',
  nav: 'space-y-8 fixed top-0 right-0 min-h-[100dvh] max-h-[100dvh] overflow-auto transition duration-200 bg-white dark:bg-slate-950 min-w-[calc(100dvw_-_1.5rem)] pb-[3rem] lg:right-auto lg:left-0 lg:pb-0 lg:min-w-[20rem]',
  navGroup: 'flex flex-col',
  navGroupTitle: 'px-4 py-2 uppercase font-semibold lg:pl-[4rem]',
  navItem:
    'pr-4 pl-8 py-2 shadow-[] opacity-50 hover:opacity-100 focus:opacity-100 transition duration-200 lg:pl-[5rem]',
  navItemCurrent:
    'opacity-100 text-white dark:text-white bg-violet-500 hover:text-white focus:text-white cursor-default',
  responsiveTable: 'p-0 rounded-lg overflow-auto',
  select: 'py-3',
  table: 'rounded-lg',
  th: '[&:first-child]:rounded-tl-lg [&:last-child]:rounded-tr-lg bg-slate-50 dark:bg-slate-800',
  tr: 'even:bg-slate-50 dark:even:bg-slate-800 [&:last-child_>_td:first-child]:rounded-bl-lg [&:last-child_>_td:last-child]:rounded-br-lg'
});

const state = get(theme);

theme.set({
  chip: twMerge(state.button, state.buttonSm, 'px-4 py-[.375rem]'),
  chipInput: twMerge(
    state.input,
    'min-h-[3rem] space-y-0 py-[.375rem] px-[.375rem] flex flex-row space-x-[.375rem] items-center'
  ),
  navToggleButton: 'z-[2] relative px-0 py-0 w-[3rem] h-[3rem]'
});
export { theme };
