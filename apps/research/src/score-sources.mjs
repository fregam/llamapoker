// Usage: node src/score-sources.mjs <sources dir>  -> ranked.json, judge.json in that dir
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dedupe, score, pickForJudging } from "./score.mjs";

const dir = process.argv[2];
const rows = [];
let bad = 0;
for (const f of readdirSync(dir).filter((f) => /^raw-.*\.jsonl$/.test(f))) {
  for (const line of readFileSync(join(dir, f), "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push({ ...JSON.parse(line), slice: f.slice(4, -6) });
    } catch {
      bad++;
    }
  }
}
const ranked = score(dedupe(rows));
const judge = pickForJudging(ranked);
writeFileSync(join(dir, "ranked.json"), JSON.stringify(ranked, null, 1));
writeFileSync(join(dir, "judge.json"), JSON.stringify(judge, null, 1));
const count = (xs, k) =>
  Object.entries(xs.reduce((a, r) => ((a[r[k]] = (a[r[k]] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
console.log(rows.length + " rows, " + bad + " unparseable, " + ranked.length + " unique, " + judge.length + " for tier 3");
console.log("types: " + count(ranked, "type").map(([k, v]) => k + " " + v).join(", "));
console.log("langs: " + count(ranked, "lang").slice(0, 20).map(([k, v]) => k + " " + v).join(", "));
