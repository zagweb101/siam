/* ============================================================
   service-worker.js — offline app shell (PWA)
   ============================================================ */
const CACHE = "siam-v4";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/config.js",
  "./js/auth.js",
  "./js/i18n.js",
  "./js/data.js",
  "./js/api.js",
  "./js/store.js",
  "./js/wizard.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Everything: NETWORK-FIRST (always fetch the latest code/data when online),
  // fall back to the cache only when offline. This avoids serving stale JS/CSS.
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || (url.origin === location.origin ? caches.match("./index.html") : undefined)))
  );
});
