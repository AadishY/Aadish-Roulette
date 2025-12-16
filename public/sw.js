const CACHE_NAME = 'aadish-roulette-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // We don't fail if some assets are missing, using catch
            return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('Cache addAll error', err));
        })
    );
    self.skipWaiting();
});

// Fetch event - Cache First for assets, Network First for HTML
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache First for Images, Audio, Fonts, Scripts
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|mp3|wav|ogg|glb|gltf|js|css|woff2)$/)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // Network First for everything else (HTML, API)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Activate event (clean up old caches)
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
