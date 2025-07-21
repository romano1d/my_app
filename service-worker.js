const CACHE_NAME = 'music-key-cache-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Иконки, на которые ссылаются manifest и HTML head
    '/icons/icon-152x152.png',
    '/icons/icon-167x167.png',
    '/icons/icon-180x180.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // Добавьте иконку 120x120, если она есть и используется в index.html для iOS
    '/icons/icon-120x120.png' 
];

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
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Ошибка при кэшировании во время установки:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Активирован. Очищаю старые кэши...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Удаляю старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Активация завершена, беру на себя контроль над клиентами.');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Укажите точный домен вашего радиопотока.
    // Если поток идет с конкретного поддомена, убедитесь, что это учтено.
    // Пример: const audioStreamHost = 'mystream.myradio24.org';
    const audioStreamHost = 'myradio24.org'; 

    if (requestUrl.hostname.includes(audioStreamHost) || requestUrl.protocol === 'https:' && requestUrl.host === 'myradio24.org') {
        console.log('Service Worker: Запрос аудиопотока, пропускаю кэш:', event.request.url);
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Service Worker: Обслуживаю из кэша:', event.request.url);
                    return response;
                }
                console.log('Service Worker: Обслуживаю из сети (нет в кэше):', event.request.url);
                return fetch(event.request).then(
                    response => {
                        // Исправлено условие: ⓃresponseⓃ не null, статус 200, тип basic
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                ).catch(error => {
                    console.error('Service Worker: Ошибка fetch для:', event.request.url, error);
                    // Здесь можно добавить логику для отображения офлайн-страницы, если ресурс не доступен
                    // Например: return caches.match('/offline.html');
                });
            })
    );
});
