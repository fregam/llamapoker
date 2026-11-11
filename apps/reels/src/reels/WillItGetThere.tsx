/**
 * Reel 003 — "Will it get there?" (v3, narration-first). Outs in two seconds: the rule of 4 and 2.
 * Script: src/scripts/will-it-get-there.json; every element enters on a spoken cue and leaves
 * before the next idea. The quick rule comes from ../../../web/src/poker/odds.ts; the exact hit
 * chances are computed here (turn: outs/47; by the river: 1 − (47−outs)(46−outs)/(47·46)).
 */

import { outsToEquity } from "../../../web/src/poker/odds";
import { PlayingCard } from "../components";
import { Script } from "../narration";
import { Hit, Music, Sfx, Ticks } from "../sound";
import { Enter, Move, Narration, Shake, Stat, eased, progress, timelineFor, useNarration } from "../stage";
import { Engraving } from "../teaching";
import { C, SANS, SERIF } from "../theme";
import type { VoManifest } from "../vo";
import scriptJson from "../scripts/will-it-get-there.json";
import voJson from "../vo/will-it-get-there.json";

const SCRIPT = scriptJson as unknown as Script;
const VO = voJson as VoManifest;

const exactRiver = (outs: number) => 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
const exactTurn = (outs: number) => outs / 47;
const pct = (x: number) => Math.round(x * 100);
const RULE_FLOP = pct(outsToEquity(9, 2)); // 36
const RULE_TURN = pct(outsToEquity(9, 1)); // 18

const HAND = ["Ah", "5h"];
const FLOP = ["Kh", "9h", "2c"];
const TURN = "7s";
const HEARTS = ["Ah", "Kh", "Qh", "Jh", "Th", "9h", "8h", "7h", "6h", "5h", "4h", "3h", "2h"];
const SEEN = new Set([...HAND, ...FLOP].filter((c) => c.endsWith("h")));
const DRAWS: [string, string, number][] = [
  ["d4", "Gutshot", 4],
  ["d6", "Two overcards", 6],
  ["d8", "Open-ended", 8],
  ["d9", "Flush draw", 9],
  ["d12", "Flush draw + pair", 12],
  ["d15", "Flush + straight", 15],
];

const row = (gap: number): React.CSSProperties => ({ left: 0, right: 0, display: "flex", justifyContent: "center", gap });

