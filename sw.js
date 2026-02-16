const CACHE_NAME = 'unsolicited-cache-v3';
const AUDIO_CACHE_NAME = 'unsolicited-audio-cache-v3';

// App Shell Assets
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/js/script.js',
    '/manifest.json'
];

// Install Event - Cache App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME && name !== AUDIO_CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Helper: Fetch and cache start of audio file
const preCacheAudioStart = async (url) => {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const existing = await cache.match(url);
    if (existing) return;

    try {
        // Range Request: First 256KB (enough for ~45s of HE-AAC v2)
        const response = await fetch(url, {
            headers: { Range: 'bytes=0-262144' }
        });

        if (response.ok || response.status === 206) {
            await cache.put(url, response.clone());
        }
    } catch (err) {
        console.error('Pre-cache failed:', err);
    }
};

// Message Handler - Trigger pre-caching from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PRECACHE_AUDIO') {
        event.data.urls.forEach(url => preCacheAudioStart(url));
    }
});

// Fetch Event - Intercept Network Requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle Audio Requests (Range Support)
    if (url.pathname.endsWith('.m4a')) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);

                // If we have the start cached and the request is for the start...
                // (Simplified: Serve cached start, let browser handle range stitching for rest)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Fallback to network
                return fetch(event.request);
            })
        );
        return;
    }

    // Handle App Shell
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
