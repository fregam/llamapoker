/**
 * Reel 002 — "Only playing aces?" (v3, narration-first). The script is src/scripts/only-aces.json;
 * every element below enters on a cue spoken in the voice-over and leaves before the next idea,
 * so there is one thing to look at per phrase (see apps/reels/README.md, "How a reel is built").
 * Numbers from ../../../web/src/poker/ranges.ts: premiums are 34 of 1,326 combos (2.6%), one
 * every 39 hands; 6-max blinds cost 1.5 bb per 6 hands, so ~10 bb per wait; the button opens 38%.
 */

import { expandRange, POSITIONS, rangeFor, rangePercent } from "../../../web/src/poker/ranges";
import { PlayingCard } from "../components";
import { Script } from "../narration";
import { ChunkBlips, Hit, Music, Sfx, Ticks } from "../sound";
import { Enter, Ledger, Move, Narration, SeatRing, Stat, Tag, progress, timelineFor, useNarration } from "../stage";
import { DotRow, Engraving, RangeGrid, Seat } from "../teaching";
import { C, SANS, SERIF } from "../theme";
import type { VoManifest } from "../vo";
import scriptJson from "../scripts/only-aces.json";
import voJson from "../vo/only-aces.json";

const SCRIPT = scriptJson as unknown as Script;
const VO = voJson as VoManifest;

const PREMIUM = expandRange(["QQ+", "AKs", "AKo"]);
const PREMIUM_PCT = rangePercent(PREMIUM); // 2.56
const PREMIUM_COMBOS = Math.round((PREMIUM_PCT / 100) * 1326); // 34
const WAIT = Math.round(1326 / PREMIUM_COMBOS); // 39 hands between premiums
const ORBITS = Math.round(WAIT / 6); // 6 or 7 orbits of blinds while waiting
const BLINDS_LOST = Math.round(WAIT * (1.5 / 6)); // 10 bb
const BTN = rangeFor("BTN");
const BTN_PCT = Math.round(rangePercent(BTN)); // 38
const pick = (re: RegExp) => new Set([...BTN].filter((h) => re.test(h)));
const SUITED_CONNECTORS = pick(/^(KQ|QJ|JT|T9|98|87|76|65|54)s$/);
const SMALL_PAIRS = pick(/^(22|33|44|55|66|77)$/);
const WEAK_ACES = pick(/^A[2-9][so]$/);

const GRID_LEFT = 145; // 13 × 58 + 12 × 3 = 790 wide, centred

/* ---------- Hook and outro: the Gentleman, big, with the headline above him ---------- */

function Gentleman({ cue, exit, dur = 16 }: { cue: string; exit?: string; dur?: number }) {
  const { since } = useNarration();
  const drift = 1 + Math.min(0.06, Math.max(0, since(cue)) / 2400);
  return (
    <Enter cue={cue} exit={exit} motion="fade" dur={dur} style={{ inset: 0 }}>
      <Engraving file="expr-4.png" fade={0.4} style={{ position: "absolute", top: 600, left: -60, width: 864, height: 727, transform: `scale(${drift})` }} />
    </Enter>
  );
}

