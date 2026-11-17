#!/usr/bin/env node
// The weekly run, start to finish, with nobody at the keyboard:
//   1. stop if the wall's `paused` flag is set (a closed wall cannot be asked: the run goes on)
//   2. a fresh branch seo/<date> from origin/main in this checkout (must be clean)
//   3. check the Search Console key, take the reading (scripts/scoreboard.mjs) and commit it
//   4. the agent step: headless Claude Code with the seo-agent skill. It gets the reading as a
//      file, no network tools and no key; it edits files and runs the site's checks
//   5. the site's tests must pass; then commit, push, open a pull request for the founder
// The reading is kept even when step 4 or 5 fails; a failed agent step, or a site change dropped
// for failing the checks, still ends the run as failed (exit 1), with the reading's pull request
// open. A second run on the same day updates that day's pull request.
//
// On the wall (apps/wall, station `seo` under DEVELOPMENT; shapes in src/wall.mjs):
//   - the station: red with the reason, or ok with "page one 2/18, indexed 9/13", and its next run
//   - one `run` event per run, with the reading in `meta`: the wall reads from these whether the
//     run happened at all, whether a page left the index and whether a target left page one
//   - the pull request as a card in Needs you
// Reports made while the wall is closed are kept and delivered when it opens
// (apps/wall/scripts/wall-outbox.mjs). Start it through scripts/weekly.mjs, which also shows the
// run as a trace on the wall.
//
//   node apps/seo/scripts/run.mjs            the real run
//   node apps/seo/scripts/run.mjs --dry      print what would run; touch nothing
//   node apps/seo/scripts/run.mjs --no-agent reading and pull request only
//
// Run it from a checkout kept for it (the seo-agent worktree), never the one being worked in.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { send, target } from "../../wall/scripts/wall-outbox.mjs";
import { repoRoot } from "../src/credentials.mjs";
import { prCard, runEvent, scoreLine, stationReport, STATION } from "../src/wall.mjs";

const flags = new Set(process.argv.slice(2));
const dry = flags.has("--dry");
const date = new Date().toISOString().slice(0, 10);
const branch = `seo/${date}`;
const isWin = process.platform === "win32";
// On Windows the commands are .cmd shims and need a shell, so arguments with spaces are quoted.
const q = (s) => (isWin ? JSON.stringify(s) : s);

/** The agent step's whole reach. No WebFetch, no WebSearch, no push, no gh. */
export const ALLOWED_TOOLS = [
  "Read",
  "Glob",
  "Grep",
  "Edit",
  "Write",
  "Bash(npm test:*)",
  "Bash(npx tsc:*)",
  "Bash(npx vitest:*)",
  "Bash(npm run build:*)",
  "Bash(git status:*)",
  "Bash(git diff:*)",
  "Bash(git log:*)",
];
export const DENIED_TOOLS = ["WebFetch", "WebSearch", "Agent", "Read(**/credentials.json)", "Read(**/.env*)"];
export const PROMPT =
  `Use the seo-agent skill. Today's reading is content/seo/scoreboard/${date}.json. ` +
  `Make this week's one move and write content/seo/reports/${date}.md. Do not commit or push.`;

