const PANEL_CACHE = "painel-cache-v3";
const PANEL_ASSETS = [
  "/painel.html",
  "/painel.css",
  "/painel.js",
  "/painel.webmanifest",
  "/painel-icon-192.png",
  "/painel-icon-512.png",
  "/config.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PANEL_CACHE).then((cache) => cache.addAll(PANEL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== PANEL_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate" && isSameOrigin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/painel.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const cloned = response.clone();
          caches.open(PANEL_CACHE).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("/painel.html"));
    }),
  );
});
