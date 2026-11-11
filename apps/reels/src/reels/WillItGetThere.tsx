/**
 * Reel 003 — "Will it get there?" (v3, narration-first). Outs in two seconds: the rule of 4 and 2.
 * Script: src/scripts/will-it-get-there.json; every element enters on a spoken cue and leaves
 * before the next idea. The quick rule comes from ../../../web/src/poker/odds.ts; the exact hit
 * chances are computed here (turn: outs/47; by the river: 1 − (47−outs)(46−outs)/(47·46)).
 */

import { outsToEquity } from "../../../web/src/poker/odds";
import { PlayingCard } from "../components";
import { Script } from "../narration";
import { Music, Sfx } from "../sound";
import { Enter, Narration, Stat, progress, timelineFor, useNarration } from "../stage";
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
      <Enter cue="hook" exit="count" delay={4} style={{ top: 600, ...row(18) }}>
        {HAND.map((c, i) => (
          <PlayingCard key={c} card={c} size={1.0} style={{ opacity: progress(since("hook") - 4 - i * 4, 8) }} />
        ))}
      </Enter>
      <Enter cue="hook" exit="count" delay={14} style={{ top: 850, ...row(14) }}>
        {FLOP.map((c, i) => (
          <PlayingCard key={c} card={c} size={0.8} style={{ opacity: progress(since("hook") - 14 - i * 4, 8) }} />
        ))}
      </Enter>
      {/* The answer first: the number stamps in under the cards, the body then earns it */}
      <Enter cue="pct0" exit="count" motion="stamp" dur={8} style={{ top: 1060, left: 0, right: 0 }}>
        <Stat value={`${RULE_FLOP}%`} label="TO GET THERE" color={C.sage} size={150} align="center" />
      </Enter>
      <Sfx cue="hook" src="sfx/deal.wav" delay={4} gain={0.8} />
      <Sfx cue="hook" src="sfx/deal.wav" delay={14} gain={0.7} />
      <Sfx cue="pct0" src="sfx/stamp.wav" />
    </>
  );
}

/* ---------- Sound: the bed under everything, one effect per change on screen ---------- */

function SoundDesign() {
  return (
    <>
      <Music src="music/bed.wav" />
      <Sfx cue="count" src="sfx/whoosh.wav" gain={0.6} />
      <Sfx cue="seen" src="sfx/tick.wav" gain={0.6} />
      <Sfx cue="nine" src="sfx/reveal.wav" />
      <Sfx cue="flop" src="sfx/deal.wav" delay={8} />
      <Sfx cue="x4" src="sfx/pluck.wav" />
      <Sfx cue="r36" src="sfx/stamp.wav" />
      <Sfx cue="turn" src="sfx/deal.wav" />
      <Sfx cue="x2" src="sfx/pluck.wav" />
      <Sfx cue="r18" src="sfx/stamp.wav" />
      <Sfx cue="exact" src="sfx/whoosh.wav" gain={0.6} />
      <Sfx cue="e35" src="sfx/reveal.wav" gain={0.7} />
      <Sfx cue="e19" src="sfx/reveal.wav" gain={0.7} />
      <Sfx cue="sheet" src="sfx/whoosh.wav" gain={0.6} />
      {["d4", "d6", "d8", "d9", "d12", "d15"].map((c) => (
        <Sfx key={c} cue={c} src="sfx/tick.wav" gain={0.6} />
      ))}
      <Sfx cue="outro" src="sfx/whoosh.wav" gain={0.6} />
      <Sfx cue="cta" src="sfx/reveal.wav" />
    </>
  );
}

/* ---------- Count the outs: thirteen hearts, four seen, nine left ---------- */

function CountOuts() {
  const { since } = useNarration();
  const seenT = progress(since("seen"), 12);
  const n = Math.round(9 * progress(since("nine"), 14));
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
      <Enter cue="nine" exit="flop" style={{ top: 800, left: 0, right: 0, textAlign: "center" }}>
        <Stat value={`${n}`} label="OUTS" size={250} align="center" />
      </Enter>
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
      <Enter cue="r36" exit="turn" style={{ top: 940, left: 0, right: 0 }}>
        <Stat value={`${Math.round(RULE_FLOP * progress(since("r36"), 14))}%`} label="TO HIT BY THE RIVER" size={200} color={C.sage} align="center" />
      </Enter>

      <Enter cue="x2" exit="exact" delay={4} style={{ top: 720, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 170, lineHeight: 1, color: C.paper }}>
          9 <span style={{ color: C.text3 }}>×</span> 2
        </div>
      </Enter>
      <Enter cue="r18" exit="exact" style={{ top: 940, left: 0, right: 0 }}>
        <Stat value={`${Math.round(RULE_TURN * progress(since("r18"), 14))}%`} label="TO HIT ON THE RIVER" size={200} color={C.brass} align="center" />
      </Enter>
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
    <Enter cue="exact" exit="sheet" delay={8} style={{ top: 480, left: 110, right: 170 }}>
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
      <div style={{ display: "flex", alignItems: "baseline", padding: "30px 0", borderBottom: `1px solid ${C.rule}` }}>
        <span style={{ flex: 1, fontFamily: SANS, fontSize: 30, letterSpacing: "0.2em", color: C.sage, fontWeight: 500 }}>EXACTLY</span>
        <span style={{ ...cols, color: C.sage, opacity: e35, transform: `translateY(${(1 - e35) * 16}px)` }}>{pct(exactRiver(9))}%</span>
        <span style={{ ...cols, color: C.sage, opacity: e19, transform: `translateY(${(1 - e19) * 16}px)` }}>{pct(exactTurn(9))}%</span>
      </div>
    </Enter>
  );
}

/* ---------- Save this: one row per draw, in the order they are spoken ---------- */

function CheatSheet() {
  return (
    <Enter cue="sheet" exit="outro" style={{ top: 440, left: 110, right: 170 }}>
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
      <Enter cue="outro" motion="fade" dur={16} style={{ inset: 0 }}>
        <Engraving file="expr-6.png" fade={0.4} style={{ position: "absolute", top: 640, left: 40, width: 720, height: 605, transform: `scale(${drift})` }} />
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
      <Hook />
      <CountOuts />
      <TheRule />
      <Exact />
      <CheatSheet />
      <Outro />
      <SoundDesign />
    </Narration>
  );
}
