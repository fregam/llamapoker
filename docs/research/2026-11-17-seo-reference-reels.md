# SEO agent: the founder's four reference reels, checked against Google's own docs

2026-11-17. The founder sent four Instagram reels (five links, one repeated) as starting material
for an SEO agent whose goal is "our site continuously highly ranked". All four are by one creator,
Edward Sturm (`edward.builds`). Each was downloaded, transcribed locally (faster-whisper) and its
claims checked against Google Search Central. A reel is a lead, not a fact: what Google's page
says wins.

## Where the site stands today

Read from the live site on 2026-11-17 (curl) and from the 2026-11-11 audit (Search Console).

| What | Value |
|---|---|
| Pages in the sitemap | 13, all return 200, each with a canonical link equal to its sitemap URL |
| robots.txt | allows everything, names the sitemap |
| Indexed (2026-11-11) | 3 pages; 10 discovered but not indexed |
| Search, 28 days (2026-11-11) | 17 impressions, 1 click; "poker outs" (6), "pot odds formula" (1) |
| Guide authorship | Article JSON-LD names the organisation LlamaPoker as author and publisher; no person, no visible byline, no dates |
| Sitemap | no `lastmod` |
| Search Console access for an agent | none: no Google key in `credentials.json`; the service account is still on the founder's list in `docs/state.md` |

Search Console could not be re-read today (the Chrome extension did not load the page), so the
indexing and search numbers are six days old.

**The tightest constraint is indexing, not ranking.** Ten of thirteen pages are not in Google's
index. A page that is not indexed cannot rank, so nothing below matters for those pages until
they are in.

## The reels

### 1. Preferred sources badge (`DceiK3UM9aI`, 2026-08-25, 32.7K likes)

- **Claim:** add Google's "preferred source" button; visitors who click it see you more in AI
  Overviews, AI Mode, Top Stories and Discover; enough clicks act as a ranking signal for everyone.
- **Google says** ([preferred sources](https://developers.google.com/search/docs/appearance/preferred-sources)):
  a user who picks a site sees it more in Top Stories, and it can carry a "preferred" badge for
  that user in AI Mode and AI Overviews. Domains and subdomains only. The link is
  `https://www.google.com/preferences/source?q=llamapoker.com`; Google also ships a script button
  and badge images.
- **Not in Google's page:** Discover, ordinary results, and any effect on other users. The
  "global ranking signal" is the creator's claim.
- **For us:** Top Stories is a news surface and we publish guides, so the effect today is close to
  nothing. It costs one link, so it is worth adding where a returning reader is (the letter, the
  colophon) once the site publishes on a rhythm. The plain link is enough; Google's script would be
  the site's first third-party script and would need the Privacy page changed.

### 2. Free dofollow backlink list (`DeNvscyPd5b`, 2026-10-08)

- **Claim:** work through "A Growing List of Free Do-Follow Backlinks" (Nick Nolan, Medium), then
  ask an AI which ones are missing.
- **Google says** ([spam policies, link spam](https://developers.google.com/search/docs/essentials/spam-policies)):
  "Low-quality directory or bookmark site links" and "Using automated programs or services to
  create links to your site" are link spam.
- **For us:** a real profile on a place our readers use (our own social accounts, a tool directory
  a poker player would browse, a GitHub repo that is already public) is fine and worth having. A
  list worked through for the sake of the links is the thing the policy names. So the agent vets a
  short list, one entry at a time, against "would a beginner poker player find us here?"; it never
  creates accounts or submits anything. The founder does that, or says no. The list itself has not
  been read yet.

### 3. Deceptive authorship (`DfsgkukvtwP`, 2026-11-13)

- **Claim:** Google added a line saying fabricated author profiles are deception and a
  low-quality signal.
- **Google says** ([helpful content, "Who"](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)):
  confirmed. Fabricated creator profiles (AI headshots, made-up names, false credentials) are
  deception, and deception "is a signal of a low-quality page". The same page strongly encourages
  accurate bylines where readers expect one, and a disclosure where a reader might ask how the
  content was made.
- **For us:** this one bites. The Gentleman is an engraved character; he must never be presented
  as an author or an expert. Today the guides name only the organisation, which is honest but
  thin: no person, no date, no word on how the numbers are made. The honest strong version is
  ours alone: the founder as the named person, and "every number on this page is computed by the
  engine you can run on the Table" as the how.

### 4. Search Console regex for long questions (`DfuyjS1Rcf4`, 2026-11-14)

- **Claim:** in Performance, filter Query by the regex `^(?:\S+\s+){7,}\S+$` (eight words or
  more); pick queries with many impressions and few clicks; answer each at the top of the page
  that already shows for it.
- **Check:** this is a filter on our own data, nothing to verify beyond that it works. It is the
  same idea as the research agent's "what could we rank for".
- **For us:** with 17 impressions in a month it returns nothing today. It is the agent's weekly
  loop once pages are indexed: read the queries, find the question a page is shown for and does
  not answer, draft the answer from the engine's numbers.

## What this means for the agent

1. Its first job is getting the ten missing pages indexed and finding out why they are not.
2. It needs Search Console through the API (a service account), or it cannot run unattended.
3. It drafts; the founder approves anything that changes the site or leaves the building
   (roadmap, "Agent rules"; `docs/operating-brief.md`, "Ask first").
4. No page whose only purpose is to catch a keyword (`docs/operating-brief.md`, content engine).
5. The transcripts are in the session scratchpad only; the reels are public and linked by id above.
