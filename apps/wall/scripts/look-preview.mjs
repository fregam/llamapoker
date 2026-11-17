#!/usr/bin/env node
// The wall's look, checked by eye without touching the store: serves dist/ and answers the API
// from memory. Three readings, each on its own port: the real one (read once from the running
// wall, GET only), an invented busy day (money, four channels, a failed job, cards, experiments)
// and the same day with nothing red (the amber state). Nothing here writes anywhere.
//   npm run dev                      (the wall itself, so dist/ is fresh and the real reading exists)
//   node scripts/look-preview.mjs    → real :8791, busy :8792, amber :8793
// Screenshot each at 1920x1080, with ?mode=wall, at 1366x768 and at phone width, e.g.
//   chrome --headless=new --window-size=1920,1080 --virtual-time-budget=7000 --screenshot=<png> "http://127.0.0.1:8792/?nobrief"
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const wall = process.env.WALL_URL ?? `http://127.0.0.1:${process.env.WALL_PORT ?? "8788"}`;
const real = await fetch(`${wall}/api/state`).then((r) => r.json()).catch(() => null);
if (!real?.day) {
  console.error(`look-preview: no reading from ${wall}/api/state (start the wall with npm run dev first)`);
  process.exit(1);
}
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

const D = real.day;
const at = (hm) => `${D}T${hm}:00.000Z`;
const ramp = (from, to, n = 30, wob = 0.02) => Array.from({ length: n }, (_, i) => Math.round(from + ((to - from) * i) / (n - 1) + Math.sin(i * 1.7) * (to - from) * wob));
const job = (id, station, label, state, percent, phase, started, extra = {}) => ({ id, station, label, state, percent, startedAt: at(started), lastBeat: new Date().toISOString(), endedAt: state === "running" ? null : at("07:02"), output: null, tail: null, phase, log: `logs/jobs/${D}/${id}.log`, ...extra });

const jobs = [
  job("j1", "reels-render", "only-aces v13", "running", 64, "Rendered", "07:05"),
  job("j2", "reels-render", "aces-crowd v12", "done", 100, "Encoded", "06:40"),
  job("j3", "foley", "only-aces-v12.mp4", "failed", 38, "Sampling", "06:50", { tail: "CUDA out of memory. Tried to allocate 2.40 GiB" }),
  job("j4", "research", "Creator hunt: explainers", "running", null, null, "06:58", { lostAfterSec: 5400 }),
];
const st = (id, name, state, message, lastRun, department) => ({ id, name, state, message, lastRun: lastRun ? at(lastRun) : null, nextRun: null, department, jobs: jobs.filter((j) => j.station === id) });
const content = [st("research", "research", "ok", "1 agent running", "06:58", "content"), st("hooks", "hooks", "idle", null, null, "content"), st("reels-render", "reels-render", "ok", "only-aces v13 rendering", "07:05", "content"), st("foley", "foley", "failed", "only-aces-v12.mp4 failed: CUDA out of memory", "06:50", "content"), st("teardown", "teardown", "idle", null, null, "content")];
const dev = [st("site", "Site", "ok", "200 in 313 ms", "07:23", "development"), st("seo", "SEO", "ok", "page one 2/18, indexed 13/14", "00:00", "development"), st("claude", "Claude", "ok", "5-hour 92% · weekly 64%", "07:15", "development")];

