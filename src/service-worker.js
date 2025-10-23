/* static/sw.js */
/* global self, clients, registration */
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('push', (event) => {
	let data = {};
	try {
		data = event.data ? event.data.json() : {};
	} catch (_) {}

	const title = data.title || 'New message';
	const options = {
		body: data.body || '',
		icon: data.icon || '/icons/icon-192x192.png',
		badge: data.badge || '/icons/badge-72x72.png',
		data: {
			url: data.url || '/',
			...data
		},
		actions: data.actions || [] // [{action:'open', title:'Open'}]
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/';
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			const client = clientList.find(
				(c) => new URL(c.url).pathname === new URL(url, self.location.origin).pathname
			);
			if (client) return client.focus();
			return clients.openWindow(url);
		})
	);
});
