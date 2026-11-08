/* 토리의 반짝 달리기 — 서비스 워커: 인터넷이 있으면 새 파일, 없으면 저장해 둔 것 */
const CACHE = 'tori-run-v3';
const FILES = ['./', 'index.html', 'css/style.css?v=3', 'js/art.js?v=3', 'js/questions.js?v=3', 'js/core.js?v=3', 'js/runner.js?v=3', 'js/screens.js?v=3',
  'fonts/jua-ko.woff2', 'fonts/jua-latin.woff2', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) => fetch(f, { cache: 'reload' }).then((r) => r.ok && c.put(f, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: false }).then((m) => m || caches.match(req, { ignoreSearch: true })).then((m) => m || caches.match('index.html')))
  );
});
