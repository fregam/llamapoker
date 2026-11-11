/**
 * Operator switches and settings, one row each in `flags`.
 *   POST /api/flags { key, value }   keys: paused ("1" | "0", the kill switch every outbound job
 *                                    must check), budget_ceiling (EUR per month), experiments (JSON)
 *   GET  /api/flags                  all flags
 */
import { setFlag, type Env } from "../_lib/store";

const KEYS = new Set(["paused", "budget_ceiling", "experiments"]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return Response.json({ error: "no event store bound" }, { status: 503 });
  let body: { key?: unknown; value?: unknown };
  try {
    body = (await request.json()) as { key?: unknown; value?: unknown };
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const key = String(body.key ?? "");
  if (!KEYS.has(key)) return Response.json({ error: "key must be one of " + [...KEYS].join(", ") }, { status: 400 });
  const value = String(body.value ?? "").slice(0, 10000);
  if (key === "paused" && !["0", "1"].includes(value)) return Response.json({ error: "paused is 1 or 0" }, { status: 400 });
  if (key === "budget_ceiling" && Number.isNaN(Number(value))) return Response.json({ error: "budget_ceiling is a number" }, { status: 400 });
  await setFlag(env.DB, key, value);
  return Response.json({ ok: true });
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return Response.json({ flags: {} });
  const r = await env.DB.prepare("SELECT key, value, ts FROM flags").all();
  return Response.json({ flags: r.results }, { headers: { "Cache-Control": "no-store" } });
};
