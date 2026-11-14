/**
 * The store against a real D1: wrangler's getPlatformProxy gives the same binding `wrangler pages
 * dev` uses, from wrangler.toml, in memory (`persist: false`), with the real migrations applied.
 * Writes go through the same functions the API routes use; the reading comes from readState, as
 * GET /api/state. Beehiiv and the site probe are faked at fetch: tests never call a real service.
 * Each test gets a fresh, empty database.
 */
/// <reference types="vite/client" />
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { insertEvents, normaliseEvent, normaliseJob, readState, upsertJob, upsertStation, type Env } from "./store";
import type { WallEvent } from "../../src/model";

// Every migration as text, in file-name order (Vite reads them; no Node APIs in this project).
const MIGRATIONS = Object.entries(import.meta.glob<string>("../../migrations/*.sql", { query: "?raw", import: "default", eager: true }))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, sql]) => sql);
const DAY = 86400000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const sec = (msAgo: number) => Math.floor((Date.now() - msAgo) / 1000);

let proxy: PlatformProxy<{ DB: D1Database }>;
let env: Env;

/** Beehiiv as the wall reads it: the publication's stats, its subscriptions, its last post. */
function fakeBeehiiv(opts: { down?: boolean } = {}) {
  const real = globalThis.fetch;
  const subs = [
    { created: sec(20 * DAY), status: "active" },
    { created: sec(3 * DAY), status: "active", utm_source: "ig" },
    { created: sec(2 * 3600000), status: "active", utm_source: "ig" },
  ];
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://llamapoker.com")) return Promise.resolve(new Response("", { status: 200 }));
    if (url.startsWith("https://api.beehiiv.com")) {
      if (opts.down) return Promise.resolve(json({ error: "down" }, 503));
      if (url.includes("/subscriptions")) return Promise.resolve(json({ data: subs, total_pages: 1 }));
      if (url.includes("/posts")) return Promise.resolve(json({ total_results: 1, data: [{ publish_date: sec(5 * DAY) }] }));
      return Promise.resolve(json({ data: { stats: { active_subscriptions: 3, total_sent: 1, average_open_rate: 0.5 } } }));
    }
    return real(input, init);
  });
}

async function write(events: Record<string, unknown>[]) {
  const ok = events.map((e) => normaliseEvent(e)).filter((e): e is WallEvent => typeof e !== "string");
  expect(ok).toHaveLength(events.length);
  await insertEvents(env.DB!, ok);
}

