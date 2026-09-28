self.addEventListener("push", (event) => {
	let data = {};
	try {
		data = event.data?.json() || {};
	} catch {
		data = {
			title: "Wuwiit",
			body: event.data?.text() || "You have a reminder.",
		};
	}
	event.waitUntil(
		self.registration.showNotification(data.title || "Wuwiit", {
			body: data.body || "",
			icon: "/icons/icon-192.png",
			badge: "/icons/icon-192.png",
			tag: data.tag || "wuwiit-reminder",
			data: { url: data.url || "/" },
		}),
	);
});
self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = new URL(
		event.notification.data?.url || "/",
		self.location.origin,
	).href;
	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clients) => {
				const existing = clients.find((client) =>
					client.url.startsWith(self.location.origin),
				);
				if (existing) {
					void existing.navigate(target);
					return existing.focus();
				}
				return self.clients.openWindow(target);
			}),
	);
});
