<script lang="ts">
	import { untrack } from 'svelte';
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
		slug: string;
		title: string;
		audience: 'public' | 'employees' | 'roles';
		roleIds: string[];
	};
	type Data = {
		locals: Locals;
		post?: PostData;
		forms: { id: string; slug: string; title: string; version: number; published: boolean }[];
		roles: { value: string; label: string }[];
	};
	let { data, form }: { data: Data; form?: { error?: string; success?: string } | null } = $props();
	let category = $state(untrack(() => data.post?.category ?? 'news')),
		title = $state(untrack(() => data.post?.title ?? '')),
		slug = $state(untrack(() => data.post?.slug ?? '')),
		md = $state(untrack(() => data.post?.md ?? ''));
	let date = $state(untrack(() => inputDateTimeLocal(new Date(data.post?.date ?? Date.now()))));
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
		md += `\n\n<PublishedForm slug="${slug}"></PublishedForm>\n`;
	}
</script>

<Div class="grid min-h-0 flex-grow grid-cols-1 gap-6 overflow-auto lg:grid-cols-2">
	<Div class="space-y-4">
		<Div class="flex flex-wrap items-center justify-between gap-3"
			><Button onclick={() => (formsOpen = true)}>Forms</Button>{#if data.post}<A
					href={publicUrl}
					target="_blank"
					rel="noopener">View post</A
				>{/if}</Div
		>
		{#if form?.error}<P role="alert">{form.error}</P>{/if}{#if form?.success}<P role="status"
				>{form.success}</P
			>{/if}
		<Form action="?/save" bind:isLoading class="max-w-none space-y-5">
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
			<Textarea label="Markdown" aria-label="Post markdown" name="md" bind:value={md} rows={18} />
			<SubmitButton bind:isLoading class="ml-auto">Save post</SubmitButton>
		</Form>
	</Div>
	<Post
		preview
		date={new Date(date)}
		firstName={data.locals.user.profile.firstName}
		lastName={data.locals.user.profile.lastName}
		{md}
		{title}
	/>
</Div>
<FormLibrary bind:open={formsOpen} forms={data.forms} roles={data.roles} onInsert={insert} />
