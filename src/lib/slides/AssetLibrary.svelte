<script lang="ts">
	import { A, Button, Div, Form, Input, P, Select } from '$lib/components';
	import type { AssetSummary } from './types';
	let {
		assets,
		sharedAssets,
		unusedAssets,
		slides,
		scopeId,
		action,
		onChoose
	}: {
		assets: AssetSummary[];
		sharedAssets: AssetSummary[];
		unusedAssets: AssetSummary[];
		slides: { id: string; title: string }[];
		scopeId: string;
		action: string;
		onChoose: (asset: AssetSummary) => void;
	} = $props();
	let tab = $state<'slide' | 'shared' | 'unused'>('slide');
	let search = $state('');
	let destination = $state('');
	let busy = $state(false);
	const visible = $derived(
		(tab === 'slide' ? assets : tab === 'shared' ? sharedAssets : unusedAssets).filter((asset) =>
			asset.name.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<Div class="space-y-4">
	<Div class="flex flex-wrap gap-2" role="tablist" aria-label="Asset library sections">
		{#each [['slide', 'This slide'], ['shared', 'Shared library'], ['unused', 'Unused assets']] as [value, label] (value)}
			<Button
				role="tab"
				aria-selected={tab === value}
				variants={tab === value ? [] : ['ghost']}
				onclick={() => (tab = value as typeof tab)}>{label}</Button
			>
		{/each}
	</Div>
	<Input label="Search assets" aria-label="Search assets" bind:value={search} />
	{#if tab === 'unused'}<P class="text-sm opacity-70"
			>Slide-specific and unassigned files not referenced by saved drafts or published slides. They
			may still be used in unfinished edits. Review and assign unassigned files, share them, or copy
			them. Nothing is deleted automatically.</P
		>{/if}
	<Select
		label="Copy destination"
		aria-label="Copy destination"
		bind:value={destination}
		options={[
			{ value: '', label: 'This slide' },
			...slides
				.filter((slide) => slide.id !== scopeId)
				.map((slide) => ({ value: slide.id, label: slide.title }))
		]}
	/>
	{#each visible as asset (asset.id)}
		<Div class="space-y-2 rounded-lg border border-slate-300 p-3 dark:border-gray-700">
			<P class="font-semibold break-words">{asset.name}</P>
			<P class="text-xs opacity-60"
				>{asset.contentType} · {asset.scope === 'shared'
					? 'Shared'
					: asset.slideId === scopeId
						? 'This slide'
						: (slides.find((slide) => slide.id === asset.slideId)?.title ??
							'Unassigned / abandoned draft')}</P
			>
			<Div
				class="-m-1 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain p-1"
			>
				<A
					class="shrink-0 text-sm whitespace-nowrap"
					href={`/admin/monitors/slides/assets/${asset.id}`}
					target="_blank"
					rel="noreferrer">Preview file</A
				>
				{#if tab !== 'unused'}<Button
						class="shrink-0 px-3 py-2 text-sm"
						onclick={() => onChoose(asset)}>Add to canvas</Button
					>{/if}
				<Form
					{action}
					class="flex w-auto max-w-none shrink-0 items-center gap-2 space-y-0"
					submitFunction={() => {
						busy = true;
						return async ({ update }) => {
							try {
								await update();
							} finally {
								busy = false;
							}
						};
					}}
				>
					<Input type="hidden" name="assetId" value={asset.id} />
					<Input type="hidden" name="assetScopeId" value={scopeId} />
					<Input type="hidden" name="targetSlideId" value={destination || scopeId} />
					{#if asset.scope !== 'shared' && (asset.slideId === scopeId || asset.scope === 'unassigned')}<Button
							type="submit"
							class="shrink-0 px-3 py-2 text-sm"
							name="operation"
							value="share"
							disabled={busy}>Share asset</Button
						>{/if}
					<Button
						class="shrink-0 px-3 py-2 text-sm"
						type="submit"
						name="operation"
						value="copy"
						disabled={busy}>Copy to destination</Button
					>
					{#if asset.scope === 'unassigned'}<Button
							type="submit"
							class="shrink-0 px-3 py-2 text-sm"
							name="operation"
							value="assign"
							disabled={busy}>Assign to this slide</Button
						>{/if}
				</Form>
			</Div>
		</Div>
	{:else}<P class="text-sm opacity-60">No assets in this section.</P>{/each}
	<P class="text-xs opacity-60"
		>Each section lists up to 500 assets, plus files already used by this slide. Repeater templates
		use their parent slide's assets.</P
	>
</Div>
