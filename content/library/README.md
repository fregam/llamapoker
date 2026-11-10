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

## History

- 2026-11-09: v01 (GPT Image 2.5, warm paper, 19th-century club) retired as off-brand. The
  FLUX paper sheets in `media/tests/2026-11-09_flux-library/` were never accepted. On-brand
  library started in `media/tests/2026-11-09_on-brand-library/`.
- 3D: `gentleman_proxy_v02` (Tripo P2) is the geometry master. Its texture came from a paper
  sheet, so never render its colours; use it for shape, depth and clay passes only.