function Headline({ cue, exit, children, size = 118, dur = 12 }: { cue: string; exit?: string; children: React.ReactNode; size?: number; dur?: number }) {
  return (
    <Enter cue={cue} exit={exit} dur={dur} style={{ top: 390, left: 70, right: 70, textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.02em", color: C.paper }}>{children}</div>
    </Enter>
  );
}

/* ---------- Hook: the question over the Gentleman, then the cost stamps in and the table folds ---------- */

function Hook() {
  return (
    <>
      <Gentleman cue="hook" exit="cost" dur={1} />
      <Headline cue="hook" exit="grid" dur={1}>
        Only playing <em>aces?</em>
      </Headline>
      {/* The cost stamps in centre stage, then docks into the HUD (top right) while the maths runs
          under it, and leaves when the 2.6% needs that slot. It comes back at "paid", earned. */}
      <Move
        width={700}
        keys={[
          { cue: "cost", top: 640, cx: 540, scale: 1, delay: 8 },
          { cue: "grid", top: 352, cx: 1080 - GRID_LEFT - 160, scale: 0.46 },
        ]}
        exit="pct"
      >
        <Stat value={`−${BLINDS_LOST} bb`} label="EVERY WAIT" color={C.vermilion} size={200} align="center" />
      </Move>
      <Enter cue="nobody0" exit="grid" style={{ top: 980, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28 }}>
        {[0, 1, 2].map((i) => (
          <Tag key={i} text="FOLD" color={C.vermilion} size={30} />
        ))}
      </Enter>
      <Hit cue="cost" delay={8} riser={false} />
      <Sfx cue="nobody0" src="sfx/fold.wav" gain={0.8} />
    </>
  );
}

/* ---------- The plan: the grid lights up hand by hand, then everything else ghosts ---------- */

function ThePlan() {
  const { since } = useNarration();
  const lit = new Set<string>();
  if (since("qq") >= 0) lit.add("QQ");
  if (since("kk") >= 0) lit.add("KK");
  if (since("aa") >= 0) lit.add("AA");
  if (since("ak") >= 0) ["AKs", "AKo"].forEach((h) => lit.add(h));
  const ghost = progress(since("dim"), 18);
  const pct = PREMIUM_PCT * progress(since("pct"), 24);
  // The grid doesn't cut away: on "wait" it sinks to a faint backdrop (the 34 premiums still
  // faintly lit) and the counter plays on top of it; it is gone by the time the aces land.
  const sink = progress(since("wait"), 20);
  return (
    <>
      <Enter cue="grid" exit="aces" style={{ top: 508, left: GRID_LEFT }}>
        <div style={{ opacity: 1 - 0.88 * sink, transform: `scale(${1 - 0.04 * sink})`, transformOrigin: "top center" }}>
          <RangeGrid lit={lit} color={C.brass} cell={58} ghost={ghost} />
        </div>
      </Enter>
      <Enter cue="n34" exit="n39" style={{ top: 352, left: GRID_LEFT }}>
        <Stat value={`${PREMIUM_COMBOS}`} label="OF 1,326 HANDS" size={92} />
      </Enter>
      <Enter cue="pct" exit="wait" delay={8} style={{ top: 352, right: GRID_LEFT }}>
        <Stat value={`${pct.toFixed(1)}%`} label="OF ALL HANDS" size={92} color={C.brass} align="right" />
      </Enter>
    </>
  );
}

/* ---------- The wait: a counter, one dot per hand, the blinds going round ---------- */

function Chip({ label, size }: { label: string; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${C.paper}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: size * 0.46, color: C.paper }}>
      {label}
    </div>
  );
}

function TheWait() {
  const { since, at } = useNarration();
  const span = Math.max(1, at("n39") - at("wait"));
  const p = progress(since("wait"), span);
  const n = Math.round(WAIT * p);
  const acesIn = since("aces") >= 0;
  const orbitEvery = Math.max(1, (at("paid") - at("blinds")) / ORBITS);
  return (
    <>
      {/* The counter rises over the sinking grid; it exits as the aces land in the same spot */}
      <Enter cue="wait" exit="aces" delay={6} style={{ top: 430, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 250, lineHeight: 0.9, color: C.paper, fontVariantNumeric: "tabular-nums" }}>{n}</div>
        <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: "0.28em", color: C.text3, fontWeight: 500, marginTop: 22 }}>HANDS BETWEEN PREMIUMS</div>
      </Enter>
      {/* The aces stay through the raise, then shrink into the top-right corner while the button
          scene plays: the hand nobody paid is still in view until the table at the end. */}
      <Move
        width={420}
        keys={[
          { cue: "aces", top: 420, cx: 540, scale: 1, delay: 8 },
          { cue: "btn", top: 352, cx: 1080 - GRID_LEFT - 90, scale: 0.42 },
        ]}
        exit="sheet"
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          {["As", "Ah"].map((c, i) => (
            <PlayingCard key={c} card={c} size={1.3} style={{ transform: `translateY(${(1 - progress(since("aces") - 8 - i * 4, 10)) * 30}px)`, opacity: progress(since("aces") - 8 - i * 4, 8) }} />
          ))}
        </div>
      </Move>
      <Enter cue="wait" exit="raise" delay={8} style={{ top: 800, left: GRID_LEFT, right: GRID_LEFT }}>
        <DotRow total={WAIT + 1} filled={n + (acesIn ? 1 : 0)} mark={WAIT} />
      </Enter>
      <Enter cue="blinds" exit="raise" style={{ top: 960, left: GRID_LEFT }}>
        <div style={{ display: "flex", gap: 22, alignItems: "center", height: 64 }}>
          {Array.from({ length: ORBITS }).map((_, i) => {
            const t = progress(since("blinds") - i * orbitEvery, 8);
            return (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", opacity: t, transform: `scale(${0.8 + 0.2 * t})` }}>
                <Chip label="1" size={58} />
                <Chip label="½" size={44} />
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: "0.28em", color: C.text3, fontWeight: 500, marginTop: 22 }}>BLINDS, EVERY SIX HANDS</div>
      </Enter>
      <Enter cue="paid" exit="raise" style={{ top: 1100, right: GRID_LEFT }}>
        <Stat value={`−${Math.round(BLINDS_LOST * progress(since("paid"), 20))} bb`} label="PAID WHILE FOLDING" size={120} color={C.vermilion} align="right" />
      </Enter>
    </>
  );
}

