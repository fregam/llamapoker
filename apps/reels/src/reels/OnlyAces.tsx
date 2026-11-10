/**
 * Reel 002 — "Only playing aces?" The most-watched beginner topic in the niche (research:
 * content/research/2026-11-06-ziramium_poker.md), rebuilt from code in the brand world.
 * Numbers from ../../../web/src/poker/ranges.ts: premium hands are 34 of 1,326 combos (2.6%),
 * one every 39 hands; 6-max blinds cost 1.5 bb per orbit of 6 hands, so ~10 bb per wait.
 * Beats (30fps, 42s): hook → the plan (grid) → the wait (counter, chips) → nobody pays →
 * the fix (grid widens to the button range) → save-this cheat sheet → outro.
 */

import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { beatDurations, beatStarts, VoManifest } from "../vo";
import voJson from "../vo/only-aces.json";
const vo = voJson as VoManifest;
import { expandRange, POSITIONS, rangeFor, rangePercent } from "../../../web/src/poker/ranges";
import { BigNumber, Caption, Frame, PlayingCard, fadeUp, pop, useT } from "../components";
import { ChipStack, Counter, DotRow, Engraving, RangeGrid, Seat } from "../teaching";
import { C, SERIF } from "../theme";

const PREMIUM = expandRange(["QQ+", "AKs", "AKo"]);
const PREMIUM_PCT = rangePercent(PREMIUM); // 2.56
const PREMIUM_COMBOS = Math.round((PREMIUM_PCT / 100) * 1326); // 34
const WAIT = Math.round(1326 / PREMIUM_COMBOS); // 39 hands between premiums
const BLINDS_PER_HAND = 1.5 / 6; // 6-max: SB 0.5 + BB 1 every 6 hands
const BLINDS_LOST = Math.round(WAIT * BLINDS_PER_HAND); // 10 bb
const BTN = rangeFor("BTN");
const BTN_PCT = Math.round(rangePercent(BTN));


