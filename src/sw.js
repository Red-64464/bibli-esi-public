import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();
self.addEventListener("activate", event => {
  event.waitUntil(caches.delete("bibli-esi-v3"));
});

registerRoute(
  ({ url, request }) => url.origin === self.location.origin && request.destination === "image",
  new CacheFirst({
    cacheName: "bibliesi-covers-v1",
    plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({
      maxEntries: 300,
      maxAgeSeconds: 30 * 86400,
      purgeOnQuotaError: true,
    })],
  }),
);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: "bibliesi-pages-v1", networkTimeoutSeconds: 3, plugins: [
    new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({ maxEntries: 10, purgeOnQuotaError: true }),
  ] }),
);
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") return (await matchPrecache("/index.html")) || Response.error();
  return Response.error();
});
