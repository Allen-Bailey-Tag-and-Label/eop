import type { Attachment } from 'svelte/attachments';

type Options = {
	/** Custom CSS selector to choose the target (overrides auto-detect) */
	selector?: string;
	/** Include disabled/aria-hidden/hidden elements? Default: false */
	includeHidden?: boolean;
	/** If no focusable child found, focus the card itself. Default: true */
	fallbackToSelf?: boolean;
	/** When to run focus: 'microtask' | 'raf' | number (ms). Default: 'microtask' */
	delay?: 'microtask' | 'raf' | number;
};

const DEFAULTS: Required<Omit<Options, 'selector'>> = {
	includeHidden: false,
	fallbackToSelf: true,
	delay: 'microtask'
};

const DEFAULT_FOCUSABLE = [
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'a[href]',
	'area[href]',
	'details > summary',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable="true"]'
].join(',');

/** Utility: is an element actually visible & interactable? */
function isVisiblyFocusable(el: Element) {
	const node = el as HTMLElement;
	const style = getComputedStyle(node);
	if (style.visibility === 'hidden' || style.display === 'none') return false;
	// Hidden via <details> closed, offset sizes, or ARIA
	if ((node as any).offsetParent === null && style.position !== 'fixed') return false;
	if (node.getAttribute('aria-hidden') === 'true') return false;
	return true;
}

function schedule(fn: () => void, delay: Options['delay']) {
	if (delay === 'raf') return requestAnimationFrame(() => fn());
	if (delay === 'microtask') return queueMicrotask(fn);
	if (typeof delay === 'number') return setTimeout(fn, delay);
	// fallback
	queueMicrotask(fn);
}

export const focusFirst = (opts: Options = {}): Attachment<HTMLElement> => {
	const options = { ...DEFAULTS, ...opts };

	return (element) => {
		schedule(() => {
			let target: HTMLElement | null = null;

			if (opts.selector) {
				target = element.querySelector<HTMLElement>(opts.selector);
			} else {
				const candidates = Array.from(element.querySelectorAll<HTMLElement>(DEFAULT_FOCUSABLE));
				target =
					candidates.find((el) => (options.includeHidden ? true : isVisiblyFocusable(el))) ?? null;
			}

			if (!target && options.fallbackToSelf) {
				// Ensure the Card itself can receive focus
				if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
				target = element;
			}

			target?.focus?.({ preventScroll: true });
		}, options.delay);

		// No cleanup required (focus is one-shot on mount)
		return () => {};
	};
};
