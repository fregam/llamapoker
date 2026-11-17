/**
 * The fact sheet for a hook topic: every number a hook may say, computed by the site's engine
 * (apps/web/src/poker) or by exact combinatorics. Spec: .scratch/hook-writing/spec.md.
 *
 *   npx tsx scripts/hooks/facts.ts <topic> <out-dir>     writes <out-dir>/facts.json
 *
 * `claim` states the conditions in full (the critic checks a hook's claim against it); `how` says
 * how it was computed. The equity sims have no seed, so the committed facts.json is the source of
 * truth and the iterations are high enough that the rounded value does not move.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCard, type Card } from "../../../web/src/poker/cards";
import { equityVsRandom } from "../../../web/src/poker/equity";

export interface Fact {
  id: string;
  claim: string;
  value: number;
  unit: "%" | "bb" | "hands" | "outs";
  how: string;
}

export const TOPICS = {
  "premium-only": "only playing premium hands",
  "aces-win": "how often pocket aces win",
  "draw-hits": "how often a draw comes in",
} as const;
export type Topic = keyof typeof TOPICS;

const r2 = (x: number) => Math.round(x * 100) / 100;
const pct = (x: number) => r2(x * 100);

/** Chance a draw with `outs` hits by the river from the flop (47 unseen cards, two to come). */
const byRiver = (outs: number) => 1 - ((47 - outs) / 47) * ((46 - outs) / 46);

function aces(iterations: number): Fact[] {
  const aa: [Card, Card] = [parseCard("As"), parseCard("Ah")];
  const facts: Fact[] = [];
  let headsUpLose = 0;
  for (const n of [1, 2, 3, 4, 5]) {
    const r = equityVsRandom(aa, [], n, iterations);
    if (n === 1) headsUpLose = r.lose;
    facts.push({
      id: `aa-vs-${n}`,
      claim: `AA's share of the pot against ${n} random hand${n > 1 ? "s" : ""}, all-in preflop and run to the river (ties split)`,
      value: pct(r.equity),
      unit: "%",
      how: `equityVsRandom(AsAh, [], ${n}, ${iterations})`,
    });
  }
  facts.push({
    id: "aa-lose-1",
    claim: "how often AA loses outright to one random hand, all-in preflop and run to the river",
    value: pct(headsUpLose),
    unit: "%",
    how: `equityVsRandom(AsAh, [], 1, ${iterations}).lose`,
  });
  for (const k of [10, 20]) {
    facts.push({
      id: `aa-lose-once-in-${k}`,
      claim: `chance AA loses at least once in ${k} heads-up preflop all-ins against random hands`,
      value: pct(1 - (1 - headsUpLose) ** k),
      unit: "%",
      how: `1 - (1 - aa-lose-1)^${k}`,
    });
  }
  return facts;
}

function draws(): Fact[] {
  return [
    { id: "flush-outs", claim: "outs for a flush draw on the flop", value: 9, unit: "outs", how: "13 suited - 4 seen" },
    { id: "flush-turn", claim: "flop flush draw completes on the turn", value: pct(9 / 47), unit: "%", how: "9/47" },
    { id: "flush-river", claim: "flop flush draw completes by the river (turn or river)", value: pct(byRiver(9)), unit: "%", how: "1 - 38/47 · 37/46" },
    { id: "flush-turn-to-river", claim: "a flush draw on the turn completes on the river", value: pct(9 / 46), unit: "%", how: "9/46" },
    { id: "flush-rule-of-4", claim: "rule of 4 estimate for a flop flush draw by the river (9 outs × 4)", value: 36, unit: "%", how: "9 × 4" },
    { id: "flush-rule-of-2", claim: "rule of 2 estimate for a flush draw with one card to come (9 outs × 2)", value: 18, unit: "%", how: "9 × 2" },
    { id: "oesd-outs", claim: "outs for an open-ended straight draw on the flop", value: 8, unit: "outs", how: "2 ranks × 4" },
    { id: "oesd-river", claim: "flop open-ended straight draw completes by the river", value: pct(byRiver(8)), unit: "%", how: "1 - 39/47 · 38/46" },
    { id: "gutshot-river", claim: "flop gutshot straight draw completes by the river", value: pct(byRiver(4)), unit: "%", how: "1 - 43/47 · 42/46" },
  ];
}

function premium(): Fact[] {
  const combos = 6 + 6 + 6 + 16; // AA, KK, QQ, AK
  const every = Math.round(1326 / combos);
  return [
    { id: "premium-share", claim: "share of dealt hands that are AA, KK, QQ or AK (34 of 1,326 combos)", value: pct(combos / 1326), unit: "%", how: "34/1326" },
    { id: "premium-every", claim: "on average one AA, KK, QQ or AK every this many hands", value: every, unit: "hands", how: "1326/34, rounded" },
    { id: "orbit-bb", claim: "blinds paid per orbit at a 6-max table (small 0.5 + big 1)", value: 1.5, unit: "bb", how: "0.5 + 1" },
    { id: "wait-bb", claim: "blinds paid at 6-max while waiting for one premium hand, folding everything else", value: r2(every * (1.5 / 6)), unit: "bb", how: `${every} hands × 1.5 bb / 6 (reel 002, OnlyAces.tsx)` },
  ];
}

export function factsFor(topic: Topic, iterations = 400000): Fact[] {
  if (topic === "aces-win") return aces(iterations);
  if (topic === "draw-hits") return draws();
  return premium();
}

if (process.argv[1]?.endsWith("facts.ts") && process.argv[2]) {
  const [topic, out] = [process.argv[2] as Topic, process.argv[3]];
  if (!(topic in TOPICS)) throw new Error(`unknown topic ${topic}; one of ${Object.keys(TOPICS).join(", ")}`);
  mkdirSync(out, { recursive: true });
  const facts = factsFor(topic);
  writeFileSync(join(out, "facts.json"), JSON.stringify(facts, null, 2) + "\n");
  for (const f of facts) console.log(`${f.id.padEnd(22)} ${String(f.value).padStart(7)} ${f.unit}  ${f.claim}`);
}
