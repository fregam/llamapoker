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
  (for tools and mockups). The website serves its own copies of exactly these files
  (`apps/web/src/fonts.css`, `apps/web/public/fonts/`); if this URL changes, regenerate them.

## Logo

- **Wordmark:** "LlamaPoker" in Bodoni Moda, weight 500, slight negative tracking
  (-0.01em), in paper on ink. No outlines, shadows or effects.
- **Mark:** `logo/llama-mark.png`, the llama head in profile, as a fine copperplate
  engraving in paper on ink (2048 px). Use it on the website, the newsletter header,
  banners and merch. It's detailed, so don't use it below about 64 px; use `logo/llama-icon.svg` there.

## The character

One llama, the same face everywhere, always in the engraving style. Never flat-cartoon,
3D or neon.

- **The Gentleman** (`assets/gentleman.png`): the main character. Dinner jacket, white dress
  shirt, black bow tie, pocket square, holding his cards in a hoof (a hoof, never a hand).
  Calm and slightly amused. Use him in articles, on the home page, in videos and on merch.
- **The Read** (`assets/the-read.png`): the same llama facing you, round wire glasses and
  bow tie, with a deadpan stare that reads you. It's the profile picture on every social
  account and the newsletter. The idea: *the llama is reading you*, the way a good player
  reads an opponent. Crop it as a circle around the face.
- **Personality:** a quiet, very good player. He doesn't gloat or hype; he knows the maths
  and he's a little amused by you. Dry wit, never mean.
- **Making new scenes:** in Higgsfield, use `gpt_image_2_6` with `assets/gentleman.png` (or
  the original job `e190b152-5ef0-4014-ad24-08bd51fa6a0f`) as the image reference, start the
  prompt with "The same llama as the reference, in the exact same fine copperplate engraving
  style with cross-hatching, cream ink (#ece7dc) on flat near-black (#0a0a0b)", then describe
  the scene. Drafts at `quality: low` cost about 0.25 credits; finals at `high`/`2k` cost about 2.75.
- `logo/concepts/` keeps the explored directions for reference; they are not approved for use.

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

Everything below `social/`, `apps/web/public/og.png`, the favicons and the web images is
**generated**: edit the source art or a template in `templates/`, then run
`node scripts/brand-assets.mjs` from `apps/web/`. It also lifts the art's blacks to `--ink` so it sits
on pages without a visible box.


- `logo/llama-mark.png`: the logo mark.
- `assets/gentleman.png`: the main character. `assets/the-read.png`: the profile picture.
- `logo/llama-icon.svg` (square, for favicons and app icons) and `logo/llama-icon-round.svg`
  (round seal, transparent, for small marks on dark pages): the simplified icon. Use it below 64 px.
- `social/profile-picture.png`: **the profile picture for every account** (the Read, cropped close on the face so it reads at 40 px). `social/avatar.png` is the full version.
- `social/x-banner.png` (1500×500), `social/youtube-banner.png` (2560×1440),
  `social/newsletter-header.png` (1200×400, Beehiiv email header).
- `apps/web/public/og.png`: the link-preview card (`templates/og.html`).
- Social tagline: **"The llama is reading you."**
