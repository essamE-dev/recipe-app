import { fetchMealDb, getSingleQueryValue, json, methodGuard } from "./_mealdb";

export default async function handler(req: any, res: any) {
  if (!methodGuard(req, res)) {
    return;
  }

  try {
    const query = getSingleQueryValue(req.query.q);
    const data = await fetchMealDb<{ meals: unknown[] | null }>("search.php", new URLSearchParams({ s: query }));
    json(res, 200, data, "public, max-age=30, stale-while-revalidate=120");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    json(res, 502, { error: message });
  }
}
