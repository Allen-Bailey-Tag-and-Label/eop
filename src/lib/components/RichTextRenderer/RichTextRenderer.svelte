<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Validated post links may be external, mailto, fragments, or site paths. */
	import type { JSONContent } from '@tiptap/core';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div, PublishedForm } from '$lib/components';
	import { safeUrl, type RichTextDocument } from '$lib/rich-text/document';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		value: RichTextDocument;
		class?: string;
		variants?: string[];
	};
	let { value, class: className, variants = [], ...restProps }: Props = $props();
	const tags: Record<string, string> = {
		paragraph: 'p',
		heading: 'h2',
		bulletList: 'ul',
		orderedList: 'ol',
		listItem: 'li',
		blockquote: 'blockquote',
		table: 'table',
		tableRow: 'tr',
		tableCell: 'td',
		tableHeader: 'th'
	};
	const align = (value: unknown) =>
		({ left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' })[
			String(value) as 'left'
		] ?? '';
</script>

<Div
	{...restProps}
	class={twMerge(
		$theme.RichTextRenderer.default,
		...variants.map((variant) => $theme.RichTextRenderer[variant]),
		className
	)}
>
	{@render nodes(value.doc.content ?? [])}
</Div>
{#snippet nodes(content: JSONContent[])}
	{#each content as node, index (index)}
		{#if node.type === 'text'}{@render text(node, 0)}
		{:else if node.type === 'component' && node.attrs?.name === 'PublishedForm'}<PublishedForm
				slug={node.attrs.slug}
			/>
		{:else if node.type === 'image' && safeUrl(node.attrs?.src, true)}
			<figure class={align(node.attrs?.align)}>
				<img
					src={node.attrs?.src}
					alt={node.attrs?.alt ?? ''}
					title={node.attrs?.title ?? undefined}
					loading="lazy"
					style:width={`${node.attrs?.width ?? 100}%`}
					class={twMerge(
						'inline-block h-auto max-w-full',
						node.attrs?.align === 'center'
							? 'mx-auto'
							: node.attrs?.align === 'right'
								? 'ml-auto'
								: 'mr-auto'
					)}
				/>{#if node.attrs?.caption}<figcaption>{node.attrs.caption}</figcaption>{/if}
			</figure>
		{:else if node.type === 'hardBreak'}<br />
		{:else if node.type === 'horizontalRule'}<hr />
		{:else if node.type === 'codeBlock'}<pre><code>{@render nodes(node.content ?? [])}</code></pre>
		{:else if node.type && tags[node.type]}
			<svelte:element
				this={node.type === 'heading' ? `h${node.attrs?.level ?? 2}` : tags[node.type]}
				class={align(node.attrs?.textAlign)}
				{...{
					start: node.type === 'orderedList' ? node.attrs?.start : undefined,
					colspan:
						node.type === 'tableCell' || node.type === 'tableHeader'
							? node.attrs?.colspan
							: undefined,
					rowspan:
						node.type === 'tableCell' || node.type === 'tableHeader'
							? node.attrs?.rowspan
							: undefined
				}}
			>
				{#if node.type === 'table'}<tbody>{@render nodes(node.content ?? [])}</tbody
					>{:else}{@render nodes(node.content ?? [])}{/if}
			</svelte:element>
		{/if}
	{/each}
{/snippet}
{#snippet text(node: JSONContent, index: number)}
	{@const mark = node.marks?.[index]}
	{#if !mark}{node.text}
	{:else if mark.type === 'link' && safeUrl(mark.attrs?.href)}<a
			href={mark.attrs.href}
			rel="noopener noreferrer">{@render text(node, index + 1)}</a
		>
	{:else if ['bold', 'italic', 'underline', 'strike', 'code'].includes(mark.type)}<svelte:element
			this={(
				{ bold: 'strong', italic: 'em', underline: 'u', strike: 's', code: 'code' } as Record<
					string,
					string
				>
			)[mark.type]}>{@render text(node, index + 1)}</svelte:element
		>
	{:else}{@render text(node, index + 1)}{/if}
{/snippet}
