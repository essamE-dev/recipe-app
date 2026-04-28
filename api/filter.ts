import { fetchMealDb, getSingleQueryValue, json, methodGuard } from "./_mealdb";

export default async function handler(req: any, res: any) {
  if (!methodGuard(req, res)) {
    return;
  }

  try {
    const category = getSingleQueryValue(req.query.category);
    const data = await fetchMealDb<{ meals: unknown[] | null }>("filter.php", new URLSearchParams({ c: category }));
    json(res, 200, data, "public, max-age=60, stale-while-revalidate=240");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    json(res, 502, { error: message });
  }
}
