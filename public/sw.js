self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  const message = event.data ? event.data.json() : {}

  event.waitUntil(
    self.registration.showNotification(message.title || '', {
      body: message.body,
      icon: message.icon || '/favicon.ico',
      tag: message.tag,
      renotify: Boolean(message.tag),
      data: { url: message.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href

  if (!url.startsWith(self.location.origin)) {
    event.waitUntil(self.clients.openWindow(url))
    return
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin))
      if (!open) return self.clients.openWindow(url)
      if (open.url.startsWith(url) || !open.navigate) return open.focus()
      return open.navigate(url).then((client) => (client || open).focus())
    }),
  )
})
