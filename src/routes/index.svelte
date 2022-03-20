<script>
	// imports
	import { goto } from '$app/navigation';
	import { ProgressIndicator } from '@components';
	import { auth, socket } from '@stores';

	// utilities
	const verifyToken = async () => {
		// verify token
		const verified = await auth.verify();

		if (verified) goto('/dashboard', { replaceState: true });
		if (!verified) goto('/signin', { replaceState: true });
	};

	// props (dynamic)
	$: if ($socket !== undefined) {
		verifyToken();
	}
</script>
