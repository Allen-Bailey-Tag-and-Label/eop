<script lang="ts">
	import { A, Card, Div, H1, P, Table, Tbody, Td, Th, Thead, Tr } from '$lib/components';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<Div class="space-y-6"
	><Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Monitor playlists</H1><A href="/admin/monitors/playlists/new">Create playlist</A></Div
	>
	<P
		>Choose slide order and durations, publish, then assign a playlist to a monitor in Monitor
		management.</P
	>
	<Card
		>{#if data.playlists.length}<Table class="w-full text-left"
				><Thead><Tr><Th>Playlist</Th><Th>Slug</Th><Th>Published</Th></Tr></Thead><Tbody
					>{#each data.playlists as playlist (playlist.id)}<Tr
							><Td><A href={`/admin/monitors/playlists/${playlist.slug}`}>{playlist.title}</A></Td
							><Td>{playlist.slug}</Td><Td
								>{playlist.publishedAt
									? new Date(playlist.publishedAt).toLocaleString()
									: 'Draft only'}</Td
							></Tr
						>{/each}</Tbody
				></Table
			>{:else}<P>No playlists yet. Publish slides, then create a playlist.</P>{/if}</Card
	>
</Div>
