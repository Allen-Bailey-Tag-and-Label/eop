<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
	import { Button, Div, H1, Modal, P, Spinner } from '$lib/components';
	import { base64Url } from '$lib/formats';
	import { Bell } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';

	let { isPermissionSet = $bindable(true) } = $props();

	let isCloseable = $state(false);
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

<Modal bind:isOpen class="flex max-w-sm flex-col items-center space-y-6 p-0" {isCloseable}>
	<Div class="flex flex-col items-center space-y-6 p-6">
		<Bell class="text-primary-500" size={80} />
		<H1>Notifications</H1>
		<P class="text-center opacity-50">
			Would you like to have notifications turned on for this device?
		</P>
	</Div>
	<Div class="flex w-full flex-col items-center">
		<Div class="relative w-full overflow-hidden">
			<Div
				class={twMerge(
					'grid w-full grid-cols-2 gap-2 p-6 transition duration-200 lg:flex lg:justify-end',
					isLoading ? '-translate-y-full' : 'translate-y-0'
				)}
			>
				{#each options as { class: className, label, onclick, variants }}
					<Button class="w-full {className}" {onclick} {variants}>
						{label}
					</Button>
				{/each}
			</Div>
			<Div
				class={twMerge(
					'absolute top-0 left-0 flex h-full w-full items-center justify-center space-x-2 p-4 transition duration-200',
					isLoading ? 'translate-y-0' : '-translate-y-full'
				)}
			>
				<Spinner />
			</Div>
		</Div>
		{#if message !== ''}
			<div class="min-h-6 px-6 pb-6" transition:slide={{ axis: 'y', duration: 200 }}>{message}</div>
		{/if}
	</Div>
</Modal>
