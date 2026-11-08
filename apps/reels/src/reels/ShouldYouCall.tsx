/**
 * Reel 001 — "Should you call?" Pot odds with one formula, on the flush-draw spot from Letter
 * No. 1 (A♥5♥ on K♥9♥2♣, facing 50 into 100). The numbers come from the website's own maths
 * (apps/web/src/poker/odds.ts), so the reel can never disagree with the tool.
 * Beats (30fps, 38s): hook → "most players guess" → the price (25%) → your outs (35%) →
 * verdict → save-this cheat sheet → the Gentleman + llamapoker.com.
 */

import { AbsoluteFill, Img, Sequence, interpolate, staticFile } from "remotion";
import { potOdds } from "../../../web/src/poker/odds";
import { BigNumber, Bar, Caption, Frame, PlayingCard, fadeUp, pop, useT } from "../components";
import { C, SERIF } from "../theme";

const price = potOdds(100, 50); // call 50 into a final pot of 200
const NEED = Math.round(price.requiredEquity * 100); // 25
const twoCards = (outs: number) => 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
const HAVE = Math.round(twoCards(9) * 100); // 35

const SIZES: [string, number][] = [
  ["¼ pot", 0.25],
  ["⅓ pot", 1 / 3],
  ["½ pot", 0.5],
  ["⅔ pot", 2 / 3],
  ["Pot", 1],
  ["2× pot", 2],
];

export const SHOULD_YOU_CALL_FRAMES = 1140;

