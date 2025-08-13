export const normalizeHtmlToText = (html: any) => {
	if (html == null) return '';
	const s = String(html)
		.replace(/<!--[\s\S]*?-->/g, '') // strip comments
		.replace(/<br\s*\/?>/gi, '\n') // normalize <br>
		.replace(/&nbsp;/gi, ' ') // nbsp -> space
		.replace(/<[^>]*>/g, '') // strip tags
		.trim();
	return s;
};
