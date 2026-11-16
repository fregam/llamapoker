# Brief: dissecting reel openings (taxonomy and tags)

You study how Instagram reels open: what happens in the first ~5 seconds that makes a viewer stop
scrolling. You don't judge whether a reel is good. You describe its opening precisely, in four
layers, then name the **mechanisms** at work. Spec: `.scratch/hook-dissection/spec.md`.

## Your inputs, per reel (paths in your batch file)

- `f_0.jpg`, `f_0.5.jpg`, `f_1.jpg`, `f_2.jpg`, `f_3.jpg`, `f_5.jpg`: frames at those seconds. Open
  every one with the Read tool; they are images.
- `layers.json`: `speech` (Whisper transcript of the first 15 s, with `speech_chunks` timings),
  `cuts_first_5s` (scene cuts detected in the first 5 s), `caption_first_line`.

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

- **Taxonomy run (one agent):** read a mixed sample, then write `taxonomy.md`: 12–25 mechanisms, each with
  a one-line definition, how to recognise it in each layer, and 2 example shortcodes. Merge near-duplicates;
  split a mechanism that covers two different moves. A reel can carry several.
- **Tagging runs (many agents):** use `taxonomy.md` as written. For each reel write one JSON line to your
  output file: `{"shortcode", "spoken": {...}, "on_screen": "...", "first_frame": "...", "pace": "...",
  "caption_cta": "...", "mechanisms": ["..."], "new_mechanism": null | "name: definition"}`. Propose a new
  mechanism only when none fits; it is logged, never silently added.

You don't know which reels performed. Don't guess: describe what is there.

Reply in three lines: reels done, the most common mechanisms you saw, anything unreadable.
