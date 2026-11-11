/**
 * POST /api/event — the write path of the store. Body: one event or an array of events in the
 * common format (src/model.ts WallEvent; only `kind` is required, `ts` defaults to now).
 * Agents and scripts call it with the ingest key (scripts/wall-event.mjs); the wall itself with
 * its session cookie. GET lists the latest events for a station or kind (evidence views).
 */
import { insertEvents, normaliseEvent, type Env } from "../_lib/store";
import type { WallEvent } from "../../src/model";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return Response.json({ error: "no event store bound" }, { status: 503 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const inputs = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
  if (inputs.length > 500) return Response.json({ error: "at most 500 events per call" }, { status: 400 });
  const events: WallEvent[] = [];
  for (const i of inputs) {
    const e = normaliseEvent(i ?? {});
    if (typeof e === "string") return Response.json({ error: e }, { status: 400 });
    events.push(e);
  }
  await insertEvents(env.DB, events);
  return Response.json({ ok: true, stored: events.length, ids: events.map((e) => e.id) });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return Response.json({ events: [], error: "no event store bound" });
  const q = new URL(request.url).searchParams;
  const station = q.get("station");
  const kind = q.get("kind");
  const limit = Math.min(500, Number(q.get("limit") ?? 100) || 100);
  const where: string[] = [];
  const binds: string[] = [];
  if (station) {
    where.push("station = ?");
    binds.push(station);
  }
  if (kind) {
    where.push("kind = ?");
    binds.push(kind);
  }
  const sql = `SELECT * FROM events${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY ts DESC LIMIT ${limit}`;
  const r = await env.DB.prepare(sql)
    .bind(...binds)
    .all();
  return Response.json({ events: r.results }, { headers: { "Cache-Control": "no-store" } });
};
