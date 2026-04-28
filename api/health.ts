import { json, methodGuard } from "./_mealdb";

export default function handler(req: any, res: any) {
  if (!methodGuard(req, res)) {
    return;
  }
  json(res, 200, { ok: true });
}
