import type { Attachment } from 'svelte/attachments';

const focusableSelectors = [
	'a[href]',
	'area[href]',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'button:not([disabled])',
	'iframe',
	'object',
	'embed',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable]'
];

export const focusTrap: Attachment = (element) => {
	if (!element) return;

	const keydownHandler = (event: KeyboardEvent) => {
		if (event.key !== 'Tab') return;

		const focusableChildren = Array.from(
			element.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
		).filter((el) => el.offsetParent !== null);
		const first = focusableChildren[0];
		const last = focusableChildren[focusableChildren.length - 1];

		if (event.shiftKey) {
			if (document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	};

	// @ts-ignore
	element.addEventListener('keydown', keydownHandler);

	return () => {
		// @ts-ignore
		element.removeEventListener('keydown', keydownHandler);
	};
};
