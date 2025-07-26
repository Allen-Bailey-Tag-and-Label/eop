import { type Theme } from '../types';

const InputDefault =
	'bg-gray-50 dark:bg-gray-800 transiton duration-200 outline-1 focus:outline-2 outline-gray-200 hover:outline-primary-500 focus:outline-primary-500 px-6 py-3 rounded-lg dark:outline-gray-700';

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
		square: 'rounded-none'
	},
	Card: {
		default:
			'flex flex-col rounded-xl bg-gray-50 p-6 backdrop-blur-md transition duration-200 dark:bg-gray-900 outline-1 outline-gray-200 shadow-2xs dark:outline-gray-700'
	},
	Checkbox: { default: '' },
	Datatable: { default: '' },
	Dialog: {
		default:
			'max-w-screen bg-transparent h-full max-h-screen w-full bg-transparent text-current transition duration-200 backdrop-blur-md backdrop:bg-transparent'
	},
	Div: { default: '' },
	Form: { default: 'w-full max-w-sm space-y-12' },
	H1: { default: 'block text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white' },
	H2: { default: 'block text-xl font-bold text-gray-800 sm:text-2xl dark:text-white' },
	Header: {
		default: 'dark:bg-gray-900 outline-1 outline-gray-200 dark:outline-gray-700 bg-gray-50'
	},
	Input: {
		default: InputDefault
	},
	Label: { default: 'text-sm' },
	Option: { default: '' },
	P: { default: '' },
	Select: { default: InputDefault },
	Table: { default: '' },
	Tbody: { default: '' },
	Td: { default: 'px-6 py-3' },
	Th: { default: 'uppercase px-6 py-3' },
	Thead: {
		default: 'dark:bg-gray-800 bg-gray-200'
	},
	Tr: {
		default: 'even:bg-gray-200 dark:even:bg-gray-800'
	}
};
