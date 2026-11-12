# Round 03 key (blind labels; don't open before the verdicts are saved)

Current = camera + bed and effects -6 dB (rounds 1 and 2 winners). Each clip adds one change.

| Label | Upgrade (ranked list) | How |
|---|---|---|
| Current | camera + quieter mix | `{camera, bedDb:-6, fxDb:-6}` |
| 1 | #7 data inside the object (2.6% as a level filling the grid) | `+ fill` |
| 2 | #17 reference mastering to 3Blue1Brown (matchering, loudness kept) | `scripts/master-match.py` on Current |
| 3 | #3 never-still holds (slow push up to 2.5% + faint wobble) | `+ drift` |
| 4 | #6 short captions (max 3 words) | `+ shortCaptions` |
