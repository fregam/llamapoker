import { describe, expect, it } from "vitest";
import { phase, progress, recognise } from "./job-lib.mjs";

describe("recognise", () => {
  it("names a Remotion render by its composition and output", () => {
    expect(recognise(["npx", "remotion", "render", "src/index.ts", "OnlyAces", "out/only-aces.mp4"])).toEqual({
      station: "reels-render",
      label: "OnlyAces",
      output: "out/only-aces.mp4",
      quietOkMs: 10 * 60 * 1000,
      command: ["npx", "remotion", "render", "src/index.ts", "OnlyAces", "out/only-aces.mp4"],
    });
  });

  it("names Python tools by their script, labelled by the output file", () => {
    const foley = recognise(["py", "-3.11", "scripts/foley-mmaudio.py", "media/tests/r2-silent.mp4", "media/tests/r2-foley.mp4", "--gain-db", "-3"]);
    expect(foley).toMatchObject({ station: "foley", label: "r2-foley.mp4", output: "media/tests/r2-foley.mp4" });
    expect(recognise(["py", "scripts/reel-teardown.py", "media/tests/refs/zack.mp4"])).toMatchObject({ station: "teardown", label: "zack.mp4" });
    expect(recognise(["node", "scripts/vo-comfy.mjs", "content/reels/004.md"])).toMatchObject({ station: "vo-comfy", label: "004.md" });
    expect(recognise(["ffmpeg", "-i", "a.wav", "b.mp3"])).toMatchObject({ station: "ffmpeg", label: "b.mp3", output: "b.mp3" });
  });

  it("takes its own options before the command and leaves the command's alone", () => {
    const r = recognise(["--station", "Voice", "--label", "take 3", "--quiet-ok", "30m", "py", "scripts/vo.py", "--label", "x", "out.wav"]);
    expect(r).toMatchObject({ station: "voice", label: "take 3", quietOkMs: 30 * 60 * 1000 });
    expect(r.command).toEqual(["py", "scripts/vo.py", "--label", "x", "out.wav"]);
    expect(recognise(["--quiet-ok", "90s", "node", "a.mjs"]).quietOkMs).toBe(90 * 1000);
  });

  it("takes --dept for the Work line and refuses anything but content or development", () => {
    expect(recognise(["--dept", "Content", "ffmpeg", "-i", "a.wav", "b.mp3"])).toMatchObject({ station: "ffmpeg", department: "content", command: ["ffmpeg", "-i", "a.wav", "b.mp3"] });
    expect(recognise(["node", "a.mjs"]).department).toBeUndefined();
    expect(() => recognise(["--dept", "sales", "node", "a.mjs"])).toThrow("--dept: content or development, not sales");
  });
});

describe("progress", () => {
  it("reads a percent or a counted fraction, and nothing else", () => {
    expect(progress("Rendering... 64%")).toBe(64);
    expect(progress(" 45%|████▌     | 9/20 [00:12<00:15]")).toBe(45);
    expect(progress("Rendered 120/900, time remaining: 1m")).toBe(13);
    expect(progress("Encoded 900/900")).toBe(100);
    expect(progress("window 4/4 done")).toBe(100);
    expect(progress("Bundling 100.0%")).toBe(100);
    expect(progress("loading src/index.ts")).toBeNull();
    expect(progress("1920/1080 landscape")).toBeNull(); // more done than total: not progress
    expect(progress("2026/11/12 starting")).toBeNull(); // a date
  });
});

// ---------- the whole wrapper, against a pretend wall ----------
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LOGS = join(tmpdir(), `job-test-logs-${process.pid}`);

const JOB = fileURLToPath(new URL("./job.mjs", import.meta.url));
let wall;
let url;
let got = [];

