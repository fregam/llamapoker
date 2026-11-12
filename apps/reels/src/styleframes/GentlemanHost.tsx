/**
 * Style frame 4 (research round 4): the Gentleman performs. He stands on the left in his
 * three-quarter profile, looking at the hook happening on his right: he glances down as the aces
 * slam, does a double take as the cost lands, and shakes his head on "nobody pays". A cut-out
 * puppet in code: the head and wool (above the collar) are a separate, feathered layer that
 * rotates around the base of the neck; the body breathes. Art: expressions sheet v02, cell 1.
 */

import { staticFile, useCurrentFrame } from "remotion";
import { PlayingCard } from "../components";
import { Enter, Stat, Tag, useNarration } from "../stage";
import { Hit, Sfx } from "../sound";
import { C, SERIF } from "../theme";
import { DrawOn } from "./DrawOn";

const IMG_W = 912;
const IMG_H = 768;
// head + neck wool, in image pixels (expr-1.png), cut along the collar
const HEAD = "280,0 770,0 770,420 660,470 625,540 560,562 470,562 400,545 340,532 300,482 280,380";
const PIVOT = { x: 505, y: 560 };

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outBack = (x: number) => {
  const t = clamp(x);
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const bump = (f: number, rise: number, hold: number, fall: number) =>
  f < 0 ? 0 : f < rise ? outBack(f / rise) : f < rise + hold ? 1 : 1 - clamp((f - rise - hold) / fall) ** 2 * (3 - 2 * clamp((f - rise - hold) / fall));

function Puppet({ x, y, scale }: { x: number; y: number; scale: number }) {
  const frame = useCurrentFrame();
  const { since } = useNarration();
  // glance down at the slam, double take at the cost (head back and up), a lean in after,
  // a small shake on "nobody"
  const glance = bump(since("hook") - 2, 6, 14, 14) * 3.2;
  const take = bump(since("cost") - 1, 7, 18, 22) * -5.5;
  const lean = clamp((since("cost") - 40) / 30) * 1.6 * (1 - clamp((since("nobody0") - 0) / 10));
  const shakeF = since("nobody0");
  const shake = shakeF >= 0 && shakeF < 22 ? Math.sin(shakeF * 0.85) * 2.2 * (1 - shakeF / 22) : 0;
  const idle = Math.sin(frame / 38) * 0.6;
  const angle = glance + take + lean + shake + idle;
  const lift = bump(since("cost") - 1, 7, 18, 22) * -7;
  const breathe = 1 + Math.sin(frame / 52) * 0.004;
  const src = staticFile("library/expr-1.png");
  return (
    <svg width={IMG_W * scale} height={IMG_H * scale} viewBox={`0 0 ${IMG_W} ${IMG_H}`} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <defs>
        <filter id="feather" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <mask id="head" maskUnits="userSpaceOnUse" x={0} y={0} width={IMG_W} height={IMG_H}>
          <polygon points={HEAD} fill="white" filter="url(#feather)" />
        </mask>
        <mask id="body" maskUnits="userSpaceOnUse" x={0} y={0} width={IMG_W} height={IMG_H}>
          <rect width={IMG_W} height={IMG_H} fill="white" />
          <polygon points={HEAD} fill="black" filter="url(#feather)" />
        </mask>
        {/* the bust dissolves into the black at the bottom, before the captions */}
        <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.72" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id="bottom" maskUnits="userSpaceOnUse" x={-200} y={-200} width={IMG_W + 400} height={IMG_H + 400}>
          <rect x={-200} y={-200} width={IMG_W + 400} height={IMG_H + 400} fill="url(#fadeDown)" />
        </mask>
      </defs>
      <g>
        <g transform={`translate(${PIVOT.x} ${IMG_H}) scale(${breathe}) translate(${-PIVOT.x} ${-IMG_H})`}>
          <image href={src} width={IMG_W} height={IMG_H} mask="url(#body)" />
        </g>
        <g transform={`translate(0 ${lift}) rotate(${angle.toFixed(3)} ${PIVOT.x} ${PIVOT.y})`}>
          <image href={src} width={IMG_W} height={IMG_H} mask="url(#head)" />
        </g>
      </g>
    </svg>
  );
}

export function GentlemanHost({ drawOn = false }: { drawOn?: boolean }) {
  const { since } = useNarration();
  return (
    <>
      {drawOn && (
        <Enter cue="hook" exit="grid" dur={1} style={{ inset: 0 }}>
          <DrawOn layout="host" />
        </Enter>
      )}
      {/* headline, centred above everything */}
      {!drawOn && <Enter cue="hook" exit="grid" dur={1} style={{ top: 360, left: 70, right: 70, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 104, lineHeight: 0.95, letterSpacing: "-0.02em", color: C.paper }}>
          Only playing <em>aces?</em>
        </div>
      </Enter>}
      <Enter cue="hook" exit="grid" dur={1} style={{ inset: 0 }}>
        <Puppet x={-150} y={640} scale={0.78} />
      </Enter>
      {/* his side of the table: the aces slam in on his right, where he is looking */}
      {!drawOn && <Enter cue="hook" exit="grid" dur={1} style={{ top: 650, left: 590, display: "flex", gap: 16 }}>
        {["As", "Ah"].map((c, i) => {
          const t = clamp((since("hook") - i * 4) / 7);
          return <PlayingCard key={c} card={c} size={0.95} style={{ opacity: t, transform: `translateY(${(1 - t) * -140}px) scale(${1.25 - 0.25 * t}) rotate(${(i ? 1 : -1) * (1 - t) * 12}deg)` }} />;
        })}
      </Enter>}
      <Enter cue="cost" exit="grid" motion="stamp" style={{ top: 900, left: 480, right: 60, textAlign: "right", whiteSpace: "nowrap" }}>
        <Stat value="−10 bb" label="EVERY WAIT" color={C.vermilion} size={128} align="right" />
      </Enter>
      {/* the hook's effects, identical to the current hook (OnlyAces Hook), so only the picture differs */}
      <Sfx cue="hook" src="sfx/deal.wav" gain={0.9} />
      <Sfx cue="hook" src="sfx/deal.wav" delay={4} gain={0.8} />
      <Hit cue="cost" riser={false} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} cue="nobody0" src="sfx/fold.wav" delay={i * 3} gain={0.7} />
      ))}
      <Enter cue="nobody0" exit="grid" style={{ top: 1110, right: 60, display: "flex", gap: 18 }}>
        {[0, 1, 2].map((i) => (
          <Tag key={i} text="FOLD" color={C.vermilion} size={26} />
        ))}
      </Enter>
    </>
  );
}
