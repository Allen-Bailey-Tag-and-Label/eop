<script lang="ts">
	import { Button, Icon, Modal, PrismaTable, Td } from '$lib/components';
	import { type SnippetProps } from '$lib/prismaTable/types';
	import { Eye } from 'sveltewind/icons';
	import type { PageData } from './$types';

	type ModalType = {
		close?: () => void;
		data: Record<string, any>;
		open?: () => void;
	};
	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	const columnOverrides = new Map([['data', { snippet: LogSnippet, width: 48 }]]);
	const modal: ModalType = $state({
		data: {}
	});
</script>

<PrismaTable {...data} {columnOverrides} />

{#snippet LogSnippet({ object }: SnippetProps)}
	<Td class="py-0">
		<Button
			class="my-auto px-2 py-1"
			onclick={() => {
				modal.data = JSON.parse(object.data);
				if (modal.open) modal.open();
			}}
			variants={['default', 'icon']}
		>
			<Icon src={Eye} />
		</Button>
	</Td>
{/snippet}

<Modal bind:close={modal.close} bind:open={modal.open}>
	<pre>{JSON.stringify(modal.data, null, 2)}</pre>
</Modal>
