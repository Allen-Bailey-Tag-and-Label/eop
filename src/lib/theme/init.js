import { twMerge } from 'tailwind-merge';
import { theme } from '$stores';

export const init = () => {
	const input =
		'hover:ring-offset-primary-500 focus:ring-offset-primary-500 focus:ring-primary-500/[.3]';
	theme.set({
		a: 'transition-all duration-200 shadow-[inset_0_-1px_0px_#6366f1] dark:shadow-[inset_0_-1px_0px_#6366f1] hover:shadow-[inset_0_-1.5rem_0px_#6366f1] hover:text-white',
		button: 'bg-primary-500 hover:bg-primary-600 focus:bg-primary-600 focus:ring-primary-500/[.3]',
		checkbox: twMerge(
			input,
			'text-white peer-focus:ring-primary-500/[.3] peer-focus:ring-offset-primary-500'
		),
		checkboxChecked: 'bg-primary-500 dark:bg-primary-500',
		input,
		radio:
			'focus:ring-primary-500/[.3] focus:ring-offset-primary-500 group-hover:ring-offset-primary-500 hover:ring-offset-primary-500',
		radioSelected: 'bg-primary-500 dark:bg-primary-500',
		select: input,
		textarea: input
	});
};
