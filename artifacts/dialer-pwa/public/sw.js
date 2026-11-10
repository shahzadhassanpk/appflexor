/* Scope is restricted to this artifact. Never cache API or personal task data. */
const CACHE = "appflexor-dialer-shell-v1";
const BASE = new URL("./", self.location.href);
const SHELL = new URL("./", BASE).href;
const OFFLINE = new URL("offline.html", BASE).href;
const assets = [SHELL, OFFLINE, new URL("icon.svg", BASE).href,
  new URL("icons/icon-192.png", BASE).href, new URL("icons/icon-512.png", BASE).href];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("appflexor-dialer-shell-") && key !== CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (url.pathname.includes("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      // All routes serve the same static shell, with no embedded account data.
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(SHELL, copy)));
      }
      return response;
    }).catch(async () => (await caches.match(SHELL)) || (await caches.match(OFFLINE))));
    return;
  }
  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
      }
      return response;
    })));
  }
});
