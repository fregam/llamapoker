---
title: Tool check for apps/research (audience research)
date: 2026-11-14
status: done; ticket 01 of .scratch/audience-research. Superseded on terms: founder decision 2026-11-15, platform terms don't constrain collection (spec, "Platform terms")
---

# Tool check for `apps/research`

Three parallel read-only checks (platform APIs, clustering stack, collectors), from primary
sources where they could be fetched. Nothing installed. Not legal advice: terms are our reading.

## Verdicts

| Tool | Verdict | Phase | Notes |
|---|---|---|---|
| YouTube Data API v3 | **adopt** | 1 | Free key, 10,000 units/day; comment threads 1 unit/call (100 comments). Real cap: search, 100 calls/day. Founder creates a Google Cloud project + key. `google-api-python-client`. |
| yt-dlp | **adopt** | 1 | YouTube comments (replies, likes) and auto-subtitles without a key; throttle against bot checks. (Terms note: III.E.6 bars scraped data for API clients; founder overruled 2026-11-15.) |
| Reddit | **adopt via scraping** (json endpoints / redlib / Agent-Reach) | 1–2 | Founder decision 2026-11-15. API background: | Reddit's own pages refused our fetches; secondary sources say the free tier is non-commercial, commercial use needs a contract, new apps need approval. |
| TikTok Research API | **skip** | – | Academic / non-profit only, "independent of commercial interests". TikTok goes through Agent-Reach in phase 2. |
| Agent-Reach v1.6.1 (MIT) | **adopt, pinned, hardened** | 1 (no-login channels), 2 (login channels) | Red flags in `install.md`: remote script via `irm … \| iex` with `-ExecutionPolicy ByPass`; installs `releases/latest` with no pin or checksum; `setup` writes skills into unnamed AI-tool folders; edits shell config; keys in `~/.agent-reach/config.yaml`; `update` upgrades everything unasked; copies sessions from real Chrome. So: install from the v1.6.1 tag source by hand into its own venv, never run the installer, `setup` or `update`, sessions only from the research profile. The PyPI package `agent-reach` is a different project. |
| google-play-scraper (MIT), app-store-web-scraper | **adopt** | 1 | App reviews. Both last released mid-2024; the Apple package lists two licences (Apache-2.0 and MIT). |
| Obsei | **borrow ideas** | – | 1.0 is a rewrite; Reddit collector unpublished; Play collector needs developer access. |
| MediaCrawler | **adopt if** the source map ranks Chinese platforms high | 2 | Chinese platforms only; needs logins. |
| BERTopic 0.17.4 (MIT) | **adopt** | 1 | Saturation: fit a model per batch, `merge_models` into the base, count topics added. Avoid the 1.0.0b1 pre-release. hdbscan/umap may not build on Windows: fallback scikit-learn's HDBSCAN. |
| multilingual-e5-base (MIT) | **adopt** | 1 | Embeddings; bge-m3 if a spot check groups better. RTX 4060 8 GB fits both. Near-duplicates: cosine ≥ 0.95, merged before clustering. |
| lingua-py 2.1.1 (Apache-2.0) | **adopt** | 1 | 2.2.0 has no build for Python 3.11 on PyPI; 2.1.1 installed. Language detection on short informal text; fastText lid.176 (CC BY-SA) as a fast first pass. |

## YouTube terms (background only, not applied)

From https://developers.google.com/youtube/terms/developer-policies (read 2026-11-14):

- **III.E.4.d:** Non-Authorized Data may be stored temporarily, "but not longer than 30 calendar
  days"; **III.E.4.b:** statistics retrieved as Non-Authorized Data are not stored "for more than 30
  days". Public comments read with a key are most likely Non-Authorized Data. → Raw YouTube items
  are deleted (or refreshed) after 30 days; long-term we keep only our own coding (themes, tags,
  counts we compute) and short quotes in the findings.
- **III.E.2.b:** no aggregating API Data "to gain insights into YouTube's usage, revenue, or any
  other aspects of YouTube's business", and "The API Client must not combine API Data from the
  different content owners." Our purpose is the audience's language, not YouTube's business, but
  pooling comments across channels is a grey area. → Store YouTube items per channel, report
  themes in our own words, never publish YouTube-derived metrics.
- **III.E.4.h:** no "new or derived data or metrics" replacing YouTube's. → No engagement scores
  presented as YouTube numbers; YouTube likes are used only inside the pipeline for weighting,
  within the 30 days.
- **III.E.6:** no scraped YouTube data. → API only (yt-dlp out, above).

## Open

- Google Cloud API key (optional, founder; in the ticket 09 wizard) if the API turns out easier than yt-dlp for bulk comments.

Working notes from the three checks were in the session scratchpad (not kept).
