# Brand image library

The permanent references every keyframe and video starts from. Each image is made once, reviewed
against the brand, and kept.

- **Files:** `media/library/` (naming rules in `media/README.md`)
- **Manifest:** `assets.json`, one entry per file: path, status (`master`, `alternate`,
  `draft` or `retired`), Higgsfield ID (pass it as an `image_references` value), source URL,
  references used, the exact prompt, sha256, size and dimensions. Verify with
  `node scripts/media-manifest.mjs --check`.

## The look: read `brand/README.md` first

Everything is a **fine cream copperplate engraving on flat near-black**, the same world as the
og card and the X banner (`apps/web/public/og.png`, `brand/social/x-banner.png`):

- Cream ink `#ece7dc` with cross-hatching on flat near-black `#0a0a0b`. No paper texture, no
  beige sheets, no floor or cast shadows on character sheets.
- Dark editorial and modern: a loft at night with the city behind, a table edge in a void.
  Never period scenes (no 19th-century clubs, gaslights or spires).
- Generous negative space, one idea per frame. Colour only as a hint: muted sage on felt,
  brass on metal. No neon, glow or gradients.
- Characters and sets are both engraving: one drawn world.

## Prompt rules

- Start every prompt with: *"The same llama as the reference, in the exact same fine copperplate
  engraving style with cross-hatching, cream ink (#ece7dc) on flat near-black (#0a0a0b)."*
  (For non-llama subjects: "…redrawn in the exact fine copperplate engraving style of the
  reference…".)
- Always pass the Gentleman's master turnaround and/or `brand/assets/gentleman.png` as references.
- Describe hooves only positively ("two-toed hooves"). Never name fingers or hands.
- **Model:** FLUX 3 on Higgsfield (`flux_3_image`), chosen over GPT Image 2.5 by the user.
  Draft at `2k` (~3 credits); a draft that passes review is the final. Use `4k` (19 credits)
  only for the Gentleman's master turnaround.
- **Review before accepting:** put it next to the og card. Same world? Same face? Hooves? Black
  background? If not, it doesn't go in.

## Adding or replacing an asset

1. Draft into `media/tests/<date>_<slug>/outputs/`; review against the og card.
2. Move the accepted file into `media/library/...` under the naming rules. Never overwrite: make
   `v<NN+1>`, and mark the old entry `retired` with a reason.
3. Add its entry to `assets.json` (prompt verbatim), then run `node scripts/media-manifest.mjs`
   and `--check`.

## Sound library

Music and sound effects for every video, kept so that making one never means searching for a sound.
All of it comes from Epidemic Sound (the founder's subscription, through its connector).

- **Files:** `media/library/audio/`: `music/<mood>/` (full tracks), `sfx/<role>/` (cuts ready to
  drop on a cue: 48 kHz mono, peak -6 dBFS, 20 ms of lead-in; `-tNN` is one take out of a recording
  with several), `sfx-raw/<role>/` (the untouched downloads).
- **Catalogue:** `audio.md`, grouped by role, with length and where each cut is loudest. Read this
  to choose. **Manifest:** `audio.json` (Epidemic Sound id, title, artist, bpm, tags, measured
  level, sha256). Verify with `node scripts/media-manifest.mjs --check content/library/audio.json`.
- **Sources:** `audio-sources.jsonl`, the curated list the library is built from (one Epidemic
  Sound id per line, with its role). The manifest and catalogue are generated from it.
- **Use:** `python scripts/sound-lib.py find <words>` then `python scripts/sound-lib.py use <id>`
  (copies it into `apps/reels/public/`, a music bed at -20 dBFS RMS as mp3, and notes the source in
  `apps/reels/sound-sources.json`).
- **Add a sound:** search and download through the Epidemic Sound connector (a download link lives
  about three minutes), add a line to `audio-sources.jsonl`, pipe `<id> <link>` lines into
  `python scripts/sound-lib.py fetch`, then `python scripts/sound-lib.py build`. Never overwrite a
  file: a changed sound is a `v02`.
- **Licence:** not verified from here. Epidemic Sound clearance normally depends on an active
  subscription and on the publishing channels being linked to it: the founder confirms the plan
  covers Instagram, TikTok and YouTube before the first reel with this music is posted.

## History

- 2026-11-09: v01 (GPT Image 2.5, warm paper, 19th-century club) retired as off-brand. The
  FLUX paper sheets were never accepted. On-brand library started as drafts in `media/tests/`.
- 2026-11-12: the FLUX and on-brand drafts and the 3D Gentleman files (used only by the
  shelved Blender work) were deleted; their manifest entries are in git history.
- 2026-11-17: sound library added: 53 tracks in 14 moods (161 minutes) and 277 effect cuts in 54
  roles, from 251 Epidemic Sound downloads (3.6 GB). Chosen by title, tags and measurement; not yet
  listened to by the founder.
