const CACHE_NAME = "bibli-esi-v3";
const OFFLINE_PAGE = "/offline.html";
const PRECACHE_URLS = [OFFLINE_PAGE, "/", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(OFFLINE_PAGE)),
    );
    return;
  }

  if (["script", "style", "font"].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
        return res;
      })),
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
