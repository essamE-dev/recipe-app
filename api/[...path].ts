type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

type MealDbCategoriesResponse = {
  categories: Array<{
    idCategory: string;
    strCategory: string;
    strCategoryThumb: string;
    strCategoryDescription: string;
  }>;
};

const categoriesCache = new Map<string, CacheEntry<MealDbCategoriesResponse>>();
const CATEGORIES_CACHE_TTL_MS = 1000 * 60 * 15;

const buildMealDbUrl = (path: string, searchParams?: URLSearchParams): string => {
  const base = process.env.MEALDB_API_BASE ?? "https://www.themealdb.com/api/json/v1";
  const key = process.env.MEALDB_API_KEY ?? "1";
  const url = new URL(`${base}/${key}/${path}`);
  if (searchParams) {
    url.search = searchParams.toString();
  }
  return url.toString();
};

const json = (res: any, status: number, body: unknown, cacheControl?: string) => {
  if (cacheControl) {
    res.setHeader("Cache-Control", cacheControl);
  }
  res.status(status).json(body);
};

const fetchMealDb = async <T>(path: string, searchParams?: URLSearchParams): Promise<T> => {
  const url = buildMealDbUrl(path, searchParams);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`MealDB request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const rawPath = Array.isArray(req.query.path) ? req.query.path.join("/") : String(req.query.path ?? "");
  const segments = rawPath.split("/").filter(Boolean);
  const route = segments[0] ?? "";

  try {
    if (route === "health") {
      json(res, 200, { ok: true });
      return;
    }

    if (route === "categories") {
      const cacheKey = "categories";
      const cached = categoriesCache.get(cacheKey);
      const now = Date.now();
      if (cached && cached.expiresAt > now) {
        res.setHeader("X-Cache", "HIT");
        json(res, 200, cached.data, "public, max-age=300, stale-while-revalidate=600");
        return;
      }
      const data = await fetchMealDb<MealDbCategoriesResponse>("categories.php");
      categoriesCache.set(cacheKey, { data, expiresAt: now + CATEGORIES_CACHE_TTL_MS });
      res.setHeader("X-Cache", "MISS");
      json(res, 200, data, "public, max-age=300, stale-while-revalidate=600");
      return;
    }

    if (route === "search") {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      const data = await fetchMealDb<{ meals: unknown[] | null }>("search.php", new URLSearchParams({ s: query }));
      json(res, 200, data, "public, max-age=30, stale-while-revalidate=120");
      return;
    }

    if (route === "filter") {
      const category = typeof req.query.category === "string" ? req.query.category : "";
      const data = await fetchMealDb<{ meals: unknown[] | null }>("filter.php", new URLSearchParams({ c: category }));
      json(res, 200, data, "public, max-age=60, stale-while-revalidate=240");
      return;
    }

    if (route === "meal") {
      const id = segments[1] ?? "";
      const data = await fetchMealDb<{ meals: unknown[] | null }>("lookup.php", new URLSearchParams({ i: id }));
      json(res, 200, data, "public, max-age=120, stale-while-revalidate=300");
      return;
    }

    if (route === "random") {
      const data = await fetchMealDb<{ meals: unknown[] | null }>("random.php");
      json(res, 200, data, "no-store");
      return;
    }

    json(res, 404, { error: "Route not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    json(res, 502, { error: message });
  }
}
