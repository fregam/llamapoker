# 05 A/B review page

Status: done
Spec: ../spec.md (Plan 2, Review page)

A private claude.ai artifact: per round, the baseline plus 3–4 variants labelled A–D blind (label
order shuffled, mapping kept out of the page), for the two bench scenes of reel 002 (hook take, plan
take). Pick one per scene and a note; picks stored in the artifact database so Claude reads them
with `ArtifactData`. Videos uploaded as artifact assets. Works on the founder's phone and desktop.

Also a render path for bench clips: render only the hook and plan takes of `only-aces`
(`--frames` ranges from the timeline) so a round costs minutes, not a full reel.

**Done when:** a dummy round (baseline vs three copies of it) is published, a pick round-trips into
the database, and the founder has opened it once.

## Comments

- 2026-11-12: page https://claude.ai/artifact/JjCqfNPWYbvxsYT39b4k2L (db: rounds/r01 holds the clips, picks/r01 the founder's pick). Bench clips render with `npx remotion render src/index.ts only-aces out/ab/<v>.mp4 --frames=0-740 --props=out/ab/<v>.json`.
