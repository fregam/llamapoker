// The pretend commands behind run.test.mjs: `git`, `gh`, `claude`, `npm`, `npx` and `node` as
// the weekly runner calls them, doing nothing real. Each call is logged to calls.log in the
// pretend repo (FAKE_REPO); FAKE_SCENARIO (JSON) says what goes wrong:
//   keyCheck: n     exit code of gsc-check.mjs          claude: n      exit code of the agent step
//   touchesSite     the agent step edits apps/web       siteTests: n   exit code of the site's tests
//   prOpen          the day's pull request already exists
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [name, ...args] = process.argv.slice(2);
const repo = process.env.FAKE_REPO;
const scenario = JSON.parse(process.env.FAKE_SCENARIO || "{}");
const line = `${name} ${args.join(" ")}`;
appendFileSync(join(repo, "calls.log"), line + "\n");

const stateFile = join(repo, "fake-state.json");
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : { agentRan: false, prOpen: !!scenario.prOpen };
const save = () => writeFileSync(stateFile, JSON.stringify(state));
const today = new Date().toISOString().slice(0, 10);
const has = (...words) => words.every((w) => args.includes(w));

// A reading in the shape scripts/scoreboard.mjs writes (the same one as wall.test.mjs).
const READING = {
  date: today,
  window: { startDate: "2026-10-26", endDate: "2026-11-21" },
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
  longQuestions: [],
};

let code = 0;
if (name === "git") {
  // Clean before the agent step; after it, whatever the agent "changed".
  if (has("status", "--porcelain") && state.agentRan) process.stdout.write(scenario.touchesSite ? " M apps/web/src/pages/learn.astro\n?? content/seo/reports/x.md\n" : "?? content/seo/reports/x.md\n");
} else if (name === "node") {
  if (line.includes("gsc-check.mjs")) code = scenario.keyCheck ?? 0;
  else if (line.includes("scoreboard.mjs")) {
    mkdirSync(join(repo, "content", "seo", "scoreboard"), { recursive: true });
    writeFileSync(join(repo, "content", "seo", "scoreboard", `${today}.json`), JSON.stringify(READING));
  }
} else if (name === "claude") {
  state.agentRan = true;
  save();
  code = scenario.claude ?? 0;
  if (code === 0) {
    mkdirSync(join(repo, "content", "seo", "reports"), { recursive: true });
    writeFileSync(join(repo, "content", "seo", "reports", `${today}.md`), `# SEO ${today}\n\nThis week: the fake move.\n`);
  }
} else if (name === "npm") {
  if (has("test")) code = scenario.siteTests ?? 0;
} else if (name === "gh") {
  if (has("pr", "list")) process.stdout.write(state.prOpen ? '[{"number":47,"url":"https://github.com/fregam/llamapoker/pull/47"}]\n' : "[]\n");
  if (has("pr", "create")) {
    state.prOpen = true;
    save();
  }
}
process.exit(code);
