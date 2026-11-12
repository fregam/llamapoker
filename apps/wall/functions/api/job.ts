/**
 * POST /api/job — a local job reports itself (scripts/job.mjs): { id, station, label, state,
 * percent?, startedAt?, endedAt?, output?, tail? }. state is running | done | failed | stuck;
 * every call is also the job's heartbeat. The row is overwritten, not kept: the history goes
 * to /api/event (job.started, job.done, ...). A new station name creates its station.
 */
import { normaliseJob, upsertJob, type Env } from "../_lib/store";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return Response.json({ error: "no event store bound" }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const job = normaliseJob(body ?? {});
  if (typeof job === "string") return Response.json({ error: job }, { status: 400 });
  await upsertJob(env.DB, job);
  return Response.json({ ok: true });
};
