# 02 Download and tear down the benchmark

Status: done except Ziramium (see Comments)
Blocked by: 01
Spec: ../spec.md (Plan 1, Teardown)

Download each reel for study only with yt-dlp into `media/tests/2026-11-12_motion-refs/`, listed in a
manifest (`media-manifest.mjs --init`). Fallback for blocked platforms (Instagram): record playback
through OBS's WebSocket server (founder enables it, password in `credentials.json`).

Per reel, measured with the `reel-check.py` tooling: cut times and shot lengths, motion events and
their easing (frame differencing on the contact sheets), sound onsets against visual events, loudness,
peak and floor, music under voice (ducking depth), words a second. Plus a qualitative read: what makes
it feel premium.

**Done when:** every reel has a teardown section in the research doc, and media manifests pass `--check`.

## Comments

- 2026-11-12: ten YouTube reels done. Ziramium (Instagram) still blocked without a login: OBS capture or browser cookies, founder to choose.
