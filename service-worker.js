// service-worker.js - Enhanced version
const CACHE_NAME = 'profitperplate-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/supabase.js',
  '/manifest.json',
  '/images/PPP30x30.png',
  '/images/PPP192x192.png',
  '/images/PPP512x512.png'
];

// Enhanced install event with better error handling
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('[Service Worker] Cache addAll failed:', error);
          // Continue even if some files fail to cache
        });
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        // Skip waiting so new service worker activates immediately
        return self.skipWaiting();
      })
  );
});

// Enhanced fetch event with network-first strategy for API calls
self.addEventListener('fetch', event => {
  // FIX: Skip non-GET requests AND non-HTTP/HTTPS protocols
  if (event.request.method !== 'GET') return;
  
  // FIX: Add protocol check to prevent caching extension URLs
  if (!(event.request.url.indexOf('http') === 0)) return;

  // For API calls, use network-first strategy
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // If not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Enhanced activate event with cache cleanup
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
    .then(() => {
      console.log('[Service Worker] Activated and ready');
    })
  );
});

// Handle push notifications (optional future enhancement)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ProfitPerPlate';
  const options = {
    body: data.body || 'New notification from ProfitPerPlate',
    icon: '/images/PPP192x192.png',
    badge: '/images/PPP30x30.png',
    tag: 'profitperplate-notification',
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});