/**
 * POST /api/station — a station reports itself: { id, name, state, message, lastRun, nextRun }.
 * state is ok | idle | waiting | failed | paused | nodata. The wall's built-in stations (site,
 * signup, letter) take their state from probes and the store; a row here overrides them.
 */
import { upsertStation, type Env } from "../_lib/store";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return Response.json({ error: "no event store bound" }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const err = await upsertStation(env.DB, body ?? {});
  return err ? Response.json({ error: err }, { status: 400 }) : Response.json({ ok: true });
};