/* ---------- Nobody pays: the raise, three seats fold, the ledger ---------- */

function NobodyPays() {
  const { since } = useNarration();
  const rows = [{ amount: "+1.5 bb", label: "WON", color: C.sage }];
  if (since("net") >= 0) rows.push({ amount: `−${BLINDS_LOST} bb`, label: "PAID TO GET THERE", color: C.vermilion });
  return (
    <>
      <Enter cue="raise" exit="btn" style={{ top: 820, left: 0, right: 0, textAlign: "center" }}>
        <Tag text="RAISE" color={C.brass} fill size={30} />
      </Enter>
      <Enter cue="watch" exit="btn" style={{ top: 940, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 70 }}>
        {["s1", "s2", "s3"].map((cue, i) => (
          <Seat key={cue} name={`SEAT ${i + 1}`} folded={since(cue) >= 0} frame={since(cue)} />
        ))}
      </Enter>
      <Enter cue="win" exit="btn" style={{ top: 1150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Ledger rows={rows} />
      </Enter>
    </>
  );
}

/* ---------- The fix: the button seat, the grid widens to 38% ---------- */

function TheFix() {
  const { since } = useNarration();
  const p = progress(since("widen"), 45);
  const pct = Math.round(BTN_PCT * p);
  const hot = since("ax") >= 0 && since("ax") < 40 ? WEAK_ACES : since("pp") >= 0 && since("pp") < 40 ? SMALL_PAIRS : since("sc") >= 0 && since("sc") < 40 ? SUITED_CONNECTORS : undefined;
  return (
    <>
      <Enter cue="btn" exit="widen" delay={8} style={{ top: 520, left: 120 }}>
        <SeatRing lit={["BTN"]} you="BTN" />
      </Enter>
      {/* The 38% and its grid don't cut to the table: they fly into the BTN row of it. */}
      <Move width={700} keys={[{ cue: "widen", top: 352, cx: 171 + 350, scale: 1 }, { cue: "sheet", top: SHEET_BTN_ROW_TOP + 10, cx: 1080 - GRID_LEFT - 65, scale: 0.6, delay: 6 }]} exit="sheet" exitDelay={30}>
        <Stat value={`${pct}%`} label="OPENED FROM THE BUTTON" size={92} color={C.sage} />
      </Move>
      <Move width={13 * 54 + 12 * 3} keys={[{ cue: "widen", top: 508, cx: 540, scale: 1, delay: 6 }, { cue: "sheet", top: SHEET_BTN_ROW_TOP + 30, cx: 540, scale: 0.12, delay: 6 }]} exit="sheet" exitDelay={30} dur={22}>
        <RangeGrid lit={BTN} progress={p} color={C.sage} cell={54} ghost={1} hot={hot} />
      </Move>
    </>
  );
}

const SHEET_TOP = 440;
const SHEET_BTN_ROW_TOP = SHEET_TOP + 50 + 3 * 111; // header, then UTG, MP, CO rows

/* ---------- Save this: one row per seat ---------- */

function CheatSheet() {
  const rows = POSITIONS.filter((p) => p !== "BB");
  return (
    <Enter cue="sheet" exit="outro" style={{ top: SHEET_TOP, left: GRID_LEFT, right: GRID_LEFT }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 26, letterSpacing: "0.26em", color: C.text3, paddingBottom: 18, borderBottom: `1px solid ${C.ruleStrong}`, fontWeight: 500 }}>
        <span>SEAT</span>
        <span>HANDS OPENED</span>
      </div>
      {rows.map((pos, i) => {
        const pct = Math.round(rangePercent(rangeFor(pos)));
        const btn = pos === "BTN";
        return (
          <Enter key={pos} cue="sheet" delay={btn ? 34 : 6 + i * 7} style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "22px 0", borderBottom: `1px solid ${C.rule}` }}>
              <span style={{ fontFamily: SANS, fontSize: 50, color: btn ? C.paper : C.text2, letterSpacing: "0.06em", fontWeight: 500 }}>{pos}</span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
                <span style={{ width: 260, height: 14, background: C.ink2, border: `1px solid ${C.rule}` }}>
                  <span style={{ display: "block", height: "100%", width: `${pct * 2.2}%`, background: btn ? C.sage : C.brass }} />
                </span>
                <span style={{ fontFamily: SERIF, fontSize: 66, width: 130, textAlign: "right", color: btn ? C.sage : C.paper }}>{pct}%</span>
              </span>
            </div>
          </Enter>
        );
      })}
    </Enter>
  );
}

