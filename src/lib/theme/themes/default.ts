import { twMerge } from 'tailwind-merge';
import { type Theme } from '../types';

const glassDark =
	'dark:bg-white/[.025] dark:shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,.1),_inset_0px_-1px_0px_0px_rgba(0,0,0,.3),_0_1.25rem_1.5625rem_-0.3125rem_rgba(0,0,0,.3),_0_.5rem_.625rem_-.375rem_rgba(0,0,0,.3)]';
const glassGreen = 'bg-green-500/90 dark:bg-green-500/70';
const glassLight =
	'bg-white/[.5] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,.7),_inset_0px_-1px_0px_0px_rgba(0,0,0,.3),_0_1.25rem_1.5625rem_-0.3125rem_rgba(0,0,0,.1),_0_.5rem_.625rem_-.375rem_rgba(0,0,0,.1)]';
const glassPrimary = 'bg-primary-500/90 dark:bg-primary-500/70';
const glassRed = 'bg-red-500/90 dark:bg-red-500/70';
const glassSecondary = 'bg-secondary-500/90 dark:bg-secondary-500/70';
const glass = twMerge('backdrop-blur-lg text-current', glassDark, glassLight);
const InputDefault = twMerge(
	glass,
	'appearance-none cursor-pointer transition duration-200 px-6 py-3 rounded-lg outline-2 outline-transparent hover:outline-gray-950 focus::outline-gray-950 dark:hover:outline-white dark:focus:outline-white'
);

export const defaultTheme: Theme = {
	A: {
		default:
			'text-primary-500 font-semibold decoration-2 hover:underline outline-hidden focus:underline'
	},
	Button: {
		default: twMerge(
			glass,
			glassPrimary,
			'cursor-pointer whitespace-nowrap flex justify-center px-6 py-3 text-white transition duration-200 rounded-lg outline-2 outline-primary-500/0 hover:outline-gray-950 focus:outline-gray-950 dark:hover:outline-white dark:focus:outline-white'
		),
		disabled: 'opacity-50 outline-none',
		error: twMerge(glassRed, ''),
		icon: 'aspect-square w-12 items-center justify-center p-0',
		ghost: twMerge('bg-transparent dark:bg-transparent shadow-none dark:shadow-none text-current'),
		glass: twMerge(glass, ''),
		secondary: twMerge(glassSecondary, ''),
		small: 'px-4 py-2',
		square: 'rounded-none',
		success: twMerge(glassGreen, ''),
		xSmall: 'px-2 py-1'
	},
	Card: {
		default: twMerge(glass, 'p-6 rounded-xl')
	},
	Checkbox: {
		default: twMerge(
			InputDefault,
			'my-3 flex h-6 w-6 px-0 py-0 items-center justify-center peer-checked:bg-primary-500/90 dark:peer-checked:bg-primary-500/70 backdrop-blur-none outline-2 outline-transparent peer-focus:outline-gray-950 dark:peer-focus:outline-white'
		)
	},
	Datatable: { default: '' },
	Dialog: {
		default:
			'max-w-screen bg-transparent h-full max-h-screen w-full bg-transparent text-current transition duration-200 backdrop-blur-md backdrop:bg-transparent px-4'
	},
	Div: { default: '' },
	Em: { default: '' },
	Form: { default: 'w-full max-w-sm space-y-12' },
	H1: { default: 'block text-3xl font-bold text-gray-800 dark:text-white' },
	H2: { default: 'block text-2xl font-bold text-gray-800 dark:text-white' },
	Header: {
		default:
			'dark:bg-gray-900 outline-1 outline-gray-200 dark:outline-gray-700 bg-gray-50 pb-[env(safe-area-inset-bottom)] lg:pb-0 lg:pt-[env(safe-area-inset-top)]'
	},
	Hr: { default: '' },
	Input: {
		default: twMerge(InputDefault),
		readonly:
			'bg-transparent dark:bg-transparent shadow-none dark:shadow-none backdrop-blur-none outline-0 cursor-default'
	},
	Label: { default: 'text-sm' },
	Li: { default: '' },
	MarkdownToken: { default: '' },
	Modal: { default: 'max-w-full max-h-full overflow-auto' },
	MongooseTable: { default: '' },
	MultiSelect: {
		default: twMerge(
			InputDefault,
			' flex w-full justify-between space-x-2 focus:outline-primary-500 dark:focus:outline-primary-500 text-current'
		),
		isOpen: 'rounded-b-none'
	},
	Ol: { default: 'list-decimal pl-4' },
	Option: { default: 'bg-gray-100 dark:bg-gray-800 text-current' },
	P: { default: '' },
	Post: { default: '' },
	Radio: {
		box: twMerge(InputDefault, 'has-checked:bg-primary-500/10 has-checked:outline-primary-500'),
		default: twMerge('flex w-full items-center space-x-2')
	},
	RangeInput: {
		default: twMerge(
			InputDefault,
			'py-5',
			'[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:block [&::-webkit-slider-thumb]:rounded-full',
			'[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-white/[.5] dark:[&::-webkit-slider-runnable-track]:bg-white/[.025] [&::-webkit-slider-runnable-track]:rounded-full'
		)
	},
	Select: { default: twMerge(InputDefault, '') },
	Slider: { default: 'relative flex flex-col space-y-6 items-center' },
	Spinner: { default: 'w-6 h-6' },
	Strong: { default: '' },
	SubmitButton: { default: '' },
	Table: { default: '' },
	Tbody: { default: '' },
	Td: { default: 'px-6 py-3' },
	Textarea: { default: twMerge(InputDefault, 'cursor-text') },
	Th: { default: 'uppercase px-6 py-3' },
	Thead: {
		default: 'dark:bg-gray-800 bg-gray-200'
	},
	Tr: {
		default:
			'even:bg-white/[.5] even:dark:bg-white/[.025] hover:bg-primary-500/10 transition duration-200 even:hover:bg-primary-500/10'
	},
	Ul: {
		default: 'list-disc pl-4'
	}
};
