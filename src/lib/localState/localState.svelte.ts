import { browser } from '$app/environment';

export const localState = <T>(key: string, initialValue: T) => {
	let state = $state(initialValue);
	if (browser && typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem(key);
		const value = saved ? JSON.parse(saved) : initialValue;

		const state = $state(value);

		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(key, JSON.stringify(state));
			});
		});
	}
	return state;
};
