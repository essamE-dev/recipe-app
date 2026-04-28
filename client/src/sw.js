/* eslint-disable no-restricted-globals */
const CACHE_VERSION = "recipes-pwa-v3-2026-04-28";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMG_CACHE = `${CACHE_VERSION}-images`;
const APP_SHELL_URL = "/index.html";
const OFFLINE_URL = "/offline.html";
const MAX_IMAGE_CACHE_ENTRIES = 80;
const MAX_API_CACHE_ENTRIES = 120;

const PRECACHE_URLS = [
  "/",
  APP_SHELL_URL,
  "/manifest.webmanifest",
  OFFLINE_URL,
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("recipes-pwa-") && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) {
    return;
  }
  const overflow = keys.length - maxEntries;
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
};

const canCacheResponse = (response, mode) => {
  if (mode === "image" && response?.type === "opaque") {
    return true;
  }
  if (!response || !response.ok || response.status !== 200) {
    return false;
  }
  if (mode === "api") {
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json");
  }
  return true;
};

const staleWhileRevalidate = async (request, cacheName, mode = "generic") => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (canCacheResponse(response, mode)) {
        cache.put(request, response.clone());
        if (cacheName === IMG_CACHE) {
          void trimCache(IMG_CACHE, MAX_IMAGE_CACHE_ENTRIES);
        }
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
};

const networkFirst = async (request, cacheName, mode = "generic") => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (canCacheResponse(response, mode)) {
      cache.put(request, response.clone());
      if (cacheName === API_CACHE) {
        void trimCache(API_CACHE, MAX_API_CACHE_ENTRIES);
      }
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(APP_SHELL_URL)) || (await cache.match("/")) || (await cache.match(OFFLINE_URL)) || Response.error();
      })
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request, IMG_CACHE, "image"));
    return;
  }

  if (url.pathname === "/api/categories") {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, "api"));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      networkFirst(request, API_CACHE, "api").catch(async () => {
        const cache = await caches.open(API_CACHE);
        return (await cache.match(request)) || new Response(JSON.stringify({ meals: null }), { status: 200 });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request);
    })
  );
});

const warmCacheEntry = async (url, cacheName, mode) => {
  const requestInit = mode === "image" && /^https?:/i.test(url) ? { mode: "no-cors", credentials: "omit" } : undefined;
  const request = new Request(url, requestInit);
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (canCacheResponse(response, mode)) {
      await cache.put(request, response.clone());
      if (cacheName === IMG_CACHE) {
        await trimCache(IMG_CACHE, MAX_IMAGE_CACHE_ENTRIES);
      }
      if (cacheName === API_CACHE) {
        await trimCache(API_CACHE, MAX_API_CACHE_ENTRIES);
      }
    }
  } catch {
    // Ignore warmup failures; runtime caching still applies on normal requests.
  }
};

self.addEventListener("message", (event) => {
  const { data } = event;
  if (!data || data.type !== "WARM_CACHE" || !Array.isArray(data.urls)) {
    return;
  }

  const cacheName = data.cache === "image" ? IMG_CACHE : API_CACHE;
  const mode = data.cache === "image" ? "image" : "api";
  event.waitUntil(Promise.all(data.urls.map((url) => warmCacheEntry(url, cacheName, mode))));
});
