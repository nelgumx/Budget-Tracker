// Service worker: makes the app installable and keeps a copy of the app shell.
// Strategy: NETWORK FIRST, so after every deploy you always get the newest version.
// The saved copy is only used if you are offline.
const CACHE = 'budget-shell-v4';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle our own pages. Never touch Firebase sign-in or database traffic.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/__/')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
