<script lang="ts">
	import { untrack } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { emptyDocument, type RichTextDocument } from '$lib/rich-text/document';
	import { markdownToDocument } from '$lib/rich-text/markdown';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { UploadedPostImage } from '$lib/rich-text/images';
	import type { FormPreview } from '$lib/forms/context';
	import {
		AudiencePicker,
		Button,
		Div,
		Form,
		Input,
		P,
		Post,
		Select,
		SubmitButton,
		Textarea,
		RichTextEditor,
		A
	} from '$lib/components';
	import { inputDateTimeLocal } from '$lib/formats';
	import { categoryDefaults, postUrl, type AudienceSettings } from '$lib/forms/definition';
	import FormLibrary from './FormLibrary.svelte';
	import type { Locals } from '$lib/types';
	type PostData = {
		_id: string;
		category: string;
		date: string;
		md: string;
		content?: RichTextDocument;
		slug: string;
		title: string;
		audience: 'public' | 'employees' | 'roles';
		roleIds: string[];
	};
	type Data = {
		locals: Locals;
		post?: PostData;
		forms: { id: string; slug: string; title: string; version: number; published: boolean }[];
		images?: UploadedPostImage[];
		roles: { value: string; label: string }[];
	};
	let { data, form }: { data: Data; form?: { error?: string; success?: string } | null } = $props();
	let category = $state(untrack(() => data.post?.category ?? 'news')),
		title = $state(untrack(() => data.post?.title ?? '')),
		slug = $state(untrack(() => data.post?.slug ?? '')),
		md = $state(untrack(() => data.post?.md ?? ''));
	let date = $state(untrack(() => inputDateTimeLocal(new Date(data.post?.date ?? Date.now()))));
	let mode = $state<'markdown' | 'richtext'>(
		untrack(() => (data.post && !data.post.content ? 'markdown' : 'richtext'))
	);
	let content = $state<RichTextDocument>(untrack(() => data.post?.content ?? emptyDocument()));
	let richEditor = $state.raw<Editor | null>(null),
		conversionError = $state('');
	function convertMarkdown() {
		try {
			content = markdownToDocument(md);
			mode = 'richtext';
			conversionError = '';
		} catch (cause) {
			conversionError = cause instanceof Error ? cause.message : 'Could not convert Markdown.';
		}
	}
	let audience = $state<AudienceSettings>(
		untrack(() => ({
			audience: data.post?.audience ?? 'public',
			roleIds: data.post?.roleIds ?? []
		}))
	);
	let audienceTouched = false,
		slugTouched = false,
		formsOpen = $state(false),
		isLoading = $state(false);
	const submitPost: SubmitFunction = ({ formData }) => {
		formData.set('contentMode', mode);
		formData.set('md', md);
		if (mode === 'richtext') formData.set('content', JSON.stringify(content));
		else formData.delete('content');
		isLoading = true;
		return async ({ update }) => {
			try {
				await update({ reset: false });
			} finally {
				isLoading = false;
			}
		};
	};
	const categories = $derived(
		[...new Set([...Object.keys(categoryDefaults), category])].map((value) => ({
			value,
			label: value.toUpperCase()
		}))
	);
	const publicUrl = $derived.by(() => {
		const [year, month, day] = date.slice(0, 10).split('-').map(Number);
		return postUrl({ year, month, day, slug });
	});
	function insert(slug: string) {
		if (mode === 'richtext')
			richEditor
				?.chain()
				.focus()
				.insertContent({ type: 'component', attrs: { name: 'PublishedForm', slug } })
				.run();
		else md += `\n\n<PublishedForm slug="${slug}"></PublishedForm>\n`;
	}
	const loadFormPreview: FormPreview['load'] = async (slug, signal) => {
		const body = new FormData();
		body.set('slug', slug);
		const response = await fetch('?/formPreview', {
			method: 'POST',
			body,
			signal,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		if (result.type !== 'success')
			throw new Error(
				result.type === 'failure'
					? String(result.data?.error ?? 'Could not load form preview.')
					: 'Could not load form preview.'
			);
		return result.data?.preview as Awaited<ReturnType<FormPreview['load']>>;
	};
	async function uploadImage(file: File): Promise<UploadedPostImage> {
		const body = new FormData();
		body.set('file', file);
		const response = await fetch('?/imageUpload', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		if (result.type !== 'success')
			throw new Error(
				result.type === 'failure'
					? String(result.data?.error ?? 'Could not upload image.')
					: 'Could not upload image.'
			);
		const image = result.data?.image as UploadedPostImage;
		await invalidateAll();
		return image;
	}
</script>

<Div class="grid min-h-0 flex-grow grid-cols-1 gap-6 overflow-auto lg:grid-cols-2">
	<Div class="space-y-4">
		<Div class="flex flex-wrap items-center justify-between gap-3"
			>{#if data.post}<A href={publicUrl} target="_blank" rel="noopener">View post</A>{/if}</Div
		>
		{#if !data.post}<P class="text-sm opacity-70"
				>Save the post before adding questions and collecting responses.</P
			>{/if}
		{#if form?.error}<P role="alert">{form.error}</P>{/if}{#if form?.success}<P role="status"
				>{form.success}</P
			>{/if}
		<Form action="?/save" submitFunction={submitPost} bind:isLoading class="max-w-none space-y-5">
			<Div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Select
					label="Category"
					aria-label="Post category"
					name="category"
					value={category}
					options={categories}
					onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
						category = event.currentTarget.value;
						if (!data.post && !audienceTouched)
							audience = { audience: categoryDefaults[category] ?? 'public', roleIds: [] };
					}}
				/>
				<Input
					label="Date"
					aria-label="Post date"
					name="date"
					type="datetime-local"
					bind:value={date}
					required
				/>
				<Input
					label="Title"
					aria-label="Post title"
					name="title"
					value={title}
					required
					oninput={(event) => {
						title = event.currentTarget.value;
						if (!data.post && !slugTouched)
							slug = title
								.toLowerCase()
								.replace(/[^a-z0-9]+/g, '-')
								.replace(/^-|-$/g, '');
					}}
				/>
				<Input
					label="Slug"
					aria-label="Post slug"
					name="slug"
					value={slug}
					required
					oninput={(event) => {
						slug = event.currentTarget.value;
						slugTouched = true;
					}}
				/>
			</Div>
			<AudiencePicker
				bind:value={audience}
				roles={data.roles}
				onChange={() => (audienceTouched = true)}
			/>
			<Input type="hidden" name="audience" value={audience.audience} /><Input
				type="hidden"
				name="roleIds"
				value={JSON.stringify(audience.roleIds)}
			/>
			<P class="text-sm opacity-70"
				>Category organizes content. Audience controls access. Existing news links keep working; all
				categories use the /posts/date/slug URL. Changing date or slug changes that URL.</P
			>
			<Input type="hidden" name="contentMode" value={mode} />
			{#if mode === 'markdown'}
				<P class="text-sm opacity-70"
					>This existing post uses Markdown. It will remain unchanged unless you choose to convert
					it.</P
				>
				<Button variants={['ghost']} onclick={convertMarkdown}>Convert to rich text</Button>
				<Button variants={['ghost']} disabled={!data.post} onclick={() => (formsOpen = true)}
					>Questions</Button
				>
				{#if conversionError}<P role="alert">{conversionError}</P>{/if}
				<Textarea label="Markdown" aria-label="Post markdown" name="md" bind:value={md} rows={18} />
			{:else}
				<Input type="hidden" name="md" value={md} /><Input
					type="hidden"
					name="content"
					value={JSON.stringify(content)}
				/>
				<RichTextEditor
					bind:value={content}
					bind:editor={richEditor}
					label="Post content"
					images={data.images ?? []}
					onUploadImage={data.post ? uploadImage : undefined}
					onInsertComponent={data.post ? () => (formsOpen = true) : undefined}
				/>
			{/if}
			<SubmitButton bind:isLoading class="ml-auto">Save post</SubmitButton>
		</Form>
	</Div>
	<Post
		preview
		formPreview={{
			load: loadFormPreview,
			revision: data.forms.map((form) => `${form.id}:${form.version}`).join(',')
		}}
		date={new Date(date)}
		firstName={data.locals.user.profile.firstName}
		lastName={data.locals.user.profile.lastName}
		{md}
		content={mode === 'richtext' ? content : undefined}
		imageSources={Object.fromEntries(
			(data.images ?? []).map((image) => [image.url, image.previewUrl])
		)}
		{title}
	/>
</Div>
<FormLibrary bind:open={formsOpen} forms={data.forms} onInsert={insert} />
