<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { X } from '@lucide/svelte';
	import { Button, Card, Div, H2, Input, Modal, P, Select } from '$lib/components';
	import { MAX_PACKAGE_BYTES, type PackageChoices, type PackageReview } from './package';
	import type { SlideDefinition } from './types';
	let {
		mode = $bindable<'import' | 'export' | null>(null),
		definition,
		title,
		slug,
		endpoint
	}: {
		mode?: 'import' | 'export' | null;
		definition: SlideDefinition;
		title: string;
		slug: string;
		endpoint: string;
	} = $props();

	let busy = $state(false),
		error = $state('');
	let file = $state<File | null>(null);
	let review = $state<PackageReview | null>(null);
	let importedTitle = $state(''),
		importedSlug = $state('');
	let choices = $state<PackageChoices>({ assets: {}, sources: {}, connections: {} });
	$effect(() => {
		if (!mode) {
			review = null;
			file = null;
			error = '';
			choices = { assets: {}, sources: {}, connections: {} };
		}
	});
	async function send(fields: FormData) {
		const response = await fetch(endpoint, { method: 'POST', body: fields });
		if (!response.ok) {
			const result = await response.json().catch(() => ({}));
			throw new Error(result.error ?? 'Could not transfer slide package.');
		}
		return response;
	}
	async function download() {
		busy = true;
		error = '';
		try {
			const fields = new FormData();
			fields.set('operation', 'export');
			fields.set('title', title);
			fields.set('slug', slug);
			fields.set('definition', JSON.stringify(definition));
			const response = await send(fields);
			const url = URL.createObjectURL(await response.blob());
			const link = document.createElement('a');
			link.href = url;
			link.download = `${slug || 'slide'}.zip`;
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 0);
			mode = null;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not export package.';
		} finally {
			busy = false;
		}
	}
	async function inspect(event: Event & { currentTarget: HTMLInputElement }) {
		file = event.currentTarget.files?.[0] ?? null;
		review = null;
		error = '';
		if (!file) return;
		if (file.size > MAX_PACKAGE_BYTES) {
			error = 'Choose a slide ZIP package under 4 MB.';
			return;
		}
		busy = true;
		try {
			const fields = new FormData();
			fields.set('operation', 'review');
			fields.set('file', file);
			review = await (await send(fields)).json();
			importedTitle = review!.package.slide.title;
			importedSlug = review!.package.slide.slug || 'imported-slide';
			choices = { assets: {}, sources: {}, connections: {} };
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not review package.';
		} finally {
			busy = false;
		}
	}
	async function importPackage() {
		if (!file || !review) return;
		busy = true;
		error = '';
		try {
			const fields = new FormData();
			fields.set('operation', 'import');
			fields.set('file', file);
			fields.set('title', importedTitle);
			fields.set('slug', importedSlug);
			fields.set('choices', JSON.stringify(choices));
			const result = await (await send(fields)).json();
			await goto(
				resolve('/(private)/(unpadded)/admin/monitors/slides/[slug]', { slug: result.slug }),
				{
					invalidateAll: true
				}
			);
			mode = null;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not import package.';
		} finally {
			busy = false;
		}
	}
</script>

{#if mode}
	<Modal
		bind:isOpen={
			() => mode !== null,
			(value) => {
				if (!value && !busy) mode = null;
			}
		}
		isCloseable={!busy}
		role="dialog"
		aria-label={mode === 'export' ? 'Export slide package' : 'Import slide package'}
		class="flex max-h-[85svh] w-full max-w-2xl flex-col gap-4 overflow-hidden p-5"
	>
		<Div class="flex shrink-0 items-center justify-between gap-4"
			><H2 class="text-lg">{mode === 'export' ? 'Export slide package' : 'Import slide package'}</H2
			><Button
				disabled={busy}
				variants={['ghost', 'icon']}
				aria-label="Close slide package"
				onclick={() => (mode = null)}><X size={18} /></Button
			></Div
		>
		<Div class="-m-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-1">
			{#if error}<P role="alert" class="text-red-600 dark:text-red-400">{error}</P>{/if}
			{#if mode === 'export'}
				<P
					>Download the current slide layout, referenced assets, data-link workflows, and API
					connection settings together in one ZIP.</P
				>
				<P
					>Credentials, cached API responses, underlying database records, playlists, and monitor
					assignments are excluded. API credential environment variable names are included;
					configure their values on the destination server.</P
				>
				<P
					>Save data-link edits before exporting. Asset IDs stored in workflow definitions are
					included; images returned dynamically by databases or APIs require their own migration.
					Packages must be under 4 MB.</P
				>
				<Button disabled={busy || !title.trim()} onclick={download}
					>{busy ? 'Exporting...' : 'Download slide package'}</Button
				>
			{:else}
				<P
					>Import creates a new slide draft. Your current slide and existing shared resources are
					preserved. Save any current edits before leaving this editor.</P
				>
				<Input
					type="file"
					aria-label="Slide package file"
					accept=".zip,application/zip"
					disabled={busy}
					onchange={inspect}
				/>
				{#if review}
					<Input label="Slide title" aria-label="Imported slide title" bind:value={importedTitle} />
					<Input label="Slide slug" aria-label="Imported slide slug" bind:value={importedSlug} />
					{#each ['assets', 'sources', 'connections'] as group (group)}
						{@const kind = group as keyof PackageChoices}
						<Card class="space-y-3"
							><H2 class="text-base"
								>{kind === 'assets'
									? 'Assets'
									: kind === 'sources'
										? 'Data links'
										: 'API connections'} ({review.package[kind].length})</H2
							>
							{#each review.package[kind] as resource (resource.id)}
								<Select
									label={'name' in resource ? resource.name : resource.title}
									aria-label={`Import ${kind} ${resource.id}`}
									value={choices[kind][resource.id] ?? ''}
									options={[
										{ value: '', label: 'Create a copy' },
										...review.existing[kind].map((item) => ({
											value: item.id,
											label: `Reuse: ${item.title}`
										}))
									]}
									onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
										(choices[kind][resource.id] = event.currentTarget.value)}
								/>
							{/each}
							{#if !review.package[kind].length}<P>None required.</P>{/if}
						</Card>
					{/each}
					<P
						>Copied data links retain their draft and published definitions so bindings can resolve.
						The slide itself stays unpublished. Configure API credentials and verify production data
						before publishing.</P
					>
					<Button
						disabled={busy || !importedTitle.trim() || !importedSlug.trim()}
						onclick={importPackage}>{busy ? 'Importing...' : 'Import as new draft'}</Button
					>
				{/if}
			{/if}
		</Div>
	</Modal>
{/if}
