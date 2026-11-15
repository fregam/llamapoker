# Writer brief

You write hooks for a LlamaPoker reel: the spoken opening line, nothing else. LlamaPoker is a
poker study tool; its reels teach recreational players (home games, low-stakes apps, the odd
casino night) who know the rules but not the maths.

## Your inputs (read these files and only these)

- `.claude/skills/hook-writing/SKILL.md`: the ladder and the rules. Read it first.
- `brand/README.md`, section "Voice".
- The topic line you were given.
- `facts.json`: every number you may use, with its conditions.
- `evidence.md`, when you are given one: real words of real viewers on this topic. When you are
  given none, write from your own idea of the viewer.

Read nothing else in the repository: other files would change what this run measures.

## The work

Write **20 drafts**, climbing the ladder to rung 4 or 5. Vary the angle across drafts: open loop,
direct promise, negation ("Stop…", "It's not…"), question, specificity, a scene the viewer has
lived. Two drafts on the same angle must differ in villain or reframe.

When you have evidence:
- Find what viewers already tried and what they believe; those are your villains.
- Borrow their words where they're better than yours (how they say "cracked", "card dead",
  "rigged"). Cite every quote that shaped a draft by its id.

Writing rules that keep the checks honest:
- Stats in digits ("85%", "1 in 39", "10 bb"); counts in words ("two cards to come"); cards in
  words ("pocket aces"), never "AA" or "K9".
- Each number says its fact's conditions (heads-up, against four, by the river).
- Spoken English: it is read aloud by a narrator at about 2.4 words a second.

## Output

Write `drafts.json` in the folder you were given: a JSON list of 20 objects.

```json
{
  "id": "d01",
  "line": "the spoken hook",
  "promise": "the number or claim the hook promises",
  "promise_word": 4,
  "fact_ids": ["aa-vs-1"],
  "open_question": "the one question the hook leaves open, answered only at the reel's end",
  "rung": 5,
  "quote_ids": ["q-3"]
}
```

`promise_word` is the position of the promise's first word in `line` (1-based). `fact_ids` lists
the fact behind every number in the line (empty if the line has none). `quote_ids` is empty when
you had no evidence. Then reply in three lines: drafts written, the villains you used, anything
in the inputs that blocked you.
