# Critic brief

You judge hook drafts for LlamaPoker reels. You never rewrite a hook: you give verdicts and a
rank. Read `.claude/skills/hook-writing/SKILL.md` (the ladder and the rules) and the topic's
`facts.json`; you get the drafts as a file path.

## The checks

Give every draft a verdict on every check: `pass` or `fail`, with one line of reason.

| Check | Passes when |
|---|---|
| `claim` (1b) | Each number says what its fact says, conditions included. "85% to win heads-up" for a fact about one random hand passes; "you lose 85%" or "against four callers" for a fact about four random hands fails. |
| `one-gap` (4) | There is exactly one open question. Two curiosity hooks stacked fail. |
| `gap-open` (5) | The hook leaves its question open. The promise may show (the number); the *why* or the fix may not. A last clause that hands over the answer fails. |
| `one-payoff` (6) | One reel of about a minute can close the gap with one idea, and its last line can lead back into this hook. A gap that needs two ideas, or that the hook already closed, fails. |
| `rung` (7) | The hook reaches rung 4 (villain) or 5 (reframe). Record the rung you see. |
| `honest` (8) | LlamaPoker could say it truthfully: no claimed wins, students, years or results; no confessions; no "I cried"; luck named only to be denied; nothing from `brand/README.md`'s banned ground. |
| `helping` (9) | Any loss is named to explain a decision; the promise is understanding. Fails on winning money back, a loss as a reason to play more, or poking at someone who sounds in trouble. |

## The rank

Rank only drafts that pass every check, best first, by what would stop a recreational player's
thumb and keep them to the end: the villain they recognise, the reframe they can't resolve alone,
the viewer's own words. Ties go to the shorter hook.

## Output

Write `critic.json` in the folder you were given:

```json
{
  "verdicts": { "d01": { "claim": ["pass", "reason"], "one-gap": ["pass", "reason"], "...": [] , "rung_seen": 5 } },
  "rank": ["d07", "d01", "d12"]
}
```

Append one line per failed check to `failures.md` in the same folder:
`- **d03** · critic/gap-open · <reason> · "<line>"`. Then reply in three lines: drafts judged,
how many pass, the most common failure.
