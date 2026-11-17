// The weekly runner end to end, with nothing real behind it: a copy of the instruments in a
// temporary folder, pretend `git`, `gh`, `claude`, `npm`, `npx` and `node` first on PATH
// (run-fakes.mjs), and a pretend wall. Checks what the wall is told, and in which order, however
// the run ends. The real run pushes a branch, opens a pull request and spends the Claude plan,
// so it is never started from a test.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SEO = fileURLToPath(new URL("..", import.meta.url));
const OUTBOX_LIB = fileURLToPath(new URL("../../wall/scripts/wall-outbox.mjs", import.meta.url));
const FAKES = fileURLToPath(new URL("./run-fakes.mjs", import.meta.url));
const today = new Date().toISOString().slice(0, 10);
const WIN = process.platform === "win32";

let tmp;
let repo;
let bin;
let wall;
let url;
let got;

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), "seo-run-"));
  repo = join(tmp, "repo");
  cpSync(SEO, join(repo, "apps", "seo"), { recursive: true });
  mkdirSync(join(repo, "apps", "wall", "scripts"), { recursive: true });
  cpSync(OUTBOX_LIB, join(repo, "apps", "wall", "scripts", "wall-outbox.mjs"));
  mkdirSync(join(repo, "apps", "web", "node_modules"), { recursive: true }); // "installed": no npm ci
  bin = join(tmp, "bin");
  mkdirSync(bin);
  for (const name of ["git", "gh", "claude", "npm", "npx", "node"]) {
    if (WIN) writeFileSync(join(bin, name + ".cmd"), `@"${process.execPath}" "${FAKES}" ${name} %*\r\n`);
    else {
      writeFileSync(join(bin, name), `#!/bin/sh\nexec "${process.execPath}" "${FAKES}" ${name} "$@"\n`);
      chmodSync(join(bin, name), 0o755);
    }
  }
  wall = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      if (req.method === "GET") return res.end(JSON.stringify({ paused: got.paused === true }));
      got.push({ path: req.url, body: JSON.parse(body) });
      res.end('{"ok":true}');
    });
  });
  await new Promise((r) => wall.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${wall.address().port}`;
});
after(async () => {
  await new Promise((r) => wall.close(r));
  rmSync(tmp, { recursive: true, force: true });
});
beforeEach(() => {
  got = [];
  for (const p of ["content", "fake-state.json", "calls.log", "outbox.jsonl"]) rmSync(join(repo, p), { recursive: true, force: true });
});

/**
 * Starts the copied runner and waits for it. `scenario` steers the pretend commands
 * (run-fakes.mjs). Not spawnSync: the pretend wall lives in this process and must be free to answer.
 */
function weekly(scenario = {}, { wallUrl = url, args = [] } = {}) {
  const child = spawn(process.execPath, [join(repo, "apps", "seo", "scripts", "run.mjs"), ...args], {
    cwd: repo,
    env: {
      ...process.env,
      PATH: bin + delimiter + process.env.PATH,
      Path: bin + delimiter + (process.env.Path ?? process.env.PATH),
      FAKE_REPO: repo,
      FAKE_SCENARIO: JSON.stringify(scenario),
      WALL_URL: wallUrl,
      WALL_INGEST_KEY: "",
      WALL_OUTBOX: join(repo, "outbox.jsonl"),
    },
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (c) => (stdout += c));
  child.stderr.on("data", (c) => (stderr += c));
  return new Promise((done) =>
    child.on("close", (status) => {
      const calls = existsSync(join(repo, "calls.log")) ? readFileSync(join(repo, "calls.log"), "utf8").trim().split("\n") : [];
      done({ status, stdout, stderr, calls });
    }),
  );
}
const waitingInOutbox = () => (existsSync(join(repo, "outbox.jsonl")) ? readFileSync(join(repo, "outbox.jsonl"), "utf8").trim().split("\n").length : 0);
const posted = (path) => got.filter((g) => g.path === `/api/${path}`).map((g) => g.body);

test("a clean run: station started, then ok with the score and the next run, a run event, the pull request's card", async () => {
  const r = await weekly();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(got.map((g) => g.path), ["/api/station", "/api/station", "/api/event", "/api/queue"]);
  assert.equal(waitingInOutbox(), 0, "an open wall gets every report at once");

  const [started, ended] = posted("station");
  assert.deepEqual({ id: started.id, state: started.state, message: started.message, department: started.department }, { id: "seo", state: "ok", message: "run started", department: "development" });
  assert.equal(ended.state, "ok");
  assert.equal(ended.message, "page one 1/2, indexed 2/3");
  assert.ok(new Date(ended.nextRun) > new Date(), "the next run is ahead");
  assert.equal(new Date(ended.nextRun).getDay(), 1);

  const [event] = posted("event");
  assert.equal(event.kind, "run");
  assert.equal(event.station, "seo");
  assert.equal(event.subject, `seo/${today}`);
  assert.equal(event.text, `SEO run ${today}: page one 1/2, indexed 2/3, pull request #47`);
  assert.equal(event.meta.ok, true);
  assert.deepEqual(event.meta.indexedPages, ["/", "/learn/outs"]);
  assert.deepEqual(event.meta.notIndexedPages, ["/about"]);
  assert.deepEqual(event.meta.pageOneQueries, ["poker outs chart"]);
  assert.deepEqual(event.meta.missedQueries, ["pot odds"]);
  assert.ok(event.id && event.ts, "stamped, so a replay lands once");

  const [card] = posted("queue");
  assert.equal(card.id, "pr-47");
  assert.equal(card.kind, "pull-request");
  assert.match(card.preview, /^https:\/\/github\.com\/fregam\/llamapoker\/pull\/47\n/);
  assert.match(card.preview, /This week: the fake move\./);

  // the order of the real work is unchanged: key check, reading, agent, push, pull request
  const order = ["node apps/seo/scripts/gsc-check.mjs", "node apps/seo/scripts/scoreboard.mjs", "claude -p", "git push", "gh pr create"].map((c) => r.calls.findIndex((l) => l.startsWith(c)));
  assert.ok(order.every((i) => i >= 0), r.calls.join("\n"));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("a key that stopped working is named as that, before any reading, and the run ends failed", async () => {
  const r = await weekly({ keyCheck: 1 });
  assert.equal(r.status, 1);
  assert.ok(!r.calls.some((l) => l.includes("scoreboard.mjs")), "no reading without the key");
  assert.ok(!r.calls.some((l) => l.startsWith("git push")));
  const ended = posted("station").at(-1);
  assert.equal(ended.state, "failed");
  assert.match(ended.message, /^the Search Console check failed/);
  const [event] = posted("event");
  assert.equal(event.meta.ok, false);
  assert.equal(event.meta.indexedPages, undefined);
  assert.match(event.text, new RegExp(`^SEO run ${today} failed: the Search Console check failed`));
  assert.deepEqual(posted("queue"), []);
});

test("a failed agent step: red, exit 1, and the reading still reaches the wall with its pull request", async () => {
  const r = await weekly({ claude: 1 });
  assert.equal(r.status, 1);
  const ended = posted("station").at(-1);
  assert.equal(ended.state, "failed");
  assert.equal(ended.message, "the agent step failed; the reading was kept and its pull request opened (page one 1/2, indexed 2/3)");
  const [event] = posted("event");
  assert.equal(event.meta.ok, false);
  assert.deepEqual(event.meta.pageOneQueries, ["poker outs chart"]);
  assert.equal(event.meta.pr, 47);
  const [card] = posted("queue");
  assert.equal(card.id, "pr-47");
  assert.match(card.preview, /left no report/);
});

test("a site change that fails the checks is dropped, and the run says so instead of ending green", async () => {
  const r = await weekly({ touchesSite: true, siteTests: 1 });
  assert.equal(r.status, 1);
  assert.ok(r.calls.some((l) => l.startsWith("git checkout -- apps/web")));
  const ended = posted("station").at(-1);
  assert.equal(ended.state, "failed");
  assert.match(ended.message, /^this week's site change failed the checks and was dropped/);
  assert.equal(posted("event")[0].meta.ok, false);
  assert.equal(posted("queue")[0].id, "pr-47");
});

test("a second run on the same day edits the day's pull request and sends the same card", async () => {
  const r = await weekly({ prOpen: true });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(r.calls.some((l) => l.startsWith("gh pr edit 47")));
  assert.ok(!r.calls.some((l) => l.startsWith("gh pr create")));
  assert.equal(posted("queue")[0].id, "pr-47");
});

test("a paused wall stops the run before it touches anything", async () => {
  got.paused = true;
  const r = await weekly();
  assert.equal(r.status, 0);
  assert.match(r.stdout, /the wall is paused: nothing run/);
  assert.deepEqual(r.calls, []);
  assert.deepEqual(got.map((g) => g.path), []);
});

test("a run while the wall is closed loses nothing: every report waits in the outbox, in order", async () => {
  const r = await weekly({}, { wallUrl: "http://127.0.0.1:9" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(got, []);
  const waiting = readFileSync(join(repo, "outbox.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(waiting.map((w) => w.path), ["station", "station", "event", "queue"]);
  assert.equal(waiting[1].body.message, "page one 1/2, indexed 2/3");

  // the wall opens later: the copied outbox delivers them as they were
  const { flush } = await import(pathToFileURL(join(repo, "apps", "wall", "scripts", "wall-outbox.mjs")).href);
  assert.deepEqual(await flush({ url, key: undefined, file: join(repo, "outbox.jsonl") }), { sent: 4, dropped: 0, left: 0 });
  assert.deepEqual(got.map((g) => g.path), ["/api/station", "/api/station", "/api/event", "/api/queue"]);
  assert.equal(posted("event")[0].id, waiting[2].body.id);
  assert.equal(posted("event")[0].ts, waiting[2].body.ts);
});
