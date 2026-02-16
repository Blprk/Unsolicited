const CACHE_NAME = 'unsolicited-cache-v13';
const AUDIO_CACHE_NAME = 'unsolicited-audio-cache-v13';

// App Shell Assets
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/js/script.js',
    '/manifest.json',
    '/assets/icons/logo.png'
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
        const range = event.request.headers.get('Range');

        // Optimization: Only intercept if we are requesting the START (bytes 0-...)
        // This prevents the "buffering hang" when seeking or continuing playback.
        if (!range || range.startsWith('bytes=0-')) {
            event.respondWith(
                caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
                    const cachedResponse = await cache.match(event.request, { ignoreSearch: true });
                    if (cachedResponse) return cachedResponse;
                    return fetch(event.request);
                })
            );
        } else {
            // Passthrough directly to network for mid-file chunks
            event.respondWith(fetch(event.request));
        }
        return;
    }

    // Handle App Shell
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
