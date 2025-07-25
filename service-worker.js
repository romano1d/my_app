// service-worker.js

// 1. Define CACHE_NAME
// Update this version number (e.g., 'v2', 'v3') whenever you make changes to
// the cached files (urlsToCache) to ensure users get the new version.
const CACHE_NAME = 'music-key-cache-v1.1'; // Changed to v1.1 for this update example

// List of static assets to cache on install
const urlsToCache = [
    '/', // Caches the root URL, usually index.html
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-152x152.png',
    '/icons/icon-167x167.png',
    '/icons/icon-180x180.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // It's good practice to cache the service worker itself for robustness
    '/service-worker.js' 
];

// 2. Install Event: Caches static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Начинаю установку...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Кэширую основные ресурсы приложения.');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Установка завершена, пропускаю ожидание.');
                // Forces the waiting service worker to become the active service worker.
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Ошибка при кэшировании во время установки:', error);
            })
    );
});

// 3. Activate Event: Cleans up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Активация...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith('music-key-cache-') && cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Удаляю старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Активирован, теперь управляет клиентами.');
            // This will take control of all clients as soon as it's activated.
            return self.clients.claim();
        })
    );
});

// 4. Fetch Event: Intercepts network requests and serves from cache or network
self.addEventListener('fetch', event => {
    // IMPORTANT: Do NOT cache the live audio stream. It should always be fetched from the network.
    const streamUrl = 'https - FORBIDDEN - myradio24.org/52340';

    if (event.request.url.includes(streamUrl)) {
        // For the radio stream, always go to the network
        // We do not cache streaming content as it's dynamic and large.
        // Also, responding with 'navigate' ensures proper handling by the browser for streaming.
        // For actual audio/video content, you might not even need to ⓃrespondWithⓃ here,
        // letting the browser handle it directly. But it's good to explicitly state.
        console.log('Service Worker: Запрос потока, проксирование напрямую:', event.request.url);
        return fetch(event.request); // Just fetch directly from network
    }

    // For other static assets, use a cache-first strategy
    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return response
            if (response) {
                console.log('Service Worker: Отдаю из кэша:', event.request.url);
                return response;
            }

            // No cache hit - fetch from network
            console.log('Service Worker: Запрос к сети:', event.request.url);
            return fetch(event.request).then(
                networkResponse => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
                    // We need to consume it once to return it to the browser, and once to cache it.
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        console.log('Service Worker: Кэширую новый ресурс:', event.request.url);
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }
            ).catch(error => {
                // This catch block handles network errors *only* for the fetch part
                console.error('Service Worker: Ошибка сетевого запроса:', event.request.url, error);
                // You could serve an offline page here if the request was for an HTML page
                // Or a placeholder image for images, etc.
                // For this app, simply failing to fetch is okay if it's a non-critical asset.
                if (event.request.mode === 'navigate') {
                    // Example: Return an offline page for navigation requests if no cache available
                    // return caches.match('/offline.html'); // You'd need to create this page
                }
                throw error; // Re-throw the error so the browser knows the request failed
            });
        })
    );
});

