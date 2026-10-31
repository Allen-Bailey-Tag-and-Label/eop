<script lang="ts">
	import { Button, DialogActions, Div, Modal, P, Spinner } from '$lib/components';
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

	import { base64Url } from '$lib/formats';
	import { Bell } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	let { isPermissionSet = $bindable(true) } = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let message = $state('');
	const options = [
		{
			class: 'order-2',
			label: 'Yes Please!',
			onclick: async () => {
				await subscribeToPush();
			},
			variants: []
		},
		{
			class: 'order-1',
			label: 'No Thanks',
			onclick: async () => {
				await unsubscribeToPush();
			},
			variants: ['ghost']
		}
	];
	const subscribeToPush = async () => {
		isLoading = true;
		if (
			!('Notification' in window) ||
			!('serviceWorker' in navigator) ||
			!('PushManager' in window)
		) {
			isLoading = false;
			message = 'Push not supported on this device/browser';
			return;
		}

		message = 'Requesting permission';
		const permission = await Notification.requestPermission();
		if (permission !== 'granted') {
			isLoading = false;
			message = 'Notification permission denied';
		}

		message = 'Registering';
		const registration = await navigator.serviceWorker.ready;

		message = 'Subscribing';
		let subscription = await registration.pushManager.getSubscription();
		if (!subscription) {
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: base64Url(
					PUBLIC_VAPID_PUBLIC_KEY
				).to.uInt8Array() as unknown as BufferSource
			});
		}

		await fetch('/api/push/subscribe', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(subscription)
		});

		await invalidateAll();
	};

	const unsubscribeToPush = async () => {
		isLoading = true;
		if (
			!('Notification' in window) ||
			!('serviceWorker' in navigator) ||
			!('PushManager' in window)
		) {
			isLoading = false;
			message = 'Push not supported on this device/browser';
			return;
		}

		message = 'Unsubscribing';
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			const unsubscribe = await subscription.unsubscribe();

			if (unsubscribe) {
				await fetch('/api/push/unsubscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' }
				});
			}
		}

		await invalidateAll();
	};

	$effect(() => {
		const isOpenValue = !isPermissionSet;
		isOpen = isOpenValue;
	});
</script>

<Modal title="Notifications" bind:isOpen class="w-full max-w-sm space-y-6">
	<Div class="flex flex-col items-center gap-6">
		<Bell class="text-primary-500" size={80} />
		<P class="text-center opacity-50"
			>Would you like to have notifications turned on for this device?</P
		>
	</Div>
	{#if isLoading}<Div class="flex justify-center"><Spinner /></Div>{/if}
	{#if message !== ''}<div class="min-h-6" transition:slide={{ axis: 'y', duration: 200 }}>
			{message}
		</div>{/if}
	<DialogActions onClose={() => (isOpen = false)}>
		{#each options as { label, onclick, variants } (label)}<Button
				{onclick}
				{variants}
				disabled={isLoading}>{label}</Button
			>{/each}
	</DialogActions>
</Modal>
