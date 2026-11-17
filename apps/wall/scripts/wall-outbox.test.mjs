// The outbox against a pretend wall that can be closed, opened, and made to refuse.
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flush, send } from "./wall-outbox.mjs";

let dir;
let file;
let wall;
let got;
let answer; // (path, body) => status

const open = async () => {
  wall = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const parsed = JSON.parse(body || "null");
      const status = answer(req.url, parsed);
      if (status === 200) got.push({ path: req.url, body: parsed, auth: req.headers.authorization ?? null });
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(status === 200 ? '{"ok":true}' : '{"error":"no"}');
    });
  });
  await new Promise((r) => wall.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${wall.address().port}`;
};
const close = () => new Promise((r) => (wall ? wall.close(r) : r())).then(() => (wall = null));
/** A port nothing listens on: the wall, closed. */
const CLOSED = "http://127.0.0.1:9";
const waiting = () => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "wall-outbox-"));
  file = join(dir, "wall-outbox.jsonl");
  got = [];
  answer = () => 200;
});
afterEach(async () => {
  await close();
  rmSync(dir, { recursive: true, force: true });
});

describe("send", () => {
  it("reports straight to an open wall and leaves nothing behind", async () => {
    const url = await open();
    expect(await send("station", { id: "seo", state: "ok" }, { url, file, key: "k" })).toBe("sent");
    expect(got).toEqual([{ path: "/api/station", body: { id: "seo", state: "ok" }, auth: "Bearer k" }]);
    expect(existsSync(file)).toBe(false);
  });

  it("keeps a report the closed wall never got, and delivers it later with the id and time it had", async () => {
    expect(await send("event", { kind: "run", station: "seo", text: "run 1" }, { url: CLOSED, file })).toBe("kept");
    const [kept] = waiting();
    expect(kept.path).toBe("event");
    expect(kept.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(kept.body.ts).getTime()).toBeGreaterThan(Date.now() - 60000);

    const url = await open();
    expect(await flush({ url, file })).toEqual({ sent: 1, dropped: 0, left: 0 });
    expect(got).toHaveLength(1);
    expect(got[0].body).toEqual(kept.body); // same id: a second replay would be ignored by the store
    expect(existsSync(file)).toBe(false);
  });

  it("sends what waited before the new report, so a replayed old station state never lands on top of a newer one", async () => {
    await send("station", { id: "seo", state: "failed", message: "old" }, { url: CLOSED, file });
    await send("event", [{ kind: "run", station: "seo", text: "old run" }], { url: CLOSED, file });
    expect(waiting()).toHaveLength(2);
    const url = await open();
    expect(await send("station", { id: "seo", state: "ok", message: "new" }, { url, file })).toBe("sent");
    expect(got.map((g) => g.body.message ?? g.body[0].text)).toEqual(["old", "old run", "new"]);
    expect(got[1].body[0].id).toBeTruthy(); // every event of an array is stamped
    expect(existsSync(file)).toBe(false);
  });

  it("queues behind what is still waiting while the wall stays closed, in order", async () => {
    for (const n of [1, 2, 3]) expect(await send("event", { kind: "note", text: "n" + n }, { url: CLOSED, file })).toBe("kept");
    expect(waiting().map((w) => w.body.text)).toEqual(["n1", "n2", "n3"]);
    expect(readdirSync(dir)).toEqual(["wall-outbox.jsonl"]); // no claimed batch left lying around
  });

  it("gives a card without an id one, so sending it twice lands on the same card", async () => {
    await send("queue", { kind: "reel", title: "a reel" }, { url: CLOSED, file });
    await send("queue", { id: "pr-47", kind: "pull-request", title: "a pull request" }, { url: CLOSED, file });
    const [reel, pr] = waiting().map((w) => w.body);
    expect(reel.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(pr.id).toBe("pr-47");
  });

  it("keeps a caller's own id and time", async () => {
    await send("event", { id: "seo-run:2026-11-17", ts: "2026-11-17T07:00:00.000Z", kind: "run" }, { url: CLOSED, file });
    expect(waiting()[0].body).toMatchObject({ id: "seo-run:2026-11-17", ts: "2026-11-17T07:00:00.000Z" });
  });
});

describe("flush", () => {
  it("drops a report the wall refuses as wrong (400) and goes on to the next", async () => {
    await send("station", { id: "x", state: "nonsense" }, { url: CLOSED, file });
    await send("station", { id: "seo", state: "ok" }, { url: CLOSED, file });
    const url = await open();
    answer = (_path, body) => (body.state === "nonsense" ? 400 : 200);
    expect(await flush({ url, file })).toEqual({ sent: 1, dropped: 1, left: 0 });
    expect(got.map((g) => g.body.id)).toEqual(["seo"]);
    expect(existsSync(file)).toBe(false);
  });

  it("stops at the first report a struggling wall does not take, keeping it and everything after it", async () => {
    for (const n of [1, 2, 3]) await send("event", { kind: "note", text: "n" + n }, { url: CLOSED, file });
    const url = await open();
    answer = (_path, body) => (body.text === "n2" ? 503 : 200); // e.g. the wall without its store, or a wrong key (401)
    expect(await flush({ url, file })).toEqual({ sent: 1, dropped: 0, left: 2 });
    expect(waiting().map((w) => w.body.text)).toEqual(["n2", "n3"]);
    answer = () => 200;
    expect(await flush({ url, file })).toEqual({ sent: 2, dropped: 0, left: 0 });
    expect(got.map((g) => g.body.text)).toEqual(["n1", "n2", "n3"]);
  });

  it("does nothing, quietly, when nothing waits", async () => {
    expect(await flush({ url: CLOSED, file })).toEqual({ sent: 0, dropped: 0, left: 0 });
    expect(await flush({ url: CLOSED, file: join(dir, "no-such-folder", "outbox.jsonl") })).toEqual({ sent: 0, dropped: 0, left: 0 });
  });

  it("holds its batch on disk until the last report is in, so a sender killed mid-way loses nothing", async () => {
    for (const n of [1, 2]) await send("event", { kind: "note", text: "n" + n }, { url: CLOSED, file });
    const url = await open();
    const during = [];
    answer = () => {
      during.push(readdirSync(dir).filter((f) => f.endsWith(".sending")).length);
      return 200;
    };
    expect(await flush({ url, file })).toEqual({ sent: 2, dropped: 0, left: 0 });
    expect(during).toEqual([1, 1]); // still claimed while each report was on its way
    expect(readdirSync(dir)).toEqual([]); // and gone once all were delivered
  });

  it("takes back a batch whose sender died mid-way, and leaves a fresh one to its sender", async () => {
    const line = (text) => JSON.stringify({ at: "x", path: "event", body: { id: text, ts: "2026-11-17T07:00:00.000Z", kind: "note", text } }) + "\n";
    const dead = `${file}.111.1.sending`;
    const busy = `${file}.222.2.sending`;
    writeFileSync(dead, line("orphan"));
    writeFileSync(busy, line("in flight"));
    const old = new Date(Date.now() - 5 * 60000);
    utimesSync(dead, old, old);
    writeFileSync(file, line("waiting"));
    const url = await open();
    expect(await flush({ url, file })).toEqual({ sent: 2, dropped: 0, left: 0 });
    expect(got.map((g) => g.body.text)).toEqual(["orphan", "waiting"]);
    expect(readdirSync(dir)).toEqual([busy.split(/[/\\]/).pop()]);
  });
});
