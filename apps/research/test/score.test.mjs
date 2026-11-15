import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupe, normUrl, score, pickForJudging, monthsAgo } from "../src/score.mjs";

const now = new Date("2026-11-15");

test("urls normalise across www, old., trailing slash and query", () => {
  assert.equal(normUrl("https://old.reddit.com/r/poker/?x=1"), normUrl("http://www.reddit.com/r/poker"));
});

test("dedupe merges gaps instead of dropping data", () => {
  const out = dedupe([
    { url: "https://reddit.com/r/poker", followers: null, lang: "en" },
    { url: "https://www.reddit.com/r/poker/", followers: 5 },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].followers, 5);
});

test("a busy recent public source beats a dead one of equal size", () => {
  const [a, b] = score(
    [
      { name: "dead", type: "community", followers: 1000, posts_per_week: 1, comments_per_post: 1, last_activity: "2023-01", access: "public" },
      { name: "busy", type: "community", followers: 1000, posts_per_week: 100, comments_per_post: 20, last_activity: "2026-11", access: "public" },
    ],
    now,
  );
  assert.equal(a.name, "busy");
  assert.ok(a.score > b.score);
});

test("an unknown never beats a measured source of the same type and size", () => {
  const ranked = score(
    [
      { name: "m1", type: "forum-section", followers: 100, posts_per_week: 10, comments_per_post: 10, last_activity: "2026-11", access: "public" },
      { name: "m2", type: "forum-section", followers: 100, posts_per_week: 10, comments_per_post: 10, last_activity: "2026-11", access: "public" },
      { name: "unknown", type: "forum-section", followers: 100, posts_per_week: null, comments_per_post: null, last_activity: "2026-11", access: "public" },
    ],
    now,
  );
  assert.equal(ranked.at(-1).name, "unknown");
  assert.deepEqual(ranked.at(-1).imputed, ["voice"]);
});

test("months ago", () => {
  assert.equal(monthsAgo("2026-11", now), 0);
  assert.equal(monthsAgo("2025-11-03", now), 12);
  assert.equal(monthsAgo(null, now), null);
});

test("tier 3 keeps a floor for every type and language", () => {
  const rows = [];
  for (let i = 0; i < 50; i++)
    rows.push({ name: "big" + i, type: "channel", lang: "en", followers: 1e6, posts_per_week: 5, comments_per_post: 500, last_activity: "2026-11", access: "public", url: "u" + i });
  rows.push({ name: "small-pt", type: "group", lang: "pt", followers: 50, posts_per_week: 1, comments_per_post: 1, last_activity: "2026-10", access: "invite", url: "pt" });
  const pick = pickForJudging(score(rows, now), 10, 1, 1);
  assert.equal(pick.length, 10);
  assert.ok(pick.some((r) => r.name === "small-pt"));
});
