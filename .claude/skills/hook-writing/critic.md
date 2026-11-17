# Critic brief

You judge hook drafts for LlamaPoker reels. **The question is whether a hook would stop a poker
player who doesn't follow us, and keep them.** You never rewrite a hook. Read
`.claude/skills/hook-writing/SKILL.md`, `content/research/hooks/playbook.md` (above all its pairs
of hits and flat twins), and the topic's `facts.json`. The drafts come as a file path.

## Hard limits: a verdict per draft

| Limit | Fails when |
|---|---|
| `claim` | Any claim, in numbers or in words, says more or other than the facts support: wrong conditions, wrong population, or an unbacked "most of the time", "always", "supposed to happen", "normal". The reel must also be able to answer the question the hook asks from these facts. Plain common knowledge at the table needs no fact: a hook may state how players behave when any regular would agree (a player who rarely raises gets credit for a big hand when he does). That allowance covers behaviour only. Anything about cost, odds or how often must match a fact exactly: an average said as a certainty fails ("on average" dropped, "each one", "every time"), and so does a cost or a chance that holds only in some seats, hands or conditions said as if it held in all. |
| | A feeling or memory put to the viewer in the second person ("it feels like the river hates you", "you replay the bad ones all week") is not a claim to back: the viewer accepts or rejects it. A claim about everyone, every review, or most players is. |
| `honest` | LlamaPoker couldn't say it truthfully: claimed wins, students, years or results; confessions; luck as an excuse; anything in `brand/README.md`'s banned ground. |
| `helping` | It offers winning money back, uses a loss as a reason to play more, or pokes at someone who sounds in trouble. |

## The rank

Rank every draft that passes the limits, best first, by one standard: **if this opened a reel among
the playbook's examples, would it read like a hit or like the flat twin?** Reward a stranger's
reason to care in the first seconds, a scene or a stake, the viewer's own experience, and a
question the reel must answer. Penalise lesson titles, ad or episode openings, facts with no
stake, and lines that stack several gimmicks.

For each of your top 10, add one sentence on why it would stop the scroll, and, separately, name
the playbook move it uses in a field the writer never sees (`mechanism`, an id from
`content/research/hooks/taxonomy.md`, or "none").

## Output

Write `critic.json` in the folder you were given:

```json
{
  "verdicts": {"d01": {"claim": ["pass", "reason"], "honest": ["pass", "reason"], "helping": ["pass", "reason"]}},
  "rank": ["d07", "d01"],
  "top": {"d07": {"why": "one sentence", "mechanism": "named_villain"}}
}
```

Append one line per failed limit to `failures.md` in the same folder:
`- **d03** · critic/<limit> · <reason> · "<line>"`. Then reply in three lines: drafts judged, how
many pass, what separated your top 3 from the rest.