beforeEach(async () => {
  // wrangler.toml is found from the working directory (apps/wall, locally and in CI).
  proxy = await getPlatformProxy<{ DB: D1Database }>({ persist: false, envFiles: [], remoteBindings: false });
  const db = proxy.env.DB;
  expect(MIGRATIONS.length).toBeGreaterThanOrEqual(5);
  for (const raw of MIGRATIONS) {
    const statements = raw.replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
  env = { DB: db, BEEHIIV_API_KEY: "test", BEEHIIV_PUBLICATION_ID: "pub_test" };
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await proxy.dispose();
});

describe("store + D1: Results", () => {
  it("reads money, a social row and the Newsletter from what was written", async () => {
    fakeBeehiiv();
    await write([
      { kind: "revenue", amount: 10, unit: "EUR", channel: "sponsor", ts: iso(60000) },
      { kind: "revenue", amount: 99, unit: "USD", channel: "sponsor", ts: iso(60000) },
      { kind: "followers", channel: "instagram", amount: 100, ts: iso(DAY + 3600000) },
      { kind: "followers", channel: "instagram", amount: 120, ts: iso(60000) },
      { kind: "post", channel: "instagram", subject: "reel-003", ts: iso(3600000), meta: { views: 900, likes: 40 } },
    ]);
    const s = await readState(env);
    expect(s?.results?.money).toMatchObject({ today: 10, month: 10, note: "revenue events" });
    expect(s?.results?.rows.map((r) => r.channel)).toEqual(["newsletter", "ig"]);
    expect(s?.results?.rows[1]).toMatchObject({ headline: 120, delta1: 20, latestPost: { subject: "reel-003", views: 900, likes: 40 } });
    expect(s?.results?.rows[0]).toMatchObject({ headline: 3, extra: { cameFrom: "INSTAGRAM 2" } }); // the SITE one joined 20 days ago: outside "new from · 7 d"
    expect(s?.results?.rows[0].extra.lastLetter).toBe(iso(5 * DAY).slice(0, 10));
  });

  it("shows the money dash until any revenue event exists", async () => {
    fakeBeehiiv();
    const s = await readState(env);
    expect(s?.results?.money).toEqual({ today: null, month: null, unit: "EUR", note: "no revenue source yet" });
  });

  it("still starts a channel's row from a followers reading older than 30 days", async () => {
    fakeBeehiiv();
    await write([{ kind: "followers", channel: "tiktok", amount: 500, ts: iso(40 * DAY) }]);
    const s = await readState(env);
    expect(s?.results?.rows.find((r) => r.channel === "tt")).toMatchObject({ headline: 500, delta1: 0 });
  });

  it("says Beehiiv is unreachable instead of inventing numbers", async () => {
    fakeBeehiiv({ down: true });
    const s = await readState(env);
    expect(s?.results?.subscribers).toBeNull();
    expect(s?.results?.rows[0]).toMatchObject({ headline: null, delta1: null, note: "Beehiiv unreachable" });
    expect(s?.errors.join(" ")).toMatch(/Beehiiv answered 503/);
  });
});

describe("store + D1: Work", () => {
  it("files stations and jobs under their department and opens the line that failed", async () => {
    fakeBeehiiv();
    expect(await upsertStation(env.DB!, { id: "reels-render", name: "reels-render", state: "idle" })).toBeNull();
    const failed = normaliseJob({ id: "j1", station: "ci-check", label: "ci", state: "failed", startedAt: iso(120000), department: "development", tail: "boom" });
    if (typeof failed === "string") throw new Error(failed);
    await upsertJob(env.DB!, failed);
    const s = await readState(env);
    const content = s?.work?.find((w) => w.id === "content");
    const dev = s?.work?.find((w) => w.id === "development");
    expect(content).toMatchObject({ word: "OK", open: false });
    expect(content?.stations.map((x) => x.id)).toContain("reels-render");
    expect(dev).toMatchObject({ word: "FAILED", open: true });
    expect(dev?.stations.map((x) => x.id)).toEqual(expect.arrayContaining(["site", "ci-check"]));
    expect(s?.threats[0].level).toBe("red");
  });

  it("refuses a station with a department that doesn't exist", async () => {
    expect(await upsertStation(env.DB!, { id: "x", name: "x", state: "idle", department: "marketing" })).toMatch(/department/);
  });
});

describe("store + D1: time control", () => {
  it("stores today's reading and reads back an old snapshot without results or work", async () => {
    fakeBeehiiv();
    const live = await readState(env);
    const stored = await env.DB!.prepare("SELECT day FROM snapshots").all<{ day: string }>();
    expect(stored.results.map((r) => r.day)).toEqual([live?.day]);
    const old = { asof: "2026-11-01T10:00:00Z", day: "2026-11-01", live: true, paused: false, stations: [], links: [], threats: [], feed: [], queue: [], budget: { spentMonth: 0, ceiling: null, month: "2026-11" }, experiments: [], briefing: "", errors: [] };
    await env.DB!.prepare("INSERT INTO snapshots (day, ts, json) VALUES (?1, ?2, ?3)").bind(old.day, old.asof, JSON.stringify(old)).run();
    const back = await readState(env, "2026-11-01");
    expect(back).toMatchObject({ day: "2026-11-01", live: false });
    expect(back?.results).toBeUndefined();
    expect(back?.work).toBeUndefined();
  });
});
