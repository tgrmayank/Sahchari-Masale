// Pushy Web Push service worker (must stay in the ROOT of the site: /service-worker.js)
importScripts('https://sdk.pushy.me/web/1.0.24/pushy-service-worker.js');

// Empty fetch handler: nothing is cached or intercepted, it only keeps the
// "installable app" criteria satisfied on every browser version.
self.addEventListener('fetch', function () {});
