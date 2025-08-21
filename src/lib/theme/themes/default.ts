import { twMerge } from 'tailwind-merge';
import { type Theme } from '../types';

const InputDefault =
	'shadow-gray-950/5 dark:shadow-gray-950/30 shadow-xl bg-white dark:bg-gray-900 outline-1 outline-gray-200 dark:outline-gray-700 appearance-none transiton duration-200 focus:outline-2 hover:outline-primary-500 focus:outline-primary-500 px-6 py-3 rounded-lg';

export const defaultTheme: Theme = {
	A: {
		default:
			'text-primary-500 font-semibold decoration-2 hover:underline outline-hidden focus:underline'
	},
	Button: {
		default:
			'whitespace-nowrap bg-primary-500 outline-primary-500/0 flex justify-center px-6 py-3 text-white outline-1 transition duration-200 hover:outline-gray-400 focus:outline-2 focus:outline-gray-950 dark:focus:outline-gray-50 rounded-lg',
		disabled: 'opacity-50 outline-none',
		error: 'bg-red-500',
		icon: 'aspect-square w-12 items-center justify-center p-0',
		ghost:
			'bg-gray-950/0 text-gray-950 hover:bg-gray-950/10 focus:bg-gray-950/10 dark:bg-gray-50/0 dark:text-gray-50 dark:hover:bg-gray-50/10 dark:focus:bg-gray-50/10',
		secondary: 'bg-secondary-500 outline-secondary-500/0',
		small: 'px-4 py-2',
		square: 'rounded-none',
		success: 'bg-green-500',
		xSmall: 'px-2 py-1'
	},
	Card: {
		default:
			'shadow-gray-950/5 dark:shadow-gray-950/30 shadow-xl bg-white dark:bg-gray-900 outline-1 outline-gray-200 dark:outline-gray-700 flex flex-col rounded-xl p-6 backdrop-blur-md transition duration-200'
	},
	Checkbox: {
		default:
			'peer-checked:bg-primary-500 peer-checked:outline-primary-500 peer-focus:outline-primary-500 hover:outline-primary-500 flex h-6 w-6 items-center justify-center rounded bg-white px-0 py-0 shadow-xl outline outline-gray-200 transition duration-200 peer-focus:outline-2 dark:bg-gray-900 dark:outline-gray-700'
	},
	Datatable: { default: '' },
	Dialog: {
		default:
			'max-w-screen bg-transparent h-full max-h-screen w-full bg-transparent text-current transition duration-200 backdrop-blur-md backdrop:bg-transparent px-4'
	},
	Div: { default: '' },
	Form: { default: 'w-full max-w-sm space-y-12' },
	H1: { default: 'block text-3xl font-bold text-gray-800 dark:text-white' },
	H2: { default: 'block text-2xl font-bold text-gray-800 dark:text-white' },
	Header: {
		default:
			'dark:bg-gray-900 outline-1 outline-gray-200 dark:outline-gray-700 bg-gray-50 pb-[env(safe-area-inset-bottom)] lg:pb-0 lg:pt-[env(safe-area-inset-top)]'
	},
	Input: {
		default: InputDefault
	},
	Label: { default: 'text-sm' },
	Modal: { default: 'max-w-full max-h-full overflow-auto' },
	MongooseTable: { default: '' },
	MultiSelect: {
		default: twMerge(
			InputDefault,
			' flex w-full justify-between space-x-2 focus:outline-primary-500 dark:focus:outline-primary-500 text-current'
		),
		isOpen: 'rounded-b-none'
	},
	Option: { default: 'bg-gray-100 dark:bg-gray-800 text-current' },
	P: { default: '' },
	Radio: {
		box: twMerge(
			InputDefault,
			'has-checked:bg-primary-500/10 has-checked:outline-primary-500'
			// 'flex w-full items-center justify-start space-x-2 rounded-lg p-3 has-checked:bg-primary-500/10 outline outline-gray-200 dark:outline-gray-700 has-checked:outline-primary-500'
		),
		default: twMerge('flex w-full items-center space-x-2')
	},
	RangeInput: {
		default:
			'ring ring-gray-200 dark:ring-gray-700 shadow-2xl shadow-gray-950 [&::-webkit-slider-thumb]:bg-primary-500 hover:ring-primary-500 focus:ring-2 focus:ring-primary-500 h-2 w-full appearance-none rounded-full bg-white p-0 outline-none dark:bg-gray-900 [&::-webkit-slider-thumb]:block [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:outline [&::-webkit-slider-thumb]:outline-transparent focus:[&::-webkit-slider-thumb]:outline-2 focus:[&::-webkit-slider-thumb]:outline-primary-500 hover:[&::-webkit-slider-thumb]:outline-gray-200 dark:hover:[&::-webkit-slider-thumb]:outline-gray-700 [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:duration-200'
	},
	Select: { default: twMerge(InputDefault, 'appearance-none') },
	Slider: { default: 'relative flex flex-col space-y-6 items-center' },
	Spinner: { default: 'w-6 h-6' },
	SubmitButton: { default: '' },
	Table: { default: '' },
	Tbody: { default: '' },
	Td: { default: 'px-6 py-3' },
	Th: { default: 'uppercase px-6 py-3' },
	Thead: {
		default: 'dark:bg-gray-800 bg-gray-200'
	},
	Tr: {
		default:
			'even:bg-gray-100 dark:even:bg-gray-800 hover:bg-primary-500/10 transition duration-200 bg-primary-500/0 even:hover:bg-primary-500/10 dark:even:hover:bg-primary-500/10'
	}
};
