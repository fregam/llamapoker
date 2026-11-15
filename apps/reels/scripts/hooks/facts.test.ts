// Run: npx tsx --test scripts/hooks/facts.test.ts   (from apps/reels)
// Expected values are published equities and hand-worked combinatorics, not engine output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { factsFor, type Fact } from "./facts";

const byId = (facts: Fact[], id: string) => {
  const f = facts.find((x) => x.id === id);
  assert.ok(f, `missing fact ${id}`);
  return f!;
};

test("aces: published preflop equities vs random hands", () => {
  const f = factsFor("aces-win", 60000);
  assert.ok(Math.abs(byId(f, "aa-vs-1").value - 85.2) < 0.8); // AA vs one random hand ≈ 85.2 %
  assert.ok(Math.abs(byId(f, "aa-vs-4").value - 55.9) < 1.5); // AA vs four random hands ≈ 56 %
  for (const x of f) assert.ok(x.claim.length > 20 && x.how.length > 5, `${x.id} states its conditions`);
});

test("draws: exact flop-to-river odds", () => {
  const f = factsFor("draw-hits");
  assert.equal(byId(f, "flush-turn").value, 19.15); // 9/47
  assert.equal(byId(f, "flush-river").value, 34.97); // 1 - 38/47 · 37/46
  assert.equal(byId(f, "oesd-river").value, 31.45); // 1 - 39/47 · 38/46
  assert.equal(byId(f, "flush-rule-of-4").value, 36);
});

test("premium only: reel 002's numbers", () => {
  const f = factsFor("premium-only");
  assert.equal(byId(f, "premium-share").value, 2.56); // 34 / 1326 combos
  assert.equal(byId(f, "premium-every").value, 39); // one premium every 39 hands
  assert.equal(byId(f, "wait-bb").value, 9.75); // 39 hands × 1.5 bb / 6
});
