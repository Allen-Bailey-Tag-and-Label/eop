<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Form } from 'sveltewind/components';

	let buttonText = $state('Fix');
</script>

<Form
	use={[
		[
			enhance,
			() => {
				buttonText = 'Fixing';
				return () => {
					buttonText = 'Fix';
				};
			}
		]
	]}
>
	<Button type="submit">{buttonText}</Button>
</Form>
