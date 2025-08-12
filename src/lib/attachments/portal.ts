import type { Attachment } from 'svelte/attachments';

type Options = {
	anchorElement?: HTMLElement | null;
	class?: string;
	matchWidth?: boolean;
};

export const portal = (options: Options = {}): Attachment<HTMLElement> => {
	return (element) => {
		const { class: classNames = 'z-[9999]', matchWidth = true } = options;
		const placeholder = document.createComment('portal');
		let attached = false;

		const anchor = () =>
			options.anchorElement &&
			typeof (options.anchorElement as any).getBoundingClientRect === 'function'
				? options.anchorElement
				: null;

		const attach = () => {
			if (attached) return;
			element.after(placeholder);
			document.body.appendChild(element);
			attached = true;
			place();
			window.addEventListener('scroll', place, true);
			window.addEventListener('resize', place);
			queueMicrotask(place);
		};

		const destroy = () => {
			if (!attached) return;
			try {
				placeholder.after(element);
			} catch {}
			try {
				placeholder.remove();
			} catch {}
			try {
				element.remove();
			} catch {}
			attached = false;
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		};

		const place = () => {
			if (!attached) return;
			const a = anchor();
			if (!a) {
				Object.assign(element.style, {
					position: 'fixed',
					top: '0px',
					left: '0px'
				});
				classNames.split(' ').forEach((className) => element.classList.add(className));
				return;
			}
			const r = a.getBoundingClientRect();
			Object.assign(element.style, {
				position: 'fixed',
				top: `${r.bottom}px`,
				left: `${r.left}px`,
				minWidth: matchWidth ? `${r.width}px` : ''
			});
			classNames.split(' ').forEach((className) => element.classList.add(className));
		};

		attach();
		return destroy;
	};
};
