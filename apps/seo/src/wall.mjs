// What the weekly run tells the wall (apps/wall), pure: no network, no clock of its own.
// Used by: scripts/run.mjs, scripts/weekly.mjs, scripts/wall-report.mjs. Tested in wall.test.mjs.
//
// The wall shows the agent as the `seo` station under DEVELOPMENT and reads three threats from
// the `run` events built here (apps/wall/functions/_lib/derive.ts, seoThreats): no run for nine
// days, a page that left Google's index, a target search that left page one. That is why a run
// event carries the lists and not only the counts: one target can leave while another enters.

export const STATION = { id: "seo", name: "SEO", department: "development" };

/** The station's line, as the ticket words it: "page one 2/18, indexed 9/13". */
export const scoreLine = (s) => `page one ${s.pageOne}/${s.targets}, indexed ${s.indexed}/${s.pages}`;

const pathOf = (url) => {
  try {
    return new URL(url).pathname;
  } catch {
    return String(url);
  }
};

/** A reading (content/seo/scoreboard/<date>.json) as a run event's meta. */
export function readingMeta(reading) {
  const { summary, targets, pages, totals } = reading;
  return {
    reading: reading.date,
    pageOne: summary.pageOne,
    targets: summary.targets,
    indexed: summary.indexed,
    pages: summary.pages,
    pageOneQueries: targets.filter((t) => t.pageOne).map((t) => t.query),
    missedQueries: targets.filter((t) => !t.pageOne).map((t) => t.query),
    indexedPages: pages.filter((p) => p.indexed).map((p) => pathOf(p.url)),
    notIndexedPages: pages.filter((p) => !p.indexed).map((p) => pathOf(p.url)),
    impressions: totals?.impressions ?? null,
    clicks: totals?.clicks ?? null,
  };
}

/**
 * The run's event. `problem` is why it failed, in plain words, or null; a run that failed after
 * the reading still carries the reading, so the wall can compare it with the next.
 */
export function runEvent({ date, branch, reading = null, pr = null, problem = null }) {
  const score = reading ? scoreLine(reading.summary) : null;
  const where = pr ? `pull request #${pr.number}` : null;
  const text = problem
    ? `SEO run ${date} failed: ${problem}${score ? ` (${score})` : ""}`
    : `SEO run ${date}: ${[score, where].filter(Boolean).join(", ") || "done"}`;
  return {
    kind: "run",
    station: STATION.id,
    subject: branch,
    text: text.slice(0, 300),
    meta: { ok: !problem, ...(reading ? readingMeta(reading) : {}), ...(pr ? { pr: pr.number, prUrl: pr.url } : {}), ...(problem ? { problem } : {}) },
  };
}

/** The station as the run leaves it: red with the reason, or ok with the two numbers. */
export function stationReport({ now, reading = null, problem = null }) {
  const score = reading ? scoreLine(reading.summary) : null;
  return {
    ...STATION,
    state: problem ? "failed" : "ok",
    message: (problem ? `${problem}${score ? ` (${score})` : ""}` : (score ?? "run finished, no reading")).slice(0, 300),
    lastRun: now.toISOString(),
    nextRun: nextRun(now),
  };
}

/** The schedule the founder registers (apps/seo/README.md): Mondays at 07:00, this PC's time. */
export const SCHEDULE = { weekday: 1, hour: 7 };

/** The next scheduled start after `now`, ISO. A run started by hand does not move the schedule. */
export function nextRun(now) {
  const d = new Date(now);
  d.setHours(SCHEDULE.hour, 0, 0, 0);
  d.setDate(d.getDate() + ((SCHEDULE.weekday - d.getDay() + 7) % 7));
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
  return d.toISOString();
}

/**
 * The pull request as a card in Needs you. The id is the pull request's, so a second run on the
 * same day brings the same card up to date, and the wall clears it when GitHub says the pull
 * request is merged or closed (apps/wall/scripts/pr-cards.mjs).
 */
export function prCard({ pr, date, report = null }) {
  const body = report?.trim();
  return {
    id: `pr-${pr.number}`,
    kind: "pull-request",
    title: `SEO ${date}: this week's move, pull request #${pr.number}`,
    preview: [`${pr.url}`, "Merge or close it on GitHub; this card clears itself when you have.", body ? `\n${body.slice(0, 12000)}` : "\nThe agent step left no report: the pull request holds the reading only."].join("\n"),
  };
}
