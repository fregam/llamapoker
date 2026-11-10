# media/

Binary media for the monorepo. This tree mirrors `content/`, so every text file there has its
files here at the same path. The binaries are git-ignored (only this README is tracked). Each
folder's manifest in `content/` records every file's sha256, size, dimensions, source,
generation ID and prompt, so any file can be verified with
`node scripts/media-manifest.mjs --check` and regenerated or re-downloaded if it is lost.

```
media/
  library/                         permanent references (manifest: content/library/assets.json)
    characters/<name>/<name>_<sheet>_v<NN>.png      sheet = turnaround | expressions | poses
    locations/<place>_plate_v<NN>.png
    props/props_sheet_v<NN>.png
  reels/<YYYY-MM-DD>_<slug>/       one folder per reel (mirrors content/reels/<same>/)
    keyframes/ motion/ clips/ audio/{vo,music,sfx}/ edit/ renders/
  tests/<YYYY-MM-DD>_<slug>/       bake-offs and model tests (write-up in docs/research/)
    inputs/ outputs/ frames/
```

## Naming

- Lowercase kebab-case words; `_` separates fields; version is `v` plus two digits.
- Library: `<subject>_<kind>_v<NN>[-alt].<ext>`, e.g. `gentleman_poses_v01.png`.
- Test outputs: `<variant>_<model>_<mode>.<ext>`, e.g. `e_kling-4.0_i2v.mp4`; frame grabs add the
  timestamp, e.g. `e_kling-4.0_i2v_2.1s.png`; frame strips end in `_strip`.
- Never overwrite a version: make `v02` and keep `v01` until the manifest marks it retired.

## Backup

Not in git (a 4K sheet is ~17 MB, and clips add up fast). Next step: mirror this folder to a
Cloudflare R2 bucket with the same paths.
