# Spec: hook dissection (how good hooks are made, from evidence)

Status: ready-for-agent
Grilled with the founder 2026-11-16, after the first hook test (`.scratch/hook-writing/`): 120 drafts
passed every check and the founder struck 19 of 30. The rules were theory. The primary goal now is
to dissect hooks that actually performed, not to test ours.

## Decisions

1. **Good = an outlier.** A reel with **at least 100k views and at least 5× its account's median**
   views. The same accounts' ordinary reels are the comparison set; lift (how much more often a
   mechanism appears in outliers than in ordinary reels) is what the dissection measures.
2. **Any niche.** We classify the hook's *mechanism*, not its topic (Jason Murray's taxonomy idea:
   the mechanism behind an image regardless of subject).
3. **Per platform.** Instagram is the main corpus (our reels live there). YouTube and TikTok, later,
   are separate sets, never pooled.
4. **Source: the Instagram Graph API, Business Discovery** (`view_count` for other accounts' reels;
   setup in memory `instagram-api`; token in `credentials.json`). No search: accounts are named.
5. **The creator list (~150 accounts)** from three feeds: the founder's swipe file (every reel the
   founder sends adds its creator; first two: Sky Tan, Jason Murray), the poker Instagram accounts in
   the research source map, and research agents hunting creators in any niche whose reels often beat
   their own norm. Every candidate is checked through the API before it joins (Business/Creator
   account, enough reels to compute a median).
6. **Four layers per reel, first ~5–10 s:** the spoken words (transcript), the on-screen text, the
   first frame and its pace, the caption's first line and CTA type. A comment-keyword funnel ("comment
   IRIS") is flagged and discounted: its engagement measures the CTA, not the hook.
7. **Tagging is blind.** The agents that tag mechanisms never know which reels are outliers. The
   taxonomy is built from a mixed sample, then applied to all.
8. **Outputs:**
   - `content/research/hooks/playbook.md` for the founder and every writer agent: per mechanism its
     lift, 3–5 real examples across the four layers with numbers and links, how it's built (the
     moves), and one line of how it would sound for LlamaPoker. Mechanisms with no lift are listed as
     "common, not why things work".
   - The corpus store (git-ignored SQLite) with every reel, its numbers, layers and tags.
9. **Then** the hook writer is rebuilt on the playbook: the objective is good hooks; rules are hard
   limits (truth, brand, where helping ends) plus craft guidance from measured lift; examples are
   real outliers (memory `agent-objective-not-rules`).

## Method

1. **Fetch** (code): for each account, Business Discovery pages through its media; keep reels with
   `view_count`, likes, comments, timestamp, caption, permalink. Median per account over its last
   ≤ 60 reels; outlier flag; funnel flag (caption asks for a comment keyword, or comments/likes far
   above the account's norm).
2. **Sample** (code): every outlier, plus an equal number of ordinary reels from the same accounts
   (closest in date), so lift compares like with like.
3. **Layers** (code + agents): yt-dlp downloads the sampled reels (logged out works for public
   reels); frames at 0 / 0.5 / 1 / 2 / 3 / 5 s and a cut count for the first 5 s (ffmpeg scene
   detection or frame differencing); speech transcribed locally (Whisper via the ComfyUI venv's
   transformers, first 15 s). Agents read the frame images for on-screen text and the first frame.
4. **Taxonomy** (agents, blind): two agents on separate mixed samples of ~150 reels each write a
   list independently; merged (found by both = kept, by one = checked against its examples).
5. **Tag** (agents, blind, parallel): every reel in the tagging set (6 strongest outliers per account
   plus twins) gets its mechanisms (several allowed). ~10% are tagged twice to measure agreement;
   mechanisms below ~70% agreement are reported as unreliable. Proposed new mechanisms are reviewed
   once and the affected reels re-tagged.
6. **Lift** (code): per mechanism, share in outliers ÷ share in ordinary reels, with counts and a
   simple interval; at least 8 outliers per mechanism before it is called.
7. **Playbook** (agent, higher effort): written from the lift table and the examples: each strong
   mechanism shown through 3–5 outlier openings beside their twins (the move done well vs flat).

## Privacy and media (the repo is public)

- Creators are public publishers: the playbook names accounts and links reels. Commenters never.
- Downloaded reels are media: `media/research/hooks/<shortcode>/` (git-ignored) with a manifest
  `content/research/hooks/assets.json` (`scripts/media-manifest.mjs`). Only frames and transcripts
  of sampled reels are kept; the store is git-ignored.

## Done when

- ~150 accounts checked, the corpus fetched, outliers and the comparison set sampled and layered.
- The taxonomy and tags exist, the lift table is computed.
- `playbook.md` is written and the founder has read it.

## Out of scope

- YouTube and TikTok sets (later, separate). Rebuilding the hook writer (next feature).
- Retention curves (only for our own reels, via insights, once we post).
