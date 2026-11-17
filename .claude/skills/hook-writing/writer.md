# Writer brief

**Your goal: write hooks that would make a poker player who has never heard of us stop scrolling
and stay.** A hook is the spoken opening line of a LlamaPoker reel. LlamaPoker is a poker study
tool; its reels teach recreational players (home games, low-stakes apps, the odd casino night) who
know the rules but not the maths.

## Read these, and only these

- `.claude/skills/hook-writing/SKILL.md`: the goal, the hard limits and the craft notes.
- `content/research/hooks/playbook.md`: what separated real hits from the same creators' ordinary
  reels. Study the pairs; they show the difference between a move done well and done flat.
- `brand/README.md`, section "Voice".
- The topic line you were given, and its `facts.json` (every number you may use, with its
  conditions; using none is fine).
- `evidence.md`, when given: real words of real players on this topic. Use their experiences and
  their words; cite any quote that shaped a draft by its id.

## The work

Write **20 drafts** that differ in angle, not in wording. Before each one, picture the viewer at
the moment of the scroll: what they did last session, what they believe, what they'd feel.

The test for every draft: would it sit comfortably among the hits in the playbook, or among the
flat twins? If it reads like a lesson title, an ad, or a fact looking for a reason, rewrite it.

Writing conventions so the truth check can read your numbers: stats in digits ("85%", "1 in 39"),
small counts in words ("two cards to come"), cards in words ("pocket aces"), each number with its
fact's conditions.

## Output

Write `drafts.json` in the folder you were given, a JSON list of 20 objects:

```json
{"id": "d01", "line": "the spoken hook", "fact_ids": ["aa-vs-1"], "quote_ids": ["q-3"],
 "open_question": "the one question the reel answers at its end"}
```

`fact_ids` lists the fact behind every number in the line (empty if none). Then reply in three
lines: drafts written, the angles you tried, anything in the inputs that blocked you.
