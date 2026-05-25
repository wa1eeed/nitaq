// ─────────────────────────────────────────────────────────────────────────────
// KILL-SWITCH service worker.
//
// Why this exists: an earlier sw.js (v0.7.0) was registered in dev mode and
// trapped users on the `/offline` page whenever the Next.js dev server
// restarted. The browser's auto-update mechanism fetches this `/sw.js` on
// every navigation; when it sees the file changed, it installs the new
// version. This new SW:
//   1. Takes over immediately (`skipWaiting()`).
//   2. Wipes ALL caches we previously created.
//   3. Unregisters itself.
//   4. Force-reloads any open tab so the user sees the live site instantly.
//   5. Never intercepts any fetch — pure pass-through.
//
// Result: any user with a stuck SW gets rescued automatically the moment
// they visit any page. PWA features will be re-introduced in a future
// release using a more conservative, prod-only registration strategy.
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  // Don't wait for old SW to be released — replace immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Clear every cache this origin owns.
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch { /* ignore */ }

    // 2. Unregister this SW so it never runs again on this origin.
    try {
      await self.registration.unregister();
    } catch { /* ignore */ }

    // 3. Force-reload every controlled page so users escape the offline view.
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        // navigate() bypasses the SW cache.
        if ('navigate' in client) client.navigate(client.url);
      }
    } catch { /* ignore */ }
  })());
});

// Explicitly do nothing on fetch — every request goes straight to the network.
self.addEventListener('fetch', () => {
  return;
});
