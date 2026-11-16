// Nijta service worker: keeps a copy of the app on the device so it works offline.
// Strategy "network first": when you're online, Nijta always loads the newest version from the
// website (new detection rules, new policy changes). When you're offline, it uses the saved copy.
// Nothing you scan is ever sent: this only fetches Nijta's own files.
const CACHE = "nijta-app";
const FILES = [
  "./", "./index.html", "./css/styles.css", "./manifest.webmanifest",
  "./js/detectors.js", "./js/topics.js", "./js/parsers.js", "./js/scan.js", "./js/app.js",
  "./js/rights.js", "./js/policy_kb.js", "./js/policy.js", "./data/policy_changes.js",
  "./vendor/jszip.min.js", "./demo/demo-data.js", "./demo/chat.html",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html")))
  );
});