/* ---------- Outro: loops back into the hook ---------- */

function Outro() {
  return (
    <>
      <Gentleman cue="outro" />
      <Headline cue="outro" exit="cta" size={104}>
        How long is <em>your</em> wait?
      </Headline>
      <Enter cue="cta" style={{ top: 400, left: 70, right: 70, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 96, lineHeight: 1, color: C.paper, letterSpacing: "-0.01em" }}>llamapoker.com</div>
        <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: "0.3em", color: C.text3, fontWeight: 500, marginTop: 22 }}>RUN ANY SPOT, FREE · LINK IN BIO</div>
      </Enter>
    </>
  );
}

/* ---------- Sound: the bed under everything, one effect per change on screen ---------- */

function SoundDesign() {
  return (
    <>
      <Music src="music/bed.wav" />
      <ChunkBlips />
      <Sfx cue="grid" src="sfx/shuffle.wav" gain={0.6} />
      {["qq", "kk", "aa", "ak"].map((c) => (
        <Sfx key={c} cue={c} src="sfx/pluck.wav" gain={0.7} />
      ))}
      <Sfx cue="dim" src="sfx/whoosh.wav" delay={-10} gain={0.5} />
      <Hit cue="n34" gain={0.8} />
      <Sfx cue="pct" src="sfx/reveal.wav" gain={0.7} />
      <Sfx cue="wait" src="sfx/whoosh.wav" delay={-8} gain={0.4} />
      <Ticks cue="wait" until="n39" n={WAIT} src="sfx/tick.wav" />
      <Sfx cue="blinds" src="sfx/chip.wav" />
      <Sfx cue="aces" src="sfx/deal.wav" delay={8} />
      <Sfx cue="aces" src="sfx/deal.wav" delay={12} gain={0.8} />
      <Hit cue="paid" />
      <Sfx cue="raise" src="sfx/chip.wav" />
      {["s1", "s2", "s3"].map((c) => (
        <Sfx key={c} cue={c} src="sfx/fold.wav" />
      ))}
      <Sfx cue="win" src="sfx/reveal.wav" gain={0.6} />
      <Hit cue="net" />
      <Sfx cue="btn" src="sfx/whoosh.wav" delay={-10} />
      <Sfx cue="widen" src="sfx/reveal.wav" />
      <Sfx cue="widen" src="sfx/shuffle.wav" delay={6} gain={0.5} />
      {["sc", "pp", "ax"].map((c) => (
        <Sfx key={c} cue={c} src="sfx/pluck.wav" gain={0.7} />
      ))}
      <Sfx cue="sheet" src="sfx/whoosh.wav" delay={-10} gain={0.6} />
      {[0, 1, 2, 4].map((i) => (
        <Sfx key={i} cue="sheet" delay={6 + i * 7} src="sfx/tick.wav" gain={0.5} />
      ))}
      <Sfx cue="sheet" delay={34} src="sfx/stamp.wav" gain={0.6} />
      <Sfx cue="outro" src="sfx/whoosh.wav" delay={-10} gain={0.6} />
      <Sfx cue="cta" src="sfx/reveal.wav" />
    </>
  );
}

export const ONLY_ACES_FRAMES = timelineFor(SCRIPT, VO).total;

export function OnlyAces() {
  return (
    <Narration script={SCRIPT} vo={VO}>
      <Hook />
      <ThePlan />
      <TheWait />
      <NobodyPays />
      <TheFix />
      <CheatSheet />
      <Outro />
      <SoundDesign />
    </Narration>
  );
}
