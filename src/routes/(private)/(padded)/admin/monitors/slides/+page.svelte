<script lang="ts">
	import { A, Card, Div, H1, P, Table, Tbody, Td, Th, Thead, Tr } from '$lib/components';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<Div class="space-y-6"
	><Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Monitor slides</H1><A href="/admin/monitors/slides/new">Create slide</A></Div
	>
	<P>Create drafts, preview animation, and publish slides before adding them to a playlist.</P>
	<Card
		>{#if data.slides.length}<Table class="w-full text-left"
				><Thead><Tr><Th>Slide</Th><Th>Slug</Th><Th>Published</Th></Tr></Thead><Tbody
					>{#each data.slides as slide (slide.id)}<Tr
							><Td><A href={`/admin/monitors/slides/${slide.slug}`}>{slide.title}</A></Td><Td
								>{slide.slug}</Td
							><Td
								>{slide.publishedAt
									? new Date(slide.publishedAt).toLocaleString()
									: 'Draft only'}</Td
							></Tr
						>{/each}</Tbody
				></Table
			>{:else}<P>No slides yet. Create your first slide to get started.</P>{/if}</Card
	>
</Div>
