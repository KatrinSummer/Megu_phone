// Offline cache. The deck and its audio are versioned together: bump VERSION
// in build-pwa and the phone quietly picks up the new words on next launch.
const VERSION = 'megu-v2';
const SHELL = ['.', 'index.html', 'app.js', 'manifest.webmanifest', 'icon.png', 'deck.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;  // sync goes to the network
  e.respondWith((async () => {
    const hit = await caches.match(e.request);
    if (hit) {
      // Serve the cached copy at once, but fetch a fresh one behind her back so
      // the next launch has it. Without this an updated app.js would never
      // reach the phone. Sound files never change, so they are left alone.
      if (!url.pathname.includes('/audio/')) e.waitUntil(refresh(e.request).catch(() => {}));
      return hit;
    }
    return refresh(e.request).catch(() => hit ?? Response.error());
  })());
});

async function refresh(request) {
  const res = await fetch(request);
  if (res.ok) (await caches.open(VERSION)).put(request, res.clone());
  return res;
}
