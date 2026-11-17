# 02 Every page indexed

Status: ready-for-agent
Blocked by: 01 (for the diagnosis only)

13 of 13 sitemap pages in Google's index. On 2026-11-11 it was 3, with 10 "discovered, currently
not indexed": Google knows the URLs and has not thought them worth crawling yet.

## Diagnosis from the first reading (2026-11-17)

- Indexed: `/`, `/learn/pot-odds`, `/learn/outs`. The other ten all read "URL is unknown to
  Google" with no crawl date: not rejected, never fetched.
- The sitemap is not the problem: Google downloaded it on 2026-11-13, 13 URLs, no errors.
- So the cause is crawl priority on an eleven-day-old site with no links from other sites.
  What moves it: asking for each page by hand in Search Console, links from other sites
  (ticket 06), and the pages linking to each other.

## Work

- [ ] From the first reading, list each page's coverage state and last crawl; write down the
      cause per page instead of guessing one cause for all.
- [ ] `/trainer` ships as an empty shell (2.9 KB, no text). Prerender a static introduction (what
      the five drills are, with one worked example from the engine) above the app, so there is a
      page to index. Keep the first render equal to the prerender (`apps/web/overview.md`).
- [x] `lastmod` in `sitemap.xml` for the dated pages (PR #41; dates are data in `seo.ts`, since
      Cloudflare builds from a shallow clone and cannot read git history).
- [ ] Internal links: every page reachable in one click from the home page and linked from at
      least two other pages with words that say what it is; report the ones that are not.
- [ ] Bing: verify the site in Bing Webmaster Tools (import from Search Console, founder's
      click), and add IndexNow (a key file in `public/`, a ping on deploy for changed URLs).
- [ ] Ask Google to index the pages still out, in Search Console's URL inspection (about ten a
      day by hand; the API cannot request indexing for ordinary pages). List them for the founder
      in the weekly report until none are left.

## Done when

The reading shows 13 of 13, or each page still out has a written cause and a move in progress.
