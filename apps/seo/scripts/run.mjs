#!/usr/bin/env node
// The weekly run, start to finish, with nobody at the keyboard:
//   1. stop if the wall's `paused` flag is set
//   2. a fresh branch seo/<date> from origin/main in this checkout (must be clean)
//   3. take the reading (scripts/scoreboard.mjs) and commit it
//   4. the agent step: headless Claude Code with the seo-agent skill. It gets the reading as a
//      file, no network tools and no key; it edits files and runs the site's checks
//   5. the site's tests must pass; then commit, push, open a pull request for the founder
// Every step reports to the wall (station `seo`). The reading is kept even when step 4 or 5 fails;
// a failed agent step still ends the run as failed (exit 1, station red), with the reading's pull
// request open. A second run on the same day updates that day's pull request.
//
//   node apps/seo/scripts/run.mjs            the real run
//   node apps/seo/scripts/run.mjs --dry      print what would run; touch nothing
//   node apps/seo/scripts/run.mjs --no-agent reading and pull request only
//
// Run it from a checkout kept for it (the seo-agent worktree), never the one being worked in.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot } from "../src/credentials.mjs";

const flags = new Set(process.argv.slice(2));
const dry = flags.has("--dry");
const date = new Date().toISOString().slice(0, 10);
const branch = `seo/${date}`;
const WALL = process.env.WALL_URL || "http://127.0.0.1:8788";
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

async function wall(path, body) {
  if (dry) return;
  try {
    await fetch(WALL + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // The wall being closed never stops the run.
  }
}
const station = (state, message) =>
  wall("/api/station", { id: "seo", name: "SEO", department: "development", state, message, lastRun: new Date().toISOString() });

async function paused() {
  try {
    const s = await (await fetch(`${WALL}/api/state`, { signal: AbortSignal.timeout(3000) })).json();
    return s?.paused === true || s?.flags?.paused === true;
  } catch {
    return false;
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

  await station("ok", "run started");
  run("git", ["fetch", "origin", "main"]);
  run("git", ["checkout", "-B", branch, "origin/main"]);

  run("node", ["apps/seo/scripts/scoreboard.mjs"]);
  run("git", ["add", "content/seo/scoreboard"]);
  run("git", ["commit", "-m", q(`SEO reading ${date}`)]);

  // The agent has no network, so the site's dependencies must be in place before it starts,
  // or it cannot run the checks on its own change (found on the first run, 2026-11-17).
  const web = resolve(repoRoot, "apps/web");
  if (!dry && !existsSync(resolve(web, "node_modules"))) run("npm", ["ci"], { cwd: web });

  let agentFailed = false;
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
      agentFailed = true;
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
      await station("failed", "this week's site change failed the checks and was dropped");
      console.error("site change failed the checks: dropped");
    }
  }
  if (changed) {
    run("git", ["add", "-A"]);
    run("git", ["commit", "-m", q(`SEO ${date}: this week's move and report`)], { allowFail: true });
  }

  run("git", ["push", "-u", "origin", branch, "--force-with-lease"]);
  const report = `content/seo/reports/${date}.md`;
  const hasReport = !dry && existsSync(resolve(repoRoot, report));
  const body = hasReport ? ["--body-file", report] : ["--body", q(`SEO reading ${date}. The agent step left no report.`)];
  // A second run on the same day reuses the day's pull request instead of failing on it.
  const open = dry ? "" : run("gh", ["pr", "list", "--head", branch, "--state", "open", "--json", "number", "-q", q(".[0].number")], { capture: true }).stdout.trim();
  if (open) run("gh", ["pr", "edit", open, ...body]);
  else run("gh", ["pr", "create", "--base", "main", "--head", branch, "--title", q(`SEO ${date}`), ...body]);

  const dir = resolve(repoRoot, "content/seo/scoreboard");
  const last = !dry && existsSync(dir) ? readdirSync(dir).sort().at(-1) : null;
  if (agentFailed) await station("failed", "the agent step failed; the reading was kept and its pull request opened");
  else await station("waiting", `pull request ${branch} waits for you${last ? ` (reading ${last.replace(".json", "")})` : ""}`);
  await wall("/api/event", { kind: "run", station: "seo", subject: branch, text: `SEO run ${date}: pull request opened` });
  if (agentFailed) throw new Error("the agent step failed (the reading and its pull request are kept)");
  console.log("done");
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(repoRoot, "apps/seo/scripts/run.mjs")) {
  main().catch(async (e) => {
    console.error(`SEO run failed: ${e.message}`);
    await station("failed", e.message.slice(0, 200));
    process.exit(1);
  });
}
