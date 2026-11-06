# LlamaPoker brand

The source of truth for how LlamaPoker looks and sounds. Everything we make, from the
website and social posts to videos, merch and agent-written articles, follows this file.

- `tokens.css`: colours and fonts as CSS variables (the website imports it).
- `tokens.json`: the same values as data, for agents, image prompts, Canva and other tools.
  Change both together.
- `logo/`: the logo files, once the mark is chosen.
- `assets/`: approved brand images (mascot, social avatars, banners).

## Name

- **LlamaPoker**: one word, capital L and capital P. Never "Llama Poker", "Llamapoker" or
  "LLAMA POKER" in running text. All-caps is fine only in small letter-spaced labels.
- Domain: **llamapoker.com**. Newsletter: **the LlamaPoker letter**.

## What we stand for

- **Positioning:** a free study, hand-review and training tool for No-Limit Hold'em. It is the
  front door to a poker media brand: articles, newsletter, social, tournament coverage, later merch.
- **Never** marketed for use during real-money play. Most sites ban real-time assistance;
  we say so openly.
- **Audience first:** the beginner who knows the rules but not positions or pot odds, and
  searches things like "poker odds calculator" or "online poker helper".
- 18+ and play responsibly, always.

## Voice

A calm coach at a good table: plain English, numbers first, honest, a little dry.

- Say what to do and why, in one or two sentences. Lead with the answer.
- Explain every term the first time it appears (equity, pot odds, outs, SPR).
- Confident, not hyped. No "crush the games", "win big", "secret system", no rocket emojis.
- No gambling glamour: no piles of cash, no luck talk. Poker here is a skill you study.
- Humour is welcome when it's light. The llama can be playful; the maths is serious.

## Colour

Dark editorial. Colour carries meaning and is never decoration.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0a0a0b` | Background |
| `--ink-2` | `#111113` | Raised surfaces |
| `--paper` | `#ece7dc` | Primary text, playing-card faces, the wordmark |
| `--text-2` | `#c4bfb4` | Body text |
| `--text-3` | `#918c83` | Captions, labels |
| `--sage` | `#97b293` | Good: call, raise, a winning number |
| `--brass` | `#bba47b` | Neutral: ties, close spots, notes |
| `--vermilion` | `#d65c40` | Danger: fold, losing, what beats you. Also the red suits. |

Hairline rules are paper at 12% (`--rule`) or 28% (`--rule-strong`) opacity.
**No glows, gradients, neon or pulsing effects.**

## Type

- **Bodoni Moda**: headlines and big numbers only. Never small, because thin serifs
  vanish on black. Italic for one emphasised word ("Should you *call?*").
- **Inter**: paragraphs, buttons, captions, labels. Small labels in caps with wide
  letter-spacing (0.2em).
- **JetBrains Mono**: maths and code only.
- Google Fonts: `https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap`

## Logo

- **Wordmark:** "LlamaPoker" in Bodoni Moda, weight 500, slight negative tracking
  (-0.01em), in paper on ink. No outlines, shadows or effects.
- **Mark:** a llama. To be designed; once chosen, the files go in `logo/` and are
  described here.

## Imagery

- **Look:** dark, cinematic and editorial: a magazine shoot at night, a loft with the city
  behind. Real textures (felt, card stock, film grain). Warm, low light.
- **Avoid:** casino neon, flying chips and cash, cartoon gambling, glossy 3D, stock-photo
  smiles, anything that glamorises betting.
- **Cards:** cream faces (`--paper`), red suits in a deep vermilion, black suits in ink.

**Base prompt for image and video tools** (prepend to every Higgsfield prompt):

> Dark editorial photography, near-black background (#0a0a0b), warm cream highlights
> (#ece7dc), restrained colour with occasional muted sage green and brass, soft low light,
> fine film grain, magazine cover composition, generous negative space, no neon, no glow,
> no text unless specified.

## Layout

Generous space, hairline rules, a strict grid. The figure is the hero: one big Bodoni number
with a small caps label above it. One idea per screen or slide.

## Approved assets

- `apps/web/public/og.png`: the link-preview card (source `apps/web/scripts/og-image.html`).
