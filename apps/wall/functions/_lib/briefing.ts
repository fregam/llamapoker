/**
 * The Gentleman's briefing, shown on the day's first open (and on `b`). Results first, then what
 * needs you, then one line on Work (spec: .scratch/wall-layout/spec.md, decision 7). Pure, so
 * briefing.test.ts can check the exact words.
 */
import type { Results, Threat, WorkLine } from "../../src/model";

export interface BriefingFacts {
  paused: boolean;
  money: Results["money"];
  subscribers: number | null;
  delta1: number | null;
  cameFrom: string | null; // first-touch sources of the subscribers who joined since yesterday, e.g. "INSTAGRAM 2 · SITE 1"
  threats: Threat[]; // ranked
  waiting: number; // approvals waiting
  work: Pick<WorkLine, "name" | "state" | "word" | "latest" | "open">[];
}

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1) + ".";

export function briefing(f: BriefingFacts): string {
  const parts: string[] = [];
  // Anything broken or paused goes above the results.
  const red = f.threats.filter((t) => t.level === "red");
  const first = [...(f.paused ? ["outbound is paused"] : []), ...red.map((t) => t.title.toLowerCase())];
  if (first.length) parts.push(`First: ${first.join("; ")}.`);
  const m = f.money;
  parts.push(m.today === null || m.month === null ? sentence(m.note) : `${m.unit} ${m.today} today, ${m.unit} ${m.month} in 30 days.`);
  if (f.subscribers === null) parts.push("I cannot see the list; Beehiiv is unreachable.");
  else {
    const d = f.delta1;
    const change = !d ? "unchanged since yesterday" : `${d > 0 ? "+" : ""}${d} since yesterday${d > 0 && f.cameFrom ? ` (${f.cameFrom})` : ""}`;
    parts.push(`${f.subscribers} on the list, ${change}.`);
  }
  const needs = f.threats.filter((t) => t.level === "amber");
  const items = needs.map((t) => t.title.toLowerCase());
  if (f.waiting) items.push(`${f.waiting} approval${f.waiting === 1 ? "" : "s"} waiting`);
  if (items.length) parts.push(`Needs you: ${items.join("; ")}.`);
  else if (!red.length) parts.push("Nothing needs you.");
  const fix = (red[0] ?? needs[0])?.fix;
  if (fix) parts.push(`I would ${fix.charAt(0).toLowerCase()}${fix.slice(1)}`);
  parts.push(`Work: ${f.work.map((w) => `${w.name} ${w.word}${w.latest ? ", " + w.latest : ""}`).join("; ")}.`);
  return parts.join(" ");
}
