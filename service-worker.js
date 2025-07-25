// service-worker.js

const CACHE_NAME = 'music-key-cache-v1'; // Увеличивайте 'v1' на 'v2', 'v3' и т.д., когда хотите принудительно обновить кэш.

// Список URL-адресов для кэширования во время установки
const urlsToCache = [
    '/', // Корневой путь приложения
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    // Иконки, на которые ссылаются manifest и HTML head
    '/icons/icon-152x152.png',
    '/icons/icon-167x167.png',
    '/icons/icon-180x180.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
    // НЕ кэшируйте URL аудиопотока здесь (https - FORBIDDEN - myradio24.org/52340),
    // так как это динамический поток, который лучше обрабатывать непосредственно медиа-элементом браузера.
];

// 1. Событие установки: Кэширование статических ресурсов
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
                // Принудительно заставляет ожидающий Service Worker стать активным.
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Ошибка при кэшировании во время установки:', error);
            })
    );
});

// 2. Событие активации: Очистка старых кэшей
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
            // Это гарантирует, что Service Worker контролирует существующие клиенты сразу после активации.
            return self.clients.claim();
        })
    );
});

// 3. Событие fetch: Перехват сетевых запросов
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Определяем, является ли запрос запросом аудиопотока
    const audioStreamHost = 'myradio24.org'; // Или полный URL 'https - FORBIDDEN - myradio24.org/52340'
    if (requestUrl.hostname.includes(audioStreamHost)) {
        // Для аудиопотока напрямую обращаемся к сети.
        // Не кэшируем сам поток через Service Worker.
        console.log('Service Worker: Запрос аудиопотока, пропускаю кэш:', event.request.url);
        event.respondWith(fetch(event.request));
        return; // Важно вернуться здесь, чтобы предотвратить дальнейшую обработку
    }

    // Для всех остальных запросов (статические ресурсы)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если найдено в кэше - возвращаем ответ
                if (response) {
                    console.log('Service Worker:Обслуживаю из кэша:', event.request.url);
                    return response;
                }
                // Если не найдено в кэше - получаем из сети
                console.log('Service Worker: Обслуживаю из сети (нет в кэше):', event.request.url);
                return fetch(event.request).then(
                    response => {
                        // Проверяем, получили ли мы действительный ответ
                        // (например, чтобы не кэшировать ошибки 404 или ответы не от сети)
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // ВАЖНО: Клонируйте ответ. Ответ — это поток
                        // и может быть использован только один раз. Мы должны клонировать его, чтобы
                        // и браузер, и кэш могли его использовать.
                        const responseToCache = response.clone();

                        // Кэшируем только если метод запроса GET
                        if (event.request.method === 'GET') {
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                    console.log('Service Worker: Кэширую новый ресурс:', event.request.url);
                                })
                                .catch(e => {
                                    console.error('Service Worker: Ошибка при кэшировании нового ресурса:', event.request.url, e);
                                });
                        }
                        return response;
                    }
                );
            })
            .catch(error => {
                console.error('Service Worker: Ошибка при обработке запроса:', error);
                // Здесь можно вернуть запасную страницу для сценариев офлайн,
                // например, return caches.match('/offline.html');
                // Для радио-плеера, если базовые ресурсы не загружаются, приложение может просто не работать.
            })
    );
});
