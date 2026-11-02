// AbsensiKu Progressive Web App Service Worker
const CACHE_NAME = 'absensiku-pwa-v2';

// Essential static assets to pre-cache
const PRECACHE_ASSETS = [
    '/',
    '/favicon.ico',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-512x512.png',
];

// Install event - precache core static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Precache asset error:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first for navigation/data, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests for same origin or fonts/images
    if (request.method !== 'GET') {
        return;
    }

    // Ignore browser extension requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 1. Static build assets (Vite build chunks, images, fonts) -> Cache-first with network fallback
    if (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/storage/') ||
        url.pathname.match(/\.(css|js|woff2|woff|ttf|png|jpg|jpeg|svg|webp|ico)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback if offline
                    return cachedResponse || new Response('', { status: 408 });
                });
            })
        );
        return;
    }

    // 2. Navigation & API/Inertia requests -> Network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return caches.match('/');
                });
            })
    );
});