function Headline({ cue, exit, children, size = 118, top = 390, dur = 12 }: { cue: string; exit?: string; children: React.ReactNode; size?: number; top?: number; dur?: number }) {
  return (
    <Enter cue={cue} exit={exit} dur={dur} style={{ top, left: 70, right: 70, textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.02em", color: C.paper }}>{children}</div>
    </Enter>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: "0.28em", color: C.text3, fontWeight: 500, textAlign: "center", ...style }}>{children}</div>;
}

/* ---------- Hook: the question, the hand, the flop ---------- */

function Hook() {
  const { since } = useNarration();
  return (
    <>
      <Headline cue="hook" exit="count" dur={1}>
        Will it <em>get there?</em>
      </Headline>
      {/* Motion from frame 0: the hand slams down, the flop is dealt across, the number stamps */}
      <Enter cue="hook" exit="count" dur={1} style={{ top: 600, ...row(18) }}>
        {HAND.map((c, i) => {
          const t = progress(since("hook") - i * 3, 7);
          return <PlayingCard key={c} card={c} size={1.0} style={{ opacity: t, transform: `translateY(${(1 - t) * -140}px) scale(${1.25 - 0.25 * t}) rotate(${(i ? 1 : -1) * (1 - t) * 12}deg)` }} />;
        })}
      </Enter>
      <Enter cue="hook" exit="count" dur={1} delay={8} style={{ top: 850, ...row(14) }}>
        {FLOP.map((c, i) => {
          const t = progress(since("hook") - 8 - i * 3, 6);
          return <PlayingCard key={c} card={c} size={0.8} style={{ opacity: t, transform: `translateX(${(1 - t) * -90}px)` }} />;
        })}
      </Enter>
      {/* The answer first: the number stamps in under the cards, then docks top right and stays
          there as the promise while the outs are counted; the big 36% takes over on "r36". */}
      <Move width={600} keys={[{ cue: "pct0", top: 1060, cx: 540, scale: 1 }, { cue: "count", top: 352, cx: HUD_RIGHT_CX, scale: 0.45 }]} exit="r36">
        <Stat value={`${RULE_FLOP}%`} label="TO GET THERE" color={C.sage} size={150} align="center" />
      </Move>
      <Sfx cue="hook" src="sfx/deal.wav" gain={0.9} />
      <Sfx cue="hook" src="sfx/deal.wav" delay={3} gain={0.8} />
      {[8, 11, 14].map((d) => (
        <Sfx key={d} cue="hook" src="sfx/deal.wav" delay={d} gain={0.5} />
      ))}
      <Hit cue="pct0" riser={false} />
    </>
  );
}

const HUD_RIGHT_CX = 1080 - 120 - 150; // centre of the small top-right HUD slot (inside the safe area)
const HUD_LEFT_CX = 120 + 150;
const EXACT_TOP = 480;
const EXACT_RULE_ROW_TEXT_TOP = EXACT_TOP + 44 + 24; // header, then the row's padding
const EXACT_EXACTLY_ROW_TOP = EXACT_TOP + 44 + 164; // after THE RULE row
const SHEET_TOP = 440;
const SHEET_FLUSH_ROW_TOP = SHEET_TOP + 41 + 3 * 100; // header, then gutshot, overcards, open-ended

/* ---------- Sound: the bed under everything, one effect per change on screen ---------- */

function SoundDesign() {
  return (
    <>
      <Music src="music/bed.wav" />
      {/* One sound per thing that moves on screen, nothing for the captions. */}
      {/* count: scene change, the 36% docks (soft whoosh), thirteen hearts tick in, the four seen
          ones dim (tick), the outs count to nine (ticks) and land (bell) */}
      <Sfx cue="count" src="sfx/whoosh.wav" delay={-10} gain={0.6} />
      <Ticks cue="count" frames={26} n={13} src="sfx/tick.wav" gain={0.35} />
      <Sfx cue="seen" src="sfx/tick.wav" gain={0.6} />
      <Ticks cue="nine" frames={14} n={9} src="sfx/tick.wav" gain={0.4} />
      <Sfx cue="nine" src="sfx/reveal.wav" delay={14} />
      {/* flop: the outs dock top left (soft whoosh), the board is dealt, ×4, 36% stamps */}
      <Sfx cue="flop" src="sfx/whoosh.wav" delay={8} gain={0.3} />
      <Sfx cue="flop" src="sfx/deal.wav" delay={8} />
      <Sfx cue="x4" src="sfx/pluck.wav" />
      <Hit cue="r36" />
      {/* turn: the turn card, 36% docks (soft whoosh), ×2, 18% stamps */}
      <Sfx cue="turn" src="sfx/deal.wav" />
      <Sfx cue="turn" src="sfx/whoosh.wav" delay={8} gain={0.3} />
      <Sfx cue="x2" src="sfx/pluck.wav" />
      <Hit cue="r18" />
      <Sfx cue="exact" src="sfx/whoosh.wav" delay={-10} gain={0.6} />
      <Sfx cue="e35" src="sfx/reveal.wav" gain={0.7} />
      <Sfx cue="e19" src="sfx/reveal.wav" gain={0.7} />
      <Sfx cue="sheet" src="sfx/whoosh.wav" delay={-10} gain={0.6} />
      {["d4", "d6", "d8", "d9", "d12", "d15"].map((c) => (
        <Sfx key={c} cue={c} src="sfx/tick.wav" gain={0.6} />
      ))}
      <Sfx cue="outro" src="sfx/whoosh.wav" delay={-10} gain={0.6} />
      <Sfx cue="cta" src="sfx/reveal.wav" />
    </>
  );
}

/* ---------- Count the outs: thirteen hearts, four seen, nine left ---------- */

function CountOuts() {
  const { since } = useNarration();
  const seenT = progress(since("seen"), 12);
  const n = Math.round(9 * eased(since("nine"), 20));
  return (
    <>
      <Enter cue="count" exit="flop" style={{ top: 430, left: 100, right: 100, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {HEARTS.map((c, i) => {
          const seen = SEEN.has(c);
          return <PlayingCard key={c} card={c} size={0.72} style={{ opacity: progress(since("count") - i * 2, 6) * (seen ? 1 - 0.78 * seenT : 1), transform: `scale(${seen ? 1 - 0.06 * seenT : 1})` }} />;
        })}
      </Enter>
      <Enter cue="seen" exit="nine" style={{ top: 800, left: 0, right: 0, textAlign: "center" }}>
        <Stat value="4" label="ALREADY ON THE TABLE" size={200} color={C.text3} align="center" />
      </Enter>
      {/* The nine outs count up centre stage, then shrink into the top-left HUD and stay there
          through the rule (they are the number being multiplied) until the exact table. */}
      <Move width={500} keys={[{ cue: "nine", top: 800, cx: 540, scale: 1 }, { cue: "flop", top: 352, cx: HUD_LEFT_CX, scale: 0.4, delay: 8 }]} exit="exact">
        <Stat value={`${n}`} label="OUTS" size={250} align="center" />
      </Move>
    </>
  );
}

/* ---------- The rule: ×4 on the flop, ×2 on the turn ---------- */

function TheRule() {
  const { since } = useNarration();
  const turnIn = since("turn") >= 0;
  return (
    <>
      {/* delay 8: the hearts fade out first, then the board takes their place */}
      <Enter cue="flop" exit="exact" delay={8} style={{ top: 430, ...row(14) }}>
        {FLOP.map((c) => (
          <PlayingCard key={c} card={c} size={0.85} />
        ))}
        {turnIn && <PlayingCard card={TURN} size={0.85} style={{ opacity: progress(since("turn"), 8), transform: `translateY(${(1 - progress(since("turn"), 10)) * 24}px)` }} />}
      </Enter>
      <Enter cue="flop" exit="turn" delay={8} style={{ top: 640, left: 0, right: 0 }}>
        <Label>TWO CARDS TO COME</Label>
      </Enter>
      <Enter cue="turn" exit="exact" delay={9} style={{ top: 640, left: 0, right: 0 }}>
        <Label>ONE CARD TO COME</Label>
      </Enter>

      <Enter cue="x4" exit="turn" style={{ top: 720, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 170, lineHeight: 1, color: C.paper }}>
          9 <span style={{ color: C.text3 }}>×</span> 4
        </div>
      </Enter>
      {/* 36% counts up centre stage, docks top right while the turn plays, then flies into the
          FLOP cell of THE RULE row as the table forms; 18% goes straight to the TURN cell. */}
      <Move width={700} keys={[{ cue: "r36", top: 940, cx: 540, scale: 1 }, { cue: "turn", top: 352, cx: HUD_RIGHT_CX, scale: 0.45, delay: 8 }, { cue: "exact", top: EXACT_RULE_ROW_TEXT_TOP - 8, cx: 585, scale: 0.52, delay: 2 }]} exit="exact" exitDelay={22}>
        <Stat value={`${Math.round(RULE_FLOP * eased(since("r36"), 22))}%`} label="TO HIT BY THE RIVER" size={200} color={C.sage} align="center" />
      </Move>

      <Enter cue="x2" exit="exact" delay={4} style={{ top: 720, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 170, lineHeight: 1, color: C.paper }}>
          9 <span style={{ color: C.text3 }}>×</span> 2
        </div>
      </Enter>
      <Move width={700} keys={[{ cue: "r18", top: 940, cx: 540, scale: 1 }, { cue: "exact", top: EXACT_RULE_ROW_TEXT_TOP - 8, cx: 815, scale: 0.52, delay: 2 }]} exit="exact" exitDelay={22}>
        <Stat value={`${Math.round(RULE_TURN * eased(since("r18"), 22))}%`} label="TO HIT ON THE RIVER" size={200} color={C.brass} align="center" />
      </Move>
    </>
  );
}

/* ---------- How close: the rule against the exact numbers ---------- */

function Exact() {
  const { since } = useNarration();
  const cols: React.CSSProperties = { width: 230, textAlign: "right", fontFamily: SERIF, fontSize: 104 };
  const e35 = progress(since("e35"), 8);
  const e19 = progress(since("e19"), 8);
  return (
    <>
      <Enter cue="exact" exit="sheet" delay={8} style={{ top: EXACT_TOP, left: 110, right: 170 }}>
        <div style={{ display: "flex", fontFamily: SANS, fontSize: 26, letterSpacing: "0.26em", color: C.text3, paddingBottom: 18, borderBottom: `1px solid ${C.ruleStrong}`, fontWeight: 500 }}>
          <span style={{ flex: 1 }} />
          <span style={{ width: 230, textAlign: "right" }}>FLOP</span>
          <span style={{ width: 230, textAlign: "right" }}>TURN</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", padding: "30px 0", borderBottom: `1px solid ${C.rule}` }}>
          <span style={{ flex: 1, fontFamily: SANS, fontSize: 30, letterSpacing: "0.2em", color: C.text2, fontWeight: 500 }}>THE RULE</span>
          <span style={{ ...cols, color: C.text2 }}>{RULE_FLOP}%</span>
          <span style={{ ...cols, color: C.text2 }}>{RULE_TURN}%</span>
        </div>
      </Enter>
      {/* The EXACTLY row is its own object: when the cheat sheet forms it slides down to where
          the flush-draw row will be (it is that row) and hands over when that row is spoken. */}
      <Move width={800} keys={[{ cue: "exact", top: EXACT_EXACTLY_ROW_TOP, cx: 510, scale: 1, delay: 8 }, { cue: "sheet", top: SHEET_FLUSH_ROW_TOP, cx: 510, scale: 1, opacity: 0.55, delay: 4 }]} exit="d9" exitDelay={4} dur={18}>
        <div style={{ display: "flex", alignItems: "baseline", padding: "30px 0", borderBottom: `1px solid ${C.rule}` }}>
          <span style={{ flex: 1, fontFamily: SANS, fontSize: 30, letterSpacing: "0.2em", color: C.sage, fontWeight: 500 }}>EXACTLY</span>
          <span style={{ ...cols, color: C.sage, opacity: e35, transform: `translateY(${(1 - e35) * 16}px)` }}>{pct(exactRiver(9))}%</span>
          <span style={{ ...cols, color: C.sage, opacity: e19, transform: `translateY(${(1 - e19) * 16}px)` }}>{pct(exactTurn(9))}%</span>
        </div>
      </Move>
    </>
  );
}

/* ---------- Save this: one row per draw, in the order they are spoken ---------- */

function CheatSheet() {
  return (
    <Enter cue="sheet" exit="outro" style={{ top: SHEET_TOP, left: 110, right: 170 }}>
      <div style={{ display: "flex", fontFamily: SANS, fontSize: 24, letterSpacing: "0.26em", color: C.text3, paddingBottom: 16, borderBottom: `1px solid ${C.ruleStrong}`, fontWeight: 500 }}>
        <span style={{ flex: 1 }}>DRAW</span>
        <span style={{ width: 110, textAlign: "right" }}>OUTS</span>
        <span style={{ width: 180, textAlign: "right" }}>FLOP</span>
        <span style={{ width: 180, textAlign: "right" }}>TURN</span>
      </div>
      {DRAWS.map(([cue, name, outs]) => (
        <Enter key={cue} cue={cue} style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "baseline", padding: "16px 0", borderBottom: `1px solid ${C.rule}` }}>
            <span style={{ flex: 1, fontFamily: SANS, fontSize: 40, color: C.text2 }}>{name}</span>
            <span style={{ width: 110, textAlign: "right", fontFamily: SERIF, fontSize: 64, color: C.brass }}>{outs}</span>
            <span style={{ width: 180, textAlign: "right", fontFamily: SERIF, fontSize: 64, color: C.paper }}>{pct(exactRiver(outs))}%</span>
            <span style={{ width: 180, textAlign: "right", fontFamily: SERIF, fontSize: 64, color: C.paper }}>{pct(exactTurn(outs))}%</span>
          </div>
        </Enter>
      ))}
    </Enter>
  );
}

/* ---------- Outro: the Gentleman squints, the question, the link ---------- */

function Outro() {
  const { since } = useNarration();
  const drift = 1 + Math.min(0.06, Math.max(0, since("outro")) / 2400);
  return (
    <>
      {/* The Gentleman, centred and large, the same framing as reel 002's outro */}
      <Enter cue="outro" motion="fade" dur={16} style={{ inset: 0 }}>
        <Engraving file="expr-6.png" fade={0.4} style={{ position: "absolute", top: 570, left: 150, width: 780, height: 656, transform: `scale(${drift})` }} />
      </Enter>
      <Headline cue="outro" exit="cta" size={100}>
        Which draw do <em>you</em> chase?
      </Headline>
      <Enter cue="cta" style={{ top: 400, left: 70, right: 70, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 96, lineHeight: 1, color: C.paper, letterSpacing: "-0.01em" }}>llamapoker.com</div>
        <Label style={{ marginTop: 22 }}>RUN ANY SPOT, FREE · LINK IN BIO</Label>
      </Enter>
    </>
  );
}

export const WILL_IT_GET_THERE_FRAMES = timelineFor(SCRIPT, VO).total;

export function WillItGetThere() {
  return (
    <Narration script={SCRIPT} vo={VO}>
      <Shake cue="pct0">
        <Hook />
        <CountOuts />
        <TheRule />
        <Exact />
        <CheatSheet />
        <Outro />
      </Shake>
      <SoundDesign />
    </Narration>
  );
}
