import test from "node:test";
import assert from "node:assert/strict";
import { check, PACK_TOKENS } from "../src/check.mjs";

const good = () => ({
  pack: "Myth: aces always lose [Q-ACES-1]. Lead: aces losing is expected in clips [Q-PREDICT-1].",
  topics: "T1 | aces | Q-ACES-1",
  quotes: '- **Q-ACES-1** (YouTube comment · en · 2026-08) "Pocket aces"\n- **Q-PREDICT-1** (YouTube comment · en · 2026-10) "worst hand"',
  study: "Evidence Q-ACES-1.",
  findings: [
    { id: "ACES", status: "finding", source_types: ["forum", "youtube"], quotes: ["Q-ACES-1"] },
    { id: "PREDICT", status: "lead", source_types: ["youtube"], quotes: ["Q-PREDICT-1"] },
  ],
});
const errorsWith = (change) => {
  const files = good();
  change(files);
  return check(files);
};

test("a clean set passes", () => assert.deepEqual(check(good()), []));

test("pack over the token budget fails", () => {
  const errors = errorsWith((f) => (f.pack += " word".repeat(PACK_TOKENS)));
  assert.match(errors.join(), /limit is 2500/);
});

test("a cited quote id must exist in quotes.md", () => {
  assert.match(errorsWith((f) => (f.topics += " Q-ACES-9")).join(), /topics\.md cites Q-ACES-9/);
});

test("a lead used without saying so fails", () => {
  const errors = errorsWith((f) => (f.pack = "Myth: aces lose in clips [Q-PREDICT-1]."));
  assert.match(errors.join(), /one-source-type lead/);
});

test("a finding needs two source types", () => {
  assert.match(errorsWith((f) => (f.findings[0].source_types = ["youtube"])).join(), /fewer than two source types/);
});

test("usernames, handles and comment permalinks fail", () => {
  assert.match(errorsWith((f) => (f.study += " said u/some_player")).join(), /Reddit username/);
  assert.match(errorsWith((f) => (f.quotes += ' "thanks @somebody"')).join(), /@handle/);
  assert.match(errorsWith((f) => (f.study += " https://youtube.com/watch?v=abc&lc=Ugx123")).join(), /YouTube comment permalink/);
});

test("non-Latin text stays out of the pack", () => {
  assert.match(errorsWith((f) => (f.pack += " 運氣")).join(), /non-Latin/);
});
