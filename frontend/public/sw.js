const cacheName = "whatsnote_cache_v1";

self.addEventListener("fetch", (event) => {
  // Check if this is a request for a static asset
  if (!event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(cacheName).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Start a fetch request for the requested URL to revalidate the resource
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });

          // Either return the cachedResponse if found or a promise which will
          // eventually resolve with the network response
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
