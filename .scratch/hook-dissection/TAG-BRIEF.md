# Brief: dissecting reel openings (taxonomy and tags)

You study how Instagram reels open: what happens in the first ~5 seconds that makes a viewer stop
scrolling. You don't judge whether a reel is good. You describe its opening precisely, in four
layers, then name the **mechanisms** at work. Spec: `.scratch/hook-dissection/spec.md`.

## Your inputs, per reel (paths in your batch file)

- `sheet.jpg`: the frames at 0 s, 1 s and 3 s side by side (left to right). Open it with the Read
  tool; it is an image. Open the single frames (`f_0.jpg` … `f_5.jpg`) only when text on the sheet
  is too small to read or you need 0.5 s / 2 s / 5 s.
- `layers.json` (tagging) or the digest `.md` (taxonomy): `speech` (Whisper transcript of the first
  15 s, with timings), `cuts_first_5s` (scene cuts detected in the first 5 s), `caption_first_line`.
- Whisper sometimes transcribes song lyrics, or garbles speech; a reel in another language is
  described as that language and tagged like any other.

Read only the files listed in your batch. Nothing else under `media/` or `apps/reels/scripts/hooks/data/`.

## The four layers (describe each, in plain words)

1. **Spoken:** what the voice says in the first ~5 s, and when. Say whether it's a **voiceover / to-camera
   voice** or **music lyrics** (a song). Song lyrics are music: never quote them, write "song".
2. **On-screen text:** any text on the frames at 0–3 s, verbatim (short), and when it appears.
3. **First frame and pace:** what is on screen at 0 s (face to camera, object, scene, screen recording,
   text card…), what changes by 1 s and by 3 s, and the cut count.
4. **Caption:** the first line, and the CTA type if any (comment keyword, follow, save, link, none).

## Mechanisms

A mechanism is a *move* that holds attention, independent of topic: for example a **distinction**
("X and Y are two very different things"), a **named villain** (the thing the viewer already does,
named as what fails them), a **mid-action start** (the video opens in the middle of something), a
**bold claim**, a **specific number**, a **direct question**, a **visual mismatch**, a **result shown
first**, a **POV / you-scene**, a **list promise**… These are examples, not the list.

- **Taxonomy run (two agents, separate samples, merged afterwards):** read your mixed sample, then write your `taxonomy-<a|b>.md`: 12–25 mechanisms, each with
  a one-line definition, how to recognise it in each layer, and 2 example shortcodes. Merge near-duplicates;
  split a mechanism that covers two different moves. A reel can carry several.
- **Tagging runs (many agents):** use `content/research/hooks/taxonomy.md` as written. For each reel write
  one JSON line (one object per line, UTF-8) to your output file:
  `{"shortcode", "spoken": "first ~5 s in plain words, or 'song' / 'none'", "on_screen": "text at 0–3 s,
  short", "first_frame": "what is at 0 s and what changes by 1 s and 3 s", "mechanisms": ["ids"],
  "context": {format, audio, transcript_reliable, language, text_style, face_at_0s, annotation,
  series_marker, caption_cta, sponsored, repost}, "new_mechanism": null | "name: definition"}`.
  Propose a new mechanism only when none fits; it is logged, never silently added.

You don't know which reels performed. Don't guess: describe what is there.

Reply in three lines: reels done, the most common mechanisms you saw, anything unreadable.
