import { fetchMealDb, json, methodGuard } from "../_mealdb";

export default async function handler(req: any, res: any) {
  if (!methodGuard(req, res)) {
    return;
  }

  try {
    const rawId = req.query.id;
    const id = Array.isArray(rawId) ? String(rawId[0] ?? "") : String(rawId ?? "");
    const data = await fetchMealDb<{ meals: unknown[] | null }>("lookup.php", new URLSearchParams({ i: id }));
    json(res, 200, data, "public, max-age=120, stale-while-revalidate=300");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    json(res, 502, { error: message });
  }
}
