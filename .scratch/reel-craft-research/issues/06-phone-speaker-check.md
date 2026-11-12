# 06 Phone-speaker pass in reel-check

Status: done
Spec: ../spec.md (Plan 2, Listening)

Add an info-only pass to `scripts/reel-check.py`: filter the render's audio like a small phone
speaker (high-pass around 300 Hz, gentle top roll-off), then report each `SoundDesign` effect whose
level drops below audibility under the voice. Info only, never a FAIL. Calibrate on 002 v9.

**Done when:** reel-check prints the pass on 002 and 003, and the README "Sound" section mentions it.
