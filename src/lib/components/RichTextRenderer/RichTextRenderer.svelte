<script lang="ts">
	import type { JSONContent } from '@tiptap/core';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { A, Div, PublishedForm } from '$lib/components';
	import { safeUrl, type RichTextDocument } from '$lib/rich-text/document';
	import { textColor, textSize } from '$lib/rich-text/formatting';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		value: RichTextDocument;
		imageSources?: Record<string, string>;
		class?: string;
		variants?: string[];
	};
	let { value, imageSources = {}, class: className, variants = [], ...restProps }: Props = $props();
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
	function linkRuns(content: JSONContent[]) {
		const result: JSONContent[] = [];
		for (const node of content) {
			const link =
				node.type === 'text' ? node.marks?.find((mark) => mark.type === 'link') : undefined;
			if (!link || !safeUrl(link.attrs?.href)) {
				result.push(node);
				continue;
			}
			const key = JSON.stringify([
				link.attrs?.href,
				link.attrs?.appearance ?? 'text',
				link.attrs?.title ?? null
			]);
			let run = result.at(-1);
			if (run?.type !== 'linkRun' || run.attrs?.key !== key) {
				run = { type: 'linkRun', attrs: { ...link.attrs, key }, content: [] };
				result.push(run);
			}
			run.content!.push({ ...node, marks: node.marks?.filter((mark) => mark.type !== 'link') });
		}
		return result;
	}
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
	{#each linkRuns(content) as node, index (index)}
		{#if node.type === 'linkRun'}<A
				href={node.attrs?.href}
				title={node.attrs?.title ?? undefined}
				class={node.attrs?.appearance === 'button'
					? twMerge($theme.Button.default, $theme.RichTextEditor.buttonLink)
					: undefined}
				rel="noopener noreferrer">{@render nodes(node.content ?? [])}</A
			>
		{:else if node.type === 'text'}{@render text(node, 0)}
		{:else if node.type === 'component' && node.attrs?.name === 'PublishedForm'}<PublishedForm
				slug={node.attrs.slug}
			/>
		{:else if node.type === 'image' && safeUrl(node.attrs?.src, true)}
			<figure class={align(node.attrs?.align)}>
				<img
					src={imageSources[node.attrs?.src] ?? node.attrs?.src}
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
				class={align(node.attrs?.textAlign ?? node.attrs?.align)}
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
	{:else if mark.type === 'textStyle'}<span
			style:font-size={textSize(mark.attrs?.fontSize)}
			style:color={textColor(mark.attrs?.color)}
			style:background-color={textColor(mark.attrs?.backgroundColor)}
			>{@render text(node, index + 1)}</span
		>
	{:else if mark.type === 'link' && safeUrl(mark.attrs?.href)}<A
			href={mark.attrs.href}
			class={mark.attrs.appearance === 'button'
				? twMerge($theme.Button.default, $theme.RichTextEditor.buttonLink)
				: undefined}
			rel="noopener noreferrer">{@render text(node, index + 1)}</A
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
