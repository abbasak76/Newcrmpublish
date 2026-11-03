const CACHE_NAME = 'akhavan-crm-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/fonts/webfonts/Vazirmatn-UI-Regular.woff2',
  '/fonts/webfonts/Vazirmatn-UI-Medium.woff2',
  '/fonts/webfonts/Vazirmatn-UI-SemiBold.woff2',
  '/fonts/webfonts/Vazirmatn-UI-Bold.woff2',
  '/fonts/webfonts/Vazirmatn-UI-ExtraBold.woff2',
  '/fonts/webfonts/Vazirmatn-UI-Black.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // فقط درخواست‌های GET را کش می‌کنیم (درخواست‌های POST/PUT مربوط به API هستند و نباید کش شوند)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر در کش بود، همان را برگردان
        if (response) {
          return response;
        }
        // در غیر این صورت از شبکه بگیر
        return fetch(event.request).then(
          (response) => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});
