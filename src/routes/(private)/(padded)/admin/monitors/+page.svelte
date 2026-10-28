<script lang="ts">
	import {
		Button,
		Card,
		Div,
		Form,
		H1,
		H2,
		Input,
		P,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let isApproving = $state(false);
</script>

<Div class="space-y-8">
	<Div class="space-y-2">
		<H1>Monitors</H1>
		<P>Approve a Raspberry Pi or other display browser using the code on its screen.</P>
		<P>Open <code>/monitors/pair</code> on the monitor to request approval.</P>
	</Div>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status" class="text-green-700 dark:text-green-400">{form.success}</P
		>{/if}
	<Card class="space-y-6">
		<H2>Approve a monitor</H2>
		<Form action="?/approve" bind:isLoading={isApproving}>
			{#snippet inputs()}
				<Input
					label="Code shown on monitor"
					aria-label="Code shown on monitor"
					name="code"
					placeholder="ABCD-EFGH"
					value={form && 'code' in form ? form.code : ''}
					autocomplete="off"
					maxlength={16}
					required
				/>
				<Input
					label="Monitor location"
					aria-label="Monitor location"
					name="location"
					placeholder="Break room, east wall"
					value={form && 'location' in form ? form.location : ''}
					minlength={2}
					maxlength={160}
					required
				/>
			{/snippet}
			{#snippet buttons()}
				<Button type="submit" disabled={isApproving}>
					{isApproving ? 'Approving…' : 'Approve monitor'}
				</Button>
			{/snippet}
		</Form>
		<P class="text-sm"
			>Codes work once and expire after 10 minutes. Approved sessions last 90 days.</P
		>
	</Card>
	<Card class="space-y-4">
		<H2>Approved monitors</H2>
		{#if data.monitors.length === 0}
			<P>No monitors are currently approved.</P>
		{:else}
			<Div class="overflow-x-auto">
				<Table class="w-full text-left">
					<Thead
						><Tr><Th>Location</Th><Th>Last connected</Th><Th>Session expires</Th><Th>Access</Th></Tr
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
								<Td>{new Date(monitor.expiresAt).toLocaleDateString()}</Td>
								<Td>
									<Form action="?/revoke" class="w-auto max-w-none space-y-0">
										<Input type="hidden" name="sessionId" value={monitor.id} />
										<Button
											type="submit"
											variants={['error', 'small']}
											aria-label={`Revoke access for ${monitor.location}`}>Revoke</Button
										>
									</Form>
								</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Div>
		{/if}
	</Card>
</Div>
