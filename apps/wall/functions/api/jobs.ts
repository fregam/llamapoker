/**
 * GET /api/jobs — today's local jobs only (scripts/job.mjs), for the traces in The machine to poll
 * every few seconds while something runs. Cheap on purpose: no site probe, no Beehiiv, no
 * snapshot, unlike /api/state.
 */
import { day } from "../../src/model";
import { readJobs, type Env } from "../_lib/store";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return Response.json({ jobs: [], error: "no event store bound" });
  const now = new Date();
  const jobs = await readJobs(env.DB, now, new Date(day(now) + "T00:00:00Z"));
  return Response.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
};
