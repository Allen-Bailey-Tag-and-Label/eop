<script lang="ts">
	import {
		Button,
		Card,
		Div,
		Form,
		H1,
		H2,
		Input,
		Modal,
		P,
		Select,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let isRevokeModalOpen = $state(false);
	let isRevoking = $state(false);
	let monitorToRevoke = $state<{ id: string; location: string }>();
</script>

<Div class="space-y-8">
	<Div class="space-y-2">
		<H1>Monitor management</H1>
		<P
			>Assign published playlists to monitors and revoke access when a device is removed or moved.</P
		>
	</Div>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status" class="text-green-700 dark:text-green-400">{form.success}</P
		>{/if}
	<Card class="space-y-4">
		<H2>Approved monitors</H2>
		{#if data.monitors.length === 0}
			<P>No monitors are currently approved.</P>
		{:else}
			<Div class="overflow-x-auto">
				<Table class="w-full text-left">
					<Thead
						><Tr><Th>Location</Th><Th>Last connected</Th><Th>Playlist</Th><Th>Access</Th></Tr
						></Thead
					>
					<Tbody>
						{#each data.monitors as monitor (monitor.id)}
							<Tr>
								<Td>{monitor.location}</Td>
								<Td
									>{monitor.lastSeenAt
										? new Date(monitor.lastSeenAt).toLocaleString()
										: 'Waiting for monitor'}</Td
								>
								<Td>
									<Form action="?/assign" class="flex min-w-64 items-end gap-2">
										<Input type="hidden" name="sessionId" value={monitor.id} />
										<Select
											name="playlistId"
											aria-label={`Playlist for ${monitor.location}`}
											value={monitor.playlistId}
											options={[
												{ value: '', label: 'No playlist' },
												...data.playlists.map((playlist) => ({
													value: playlist.id,
													label: playlist.title
												}))
											]}
										/>
										<Button type="submit">Assign</Button>
									</Form>
								</Td>
								<Td>
									<Button
										type="button"
										variants={['error', 'small']}
										onclick={() => {
											monitorToRevoke = monitor;
											isRevokeModalOpen = true;
										}}
										aria-label={`Revoke access for ${monitor.location}`}>Revoke</Button
									>
								</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Div>
		{/if}
	</Card>
</Div>

{#if isRevokeModalOpen && monitorToRevoke}
	<Modal
		bind:isOpen={isRevokeModalOpen}
		isCloseable={!isRevoking}
		role="dialog"
		aria-modal="true"
		aria-labelledby="revoke-monitor-title"
		aria-describedby="revoke-monitor-description"
	>
		<Form
			action="?/revoke"
			submitFunction={() => {
				isRevoking = true;
				return async ({ update }) => {
					try {
						await update();
					} finally {
						isRevoking = false;
						isRevokeModalOpen = false;
					}
				};
			}}
		>
			<Input type="hidden" name="sessionId" value={monitorToRevoke.id} />
			<H2 id="revoke-monitor-title">Revoke monitor access?</H2>
			<P id="revoke-monitor-description">
				Revoke access for {monitorToRevoke.location}? The monitor will return to the pairing screen
				on its next check and will need approval to reconnect.
			</P>
			{#snippet buttons()}
				<Button
					type="button"
					variants={['contrast']}
					disabled={isRevoking}
					onclick={() => (isRevokeModalOpen = false)}>Cancel</Button
				>
				<Button type="submit" variants={['error']} disabled={isRevoking}>
					{isRevoking ? 'Revoking…' : 'Revoke access'}
				</Button>
			{/snippet}
		</Form>
	</Modal>
{/if}
