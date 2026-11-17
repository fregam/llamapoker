#!/usr/bin/env node
// The weekly reading the SEO agent starts from: reads Search Console (last 28 days) and the index
// status of every sitemap page, scores them against targets.json and writes
// content/seo/scoreboard/<date>.json. Read-only against Google. No dependencies.
//   node apps/seo/scripts/scoreboard.mjs            write today's reading and print the summary
//   node apps/seo/scripts/scoreboard.mjs --dry      print only
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readCredentials, repoRoot } from "../src/credentials.mjs";
import { searchConsole } from "../src/google.mjs";
import { scoreTargets, sitemapUrls, isIndexed, longQuestions, summarize } from "../src/scoreboard.mjs";

const SITEMAP = "https://llamapoker.com/sitemap.xml";
const day = (d) => d.toISOString().slice(0, 10);
const today = new Date();
// Search Console's data lags about two days.
const endDate = day(new Date(today - 2 * 864e5));
const startDate = day(new Date(today - 30 * 864e5));

const { targets } = JSON.parse(readFileSync(resolve(repoRoot, "apps/seo/targets.json"), "utf8"));
const sc = searchConsole(readCredentials().google_search_console);

const rows = await sc.queries({ startDate, endDate });
const urls = sitemapUrls(await (await fetch(SITEMAP)).text());
const pages = [];
for (const url of urls) {
  // One at a time: the inspection API allows 600 a minute and 2,000 a day per property.
  const s = await sc.inspect(url);
  pages.push({ url, indexed: isIndexed(s), state: s.coverageState ?? null, lastCrawl: s.lastCrawlTime ?? null });
}
const scores = scoreTargets(targets, rows);
const reading = {
  date: day(today),
  window: { startDate, endDate },
  summary: summarize(scores, pages),
  totals: {
    clicks: rows.reduce((n, r) => n + r.clicks, 0),
    impressions: rows.reduce((n, r) => n + r.impressions, 0),
  },
  targets: scores,
  pages,
  longQuestions: longQuestions(rows),
};

const s = reading.summary;
console.log(`page one: ${s.pageOne}/${s.targets} target searches   indexed: ${s.indexed}/${s.pages} pages`);
console.log(`28 days: ${reading.totals.impressions} impressions, ${reading.totals.clicks} clicks`);
for (const p of pages.filter((p) => !p.indexed)) console.log(`  not indexed: ${p.url} (${p.state ?? "unknown"})`);

if (!process.argv.includes("--dry")) {
  const dir = resolve(repoRoot, "content/seo/scoreboard");
  mkdirSync(dir, { recursive: true });
  const out = resolve(dir, `${reading.date}.json`);
  writeFileSync(out, JSON.stringify(reading, null, 2) + "\n");
  console.log(`wrote ${out}`);
}
