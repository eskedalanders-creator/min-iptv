// Cacher selve appen slik at den starter raskt. Proxy (/p), spillelister og strømmer går alltid rett ut.
const CACHE = 'min-iptv-v63';
const LIBS = ['./lib/hls.min.js', './lib/mpegts.js'];
const FILES = ['./', './index.html', './manifest.webmanifest', './bg.svg', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).then(() => Promise.all(LIBS.map(u => c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/p')) return; // proxy: aldri cache
  if (/\/lib\//.test(url.pathname)) { // bibliotekene endrer seg aldri: cache først
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(x => { const cp = x.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return x; })));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
