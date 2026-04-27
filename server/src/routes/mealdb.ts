import { Router, type Request, type Response } from "express";

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

const fetchMealDb = async <T>(path: string, searchParams?: URLSearchParams): Promise<T> => {
  const url = buildMealDbUrl(path, searchParams);
  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`MealDB request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

const withAsync =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown server error";
      res.status(502).json({ error: message });
    }
  };

export const mealdbRouter = Router();

mealdbRouter.get(
  "/search",
  withAsync(async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const data = await fetchMealDb<{ meals: unknown[] | null }>(
      "search.php",
      new URLSearchParams({ s: query })
    );
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    res.json(data);
  })
);

mealdbRouter.get(
  "/meal/:id",
  withAsync(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await fetchMealDb<{ meals: unknown[] | null }>(
      "lookup.php",
      new URLSearchParams({ i: id })
    );
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
    res.json(data);
  })
);

mealdbRouter.get(
  "/categories",
  withAsync(async (_req, res) => {
    const cacheKey = "categories";
    const cached = categoriesCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      res.json(cached.data);
      return;
    }

    const data = await fetchMealDb<MealDbCategoriesResponse>("categories.php");
    categoriesCache.set(cacheKey, { data, expiresAt: now + CATEGORIES_CACHE_TTL_MS });
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(data);
  })
);

mealdbRouter.get(
  "/filter",
  withAsync(async (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const data = await fetchMealDb<{ meals: unknown[] | null }>(
      "filter.php",
      new URLSearchParams({ c: category })
    );
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=240");
    res.json(data);
  })
);

mealdbRouter.get(
  "/random",
  withAsync(async (_req, res) => {
    const data = await fetchMealDb<{ meals: unknown[] | null }>("random.php");
    res.setHeader("Cache-Control", "no-store");
    res.json(data);
  })
);
