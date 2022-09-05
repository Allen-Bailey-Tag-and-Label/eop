import { twMerge } from 'tailwind-merge';

const inputRounded = 'rounded-[.5rem]';

const common = {
  button: `bg-primary-500 hover:bg-primary-600 focus:bg-primary-600 focus:ring-primary-500/[.3] uppercase ${inputRounded}`,
  gradientBG: 'bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
};

export default {
  a: 'before:hover:rounded-[.5rem] before:bg-primary-500 hover:before:bg-primary-600 focus:before:bg-primary-600 focus:before:ring-primary-500/[.3] hover:text-white focus:text-white',
  button: common.button,
  buttonDelete: twMerge(
    common.button,
    'bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/[.3]'
  ),
  buttonIcon: twMerge(common.button, 'px-[.5rem]'),
  buttonSecondary: twMerge(
    common.button,
    'bg-gray-900 hover:bg-gray-700 focus:bg-gray-700 focus:ring-gray-900/[.3] dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus:bg-gray-300 dark:focus:ring-gray-100/[.3]'
  ),
  buttonTransparent: 'text-current bg-transparent hover:bg-transparent focus:bg-transparent',
  card: `${inputRounded} ${common.gradientBG}`,
  checkbox: `bg-transparent focus:ring-primary-500/[.3] focus:ring-offset-primary-500 hover:ring-offset-primary-500 peer-focus:ring-primary-500/[.3] peer-focus:ring-offset-primary-500 dark:ring-offset-white/[.2] mr-0 text-white ${inputRounded}`,
  checkboxChecked:
    'bg-primary-500 dark:bg-primary-500 focus:ring-primary-500/[.3] focus:ring-offset-primary-500 hover:ring-offset-primary-500 peer-focus:ring-primary-500/[.3] peer-focus:ring-offset-primary-500',
  form: 'w-full max-w-[375px] space-y-[2rem]',
  header: 'z-[1] bg-white dark:bg-black/[.2] items-end lg:items-start',
  input: `${inputRounded} peer px-[1rem] hover:ring-offset-primary-500 focus:ring-offset-primary-500 focus:ring-primary-500/[.3] bg-transparent dark:bg-transparent`,
  inputTd: 'rounded-none w-full',
  legend: 'text-[.75rem] opacity-[.5] peer-focus:opacity-[1]',
  modal: `${inputRounded} max-w-[min(375px,_calc(100vw_-_1rem))] ml-0 z-[2] w-auto h-auto top-auto bottom-[max(2rem,_env(safe-area-inset-bottom))] left-1/2 transform -translate-x-1/2 ${common.gradientBG} w-full pt-[max(1.5rem,_env(safe-area-inset-top))] pr-[max(1.5rem,_env(safe-area-inset-right))] pl-[max(1.5rem,_env(safe-area-inset-left))] pb-[max(1.5rem,_env(safe-area-inset-bottom))] lg:bottom-auto lg:top-1/2 lg:translate-y-[-50%] lg:w-auto`,
  nav: `space-y-[2rem] z-[2] transition duration-200 transform fixed top-0 right-0 w-[calc(100%_-_4rem)] h-screen max-h-screen overflow-y-auto items-stretch pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${common.gradientBG} lg:right-auto lg:left-0 lg:top-0 lg:w-auto lg:pl-[3rem]`,
  navA: 'before:hidden px-[2rem] py-[1rem] hover:bg-black/[.05] focus:bg-black/[.05] hover:text-current focus:text-current dark:hover:bg-white/[.1] dark:focus:bg-white/[.1] transition duration-200',
  navACurrent:
    'cursor-default bg-blue-500 text-white dark:bg-blue-500 hover:bg-blue-500 focus:bg-blue-500 dark:hover:bg-blue-500 dark:focus:bg-blue-500',
  navGroupContainer: 'flex flex-col w-full',
  navGroupTitle: 'uppercase py-[1rem] px-[2rem]',
  overlay: 'z-[2] transition duration-200',
  table: 'bg-black/[.05] dark:bg-black/[.1] w-full',
  td: 'transition duration-200 outline-none ring-1 ring-transparent focus:ring-primary-500',
  titleBar:
    'min-h-[calc(40px_+_env(safe-area-inset-top)_+_2rem)] flex justify-between pt-[calc(env(safe-area-inset-top))] ring-1 ring-black/[.1] dark:ring-white/[.05] bg-white dark:bg-black/[.2] px-[2rem]',
  th: 'bg-white dark:bg-gray-950 sticky top-0 border-b-0 shadow-[inset_0px_-1px_0px_rgba(0,0,0,_.3),_inset_0px_1px_0px_rgba(0,0,0,.03)] dark:shadow-[inset_0px_-1px_0px_rgba(255,255,255,_.3),_inset_0px_1px_0px_rgba(255,255,255,.05)] z-[1]',
  tr: 'transition duration-200 odd:bg-gray-100 even:bg-gray-50 hover:bg-white/[.1] dark:odd:bg-black/[.4] dark:even:bg-black/[.2] dark:hover:bg-white/[.05]'
};
