// The SEO agent's score, computed from Search Console data. Pure: no network, no clock.
// Used by: scripts/scoreboard.mjs. Tested in scoreboard.test.mjs.
//
// Two numbers (.scratch/seo-agent/spec.md, "The score"):
//   pageOne  how many target searches show a llamapoker.com page at average position 10 or better
//   indexed  how many sitemap pages Google has in its index

/** Google's first page: an average position of 10 or better. */
export const PAGE_ONE = 10;

const norm = (q) => q.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * @param targets [{ query, page }] the searches we want page one for, and the page meant to win each
 * @param rows    Search Console rows with dimensions [query, page]
 * @returns one line per target: best position seen for that exact query, and whether the page
 *          Google shows is the one we meant (`rightPage`)
 */
export function scoreTargets(targets, rows) {
  const best = new Map();
  for (const r of rows) {
    const q = norm(r.keys[0]);
    const cur = best.get(q);
    if (!cur || r.position < cur.position)
      best.set(q, { position: r.position, impressions: r.impressions, clicks: r.clicks, page: r.keys[1] });
  }
  return targets.map((t) => {
    const hit = best.get(norm(t.query));
    return {
      query: t.query,
      page: t.page,
      position: hit ? Math.round(hit.position * 10) / 10 : null,
      impressions: hit?.impressions ?? 0,
      clicks: hit?.clicks ?? 0,
      shownPage: hit?.page ?? null,
      rightPage: hit ? new URL(hit.page).pathname === t.page : null,
      pageOne: !!hit && hit.position <= PAGE_ONE,
    };
  });
}

/** Sitemap <loc> values. */
export const sitemapUrls = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

/** Google's verdict "PASS" is the only state that means the URL is in the index. */
export const isIndexed = (status) => status?.verdict === "PASS";

/**
 * Long questions people typed before they saw us (eight words or more), most shown first, that
 * we are shown for and rarely clicked on: candidates to answer at the top of the page shown.
 */
export function longQuestions(rows, { minWords = 8, maxCtr = 0.03, minImpressions = 5 } = {}) {
  return rows
    .filter((r) => norm(r.keys[0]).split(" ").length >= minWords && r.impressions >= minImpressions && r.ctr <= maxCtr)
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => ({ query: r.keys[0], page: r.keys[1], impressions: r.impressions, clicks: r.clicks, position: r.position }));
}

export function summarize(targetScores, pages) {
  return {
    pageOne: targetScores.filter((t) => t.pageOne).length,
    targets: targetScores.length,
    indexed: pages.filter((p) => p.indexed).length,
    pages: pages.length,
  };
}
