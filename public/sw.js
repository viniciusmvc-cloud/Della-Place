/* Della Pace - Service Worker */
/* Handles Web Push notifications and notification clicks. */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Della Pace',
    body: 'Nova edição disponível.',
    url: '/',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (err) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/' },
    tag: payload.tag || 'della-pace',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) client.navigate(targetUrl);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      }),
  );
});
