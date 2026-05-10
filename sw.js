var CACHE = 'weathervue-v2';
var STATIC_ASSETS = [
    '/',
    '/index.html',
    '/script.js',
    '/manifest.json',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

function shouldCache(url) {
    var path = url.pathname;
    if (path.indexOf('/api/') === 0) return true;
    if (path === '/' || path === '/index.html' || path === '/script.js') return true;
    if (path.indexOf('/icons/') === 0) return true;
    return false;
}

self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);
    var isApi = url.pathname.indexOf('/api/') === 0;

    // API calls: network first, cache fallback, notify client
    if (isApi) {
        event.respondWith(
            fetch(event.request).then(function (resp) {
                var clone = resp.clone();
                caches.open(CACHE).then(function (cache) { cache.put(event.request, clone); });
                return resp;
            }).catch(function () {
                return caches.match(event.request).then(function (cached) {
                    if (cached) {
                        self.clients.matchAll().then(function (clients) {
                            clients.forEach(function (c) { c.postMessage({ type: 'offline', url: url.pathname }); });
                        });
                    }
                    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
                        status: 503, headers: { 'Content-Type': 'application/json' },
                    });
                });
            })
        );
        return;
    }

    // Static assets: cache first, network fallback
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            var fetchPromise = fetch(event.request).then(function (resp) {
                if (shouldCache(url)) {
                    var clone = resp.clone();
                    caches.open(CACHE).then(function (cache) { cache.put(event.request, clone); });
                }
                return resp;
            }).catch(function () { return cached; });
            return cached || fetchPromise;
        })
    );
});
