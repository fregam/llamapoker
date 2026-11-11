/**
 * GET /api/state[?day=YYYY-MM-DD] — the whole wall in one reading (src/model.ts WallState).
 * Today is assembled live and stored as today's snapshot; a past day comes back from its
 * snapshot or 404 if the wall was never opened that day. `days` lists the days that have one.
 */
import { readState, snapshotDays, type Env } from "../_lib/store";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const requested = new URL(request.url).searchParams.get("day");
  if (requested && !/^\d{4}-\d{2}-\d{2}$/.test(requested)) return Response.json({ error: "day must be YYYY-MM-DD" }, { status: 400 });
  const [state, days] = await Promise.all([readState(env, requested), snapshotDays(env)]);
  if (!state) return Response.json({ error: "no snapshot for that day", days }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ ...state, days }, { headers: { "Cache-Control": "no-store" } });
};
