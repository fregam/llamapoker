import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { nextRun, prCard, readingMeta, runEvent, scoreLine, stationReport } from "./wall.mjs";

// A reading in the shape scripts/scoreboard.mjs writes, cut down to two targets and three pages.
const reading = {
  date: "2026-11-23",
  summary: { pageOne: 1, targets: 2, indexed: 2, pages: 3 },
  totals: { clicks: 4, impressions: 120 },
  targets: [
    { query: "poker outs chart", page: "/learn/outs", pageOne: true },
    { query: "pot odds", page: "/learn/pot-odds", pageOne: false },
  ],
  pages: [
    { url: "https://llamapoker.com/", indexed: true },
    { url: "https://llamapoker.com/learn/outs", indexed: true },
    { url: "https://llamapoker.com/about", indexed: false },
  ],
};
const pr = { number: 47, url: "https://github.com/fregam/llamapoker/pull/47" };

test("the station line reads as the two numbers of the score", () => {
  assert.equal(scoreLine(reading.summary), "page one 1/2, indexed 2/3");
});

test("a run carries the lists the wall compares week to week, as paths and searches", () => {
  assert.deepEqual(readingMeta(reading), {
    reading: "2026-11-23",
    pageOne: 1,
    targets: 2,
    indexed: 2,
    pages: 3,
    pageOneQueries: ["poker outs chart"],
    missedQueries: ["pot odds"],
    indexedPages: ["/", "/learn/outs"],
    notIndexedPages: ["/about"],
    impressions: 120,
    clicks: 4,
  });
});

test("a clean run says the score and the pull request", () => {
  const e = runEvent({ date: "2026-11-23", branch: "seo/2026-11-23", reading, pr });
  assert.equal(e.kind, "run");
  assert.equal(e.station, "seo");
  assert.equal(e.subject, "seo/2026-11-23");
  assert.equal(e.text, "SEO run 2026-11-23: page one 1/2, indexed 2/3, pull request #47");
  assert.equal(e.meta.ok, true);
  assert.equal(e.meta.pr, 47);
  assert.deepEqual(e.meta.indexedPages, ["/", "/learn/outs"]);
});

test("a run that failed after the reading keeps the reading; one that failed before it has none", () => {
  const late = runEvent({ date: "2026-11-23", branch: "seo/2026-11-23", reading, pr, problem: "the agent step failed" });
  assert.equal(late.text, "SEO run 2026-11-23 failed: the agent step failed (page one 1/2, indexed 2/3)");
  assert.equal(late.meta.ok, false);
  assert.equal(late.meta.problem, "the agent step failed");
  assert.deepEqual(late.meta.pageOneQueries, ["poker outs chart"]);

  const early = runEvent({ date: "2026-11-23", branch: "seo/2026-11-23", problem: "git fetch origin main exited 128" });
  assert.equal(early.text, "SEO run 2026-11-23 failed: git fetch origin main exited 128");
  assert.deepEqual(early.meta, { ok: false, problem: "git fetch origin main exited 128" });
  // the wall reads "took a reading" from these lists being there
  assert.equal(early.meta.indexedPages, undefined);
});

test("the station ends ok with the score, or red with the reason, and always says when it runs next", () => {
  const now = new Date(2026, 10, 23, 7, 12); // a Monday, local time
  const ok = stationReport({ now, reading });
  assert.deepEqual({ id: ok.id, name: ok.name, department: ok.department, state: ok.state, message: ok.message }, { id: "seo", name: "SEO", department: "development", state: "ok", message: "page one 1/2, indexed 2/3" });
  assert.equal(ok.lastRun, now.toISOString());
  assert.equal(ok.nextRun, new Date(2026, 10, 30, 7, 0).toISOString());
  const bad = stationReport({ now, reading, problem: "the agent step failed" });
  assert.equal(bad.state, "failed");
  assert.equal(bad.message, "the agent step failed (page one 1/2, indexed 2/3)");
  assert.equal(stationReport({ now, problem: "x".repeat(500) }).message.length, 300);
});

test("the next run is the coming Monday at 07:00 local, also for a run started by hand", () => {
  const at = (...a) => nextRun(new Date(2026, 10, ...a));
  const monday = (d) => new Date(2026, 10, d, 7, 0).toISOString();
  assert.equal(at(17, 22, 40), monday(23)); // Tuesday night
  assert.equal(at(22, 12, 0), monday(23)); // Sunday
  assert.equal(at(23, 6, 59), monday(23)); // Monday, before the hour
  assert.equal(at(23, 7, 0), monday(30)); // Monday, on the hour: this run is that one
  assert.equal(at(23, 9, 30), monday(30));
});

test("the pull request's card has the pull request's id, its link and the report", () => {
  const card = prCard({ pr, date: "2026-11-23", report: "# SEO 2026-11-23\n\nThis week: links to the outs guide.\n" });
  assert.equal(card.id, "pr-47");
  assert.equal(card.kind, "pull-request");
  assert.equal(card.title, "SEO 2026-11-23: this week's move, pull request #47");
  assert.ok(card.preview.startsWith("https://github.com/fregam/llamapoker/pull/47\n"));
  assert.match(card.preview, /This week: links to the outs guide\./);
  assert.match(prCard({ pr, date: "2026-11-23" }).preview, /left no report/);
});

test("the runner and the launcher load and a dry run touches nothing", () => {
  for (const script of ["../scripts/run.mjs", "../scripts/weekly.mjs"]) {
    const r = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), "--dry"], { encoding: "utf8", env: { ...process.env, WALL_URL: "http://127.0.0.1:9", WALL_OUTBOX: fileURLToPath(new URL("./never-written.jsonl", import.meta.url)) } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /would run: /);
  }
});
