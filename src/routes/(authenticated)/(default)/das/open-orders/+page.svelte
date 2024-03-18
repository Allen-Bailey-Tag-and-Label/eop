<script lang="ts">
import { enhance } from '$app/forms';
import { Button, Fieldset, Form, Modal, ProgressIndicator, Textarea } from '$components';

// handlers
const enhanceHandler = () => {
	open();
	return async ({ update }) => {
		close();
		await update();
	};
};

// props (internal)
let close: () => boolean;
let isOpen: boolean;
let open: () => boolean;
let toggle: () => boolean;
</script>

<Form class="flex-grow" use={[[enhance,enhanceHandler]]}>
	<Fieldset class="flex-grow" legend="CSV">
		<Textarea class="flex-grow" name="csv" required="required" />
	</Fieldset>
	<Button class="lg:self-end" type="submit">Submit</Button>
</Form>

<Modal
	bind:close={close}
	bind:isOpen={isOpen}
	bind:open={open}
	bind:toggle={toggle}
	class="bg-transparent text-primary-500 shadow-[inset] ring-0 dark:bg-transparent dark:shadow-none"
	isCloseable={false}
>
	<ProgressIndicator />
</Modal>