const busy = {
  ...real,
  results: {
    money: { today: 49, month: 1284, unit: "EUR", note: "" },
    subscribers: 1246,
    delta1: 9,
    delta7: 38,
    rows: [
      { channel: "newsletter", name: "NEWSLETTER", headline: 1246, unit: "subscribers", delta1: 9, delta7: 38, spark: ramp(1090, 1246), latestPost: null, extra: { signupsToday: 9, lastLetter: "016 · 52% opened", sends: 16, cameFrom: "reel 013 ×6, search ×3" }, note: "Beehiiv" },
      { channel: "ig", name: "INSTAGRAM", headline: 3420, unit: "followers", delta1: 41, delta7: 212, spark: ramp(2700, 3420, 30, 0.05), latestPost: { subject: "reel-013", ts: at("06:00"), url: null, views: 48200, likes: 1904, saves: 212, comments: 61 }, extra: {}, note: "fetch-instagram" },
      { channel: "tt", name: "TIKTOK", headline: 812, unit: "followers", delta1: -3, delta7: 44, spark: ramp(640, 812, 30, 0.08), latestPost: { subject: "reel-013", ts: at("06:00"), url: null, views: 9100, likes: 310, saves: null, comments: 12 }, extra: {}, note: "fetch-tiktok" },
      { channel: "yt", name: "YOUTUBE", headline: 96, unit: "subscribers", delta1: 0, delta7: 5, spark: [90, 96], latestPost: null, extra: {}, note: "fetch-youtube" },
    ],
  },
  work: [
    { id: "content", name: "CONTENT", state: "failed", word: "FAILED", latest: "foley only-aces-v12.mp4 failed: CUDA out of memory", open: true, stations: content },
    { id: "development", name: "DEVELOPMENT", state: "ok", word: "OK", latest: "Site: 200 in 313 ms", open: false, stations: dev },
  ],
  stations: [...content, ...dev],
  threats: [
    { id: "t1", level: "red", weight: 90, title: "FOLEY FAILED", detail: "only-aces-v12.mp4 stopped at 38%: CUDA out of memory.", fix: `Read logs/jobs/${D}/j3.log, free the GPU, run it again.` },
    { id: "t2", level: "amber", weight: 60, title: "CLAUDE 5-HOUR LIMIT AT 92%", detail: "Resets 10:30 UTC.", fix: "Hold big sessions until the reset." },
    { id: "t3", level: "amber", weight: 50, title: "A TARGET SEARCH LEFT PAGE ONE", detail: "“pot odds formula” was on page one last week and is not now.", fix: "Open the SEO pull request; the agent proposes the fix." },
    { id: "t4", level: "cyan", weight: 20, title: "LETTER BOUNCE 0.8%", detail: "Within range.", fix: "None." },
  ],
  queue: [
    { id: "pr-51", ts: at("06:12"), kind: "pull-request", title: "SEO: internal links for /learn/pot-odds", preview: "https://github.com/example/repo/pull/51\nAdds three internal links and the exact-odds table above the fold.", status: "waiting" },
    { id: "q2", ts: at("05:40"), kind: "reel", title: "003 Only playing aces? (v13)", preview: "Hook: You fold 220 hands waiting for aces.\nThen they get cracked.", status: "waiting" },
    { id: "q3", ts: at("04:10"), kind: "letter", title: "Letter 017: the hand you should have folded", preview: "Subject: the hand you should have folded\n\n1,140 words.", status: "waiting" },
  ],
  feed: [
    { id: "f1", ts: at("07:21"), kind: "signup", text: "Signup from /learn/outs (search)" },
    { id: "f2", ts: at("07:05"), kind: "job.started", text: "reels-render started: only-aces v13" },
    { id: "f3", ts: at("07:02"), kind: "fail", text: "foley failed: only-aces-v12.mp4 (CUDA out of memory)" },
    { id: "f4", ts: at("06:58"), kind: "job.started", text: "Research agent started: Creator hunt: explainers" },
    { id: "f5", ts: at("06:31"), kind: "revenue", text: "Sponsor X, letter 016: EUR 49" },
    { id: "f6", ts: at("06:12"), kind: "decision", text: "003 Only playing aces? (v12): raised (check the word save this)" },
    { id: "f7", ts: at("06:02"), kind: "run", text: "Voice board round 2", cost: 3.6 },
    { id: "f8", ts: at("00:00"), kind: "run", text: `SEO run ${D}: page one 2/18, indexed 13/14` },
    ...real.feed.slice(1, 8),
  ],
  budget: { spentMonth: 61.4, ceiling: 150, month: real.budget.month },
  experiments: [
    { id: "e1", name: "HOOK: NUMBER VS QUESTION", started: "2026-11-11", status: "too early to call", detail: "day 6 of 14 · 4 reels" },
    { id: "e2", name: "LETTER: THU VS SUN", started: "2026-11-05", status: "inconclusive", detail: "3 sends · need 6" },
  ],
  claude: { asof: at("07:15"), windows: [{ id: "five_hour", name: "5-HOUR", used: 92, resetsAt: at("10:30"), note: "" }, { id: "seven_day", name: "WEEKLY", used: 64, resetsAt: real.claude?.windows?.[1]?.resetsAt ?? at("23:00"), note: "" }] },
  briefing: "EUR 1,284 in 30 days, 49 today. 1,246 on the list, 9 more than yesterday, most from reel 013. One thing is red: foley failed on only-aces v12. Three pieces wait on you. Work: CONTENT FAILED; DEVELOPMENT OK.",
};

function serve(port, state) {
  createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const json = (o) => (res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }), res.end(JSON.stringify(o)));
    if (url.pathname === "/api/state") return json({ ...state, asof: new Date().toISOString() });
    if (url.pathname === "/api/jobs") return json({ jobs: (state.stations ?? []).flatMap((s) => s.jobs ?? []) });
    if (url.pathname.startsWith("/api/")) return json({ events: [], ok: true });
    let f = join(dist, url.pathname === "/" ? "index.html" : url.pathname);
    if (!existsSync(f)) f = join(dist, "index.html");
    res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(readFileSync(f));
  }).listen(port, "127.0.0.1");
}
// the same day with the failure taken out: panes go amber (something waits), nothing is red
const calm = (x) => ({ ...x, state: x.state === "failed" ? "ok" : x.state, message: x.state === "failed" ? null : x.message, jobs: (x.jobs ?? []).filter((j) => j.state !== "failed") });
const amber = {
  ...busy,
  work: busy.work.map((l) => ({ ...l, state: "ok", word: l.id === "content" ? "RUNNING 2" : l.word, latest: l.id === "content" ? "reels-render started: only-aces v13" : l.latest, open: false, stations: l.stations.map(calm) })),
  stations: busy.stations.map(calm),
  threats: busy.threats.filter((t) => t.level !== "red"),
  feed: busy.feed.filter((e) => e.kind !== "fail"),
  budget: { ...busy.budget, spentMonth: 131.2 },
};
serve(8791, real);
serve(8792, busy);
serve(8793, amber);
console.log("look-preview: real :8791, busy :8792, amber :8793");
