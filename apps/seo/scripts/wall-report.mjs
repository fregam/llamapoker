#!/usr/bin/env node
// Puts a reading that is already in the repo on the wall, as the run it came from: for the
// readings taken before the runner reported to the wall, and for mending the wall after its
// store was reset. The wall compares each new run with the one before it, so it needs a first one.
//   node apps/seo/scripts/wall-report.mjs 2026-11-17     that day's reading
//   node apps/seo/scripts/wall-report.mjs                the newest reading
// Safe to repeat: the event's id is the reading's date, and the store ignores an id it has.
// With no date, or with --station, the station is set to that reading too; with a date alone,
// only the event is added (an old reading must not move the station back).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { send } from "../../wall/scripts/wall-outbox.mjs";
import { repoRoot } from "../src/credentials.mjs";
import { runEvent, stationReport } from "../src/wall.mjs";

const dir = resolve(repoRoot, "content/seo/scoreboard");
const given = process.argv.slice(2).find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const date = given ?? (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort().at(-1)?.replace(".json", "") : null);
const file = date ? resolve(dir, `${date}.json`) : null;
if (!file || !existsSync(file)) {
  console.error(date ? `no reading for ${date} in content/seo/scoreboard/` : "no readings in content/seo/scoreboard/");
  process.exit(1);
}
const reading = JSON.parse(readFileSync(file, "utf8"));
// The start of the reading's own day (the file keeps the date, not the time): never in the
// future, and before any run that reports itself later that day, so the order of runs holds.
const at = new Date(`${reading.date}T00:00:00Z`);
const event = { ...runEvent({ date: reading.date, branch: `seo/${reading.date}`, reading }), id: `seo-run:${reading.date}`, ts: at.toISOString() };
const results = [await send("event", event)];
if (process.argv.includes("--station") || !given) results.push(await send("station", { ...stationReport({ now: new Date(), reading }), lastRun: at.toISOString() }));
console.log(`${event.text} → ${results.join(", ")}`);
