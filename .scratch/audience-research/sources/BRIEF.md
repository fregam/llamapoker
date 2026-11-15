# Source map, tier 1: find everything

You are one of 8 parallel discovery agents for LlamaPoker's audience research (spec:
`../spec.md`, sections "Who", "Method" step 1). Your job: list **every candidate source** in your
slice where our viewers talk, with numbers. You **find and describe**; you do not collect quotes.

**Our viewer:** recreational poker players who already play (home games, low-stakes apps, casino
nights), know the rules but not the maths, want to stop losing; plus the edge where they start
turning serious (watching strategy content, hearing "GTO", trying a solver). Not pros/regulars.
A source full of regulars still counts as a candidate (note it); tier 3 judges the mix.

**Unit:** one community or comment section: a subreddit, a forum section, a YouTube channel, a
TikTok/Instagram creator, a Twitch channel, a podcast, one app's store reviews (per store), a
Discord/Telegram group, a Q&A topic. Not whole platforms.

**Any language, any country.** Search in the languages that matter for your slice (at least
English, Spanish, Portuguese, German, French, Russian, Chinese, Japanese, Italian, Polish,
Turkish, Hindi, Vietnamese, Thai where poker is active). Use native search terms, not translations
of English ones.

**How:** web search (many queries), directory and ranking sites (e.g. subreddit stats sites, Social
Blade-style trackers, podcast charts, app-store rankings, forum indexes, "best poker YouTube
channels" lists in each language), and page fetches. If a site blocks you, try another route
(a mirror like old.reddit/redlib, a tracker, a cached listing). Throttle: don't hammer one host.
Aim for **as many real candidates as you can find in your slice, 100–300**; breadth over depth.
**Nothing from memory:** every row must have been seen on a page you fetched or a search result in
this run, with a real url. Expect 30+ searches and many fetches; a handful of searches is not a map.

**Output:** append one JSON object per line to `raw-<your-slice>.jsonl` in this folder:

```json
{"name":"r/poker","platform":"reddit","url":"https://www.reddit.com/r/poker/","type":"community",
 "lang":"en","market":"global","followers":1200000,"posts_per_week":400,"comments_per_post":15,
 "last_activity":"2026-11","audience_guess":"mixed rec/reg","access":"public",
 "tool_route":"reddit json / redlib / Agent-Reach","notes":"hand histories, bad beats","evidence":"https://..."}
```

- `type`: community | channel | creator | forum-section | stream | podcast | app-reviews | group | qa
- `access`: public | login | blocks-bots | invite
- Unknown numbers → `null`, never invented. `evidence` = the page where you saw the numbers.
- `market`: us | uk | eu-<cc> | ca | au | in | es | latam-<cc> | br | ru | cn | jp | … | global
- No duplicates within your file (same url).

**Report back in 3–5 lines:** how many candidates, the 5 biggest, anything that blocked you.
