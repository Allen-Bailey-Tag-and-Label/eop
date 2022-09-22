<script>
  import { Form } from 'sveltewind/components';
  import { enhance } from '$app/forms';

  // props (external)
  export let action = undefined;
  export let method = 'POST';
  export let style = undefined;
  export let use = [enhance];
</script>

<Form {action} {method} {style} on:submit {use}>
  <slot />
</Form>
