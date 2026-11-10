/**
 * Reel 003 — "Will it get there?" Outs in two seconds (the rule of 2 and 4), the niche's third
 * biggest topic (196K views on the reference account). Exact hit chances are computed here
 * (turn: outs/47; by the river: 1 − (47−outs)(46−outs)/(47·46)); the quick rule comes from
 * ../../../web/src/poker/odds.ts so the reel and the site always agree.
 * Beats (30fps, 40s): hook → count the outs (hearts fly in) → ×4 on the flop → ×2 on the turn →
 * the exact numbers vs the rule → save-this table of draws → outro with comment bait.
 * Growth mechanics: hook under one second, a "send this to…" line, a question to answer in
 * the comments, and the outro's last frame matching the hook (seamless loop).
 */

import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { beatDurations, beatStarts, VoManifest } from "../vo";
import voJson from "../vo/will-it-get-there.json";
const vo = voJson as VoManifest;
import { outsToEquity } from "../../../web/src/poker/odds";
import { BigNumber, Caption, Frame, PlayingCard, fadeUp, pop, useT } from "../components";
import { Counter, Engraving } from "../teaching";
import { C, SERIF } from "../theme";

const exactRiver = (outs: number) => 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
const exactTurn = (outs: number) => outs / 47;
const pct = (x: number) => Math.round(x * 100);

const DRAWS: [string, number][] = [
  ["Gutshot", 4],
  ["Two overcards", 6],
  ["Open-ended", 8],
  ["Flush draw", 9],
  ["Flush + pair", 12],
  ["Flush + straight", 15],
];
const HEARTS = ["Qh", "Jh", "Th", "8h", "7h", "6h", "4h", "3h", "2h"];