function run(cmd, args, { cwd = repoRoot, allowFail = false, capture = false } = {}) {
  if (dry) {
    console.log(`  would run: ${cmd} ${args.join(" ")}`);
    return { status: 0, stdout: "" };
  }
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit", shell: isWin });
  if (r.status !== 0 && !allowFail) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} exited ${r.status}`);
  return r;
}

/** To the wall, or to its outbox when it is closed. Never stops the run. */
const wall = (path, body) => (dry ? undefined : send(path, body));

async function paused() {
  try {
    const s = await (await fetch(`${target().url}/api/state`, { signal: AbortSignal.timeout(3000) })).json();
    return s?.paused === true || s?.flags?.paused === true;
  } catch {
    return false;
  }
}

/** This branch's open pull request ({ number, url }), or null. */
function openPr() {
  if (dry) return null;
  const out = run("gh", ["pr", "list", "--head", branch, "--state", "open", "--json", "number,url"], { capture: true }).stdout;
  try {
    return JSON.parse(out)[0] ?? null;
  } catch {
    return null;
  }
}

// What the run knows so far, for the report at its end, however it ends.
let reading = null;
let pr = null;

/** The run's last word to the wall: the station, the run event, and the pull request's card. */
async function report(problem) {
  const now = new Date();
  await wall("station", stationReport({ now, reading, problem }));
  await wall("event", runEvent({ date, branch, reading, pr, problem }));
  if (pr) {
    const file = resolve(repoRoot, `content/seo/reports/${date}.md`);
    await wall("queue", prCard({ pr, date, report: existsSync(file) ? readFileSync(file, "utf8") : null }));
  }
}

async function main() {
  console.log(`SEO run ${date}${dry ? " (dry)" : ""}`);
  if (!dry && (await paused())) {
    console.log("the wall is paused: nothing run");
    return;
  }
  const dirty = dry ? "" : run("git", ["status", "--porcelain"], { capture: true }).stdout.trim();
  if (dirty) throw new Error("this checkout has uncommitted changes; the run needs a clean one");

  await wall("station", { ...STATION, state: "ok", message: "run started", lastRun: new Date().toISOString() });
  run("git", ["fetch", "origin", "main"]);
  run("git", ["checkout", "-B", branch, "origin/main"]);

  // Asked first and by name: a key that stopped working must not read as "the reading failed".
  if (run("node", ["apps/seo/scripts/gsc-check.mjs"], { allowFail: true }).status !== 0)
    throw new Error("the Search Console check failed (the key, its permission, or the network): no reading. Run `npm run check` in apps/seo");
  run("node", ["apps/seo/scripts/scoreboard.mjs"]);
  if (!dry) {
    reading = JSON.parse(readFileSync(resolve(repoRoot, `content/seo/scoreboard/${date}.json`), "utf8"));
    console.log(scoreLine(reading.summary));
  }
  run("git", ["add", "content/seo/scoreboard"]);
  // A second run on the same day may read the same numbers: nothing new to commit is not a failure.
  run("git", ["commit", "-m", q(`SEO reading ${date}`)], { allowFail: true });

  // The agent has no network, so the site's dependencies must be in place before it starts,
  // or it cannot run the checks on its own change (found on the first run, 2026-11-17).
  const web = resolve(repoRoot, "apps/web");
  if (!dry && !existsSync(resolve(web, "node_modules"))) run("npm", ["ci"], { cwd: web });

  let problem = null;
  if (!flags.has("--no-agent")) {
    const agent = run(
      "claude",
      [
        "-p",
        q(PROMPT),
        "--permission-mode",
        "acceptEdits",
        "--allowedTools",
        ...ALLOWED_TOOLS.map(q),
        "--disallowedTools",
        ...DENIED_TOOLS.map(q),
      ],
      { allowFail: true }
    );
    if (agent.status !== 0) {
      problem = "the agent step failed; the reading was kept and its pull request opened";
      console.error(`the agent step exited ${agent.status}; the reading is kept`);
    }
  }

  const changed = dry ? "" : run("git", ["status", "--porcelain"], { capture: true }).stdout.trim();
  const touchesSite = /apps\/web\//.test(changed);
  if (touchesSite) {
    const ok =
      run("npx", ["tsc", "--noEmit"], { cwd: web, allowFail: true }).status === 0 &&
      run("npm", ["test"], { cwd: web, allowFail: true }).status === 0;
    if (!ok) {
      // Keep the reading and the report; throw the site change away rather than ship it broken.
      run("git", ["checkout", "--", "apps/web"]);
      run("git", ["clean", "-fd", "apps/web/src"]);
      problem ??= "this week's site change failed the checks and was dropped; the reading and the report are in the pull request";
      console.error("site change failed the checks: dropped");
    }
  }
  if (changed) {
    run("git", ["add", "-A"]);
    run("git", ["commit", "-m", q(`SEO ${date}: this week's move and report`)], { allowFail: true });
  }

  run("git", ["push", "-u", "origin", branch, "--force-with-lease"]);
  const file = `content/seo/reports/${date}.md`;
  const hasReport = !dry && existsSync(resolve(repoRoot, file));
  const body = hasReport ? ["--body-file", file] : ["--body", q(`SEO reading ${date}. The agent step left no report.`)];
  // A second run on the same day reuses the day's pull request instead of failing on it.
  const open = openPr();
  if (open) run("gh", ["pr", "edit", String(open.number), ...body]);
  else run("gh", ["pr", "create", "--base", "main", "--head", branch, "--title", q(`SEO ${date}`), ...body]);
  pr = openPr();

  await report(problem);
  if (problem) {
    console.error(`SEO run failed: ${problem}`);
    process.exitCode = 1;
  } else console.log("done");
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(repoRoot, "apps/seo/scripts/run.mjs")) {
  main().catch(async (e) => {
    console.error(`SEO run failed: ${e.message}`);
    // The pull request may exist from an earlier step or an earlier run today: its card still counts.
    try {
      pr ??= openPr();
    } catch {
      /* gh is what failed */
    }
    await report(e.message.slice(0, 200));
    process.exitCode = 1;
  });
}
