const CACHE = 'cb-transfers-v2';
const ASSETS = [
  'menu.html', 'index.html', 'dashboard.html', 'motorista.html', 'transfer.html',
  'icon-192.png', 'icon-512.png', 'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Dados dinâmicos (Apps Script) sempre pela rede, nunca do cache
  if (url.hostname.indexOf('script.google.com') !== -1) return;
  // Resto: rede primeiro, com cache como reserva (offline)
  e.respondWith(
    fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
