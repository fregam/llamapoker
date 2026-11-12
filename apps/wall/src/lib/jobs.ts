/**
 * What one job trace in The machine shows (src/panels/Machine.tsx): pure, so jobs.test.ts can
 * check it. The look lives in the panel and styles.css.
 */
import type { Job } from "../model";

export interface Trace {
  name: string;
  phase: string | null;
  percent: number | null; // null: the tool prints no progress, show "running"
  elapsed: string;
  word: string; // RUNNING | DONE | FAILED | STUCK | LOST
  tone: "run" | "done" | "bad";
  note: string | null; // the output file when done, the log when something went wrong
}

/** "2m 10s", "1h 03m", "45s". */
export function elapsed(from: string, to: Date): string {
  const s = Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}

export function trace(j: Job, now: Date): Trace {
  const bad = j.state === "stuck" || j.state === "failed" || j.state === "lost";
  const done = j.state === "done";
  return {
    name: j.label,
    phase: j.phase,
    percent: j.percent,
    elapsed: elapsed(j.startedAt, j.endedAt ? new Date(j.endedAt) : now),
    word: j.state.toUpperCase(),
    tone: bad ? "bad" : done ? "done" : "run",
    note: bad ? (j.log ? `log: ${j.log}` : null) : done ? j.output : null,
  };
}
