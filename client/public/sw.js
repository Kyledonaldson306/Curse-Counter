self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Hey! You CURSED!", body: "A punishment has been assigned." };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: "curse-detection",
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/dashboard");
        }
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CURSE_DETECTED") {
    const word = event.data.word || "unknown";
    self.registration.showNotification("Hey! You CURSED!", {
      body: `You said "${word}". A punishment has been assigned.`,
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "curse-detection-" + Date.now(),
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: "/dashboard" },
    });
  }
});
