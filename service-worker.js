const CACHE_NAME = 'radio-player-cache-v1';
// Определяем URL радиопотока здесь тоже, чтобы исключить его из кэширования (обновлено)
const STREAM_URL = 'https://myradio24.org/52340'; 

// Ресурсы, которые будут кэшированы при установке Service Worker
const urlsToCache = [
    '/', // Главная страница (если start_url="./")
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Добавьте пути к иконкам, которые вы указали в manifest.json
    '/icons/icon-152x152.png',
    '/icons/icon-167x167.png',
    '/icons/icon-180x180.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/maskable_icon.png' // Если добавили в манифест
    // ... другие необходимые ресурсы
];

self.addEventListener('install', event => {
    console.log('Service Worker: Установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Кэширую основные ресурсы:', urlsToCache);
                // Фильтруем STREAM_URL, чтобы он не попал в кэш
                return cache.addAll(urlsToCache.filter(url => url !== STREAM_URL)); 
            })
            .catch(error => {
                console.error('Service Worker: Ошибка при кэшировании во время установки:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Активация...');
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
        })
    );
});

self.addEventListener('fetch', event => {
    // Если запрос относится к потоковому аудио, просто пропускаем его через сеть БЕЗ кэширования
    // Убедитесь, что проверяете только hostname или часть пути, если URL может меняться динамически
    // Для потока 'https - FORBIDDEN - myradio24.org/52340' достаточно точного сравнения URL
    if (event.request.url === STREAM_URL) {
        // console.log('Service Worker: Пропускаю радиопоток:', event.request.url);
        event.respondWith(fetch(event.request));
        return; 
    }

    // Для остальных ресурсов, используем стратегию "кэш, затем сеть"
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                // console.log('Service Worker: Отдаю из кэша:', event.request.url);
                return cachedResponse;
            }

            // Важно: fetch(event.request.clone()) если запрос имеет тело (POST, PUT),
            // но для GET запросов это обычно не требуется.
            return fetch(event.request).then(
                networkResponse => {
                    // Проверяем, что ответ действителен (статус 200, не редирект, тип basic)
                    // type 'basic' означает запрос к тому же источнику
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Клонируем ответ, так как его нужно использовать дважды
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        console.log('Service Worker: Кэширую новый ресурс:', event.request.url);
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }
            ).catch(error => {
                // Этот блок обрабатывает ошибки сети для fetch
                console.error('Service Worker: Ошибка сетевого запроса или ресурс не найден в кэше:', event.request.url, error);
                
                // Если запрос был для навигации (т.е. загрузка HTML страницы)
                if (event.request.mode === 'navigate') {
                    // Можно вернуть оффлайн-страницу
                    // return caches.match('/offline.html'); 
                }
                // Для других типов запросов (изображения, скрипты, CSS)
                // можно бросить ошибку, чтобы браузер знал о сбое,
                // или вернуть какой-либо плейсхолдер.
                throw error; 
            });
        })
    );
});