const clamp = (f: number, a: number, b: number, lo = 0, hi = 1) => interpolate(f, [a, b], [lo, hi], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

function Title({ children, top = 350, size = 118 }: { children: React.ReactNode; top?: number; size?: number }) {
  const { frame } = useT();
  return (
    <div style={{ position: "absolute", top, left: 70, right: 70, textAlign: "center", fontFamily: SERIF, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.02em", ...fadeUp(frame, 0, 10) }}>
      {children}
    </div>
  );
}

function Hook() {
  const { frame } = useT();
  const drift = interpolate(frame, [0, 120], [1.02, 1.08]);
  return (
    <>
      <Engraving file="expr-4.png" fade={0.35} style={{ position: "absolute", top: 569, left: -60, width: 864, height: 727, transform: `scale(${drift})`, opacity: clamp(frame, 0, 18) }} />
      <Title>
        Only playing <em>aces?</em>
      </Title>
      <Caption text="Fold. Fold. Fold. Waiting for the big hand feels disciplined." hl={["disciplined"]} accent={C.brass} start={20} dur={55} />
    </>
  );
}

function ThePlan() {
  const { frame } = useT();
  const p = clamp(frame, 10, 50);
  return (
    <>
      <Title top={340} size={84}>The plan</Title>
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <RangeGrid lit={PREMIUM} progress={p} color={C.brass} cell={40} dim />
      </div>
      <div style={{ position: "absolute", top: 1069, left: 0, right: 0, ...fadeUp(frame, 55) }}>
        <BigNumber value={`${PREMIUM_PCT.toFixed(1)}%`} label={`${PREMIUM_COMBOS} OF 1,326 HANDS`} color={C.brass} />
      </div>
      <Caption text={`Aces, kings, queens, ace-king. ${PREMIUM_COMBOS} of 1,326 combos. Under 3% of hands.`} hl={["34", "3%"]} accent={C.brass} start={10} dur={60} />
    </>
  );
}

function TheWait() {
  const { frame } = useT();
  const p = clamp(frame, 15, 150);
  const chips = 40 - BLINDS_LOST * p;
  const acesIn = frame > 165;
  return (
    <>
      <Title top={340} size={84}>The wait</Title>
      <Counter to={WAIT} progress={p} label="HANDS BETWEEN PREMIUMS" color={C.paper} style={{ position: "absolute", top: 487, left: 0, right: 0 }} />
      <DotRow total={WAIT + 1}  filled={Math.round(p * WAIT) + (acesIn ? 1 : 0)} mark={WAIT} style={{ position: "absolute", top: 784, left: 150, right: 150 }} />
      <div style={{ position: "absolute", top: 816, left: 150, display: "flex", alignItems: "flex-end", gap: 50 }}>
        <ChipStack count={chips} />
        <div style={{ paddingBottom: 40 }}>
          <div style={{ fontFamily: SERIF, fontSize: 120, color: C.vermilion, lineHeight: 0.9, opacity: clamp(frame, 30, 45) }}>−{Math.round(BLINDS_LOST * p)} bb</div>
          <div style={{ fontSize: 30, letterSpacing: "0.26em", color: C.text3, fontWeight: 500, marginTop: 16 }}>BLINDS PAID WHILE YOU FOLD</div>
        </div>
      </div>
      {acesIn && (
        <div style={{ position: "absolute", top: 1104, left: 620, display: "flex", gap: 14 }}>
          {["As", "Ah"].map((c, i) => (
            <PlayingCard key={c} card={c} size={0.49} style={{ transform: `scale(${pop(frame, 30, 165 + i * 4)})` }} />
          ))}
        </div>
      )}
      <Caption text={`One premium every ${WAIT} hands. The blinds come round anyway: ${BLINDS_LOST} big blinds, gone.`} hl={[String(WAIT), String(BLINDS_LOST), "gone"]} accent={C.vermilion} start={10} dur={70} />
    </>
  );
}

function NobodyPays() {
  const { frame, fps } = useT();
  return (
    <>
      <Title top={340} size={84}>Nobody pays</Title>
      <div style={{ position: "absolute", top: 501, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 70 }}>
        {["SEAT 1", "SEAT 2", "SEAT 3"].map((n, i) => (
          <Seat key={n} name={n} folded frame={frame} delay={45 + i * 14} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 665, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        {["As", "Ah"].map((c, i) => (
          <PlayingCard key={c} card={c} size={0.86} style={{ transform: `scale(${pop(frame, fps, 4 + i * 4)})` }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 888, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontSize: 74, ...fadeUp(frame, 24) }}>
        You raise.
      </div>
      <Engraving file="expr-3.png" fade={0.45} style={{ position: "absolute", top: 939, left: 190, width: 504, height: 403, opacity: clamp(frame, 95, 115) }} />
      <Caption text="The aces finally come. You raise. Everyone folds. After an hour of folding, nobody pays you off." hl={["everyone", "folds", "nobody"]} accent={C.vermilion} start={20} dur={80} />
    </>
  );
}

function TheFix() {
  const { frame } = useT();
  const p = clamp(frame, 20, 110);
  const pct = Math.round(PREMIUM_PCT + (BTN_PCT - PREMIUM_PCT) * p);
  return (
    <>
      <Title top={340} size={84}>From the button</Title>
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <RangeGrid lit={BTN} progress={p} color={C.sage} cell={40} dim />
      </div>
      <div style={{ position: "absolute", top: 1069, left: 0, right: 0 }}>
        <BigNumber value={`${pct}%`} label="OF HANDS, RAISED FIRST IN" color={C.sage} />
      </div>
      <Caption text={`Last to act, open about ${BTN_PCT}% of hands. Tight is fine. Predictable is broke.`} hl={[`${BTN_PCT}%`, "predictable", "broke"]} start={10} dur={70} />
    </>
  );
}

function CheatSheet() {
  const { frame } = useT();
  const rows = POSITIONS.filter((p) => p !== "BB");
  return (
    <>
      <Title top={340} size={84}>Save this.</Title>
      <div style={{ position: "absolute", top: 473, left: 120, right: 170 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: "0.24em", color: C.text3, paddingBottom: 18, borderBottom: `1px solid ${C.ruleStrong}` }}>
          <span>SEAT</span>
          <span>OPEN</span>
        </div>
        {rows.map((pos, i) => {
          const pct = Math.round(rangePercent(rangeFor(pos)));
          return (
            <div key={pos} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderBottom: `1px solid ${C.rule}`, ...fadeUp(frame, 8 + i * 8, 10) }}>
              <span style={{ fontSize: 54, color: C.text2, letterSpacing: "0.06em" }}>{pos}</span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
                <span style={{ width: 216, height: 14, background: C.ink2, border: `1px solid ${C.rule}` }}>
                  <span style={{ display: "block", height: "100%", width: `${pct * 2}%`, background: pos === "BTN" ? C.sage : C.brass }} />
                </span>
                <span style={{ fontFamily: SERIF, fontSize: 67, width: 122, textAlign: "right" }}>{pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
      <Caption text="Send this to the friend who folds for an hour." hl={["hour"]} accent={C.brass} start={55} dur={40} />
    </>
  );
}

function Outro() {
  const { frame } = useT();
  return (
    <>
      <Engraving file="expr-4.png" fade={0.35} style={{ position: "absolute", top: 569, left: -60, width: 864, height: 727, transform: "scale(1.02)", opacity: clamp(frame, 0, 12) }} />
      <div style={{ position: "absolute", top: 371, left: 70, right: 70, textAlign: "center", ...fadeUp(frame, 6) }}>
        <div style={{ fontFamily: SERIF, fontSize: 86, lineHeight: 1 }}>
          How long is <em>your</em> wait?
        </div>
        <div style={{ marginTop: 30, fontSize: 34, letterSpacing: "0.26em", color: C.text3, fontWeight: 500 }}>HONEST ANSWERS IN THE COMMENTS</div>
      </div>
      <div style={{ position: "absolute", bottom: 450, left: 110, right: 160, ...fadeUp(frame, 30) }}>
        <div style={{ width: 54, height: 1, background: C.brass, marginBottom: 22 }} />
        <div style={{ fontSize: 44, color: C.text2 }}>Run any spot, free.</div>
        <div style={{ marginTop: 8, fontSize: 60, letterSpacing: "0.04em", color: C.paper, fontWeight: 500 }}>llamapoker.com</div>
        <div style={{ marginTop: 10, fontSize: 28, letterSpacing: "0.24em", color: C.text3 }}>LINK IN BIO · THE LLAMA IS READING YOU</div>
      </div>
    </>
  );
}

const MINIMUMS = [120, 180, 240, 210, 180, 210, 120]; // frames each beat's graphics need
const BEATS = [Hook, ThePlan, TheWait, NobodyPays, TheFix, CheatSheet, Outro];
const DUR = beatDurations(vo.lines.length ? vo : null, MINIMUMS);
const START = beatStarts(DUR);
export const ONLY_ACES_FRAMES = DUR.reduce((a, b) => a + b, 0);

export function OnlyAces() {
  return (
    <Frame>
      {BEATS.map((Beat, i) => (
        <Sequence key={i} from={START[i]} durationInFrames={DUR[i]}>
          {vo.lines[i] && <Audio src={staticFile(vo.lines[i].file)} />}
          <AbsoluteFill>
            <Beat />
          </AbsoluteFill>
        </Sequence>
      ))}
    </Frame>
  );
}
