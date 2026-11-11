/**
 * The approval queue. POST /api/queue adds a piece waiting on the founder
 * ({ kind, title, preview }); POST /api/queue/<id> decides it ({ action: call | fold | raise,
 * note }). GET lists the last 50 items in any status (the evidence behind the panel).
 */
import { addQueueItem, decideQueueItem, type Env } from "../_lib/store";

const readJson = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!env.DB) return Response.json({ error: "no event store bound" }, { status: 503 });
  const body = await readJson(request);
  if (!body) return Response.json({ error: "bad json" }, { status: 400 });
  const id = params.id ? String(Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const err = id ? await decideQueueItem(env.DB, id, String(body.action ?? ""), body.note ? String(body.note).slice(0, 500) : null) : await addQueueItem(env.DB, body);
  return err ? Response.json({ error: err }, { status: 400 }) : Response.json({ ok: true });
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return Response.json({ queue: [] });
  const r = await env.DB.prepare("SELECT * FROM queue ORDER BY ts DESC LIMIT 50").all();
  return Response.json({ queue: r.results }, { headers: { "Cache-Control": "no-store" } });
};
