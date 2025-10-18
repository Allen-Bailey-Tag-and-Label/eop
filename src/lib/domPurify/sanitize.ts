import { browser } from '$app/environment';

export const sanitize = async (html: string) => {
	if (browser) {
		// client side
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const DOMPurify = (await import('dompurify')).default;
		return DOMPurify.sanitize(html, {
			// Allow custom elements & attrs you’ll use
			ADD_TAGS: ['callout-box', 'youtube-embed'],
			ADD_ATTR: ['type', 'videoid'],
			USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true }
		});
	}

	// server side (SSR)
	const { JSDOM } = await import('jsdom');
	const window = new JSDOM('').window as unknown as Window;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const createDOMPurify = require('dompurify');
	const DOMPurify = createDOMPurify(window as any);
	return DOMPurify.sanitize(html, {
		ADD_TAGS: ['callout-box', 'youtube-embed'],
		ADD_ATTR: ['type', 'videoid'],
		USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true }
	});
};
