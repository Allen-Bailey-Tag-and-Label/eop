<script lang="ts">
	import { Div, Form, Input, Label, Post, Select, SubmitButton, Textarea } from '$lib/components';
	import { inputDate, inputDateTimeLocal } from '$lib/formats';

	let category = $state('news');
	const categoryOptions = ['News'].map((label) => ({ label, value: label.toLowerCase() }));
	let date = $state(new Date());
	let isLoading = $state(false);
	let md = $state(``);
	let slug = $state('');
	let title = $state('');

	// $effects
	$effect(() => {
		slug = title.toLowerCase().split(' ').join('-');
	});
</script>

<Div class="grid flex-grow grid-cols-2 gap-4">
	<Form bind:isLoading class="max-w-auto flex flex-grow flex-col">
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
	<Post {date} {md} {title} />
</Div>