beforeAll(async () => {
  wall = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      got.push({ path: req.url, body: JSON.parse(body || "null") });
      res.setHeader("Content-Type", "application/json");
      res.end('{"ok":true}');
    });
  });
  await new Promise((r) => wall.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${wall.address().port}`;
});
afterAll(() => {
  wall.close();
  rmSync(LOGS, { recursive: true, force: true });
});

/** Runs `job <args>` and resolves with its exit code and output. */
function run(args, wallUrl = url, env = {}) {
  got = [];
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [JOB, ...args], {
      env: { ...process.env, WALL_URL: wallUrl, WALL_INGEST_KEY: "", JOB_BEAT_MS: "100", JOB_THROTTLE_MS: "0", JOB_LOG_DIR: LOGS, ...env },
    });
    let out = "";
    let err = "";
    p.stdout.on("data", (c) => (out += c));
    p.stderr.on("data", (c) => (err += c));
    p.on("close", (code) => resolve({ code, out, err }));
  });
}

const node = (code) => ["node", "-e", code];
const events = () => got.filter((g) => g.path === "/api/event").map((g) => g.body.kind);
const rows = () => got.filter((g) => g.path === "/api/job").map((g) => g.body);

describe("job, end to end", () => {
  it("reports a successful run with its progress and passes the output through", async () => {
    const r = await run(["--label", "demo", ...node("console.log('Rendered 1/4'); setTimeout(() => console.log('Rendered 4/4'), 300)")]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Rendered 4/4");
    expect(events()).toEqual(["job.started", "job.done"]);
    expect(rows().map((x) => x.percent)).toContain(25);
    expect(rows().find((x) => x.percent === 25)?.phase).toBe("Rendered");
    expect(rows().at(-1)).toMatchObject({ station: "node", label: "demo", state: "done", percent: 100 });
  }, 15000);

  it("reports a failure with its last lines and keeps the exit code", async () => {
    const r = await run(node("console.log('working'); console.error('Error: ffmpeg exit 1'); process.exit(3)"));
    expect(r.code).toBe(3);
    expect(r.err).toContain("Error: ffmpeg exit 1");
    expect(events()).toEqual(["job.started", "job.failed"]);
    expect(rows().at(-1)).toMatchObject({ state: "failed", tail: "working\nError: ffmpeg exit 1" });
  }, 15000);

  it("reads a silent command as stuck and running again once it prints", async () => {
    const r = await run(["--quiet-ok", "1s", ...node("setTimeout(() => console.log('back'), 1600); setTimeout(() => {}, 2200)")]);
    expect(r.code).toBe(0);
    expect(events()).toEqual(["job.started", "job.stuck", "job.done"]);
    const states = rows().map((x) => x.state);
    expect(states.indexOf("stuck")).toBeGreaterThan(-1);
    expect(states.lastIndexOf("running")).toBeGreaterThan(states.indexOf("stuck"));
  }, 15000);

  it("keeps the full output in a log per run and clears logs older than 14 days", async () => {
    mkdirSync(join(LOGS, "2020-01-01"), { recursive: true });
    const r = await run(node("for (let i = 1; i <= 30; i++) console.log('line ' + i)"));
    expect(r.code).toBe(0);
    const log = rows().at(-1).log;
    expect(log).toMatch(/node-.*\.log$/);
    const text = readFileSync(log, "utf8");
    expect(text).toContain("line 1\n");
    expect(text).toContain("line 30");
    expect(existsSync(join(LOGS, "2020-01-01"))).toBe(false);
  }, 15000);
  it("kills a job still silent after twice --quiet-ok, child processes included", async () => {
    const t = Date.now();
    const r = await run(["--quiet-ok", "1s", ...node("console.log('start'); setTimeout(() => {}, 8000)")]);
    expect(r.code).toBe(124);
    expect(Date.now() - t).toBeLessThan(5000); // the grandchild holding the pipes died too
    expect(events()).toEqual(["job.started", "job.stuck", "job.failed"]);
    expect(rows().at(-1)).toMatchObject({ state: "failed" });
    expect(got.find((g) => g.body?.kind === "job.failed")?.body.text).toContain("killed: no output for 2 s");
  }, 15000);
  it("still sends the last progress once the throttle allows, not only at the next heartbeat", async () => {
    const code = "console.log('Rendered 1/4'); setTimeout(() => console.log('Rendered 2/4'), 50); setTimeout(() => {}, 1500)";
    await run(node(code), url, { JOB_THROTTLE_MS: "500", JOB_BEAT_MS: "60000" });
    const running = rows().filter((x) => x.state === "running").map((x) => x.percent);
    expect(running).toContain(50);
  }, 15000);
  it("runs normally with the wall off and says so once", async () => {
    const t = Date.now();
    const r = await run(node("console.log('Rendered 1/2'); setTimeout(() => { console.log('Rendered 2/2'); process.exitCode = 4 }, 400)"), "http://127.0.0.1:9");
    expect(r.code).toBe(4);
    expect(r.out).toContain("Rendered 2/2");
    expect(r.err.match(/wall offline/g)).toHaveLength(1);
    expect(Date.now() - t).toBeLessThan(5000);
  }, 15000);
});

describe("phase", () => {
  it("is the word just before the progress number, if any", () => {
    expect(phase("Bundling 43%")).toBe("Bundling");
    expect(phase("Rendered 120/150, time remaining: 1s")).toBe("Rendered");
    expect(phase("Encoded 55/150")).toBe("Encoded");
    expect(phase("window: 3/4")).toBe("window");
    expect(phase(" 45%|████▌     | 9/20")).toBeNull();
    expect(phase("loading src/index.ts")).toBeNull();
  });
});
