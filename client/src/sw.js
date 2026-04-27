/* eslint-disable no-restricted-globals */
const CACHE_VERSION = "recipes-pwa-v2-2026-04-27";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMG_CACHE = `${CACHE_VERSION}-images`;
const OFFLINE_URL = "/offline.html";
const MAX_IMAGE_CACHE_ENTRIES = 80;
const MAX_API_CACHE_ENTRIES = 120;

const PRECACHE_URLS = [
  "/",
  "/index.html",
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
        return (await cache.match(OFFLINE_URL)) || Response.error();
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
