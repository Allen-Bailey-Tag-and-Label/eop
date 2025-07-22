export const localState = (key: string, initial: any) => {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
	let value = stored ? JSON.parse(stored) : initial;

	const state = $state(value);

	$effect(() => {
		if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(state));
	});

	return state;
};