function Title({ children, top = 260, size = 150 }: { children: React.ReactNode; top?: number; size?: number }) {
  const { frame } = useT();
  return (
    <div style={{ position: "absolute", top, left: 80, right: 80, textAlign: "center", fontFamily: SERIF, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.02em", ...fadeUp(frame, 0, 10) }}>
      {children}
    </div>
  );
}

function Hook() {
  const { frame, fps } = useT();
  return (
    <>
      <Title>
        Should you <em>call?</em>
      </Title>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26 }}>
        {["Ah", "5h"].map((c, i) => (
          <PlayingCard key={c} card={c} size={1.25} style={{ transform: `scale(${pop(frame, fps, 6 + i * 4)})` }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 940, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
        {["Kh", "9h", "2c"].map((c, i) => (
          <PlayingCard key={c} card={c} size={0.95} style={{ transform: `scale(${pop(frame, fps, 18 + i * 4)})` }} />
        ))}
      </div>
      <Caption text="They bet 50 into 100. You hold a flush draw." hl={["50", "100", "flush", "draw"]} start={14} dur={40} />
    </>
  );
}

function Guess() {
  const { frame } = useT();
  const strike = interpolate(frame, [22, 36], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontSize: 120, color: C.text2 }}>
        <span style={{ position: "relative" }}>
          Gut feeling
          <span style={{ position: "absolute", left: 0, top: "55%", height: 8, width: `${strike}%`, background: C.vermilion }} />
        </span>
      </div>
      <div style={{ position: "absolute", top: 860, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontSize: 120, ...fadeUp(frame, 40, 12) }}>
        One formula.
      </div>
      <Caption text="Most players guess. You only need one line of maths." hl={["guess", "one", "line"]} dur={40} />
    </>
  );
}

function Price() {
  const { frame } = useT();
  const fill = interpolate(frame, [90, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Title top={230} size={110}>The price</Title>
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, textAlign: "center", fontSize: 58, color: C.text2, lineHeight: 1.6 }}>
        <div style={fadeUp(frame, 10)}>Pot 100 + their 50 + your 50</div>
        <div style={{ ...fadeUp(frame, 34), color: C.paper, fontSize: 70 }}>= {price.potAfterCall}</div>
      </div>
      <div style={{ position: "absolute", top: 800, left: 0, right: 0, ...fadeUp(frame, 60) }}>
        <BigNumber value={`${NEED}%`} label="YOU NEED" color={C.brass} />
      </div>
      <div style={{ position: "absolute", top: 1230, left: 120, opacity: frame > 85 ? 1 : 0 }}>
        <Bar label="NEED" pct={NEED} color={C.brass} progress={fill} />
      </div>
      <Caption text={`You pay 50 to win ${price.potAfterCall}. Win more than 1 in 4 and the call pays.`} hl={["50", String(price.potAfterCall), "1", "4"]} accent={C.brass} start={10} dur={60} />
    </>
  );
}

function Outs() {
  const { frame, fps } = useT();
  const hearts = ["Qh", "Jh", "Th", "8h", "7h", "6h", "4h", "3h", "2h"];
  return (
    <>
      <Title top={230} size={110}>Your odds</Title>
      <div style={{ position: "absolute", top: 450, left: 90, right: 90, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {hearts.map((c, i) => (
          <PlayingCard key={c} card={c} size={0.72} style={{ transform: `scale(${pop(frame, fps, 8 + i * 4)})` }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 960, left: 0, right: 0, textAlign: "center", fontSize: 62, color: C.text2, ...fadeUp(frame, 60) }}>
        9 outs × 4 ≈ 36%
      </div>
      <div style={{ position: "absolute", top: 1100, left: 0, right: 0, ...fadeUp(frame, 110) }}>
        <BigNumber value={`${HAVE}%`} label="EXACTLY, BY THE RIVER" color={C.sage} />
      </div>
      <Caption text="Nine hearts left. Outs times four on the flop is your rough chance." hl={["nine", "hearts", "four"]} accent={C.sage} start={8} dur={60} />
    </>
  );
}

function Verdict() {
  const { frame, fps } = useT();
  const fill = interpolate(frame, [6, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", top: 380, left: 120, display: "flex", flexDirection: "column", gap: 60 }}>
        <Bar label="YOU NEED" pct={NEED} color={C.brass} progress={fill} />
        <Bar label="YOU HAVE" pct={HAVE} color={C.sage} progress={fill} />
      </div>
      <div style={{ position: "absolute", top: 820, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontSize: 230, color: C.sage, transform: `scale(${pop(frame, fps, 60)})` }}>
        Call.
      </div>
      <div style={{ position: "absolute", top: 1110, left: 0, right: 0, textAlign: "center", fontSize: 50, color: C.text2, ...fadeUp(frame, 90) }}>
        (Raising is even better.)
      </div>
      <Caption text="35 beats 25. Calling makes money in the long run." hl={["35", "25", "money"]} start={30} dur={40} />
    </>
  );
}

function CheatSheet() {
  const { frame } = useT();
  return (
    <>
      <Title top={220} size={100}>
        Save this.
      </Title>
      <div style={{ position: "absolute", top: 380, left: 140, right: 140 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: "0.24em", color: C.text3, paddingBottom: 18, borderBottom: `1px solid ${C.ruleStrong}` }}>
          <span>THEY BET</span>
          <span>YOU NEED</span>
        </div>
        {SIZES.map(([name, f], i) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "17px 0", borderBottom: `1px solid ${C.rule}`, ...fadeUp(frame, 8 + i * 7, 10) }}>
            <span style={{ fontSize: 54, color: C.text2 }}>{name}</span>
            <span style={{ fontFamily: SERIF, fontSize: 84 }}>{Math.round(potOdds(100, 100 * f).requiredEquity * 100)}%</span>
          </div>
        ))}
      </div>
      <Caption text="Bigger bet, higher price. Even a huge overbet never asks for 50." hl={["bigger", "higher", "50"]} accent={C.brass} start={50} dur={50} />
    </>
  );
}

function Outro() {
  const { frame } = useT();
  return (
    <>
      <Img src={staticFile("gentleman.webp")} style={{ position: "absolute", top: 230, left: 90, width: 900, height: 900, objectFit: "cover", ...fadeUp(frame, 0, 14) }} />
      <div style={{ position: "absolute", top: 1180, left: 0, right: 0, textAlign: "center", ...fadeUp(frame, 14) }}>
        <div style={{ fontFamily: SERIF, fontSize: 96 }}>Run any spot, free.</div>
        <div style={{ marginTop: 26, fontSize: 52, letterSpacing: "0.08em", color: C.paper, fontWeight: 500 }}>llamapoker.com</div>
        <div style={{ marginTop: 18, fontSize: 30, letterSpacing: "0.24em", color: C.text3 }}>LINK IN BIO</div>
      </div>
    </>
  );
}

const BEATS: [number, number, () => JSX.Element][] = [
  [0, 120, Hook],
  [120, 90, Guess],
  [210, 210, Price],
  [420, 240, Outs],
  [660, 150, Verdict],
  [810, 210, CheatSheet],
  [1020, 120, Outro],
];

export function ShouldYouCall() {
  return (
    <Frame>
      {BEATS.map(([from, dur, Beat]) => (
        <Sequence key={from} from={from} durationInFrames={dur}>
          <AbsoluteFill>
            <Beat />
          </AbsoluteFill>
        </Sequence>
      ))}
    </Frame>
  );
}
