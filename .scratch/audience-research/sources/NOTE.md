# Source map: result (2026-11-15)

Ticket 04. Final list: `sources.json` (204 judged, ordered deep → maybe → skip, then by
rec_share × own_voice). Every row has the route used to sample it, for the collectors.

## Funnel

| Tier | What | Count |
|---|---|---|
| 1 | Candidates found by 8 discovery agents, every row seen on a fetched page | 3,023 (2,931 unique after dedupe; 88 unverified Reddit rows held back) |
| 2 | Ranked in code (voice, reach, recency, access; floors per type and language) | top 204 |
| 3 | Judged by 8 agents from a real 20–40 item sample each | **28 deep**, 55 maybe, 121 skip |

## The 28 to mine (deep runs, ticket 07)

- **App reviews (8):** Mega Hit, DH Texas, Governor of Poker, Zynga, Poker Heat, WSOP (Play), WSOP
  (App Store), Sohoo (China App Store). Free-chip players, rec 0.95+, many languages.
- **Forums (8):** CardsChat General / Learning / Online / Tournament, Replay Poker, Poker Académie
  (fr), GipsyTeam low-limit MTT and NL40 cash (ru).
- **Communities and Q&A (3):** r/poker, r/Poker_Theory, Yahoo!知恵袋 poker (ja).
- **YouTube (9):** Jonathan Little, Sethy Poker, World Poker Tour Shorts, zChance44 (fr), Mattia
  Festa (it), 어수홀덤TV and Korea JJ Poker (ko), Gshan吉祥 (zh), GRND (de).

## First signal (not a finding yet: two-source rule applies in the deep runs)

"The app is rigged / bots / you only win if you buy chips / AA always loses" appears in 6+
independent sources across English, Chinese and 6+ other languages, plus forums.

## Gaps, and why

- **No short-video source is deep:** TikTok and Instagram comments need a login. These are our own
  reel viewers, so this is the biggest gap: phase 2 (research profile + Agent-Reach).
- **Facebook groups, X, VK, Telegram groups:** login walls. 5–10 "maybe" rows wait for one
  logged-in look (Vietnam/Thai Facebook groups, PokerOK Telegram, Doug Polk on X).
- **Twitch chat:** only via a public chat-log mirror (`logs.zonian.dev`); replays have no chat.
- **Blocked by bot checks:** 2+2, PokerStrategy (all languages), Quora, Yahoo Japan, Zhihu, Dcard.

## Routes that work (for the collectors)

- YouTube comments: yt-dlp `--write-comments` (bot-walls after ~14 videos: throttle, or API key).
- Reddit: `/r/<sub>/new/.rss`, Arctic Shift API (no login); official API once the wizard runs.
- App Store reviews: `itunes.apple.com/<cc>/rss/customerreviews/id=<id>/sortby=mostrecent/json`.
- Google Play reviews: google-play-scraper or Play's reviews endpoint (inconsistently allowed by
  the permission check: needs one settled route).
- Discourse forums (Replay Poker → forum.casino.org): `.json` endpoints.
- Discord member counts: `/api/v9/invites/<code>?with_counts=true`; Telegram: `t.me/s/<name>`.

## Social rows (decision 2026-11-15)

`raw-social.jsonl` (305 rows: X, Facebook, Instagram, Telegram; 209 Facebook) stays. Some rows were
found while an agent browsed the founder's logged-in Chrome; founder chose to keep them. They are a
list of places (no posts), the target list for phase 2 (ticket 10).
