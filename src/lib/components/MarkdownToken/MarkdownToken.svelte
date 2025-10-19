<script lang="ts">
	import { marked } from 'marked';
	import type { Component } from 'svelte';
	import { Em, H1, H2, Li, Ol, P, Strong, Ul } from '$lib/components';
	import * as UI from '$lib/components';

	type EmToken = {
		raw: string;
		text: string;
		type: 'em';
	};
	type HeadingToken = {
		depth: number;
		raw: string;
		text: string;
		tokens: Token[];
		type: 'heading';
	};
	type HtmlToken = {
		block: boolean;
		pre: boolean;
		raw: string;
		text: string;
		type: 'html';
	};
	type ListItemToken = {
		checked?: boolean;
		loose: boolean;
		raw: string;
		task: boolean;
		text: string;
		tokens: Token[];
		type: 'list_item';
	};
	type ListToken = {
		items: ListItemToken[];
		loose: boolean;
		ordered: boolean;
		raw: string;
		start: string;
		type: 'list';
	};
	type ParagraphToken = {
		raw: string;
		text: string;
		tokens: Token[];
		type: 'paragraph';
	};
	type StrongToken = {
		raw: string;
		text: string;
		type: 'strong';
	};
	type TextToken = {
		excaped: boolean;
		raw: string;
		text: string;
		type: 'text';
	};
	type Token =
		| EmToken
		| HeadingToken
		| HtmlToken
		| ListItemToken
		| ListToken
		| ParagraphToken
		| StrongToken
		| TextToken;
	type Props = {
		tokens: Token[];
	};

	let { tokens = $bindable([]) }: Props = $props();

	const coerce = (v: string) => {
		if (v === 'true') return true;
		if (v === 'false') return false;
		const n = Number(v);
		return Number.isNaN(n) ? v : n;
	};
	const componentMap: Record<string, Component<any>> = UI;

	const parseAttrs = (s: string): Record<string, unknown> => {
		const attrs: Record<string, unknown> = {};
		const re = /([:@\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(s))) {
			const key = m[1];
			const val = m[2] ?? m[3] ?? m[4];
			attrs[key] = val === undefined ? true : coerce(val);
		}
		return attrs;
	};
	const parseComponentTag = (src: string) => {
		// Try paired first
		let m = src.match(/^<([A-Z][\w]*)\s*([^>]*)>([\s\S]*?)<\/\1>\s*$/);
		if (m) {
			const [, name, rawAttrs, inner] = m;
			return { name, attrs: parseAttrs(rawAttrs), inner };
		}
		// Then self-closing
		m = src.match(/^<([A-Z][\w]*)\s*([^/>]*?)\/>\s*$/);
		if (m) {
			const [, name, rawAttrs] = m;
			return { name, attrs: parseAttrs(rawAttrs), inner: '' };
		}
		return null;
	};
	const parseMultiComponentBlock = (src: string) => {
		const nodes: Array<
			| { kind: 'component'; name: string; attrs: Record<string, unknown>; inner: string }
			| { kind: 'html'; html: string }
		> = [];

		// Global regex that matches either a paired or self-closing PascalCase tag
		const re = /<([A-Z][\w]*)\s*([^/>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;

		let lastIndex = 0;
		let m: RegExpExecArray | null;

		while ((m = re.exec(src))) {
			// push any non-matched html between components
			if (m.index > lastIndex) {
				nodes.push({ kind: 'html', html: src.slice(lastIndex, m.index) });
			}

			const [, name, rawAttrs, inner = ''] = m;
			nodes.push({
				kind: 'component',
				name,
				attrs: parseAttrs(rawAttrs),
				inner
			});
			lastIndex = re.lastIndex;
		}

		// trailing html
		if (lastIndex < src.length) {
			nodes.push({ kind: 'html', html: src.slice(lastIndex) });
		}

		// If nothing was parsed as component, return null so caller can fall back
		return nodes.some((n) => n.kind === 'component') ? nodes : null;
	};
</script>

{@render tokensSnippet(tokens)}

{#snippet emSnippet(token: EmToken)}
	<Em>{token.text}</Em>
{/snippet}
{#snippet headingSnippet(token: HeadingToken)}
	{#if token.depth === 1}
		<H1>
			{@render tokensSnippet(token.tokens)}
		</H1>
	{:else if token.depth === 2}
		<H2>
			{@render tokensSnippet(token.tokens)}
		</H2>
	{/if}
{/snippet}
{#snippet htmlSnippet(token: HtmlToken)}
	{#key token.text}
		{@const parsed = parseComponentTag(token.text)}
		{@const multi = !parsed && parseMultiComponentBlock(token.text)}

		{#if parsed}
			{@const C = componentMap[parsed.name]}
			{#if C}
				<C {...parsed.attrs}>
					{@render tokensSnippet(marked.lexer(parsed.inner) as unknown as Token[])}
				</C>
			{:else}
				{@html token.text}
			{/if}
		{:else if multi}
			{#each multi as node}
				{#if node.kind === 'component'}
					{@const C = componentMap[node.name]}
					{#if C}
						<C {...node.attrs}>
							{@render tokensSnippet(marked.lexer(node.inner) as unknown as Token[])}
						</C>
					{:else}
						<!-- unknown component: emit as raw html -->
						{@html `<${node.name}></${node.name}>`}
					{/if}
				{:else}
					{@html node.html}
				{/if}
			{/each}
		{:else}
			{@html token.text}
		{/if}
	{/key}
{/snippet}
{#snippet listItemSnippet(token: ListItemToken)}
	<Li>{@render tokensSnippet(token.tokens)}</Li>
{/snippet}
{#snippet listSnippet(token: ListToken)}
	{#if token.ordered}
		<Ol>{@render tokensSnippet(token.items)}</Ol>
	{:else if !token.ordered}
		<Ul>{@render tokensSnippet(token.items)}</Ul>
	{/if}
{/snippet}
{#snippet paragraphSnippet(token: ParagraphToken)}
	<P>{@render tokensSnippet(token.tokens)}</P>
{/snippet}
{#snippet strongSnippet(token: StrongToken)}
	<Strong>{token.text}</Strong>
{/snippet}
{#snippet textSnippet(token: TextToken)}
	{token.text}
{/snippet}

{#snippet tokensSnippet(tokens: Token[])}
	{#each tokens as token}
		{#if token.type === 'em'}
			{@render emSnippet(token)}
		{:else if token.type === 'heading'}
			{@render headingSnippet(token)}
		{:else if token.type === 'html'}
			{@render htmlSnippet(token)}
		{:else if token.type === 'list'}
			{@render listSnippet(token)}
		{:else if token.type === 'list_item'}
			{@render listItemSnippet(token)}
		{:else if token.type === 'paragraph'}
			{@render paragraphSnippet(token)}
		{:else if token.type === 'strong'}
			{@render strongSnippet(token)}
		{:else if token.type === 'text'}
			{@render textSnippet(token)}
		{/if}
	{/each}
{/snippet}
