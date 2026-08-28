// `vite build` replaces this development fallback with a generated worker
// that contains the exact hashed JS and CSS files for the release.
const CACHE = "tsrm-site-dev-v4";
const CORE = ["/", "/demo", "/privacy", "/terms", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try { return await fetch(event.request); } catch {
      return event.request.mode === "navigate" ? (await caches.match("/", { ignoreVary: true })) || Response.error() : Response.error();
    }
  })());
});
