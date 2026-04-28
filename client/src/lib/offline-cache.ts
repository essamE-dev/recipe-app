const warmRequest = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    await fetch(input, init);
  } catch {
    // Best-effort cache warming should never break the UI.
  }
};

const postWarmCacheMessage = (cache: "api" | "image", urls: string[]) => {
  if (!navigator.serviceWorker?.controller || urls.length === 0) {
    return false;
  }

  navigator.serviceWorker.controller.postMessage({
    type: "WARM_CACHE",
    cache,
    urls
  });

  return true;
};

export const warmImageCache = async (urls: Array<string | undefined>) => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))] as string[];

  if (postWarmCacheMessage("image", uniqueUrls)) {
    return;
  }

  await Promise.all(
    uniqueUrls.map((url) => {
      const requestInit: RequestInit | undefined = url.startsWith("http")
        ? { mode: "no-cors", credentials: "omit" }
        : undefined;

      return warmRequest(url, requestInit);
    })
  );
};

export const warmMealDetailsCache = async (ids: Array<string | undefined>) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))] as string[];
  const urls = uniqueIds.map((id) => `/api/meal/${id}`);

  if (postWarmCacheMessage("api", urls)) {
    return;
  }

  await Promise.all(urls.map((url) => warmRequest(url)));
};
