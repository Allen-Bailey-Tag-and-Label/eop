import { marked } from 'marked';

// Base config
marked.use({
	gfm: true
});

// External link safety
const renderer = new marked.Renderer();
marked.use({ renderer });

export const mdToHtml = (md: string) => marked.parse(md) as string;
