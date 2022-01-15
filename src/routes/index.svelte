<script>
	// imports
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Route, Spinner } from '$components';
	import { socket, token } from '$stores'

	// utilities
	const verifyToken = async () => {
		// verify token
		const verified = await token.verify();

		if (verified) goto('/dashboard', { replaceState: true });
		if (!verified) goto('/signin', { replaceState: true });
	}

	// handlers

	// props (internal)

	// props (external)

	// props (dynamic)
	$: if ($socket !== undefined) verifyToken();

	// lifecycle
	const lifecycle = {
    destroy: () => {},
    mount: async () => {
		},
  };
  onMount(async () => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    };
  });
</script>

<Route>
	<Spinner />
</Route>

<slot/>