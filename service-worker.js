/* service-worker.js — lets Quest Academy install as an app and open offline.
   Strategy: NETWORK-FIRST for the app's own files (so a new upload to GitHub
   shows up straight away — no stale versions), with the cache as the offline
   fallback. The versioned Firebase SDK files are cache-first. Firebase login
   and database calls are never cached. */
const CACHE = "quest-academy-v2";
const CORE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/firebase-config.js",
  "./js/art.js",
  "./js/questions/english.js",
  "./js/questions/bahasa.js",
  "./js/questions/maths.js",
  "./js/data.js",
  "./js/store.js",
  "./js/sound.js",
  "./js/firebase.js",
  "./js/report.js",
  "./js/ui.js",
  "./js/main.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg"
];
const SDK_PREFIX = "https://www.gstatic.com/firebasejs/";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Firebase SDK scripts — the URL carries the version, so cache-first is safe.
  if (req.url.indexOf(SDK_PREFIX) === 0) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Anything else on another origin (login, database) — straight to network.
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: true }).then((hit) =>
        hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined)
      )
    )
  );
});
