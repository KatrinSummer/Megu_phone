// Offline cache. The app itself is fetched fresh every launch; the cache is
// what keeps it working with no signal. Sound is the opposite: cached forever.
const VERSION = 'megu-v2';
const SHELL = ['.', 'index.html', 'app.js', 'manifest.webmanifest', 'icon.png', 'deck.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Old versions kept the sound in the same cache as the shell, so throw away
    // only the shell files. Dropping the whole cache would cost her the 808
    // downloads, and a bumped version is not worth that.
    for (const key of await caches.keys()) {
      if (key === VERSION) continue;
      const old = await caches.open(key);
      for (const req of await old.keys()) {
        if (!new URL(req.url).pathname.includes('/audio/')) await old.delete(req);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;  // sync goes to the network

  // Sound never changes and there is a lot of it: cache wins, network only if missing.
  if (url.pathname.includes('/audio/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit ?? refresh(e.request)));
    return;
  }

  // The app itself asks the network first. Serving it from cache meant a change
  // landed only on the launch after next, and caches.match searches every cache,
  // so a stale copy in an old one beat the fresh copy forever.
  // 'no-cache' revalidates instead of trusting the browser's own copy, which
  // GitHub Pages lets it hold for ten minutes. An ETag match costs nothing.
  e.respondWith(refresh(e.request, 'no-cache')
    .catch(async () => (await caches.match(e.request)) ?? Response.error()));
});

async function refresh(request, cache) {
  const res = await fetch(request, cache ? { cache } : undefined);
  if (res.ok) (await caches.open(VERSION)).put(request, res.clone());
  return res;
}
