const CACHE_NAME = 'tipidbuddy-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Update service worker and clean old caches
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
    // Claim clients immediately
    return self.clients.claim();
});

// Robust Fetch Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Calls & Supabase -> Network Only (Never Cache)
    if (url.pathname.startsWith('/functions/') || url.hostname.includes('supabase.co')) {
        return; // Fallback to network
    }

    // 2. Navigation (HTML) -> Network First (Fresh content, fallback to cache)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // 3. Static Assets (JS, CSS, Images) -> Stale-While-Revalidate
    // Serve from cache immediately, but update cache in background
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Check if valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                });

                // Return cached response if available, otherwise wait for network
                return cachedResponse || fetchPromise;
            })
    );
});
