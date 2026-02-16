const CACHE_NAME = 'socraticAI-v1.5';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/i18n.js',
  './manifest.json',
  './assets/icon-192.png'
];

// Εγκατάσταση και αποθήκευση αρχείων στην cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Στρατηγική Network-first με Fallback στην cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
