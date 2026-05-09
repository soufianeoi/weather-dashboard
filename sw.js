var CACHE = 'weathervue-v1';
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
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);

    // API calls: network first, fallback to cache
    if (url.pathname.indexOf('/api/') === 0) {
        event.respondWith(
            fetch(event.request).then(function (resp) {
                var clone = resp.clone();
                caches.open(CACHE).then(function (cache) { cache.put(event.request, clone); });
                return resp;
            }).catch(function () {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Static assets: cache first, network fallback
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            var fetchPromise = fetch(event.request).then(function (resp) {
                var clone = resp.clone();
                caches.open(CACHE).then(function (cache) { cache.put(event.request, clone); });
                return resp;
            }).catch(function () { return cached; });
            return cached || fetchPromise;
        })
    );
});
