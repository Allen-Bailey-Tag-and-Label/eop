<script lang="ts">
	import { tick } from 'svelte';
	import { subtleReveal } from 'sveltewind/transitions';
	import { focusTrap } from '$lib/attachments';
	import { A, Button, Div, Form, H2, Input, P, Select } from '$lib/components';
	import type { AssetSummary } from './types';
	let {
		assets,
		sharedAssets,
		unusedAssets,
		slides,
		scopeId,
		action,
		onChoose,
		onUpload,
		usedAssetIds = []
	}: {
		assets: AssetSummary[];
		sharedAssets: AssetSummary[];
		unusedAssets: AssetSummary[];
		slides: { id: string; title: string }[];
		scopeId: string;
		action: string;
		onChoose: (asset: AssetSummary) => void;
		onUpload?: () => void;
		usedAssetIds?: string[];
	} = $props();
	let tab = $state<'slide' | 'shared' | 'unused'>('slide');
	let search = $state('');
	let destination = $state('');
	let busy = $state(false);
	let pending = $state<{ asset: AssetSummary; operation: 'delete' | 'move' } | null>(null);
	let actionError = $state('');
	let library = $state<HTMLDivElement | null>(null);
	let cancelButton = $state<HTMLButtonElement | null>(null);
	let previousFocus: HTMLElement | null = null;
	const uid = $props.id();
	async function requestAction(asset: AssetSummary, operation: 'delete' | 'move') {
		if (busy) return;
		previousFocus = document.activeElement as HTMLElement;
		actionError = '';
		pending = { asset, operation };
		await tick();
		cancelButton?.focus();
	}
	async function dismissConfirmation() {
		pending = null;
		actionError = '';
		await tick();
		if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
		else library?.querySelector<HTMLInputElement>('[aria-label="Search assets"]')?.focus();
	}
	const visible = $derived(
		(tab === 'slide' ? assets : tab === 'shared' ? sharedAssets : unusedAssets).filter((asset) =>
			asset.name.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

{#if pending}
	<div
		{@attach focusTrap}
		role="alertdialog"
		tabindex={-1}
		aria-modal="true"
		aria-labelledby={`${uid}-confirmation-title`}
		aria-describedby={`${uid}-confirmation-description`}
		class="space-y-4"
		in:subtleReveal
		onkeydown={(event) => {
			if (event.key === 'Escape' && !busy) {
				event.preventDefault();
				event.stopPropagation();
				void dismissConfirmation();
			}
		}}
	>
		<H2 id={`${uid}-confirmation-title`} class="text-lg"
			>{pending.operation === 'delete' ? 'Delete asset?' : 'Move asset to this slide?'}</H2
		>
		<P class="font-semibold break-words">{pending.asset.name}</P>
		<P id={`${uid}-confirmation-description`} class="text-sm">
			{pending.operation === 'delete'
				? 'This permanently deletes the uploaded file. Assets used by saved drafts or published slides cannot be deleted.'
				: 'This removes the asset from the shared library and makes it belong to the current slide. Existing uses in other slides keep working.'}
		</P>
		{#if pending.operation === 'delete' && usedAssetIds.includes(pending.asset.id)}
			<P role="alert" class="text-sm text-red-600 dark:text-red-400"
				>Remove this asset from the current slide's canvas, including item templates, and save your
				changes before deleting it. Published uses must also be removed.</P
			>
		{/if}
		{#if actionError}<P role="alert" class="text-sm text-red-600 dark:text-red-400">{actionError}</P
			>{/if}
		<Form
			{action}
			class="w-full max-w-none space-y-4"
			submitFunction={() => {
				busy = true;
				actionError = '';
				return async ({ update, result }) => {
					try {
						await update();
						if (result.type === 'success') {
							if (pending?.operation === 'move') tab = 'slide';
							await dismissConfirmation();
						} else {
							actionError =
								result.type === 'failure' && typeof result.data?.error === 'string'
									? result.data.error
									: 'Could not complete this action. Please retry.';
						}
					} finally {
						busy = false;
					}
				};
			}}
		>
			<Input type="hidden" name="assetId" value={pending.asset.id} />
			<Input type="hidden" name="assetScopeId" value={scopeId} />
			<Input type="hidden" name="operation" value={pending.operation} />
			<Input type="hidden" name="confirm" value={pending.operation} />
			<Div class="flex justify-end gap-2">
				<Button
					bind:element={cancelButton}
					variants={['ghost']}
					disabled={busy}
					onclick={dismissConfirmation}>Cancel</Button
				>
				<Button
					type="submit"
					variants={pending.operation === 'delete' ? ['error'] : []}
					disabled={busy ||
						(pending.operation === 'delete' && usedAssetIds.includes(pending.asset.id))}
					>{busy
						? 'Working…'
						: pending.operation === 'delete'
							? 'Delete asset'
							: 'Move to this slide'}</Button
				>
			</Div>
		</Form>
	</div>
{/if}
<Div
	bind:element={library}
	hidden={pending !== null}
	inert={pending ? true : undefined}
	class={pending ? 'hidden' : 'space-y-4'}
>
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
				{#if asset.scope === 'shared'}<Button
						class="shrink-0 px-3 py-2 text-sm"
						disabled={busy}
						onclick={() => requestAction(asset, 'move')}>Move to this slide</Button
					>{/if}
				<Button
					class="shrink-0 px-3 py-2 text-sm"
					variants={['error']}
					disabled={busy}
					onclick={() => requestAction(asset, 'delete')}>Delete asset</Button
				>
			</Div>
		</Div>
	{:else}<P class="text-sm opacity-60">No assets in this section.</P>{/each}
	<P class="text-xs opacity-60"
		>Each section lists up to 500 assets, plus files already used by this slide. Repeater templates
		use their parent slide's assets.</P
	>
	{#if onUpload}<Button onclick={onUpload}>Upload to this slide</Button>{/if}
</Div>
