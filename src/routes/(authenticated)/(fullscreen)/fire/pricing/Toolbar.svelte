<script lang="ts">
import { Button, Card, Icon, Modal, Tooltip } from '$components';
import { MagnifyingGlass, Plus } from '$icons';

type Modal = {
	close?: () => boolean;
	isOpen?: boolean;
	open?: () => boolean;
	toggle?: () => boolean;
};

// props (internal)
const find: Modal = {};
</script>

<Card class="flex flex-row space-x-2 rounded-none p-2">
	<Tooltip class="z-[2]" position="bottom" tooltip="Find">
		<Button class="px-2 py-2" on:click={find.open} variants={['icon']}>
			<Icon class="h-4 w-4" src={MagnifyingGlass} />
		</Button>
	</Tooltip>
	<Tooltip class="z-[2]" position="bottom" tooltip="Save">
		<Button class="px-2 py-2" variants={['icon']}>
			<Icon class="h-4 w-4" src={Plus} />
		</Button>
	</Tooltip>
</Card>

<Modal
	bind:close={find.close}
	bind:isOpen={find.isOpen}
	bind:open={find.open}
	bind:toggle={find.toggle}
	class="pt-12"
>
	Find
</Modal>
