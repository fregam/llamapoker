#!/usr/bin/env node
// What the scheduled task starts (apps/seo/README.md, "Running it every week"). Two jobs, both
// small, so that this file almost never needs to change:
//
//   1. Bring this checkout to origin/main before anything else is loaded from it. Node reads
//      run.mjs once, at start: without this, a fix to the runner merged this week would only
//      take effect the week after. Skipped, with a line saying so, when the checkout has
//      uncommitted changes or git fails; run.mjs then reports the real problem itself.
//   2. Start run.mjs through the wall's `job` wrapper, so the run shows as a trace under the
//      `seo` station, with its full output in logs/jobs/<day>/. The agent step prints nothing
//      until it ends, so the run may be silent for an hour before it reads as stuck; after two
//      it is killed (exit 124), and that is reported here because run.mjs no longer can.
//
//   node apps/seo/scripts/weekly.mjs               the weekly run
//   node apps/seo/scripts/weekly.mjs --no-agent    arguments pass through to run.mjs
//   node apps/seo/scripts/weekly.mjs --dry         print what would run; touch nothing
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { repoRoot } from "../src/credentials.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
/** How long the run may print nothing: the agent step is one silent command. */
const QUIET_OK = "60m";

const git = (...a) => spawnSync("git", a, { cwd: repoRoot, encoding: "utf8" });

if (dry) console.log("  would run: git fetch origin main; git checkout --detach origin/main (when the checkout is clean)");
else {
  const status = git("status", "--porcelain");
  if (status.status !== 0 || status.stdout.trim()) console.error("weekly: the checkout is not clean, running the runner that is here");
  else if (git("fetch", "origin", "main").status !== 0 || git("checkout", "--detach", "origin/main").status !== 0)
    console.error("weekly: could not update to origin/main, running the runner that is here");
}

const job = [
  resolve(repoRoot, "apps/wall/scripts/job.mjs"),
  ...["--station", "seo", "--label", "weekly-run", "--dept", "development", "--quiet-ok", QUIET_OK],
  "node",
  "apps/seo/scripts/run.mjs",
  ...args,
];
if (dry) console.log(`  would run: node ${job.join(" ")}`);
// --dry goes straight to the runner: a dry run is not a job and must not show on the wall.
const r = dry
  ? spawnSync(process.execPath, [resolve(repoRoot, "apps/seo/scripts/run.mjs"), ...args], { cwd: repoRoot, stdio: "inherit" })
  : spawnSync(process.execPath, job, { cwd: repoRoot, stdio: "inherit" });
const code = r.status ?? 1;

if (!dry && code === 124) {
  // Killed by `job` for its silence: the runner died before it could say anything. Loaded only
  // now, from the checkout as it is after the update above.
  const { send } = await import("../../wall/scripts/wall-outbox.mjs");
  const { runEvent, stationReport } = await import("../src/wall.mjs");
  const date = new Date().toISOString().slice(0, 10);
  const problem = "the run printed nothing for two hours and was stopped (the agent step hung); its output is in logs/jobs/";
  await send("station", stationReport({ now: new Date(), problem }));
  await send("event", runEvent({ date, branch: `seo/${date}`, problem }));
}
process.exitCode = code;
