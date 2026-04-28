import { fetchMealDb, json, methodGuard } from "./_mealdb";

export default async function handler(req: any, res: any) {
  if (!methodGuard(req, res)) {
    return;
  }

  try {
    const data = await fetchMealDb<{ meals: unknown[] | null }>("random.php");
    json(res, 200, data, "no-store");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    json(res, 502, { error: message });
  }
}
