#!/usr/bin/env node
// `job`: run any long command and show it on the wall as a progress trace under its station.
//
//   node apps/wall/scripts/job.mjs npx remotion render src/index.ts OnlyAces out/only-aces.mp4
//   node apps/wall/scripts/job.mjs --quiet-ok 30m py -3.11 scripts/foley-mmaudio.py in.mp4 out.mp4
//
// Own options, before the command only: --station, --label (override what is recognised from the
// command), --quiet-ok (how long the command may print nothing before it reads as stuck; 10m).
// The command runs unchanged, its output passes through, and `job` exits with its exit code.
// Reporting never blocks or fails the command: if the wall doesn't answer, `job` says so once.
// Wall: WALL_URL / WALL_INGEST_KEY, else `wall.url` / `wall.ingest_key` in credentials.json,
// else the local wall at http://127.0.0.1:8788. Spec: .scratch/wall-renders/spec.md.
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { phase, progress, recognise } from "./job-lib.mjs";

const ms = (name, fallback) => Number(process.env[name] ?? fallback);
const BEAT_MS = ms("JOB_BEAT_MS", 30000); // heartbeat; the wall reads 2 min of silence as lost
const THROTTLE_MS = ms("JOB_THROTTLE_MS", 5000); // at most one progress update this often
const TIMEOUT_MS = 2000; // a slow wall never slows the job

let job;
try {
  job = recognise(process.argv.slice(2));
} catch (e) {
  console.error(`job: ${e.message}`);
  process.exit(2);
}
if (!job.command.length) {
  console.error("usage: job [--station s] [--label l] [--quiet-ok 30m] <command…>");
  process.exit(2);
}

// ---------- where to report ----------

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let url = process.env.WALL_URL;
let key = process.env.WALL_INGEST_KEY;
const credsPath = resolve(root, "credentials.json");
if ((!url || key === undefined) && existsSync(credsPath)) {
  try {
    const c = JSON.parse(readFileSync(credsPath, "utf8")).wall ?? {};
    url ??= c.url;
    key ??= c.ingest_key;
  } catch {
    /* unreadable credentials: report to the local wall */
  }
}
url = (url || "http://127.0.0.1:8788").replace(/\/$/, "");

