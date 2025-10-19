// src/lib/markdown.ts
import { marked } from 'marked';

export type MdToken = any; // you can refine types as you extend

export function mdToTokens(md: string): MdToken[] {
	return marked.lexer(md); // block-level tokens; inline tokens live in token.tokens
}