const clamp = (f: number, a: number, b: number, lo = 0, hi = 1) => interpolate(f, [a, b], [lo, hi], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

function Title({ children, top = 350, size = 118 }: { children: React.ReactNode; top?: number; size?: number }) {
  const { frame } = useT();
  return (
    <div style={{ position: "absolute", top, left: 70, right: 70, textAlign: "center", fontFamily: SERIF, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.02em", ...fadeUp(frame, 0, 8) }}>
      {children}
    </div>
  );
}

function Hook() {
  const { frame, fps } = useT();
  return (
    <>
      <Engraving file="expr-6.png" fade={0.45} style={{ position: "absolute", top: 597, left: 40, width: 720, height: 605, opacity: clamp(frame, 0, 14) }} />
      <Title size={85.28}>
        Will it <em>get there?</em>
      </Title>
      <div style={{ position: "absolute", top: 597, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22 }}>
        {["Ah", "5h"].map((c, i) => (
          <PlayingCard key={c} card={c} size={0.9} style={{ transform: `scale(${pop(frame, fps, 2 + i * 3)})` }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 809, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        {["Kh", "9h", "2c"].map((c, i) => (
          <PlayingCard key={c} card={c} size={0.7} style={{ transform: `scale(${pop(frame, fps, 10 + i * 3)})` }} />
        ))}
      </div>
      <Caption text="Four hearts. Two cards to come. You have two seconds to know your chance." hl={["two", "seconds"]} accent={C.brass} start={12} dur={55} />
    </>
  );
}

function CountOuts() {
  const { frame, fps } = useT();
  const n = Math.min(9, Math.max(0, Math.floor((frame - 10) / 5)));
  return (
    <>
      <Title top={340} size={84}>Count the outs</Title>
      <div style={{ position: "absolute", top: 487, left: 100, right: 100, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
        {HEARTS.map((c, i) => (
          <PlayingCard key={c} card={c} size={0.64} style={{ transform: `scale(${pop(frame, fps, 10 + i * 5)})` }} />
        ))}
      </div>
      <Counter to={9} progress={n / 9} label="HEARTS LEFT IN THE DECK" color={C.paper} size={213.2} style={{ position: "absolute", top: 939, left: 0, right: 0 }} />
      <Caption text="Thirteen hearts. You see four. Nine outs." hl={["nine"]} start={55} dur={40} />
    </>
  );
}

function TimesFour() {
  const { frame } = useT();
  const rule = pct(outsToEquity(9, 2));
  return (
    <>
      <Title top={340} size={84}>On the flop</Title>
      <div style={{ position: "absolute", top: 514, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontSize: 160, lineHeight: 1, ...fadeUp(frame, 6) }}>
        9 <span style={{ color: C.text3 }}>×</span> 4
      </div>
      <div style={{ position: "absolute", top: 706, left: 0, right: 0, ...fadeUp(frame, 36) }}>
        <BigNumber value={`${rule}%`} label="TO HIT BY THE RIVER" color={C.sage} />
      </div>
      <Caption text="Two cards to come: outs times four. Nine times four, thirty-six percent." hl={["four", "thirty-six"]} start={10} dur={60} />
    </>
  );
}

function TimesTwo() {
  const { frame, fps } = useT();
  const rule = pct(outsToEquity(9, 1));
  return (
    <>
      <Title top={340} size={84}>On the turn</Title>
      <div style={{ position: "absolute", top: 494, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
        {["Kh", "9h", "2c", "7s"].map((c, i) => (
          <PlayingCard key={c} card={c} size={0.66} style={{ transform: `scale(${i === 3 ? pop(frame, fps, 8) : 1})`, opacity: i === 3 ? 1 : 0.55 }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 706, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontSize: 160, lineHeight: 1, ...fadeUp(frame, 24) }}>
        9 <span style={{ color: C.text3 }}>×</span> 2
      </div>
      <div style={{ position: "absolute", top: 891, left: 0, right: 0, ...fadeUp(frame, 50) }}>
        <BigNumber value={`${rule}%`} label="ONE CARD LEFT" color={C.brass} />
      </div>
      <Caption text="A blank. One card to come: outs times two. Eighteen percent." hl={["two", "eighteen"]} accent={C.brass} start={20} dur={55} />
    </>
  );
}

function Exact() {
  const { frame } = useT();
  const rows: [string, number, number][] = [
    ["RULE SAYS", pct(outsToEquity(9, 2)), pct(outsToEquity(9, 1))],
    ["EXACTLY", pct(exactRiver(9)), pct(exactTurn(9))],
  ];
  return (
    <>
      <Title top={340} size={84}>How close?</Title>
      <div style={{ position: "absolute", top: 501, left: 120, right: 170 }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: "0.24em", color: C.text3, paddingBottom: 18, borderBottom: `1px solid ${C.ruleStrong}` }}>
          <span style={{ flex: 1 }} />
          <span style={{ width: 216, textAlign: "right" }}>FLOP</span>
          <span style={{ width: 216, textAlign: "right" }}>TURN</span>
        </div>
        {rows.map(([label, a, b], i) => (
          <div key={label} style={{ display: "flex", alignItems: "baseline", padding: "26px 0", borderBottom: `1px solid ${C.rule}`, ...fadeUp(frame, 10 + i * 20, 12) }}>
            <span style={{ flex: 1, fontSize: 34, letterSpacing: "0.2em", color: i ? C.sage : C.text2, fontWeight: 500 }}>{label}</span>
            <span style={{ width: 216, textAlign: "right", fontFamily: SERIF, fontSize: 96, color: i ? C.sage : C.text2 }}>{a}%</span>
            <span style={{ width: 216, textAlign: "right", fontFamily: SERIF, fontSize: 96, color: i ? C.sage : C.text2 }}>{b}%</span>
          </div>
        ))}
      </div>
      <Engraving file="expr-1.png" fade={0.45} style={{ position: "absolute", top: 871, left: 200, width: 490, height: 389, opacity: clamp(frame, 60, 80) }} />
      <Caption text="Off by one. Good enough to decide in two seconds, every hand." hl={["one"]} start={45} dur={50} />
    </>
  );
}

function CheatSheet() {
  const { frame } = useT();
  return (
    <>
      <Title top={340} size={84}>Save this.</Title>
      <div style={{ position: "absolute", top: 466, left: 110, right: 170 }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: "0.24em", color: C.text3, paddingBottom: 16, borderBottom: `1px solid ${C.ruleStrong}` }}>
          <span style={{ flex: 1 }}>DRAW</span>
          <span style={{ width: 100, textAlign: "right" }}>OUTS</span>
          <span style={{ width: 190, textAlign: "right" }}>FLOP</span>
          <span style={{ width: 190, textAlign: "right" }}>TURN</span>
        </div>
        {DRAWS.map(([name, outs], i) => (
          <div key={name} style={{ display: "flex", alignItems: "baseline", padding: "15px 0", borderBottom: `1px solid ${C.rule}`, ...fadeUp(frame, 8 + i * 7, 10) }}>
            <span style={{ flex: 1, fontSize: 42, color: C.text2 }}>{name}</span>
            <span style={{ width: 100, textAlign: "right", fontFamily: SERIF, fontSize: 64, color: C.brass }}>{outs}</span>
            <span style={{ width: 190, textAlign: "right", fontFamily: SERIF, fontSize: 64 }}>{pct(exactRiver(outs))}%</span>
            <span style={{ width: 190, textAlign: "right", fontFamily: SERIF, fontSize: 64 }}>{pct(exactTurn(outs))}%</span>
          </div>
        ))}
      </div>
      <Caption text="Send this to the friend who chases every gutshot." hl={["gutshot"]} accent={C.vermilion} start={60} dur={40} />
    </>
  );
}

function Outro() {
  const { frame } = useT();
  return (
    <>
      <Engraving file="expr-6.png" fade={0.45} style={{ position: "absolute", top: 597, left: 40, width: 720, height: 605, opacity: clamp(frame, 0, 12) }} />
      <div style={{ position: "absolute", top: 371, left: 70, right: 70, textAlign: "center", ...fadeUp(frame, 6) }}>
        <div style={{ fontFamily: SERIF, fontSize: 86, lineHeight: 1 }}>
          Which draw do <em>you</em> chase?
        </div>
        <div style={{ marginTop: 30, fontSize: 34, letterSpacing: "0.26em", color: C.text3, fontWeight: 500 }}>WRONG ANSWERS IN THE COMMENTS</div>
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

const MINIMUMS = [110, 150, 170, 180, 180, 240, 170]; // frames each beat's graphics need
const BEATS = [Hook, CountOuts, TimesFour, TimesTwo, Exact, CheatSheet, Outro];
const DUR = beatDurations(vo.lines.length ? vo : null, MINIMUMS);
const START = beatStarts(DUR);
export const WILL_IT_GET_THERE_FRAMES = DUR.reduce((a, b) => a + b, 0);

export function WillItGetThere() {
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