const pending = new Set();
let warned = false;
function offline(why = "no answer") {
  if (warned) return;
  warned = true;
  process.stderr.write(`job: wall offline at ${url} (${why}), not reporting\n`);
}
function send(path, body) {
  const p = fetch(`${url}/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Connection: "close", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((res) => {
      // 401: wrong key; 405: an older wall without /api/job (e.g. another checkout on the port).
      if (!res.ok) offline(`answered ${res.status}`);
    })
    .catch(() => offline())
    .finally(() => pending.delete(p));
  pending.add(p);
}

// ---------- the run ----------

const id = `${job.station}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const startedAt = new Date().toISOString();
const state = { state: "running", percent: null, phase: null, tail: [] };
let lastSent = 0;
let lastOutput = Date.now();

// A log per run (the full output), for whoever reads a failure later: the founder or an agent.
// logs/jobs/<YYYY-MM-DD>/<id>.log, git-ignored; day folders older than 14 days are cleared here.
const LOG_DAYS = 14;
const logRoot = process.env.JOB_LOG_DIR || resolve(root, "logs", "jobs");
const today = startedAt.slice(0, 10);
const logPath = resolve(logRoot, today, `${id}.log`);
let log = null;
try {
  mkdirSync(dirname(logPath), { recursive: true });
  const cutoff = new Date(Date.now() - LOG_DAYS * 86400000).toISOString().slice(0, 10);
  for (const d of readdirSync(logRoot)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d < cutoff) rmSync(resolve(logRoot, d), { recursive: true, force: true });
  log = createWriteStream(logPath);
  log.write(`$ ${job.command.join(" ")}\n# ${startedAt}\n`);
} catch (e) {
  process.stderr.write(`job: no log file (${e.message})\n`);
}

const row = () => ({
  id,
  station: job.station,
  label: job.label,
  state: state.state,
  percent: state.percent,
  phase: state.phase,
  startedAt,
  output: job.output ?? null,
  tail: state.tail.join("\n") || null,
  log: log ? logPath : null,
});
let trailing = null; // a progress update held back by the throttle, sent when it allows
const report = () => {
  clearTimeout(trailing);
  trailing = null;
  lastSent = Date.now();
  send("job", row());
};
/** Progress changed: send now if the throttle allows, else once it does (never only at the next heartbeat). */
const reportSoon = () => {
  const wait = THROTTLE_MS - (Date.now() - lastSent);
  if (wait <= 0) report();
  else trailing ??= setTimeout(report, wait);
};
const event = (kind, text, extra = {}) => send("event", { kind, station: job.station, subject: job.label, text, ...extra });

event("job.started", `${job.label}: started`);
report();

const quote = (a) => (/^[\w./:=@%+,-]+$/.test(a) ? a : `"${a.replace(/(\\*)"/g, '$1$1\\"')}"`);
const WIN = process.platform === "win32";
// detached on POSIX gives the command its own process group, so a kill reaches its children too.
const child = spawn(job.command.map(quote).join(" "), { shell: true, stdio: ["inherit", "pipe", "pipe"], detached: !WIN });

/** Kills the command and everything it started (the shell's children hold the output pipes). */
function killTree() {
  if (WIN) spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}
let killed = null; // why job killed the command, if it did

function watch(stream, out) {
  let partial = "";
  stream.on("data", (chunk) => {
    out.write(chunk);
    log?.write(chunk);
    lastOutput = Date.now();
    if (state.state === "stuck") {
      state.state = "running";
      report();
    }
    const parts = (partial + chunk.toString()).split(/\r\n|\r|\n/);
    partial = parts.pop();
    for (const line of parts) seen(line);
    if (partial) seen(partial, true);
  });
}

function seen(line, partial = false) {
  if (!line.trim()) return;
  if (!partial) state.tail = [...state.tail, line].slice(-10);
  const p = progress(line);
  if (p !== null && p !== state.percent) {
    state.percent = p;
    state.phase = phase(line);
    reportSoon();
  }
}

watch(child.stdout, process.stdout);
watch(child.stderr, process.stderr);
const beat = setInterval(report, BEAT_MS);
// Stuck: alive but silent longer than --quiet-ok; back to running as soon as it prints again.
// Still silent after twice that: killed, so an unattended workflow never hangs behind it.
const span = (t) => (t >= 60000 ? `${Math.round(t / 60000)} min` : `${Math.round(t / 1000)} s`);
const quiet = setInterval(() => {
  const silent = Date.now() - lastOutput;
  if (state.state === "running" && silent >= job.quietOkMs) {
    state.state = "stuck";
    event("job.stuck", `${job.label}: no output for ${span(job.quietOkMs)}`);
    report();
  } else if (state.state === "stuck" && silent >= 2 * job.quietOkMs && !killed) {
    killed = `killed: no output for ${span(2 * job.quietOkMs)}`;
    process.stderr.write(`job: ${killed}\n`);
    killTree();
  }
}, Math.min(1000, job.quietOkMs / 4));
// Ctrl+C: on Windows it reaches the command through the console; on POSIX the command runs in its
// own process group (for the tree kill), so pass the signal on. Either way we stay to report the end.
process.on("SIGINT", () => {
  if (WIN) return;
  try {
    process.kill(-child.pid, "SIGINT");
  } catch {
    child.kill("SIGINT");
  }
});

child.on("close", async (code, signal) => {
  clearInterval(beat);
  clearInterval(quiet);
  clearTimeout(trailing);
  const exit = killed ? 124 : (code ?? (signal ? 1 : 0));
  const seconds = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
  if (exit === 0) {
    state.state = "done";
    state.percent = 100;
    event("job.done", `${job.label}: done in ${seconds} s${job.output ? `, ${job.output}` : ""}`, { amount: seconds, unit: "s", meta: { output: job.output ?? null } });
  } else {
    state.state = "failed";
    if (killed) state.tail = [...state.tail, killed].slice(-10);
    const why = killed ?? (state.tail.length ? state.tail.at(-1) : null);
    event("job.failed", `${job.label}: failed (exit ${exit})${why ? `: ${why}` : ""}`, { amount: seconds, unit: "s" });
  }
  report();
  if (log) await new Promise((done) => log.end(`\n# ${state.state} (exit ${exit})${killed ? `, ${killed}` : ""} after ${seconds} s\n`, done));
  await Promise.allSettled([...pending]);
  // Not process.exit(): on Windows it can abort Node mid-close (libuv async.c assertion) and turn
  // the command's exit code into a crash code. Nothing else holds the loop open, so it ends here.
  process.exitCode = exit;
});
