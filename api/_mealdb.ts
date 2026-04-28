type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export type MealDbCategoriesResponse = {
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

export const json = (res: any, status: number, body: unknown, cacheControl?: string) => {
  if (cacheControl) {
    res.setHeader("Cache-Control", cacheControl);
  }
  res.status(status).json(body);
};

export const methodGuard = (req: any, res: any) => {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
};

export const getSingleQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return typeof value === "string" ? value : "";
};

export const fetchMealDb = async <T>(path: string, searchParams?: URLSearchParams): Promise<T> => {
  const url = buildMealDbUrl(path, searchParams);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`MealDB request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const getCachedCategories = async () => {
  const cacheKey = "categories";
  const cached = categoriesCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return { data: cached.data, hit: true };
  }

  const data = await fetchMealDb<MealDbCategoriesResponse>("categories.php");
  categoriesCache.set(cacheKey, { data, expiresAt: now + CATEGORIES_CACHE_TTL_MS });
  return { data, hit: false };
};
