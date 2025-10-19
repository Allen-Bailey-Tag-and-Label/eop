// src/lib/markdown.ts
import { marked } from 'marked';

const renderer = {
	heading(this: any, token: any) {
		// Convert inline tokens → HTML
		const text = this.parser.parseInline(token.tokens);
		const tag = `md-h${token.depth}`;
		return `<${tag}>${text}</${tag}>`;
	}
};

// Basic GitHub-style Markdown parsing
marked.use({
	gfm: true,
	renderer
});

export const mdToHtml = (md: string) => marked.parse(md) as string;
