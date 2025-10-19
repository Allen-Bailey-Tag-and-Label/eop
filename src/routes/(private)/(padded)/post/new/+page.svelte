<script lang="ts">
	import { Div, Form, Input, Label, Post, Select, SubmitButton, Textarea } from '$lib/components';
	import { inputDateTimeLocal } from '$lib/formats';
	import type { Locals } from '$lib/types';

	type Props = {
		_id?: string;
		category: string;
		data: {
			locals: Locals;
		};
		date: Date;
		md: string;
		slug: string;
		title: string;
	};

	let {
		_id,
		category = $bindable('news'),
		date = $bindable(new Date()),
		data,
		md = $bindable(''),
		slug = $bindable(''),
		title = $bindable(''),
		...props
	}: Props = $props();

	const categoryOptions = ['News'].map((label) => ({ label, value: label.toLowerCase() }));
	let isLoading = $state(false);

	// $effects
	$effect(() => {
		slug = title.toLowerCase().split(' ').join('-');
	});
</script>

<Div class="grid flex-grow grid-cols-2 gap-4">
	<Form bind:isLoading class="max-w-auto flex flex-grow flex-col">
		{#if _id}
			<Input class="sr-only" name="_id" value={_id} />
		{/if}
		<Div class="flex flex-grow flex-col items-start space-y-6">
			<Div class="flex flex-wrap space-x-4">
				<Div class="flex flex-col">
					<Label>Category</Label>
					<Select bind:value={category} options={categoryOptions} name="category" />
				</Div>
				<Div class="flex flex-col">
					<Label>Date</Label>
					<Input
						bind:value={
							() => {
								const formattedDate = inputDateTimeLocal(date);
								return formattedDate;
							},
							(value: string) => {
								date = new Date(value);
							}
						}
						name="date"
						required={true}
						type="datetime-local"
					/>
				</Div>
				<Div class="flex flex-col">
					<Label>Title</Label>
					<Input bind:value={title} name="title" required={true} />
				</Div>
				<Div class="flex flex-col">
					<Label>Slug</Label>
					<Input bind:value={slug} name="slug" required={true} />
				</Div>
			</Div>
			<Div class="flex w-full flex-grow flex-col">
				<Label>Markdown</Label>
				<Textarea bind:value={md} class="flex-grow" name="md" />
			</Div>
			<SubmitButton bind:isLoading class="ml-auto">Post</SubmitButton>
		</Div>
	</Form>
	<Post
		{date}
		firstName={data.locals.user.profile.firstName}
		lastName={data.locals.user.profile.lastName}
		{md}
		{title}
	/>
</Div>
