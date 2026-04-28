import { getCachedCategories, json, methodGuard } from "./_mealdb";

export default async function handler(req: any, res: any) {
  if (!methodGuard(req, res)) {
    return;
  }

  try {
    const { data, hit } = await getCachedCategories();
    res.setHeader("X-Cache", hit ? "HIT" : "MISS");
    json(res, 200, data, "public, max-age=300, stale-while-revalidate=600");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    json(res, 502, { error: message });
  }
}
