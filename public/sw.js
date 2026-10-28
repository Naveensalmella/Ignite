// IGNITE service worker — offline shell + notifications.
// Bump CACHE when the caching strategy changes; old caches are deleted on activate.
const CACHE = "ignite-v3";
const OFFLINE_URLS = ["/", "/manifest.json", "/ignite-logo.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  // Precache what we can; a missing file must not block installation.
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(OFFLINE_URLS.map((u) => c.add(u))))
  );
  self.skipWaiting();
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
  // Only handle our own origin; never cache API responses (AI, data) or dev tooling.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/webpack-hmr") || url.pathname.startsWith("/__nextjs")) return;

  // Exercise library catalog: show the cached copy instantly, refresh in the background.
  if (url.pathname === "/data/exercise-catalog.json") {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => {
        const fresh = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fresh;
      }))
    );
    return;
  }

  // Hashed build assets and exercise demo photos never change — serve from cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/exercises/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Pages and other files: network first (always fresh), cache as offline fallback.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/") : undefined)))
      .then((res) => res || new Response("Offline", { status: 503, statusText: "Offline" }))
  );
});

// ── Push Notifications ──
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || "🔥 IGNITE", {
      body: data.body || "Time to level up!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === self.location.origin);
      return open ? open.focus() : self.clients.openWindow(target);
    })
  );
});
