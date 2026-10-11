// Oyunu telefonda saklar: internet yokken de açılır. İnternet varsa her zaman en yeni dosyaları alır.
const CACHE = 'wormie-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const yazi = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !yazi) return;
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok || res.type === 'opaque') {
          const kopya = res.clone();
          caches.open(CACHE).then(c => c.put(req, kopya));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })),
  );
});
