<script lang="ts">
	import { Button, Form } from 'sveltewind/components';
	import { enhance } from '$app/forms';

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
