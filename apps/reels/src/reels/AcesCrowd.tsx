/**
 * Reel "aces-crowd": why pocket aces "always get cracked". One ace of spades built from 3,500
 * tiles; every caller who stays to the river knocks out the share of tiles the aces now lose.
 * The win rates come from the website's engine (scripts/aces-crowd.ts → data/aces-crowd.json).
 * The tiles are drawn on a canvas with a small hand-written 3D camera; the type sits above in DOM.
 * Registered in Root.tsx as "aces-crowd". The last frame matches the first, so the reel loops.
 */

import { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import data from "../data/aces-crowd.json";
import { C, H, SANS, SERIF, W } from "../theme";

const MONO = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

export const ACES_CROWD_FRAMES = 552;

// ---- the numbers (engine) ----
const WIN = data.rows.map((r) => r.win); // index 0 = 1 opponent
const LOSS = [0, ...WIN.slice(0, 5).map((w) => 1 - w)]; // LOSS[k] = share of tiles gone with k callers
const PCT = WIN.map((w) => Math.round(w * 100));

// ---- timeline (frames, 30 fps), set from the voice-over's word times (public/vo/aces-crowd/vo.wav) ----
const BLAST = 16; // "cracked."
const AGAIN = 37;
const HOOK_END = 50;
const REWIND_END = 84;
const S = [0, 132, 239, 265, 292, 346]; // S[k] = caller k sits down: "85", "73", "64", "56", "49"
const EVERY = 178; // "But every extra caller takes a piece"
const FIVE = 318; // "Five callers?"
const FLASH = 349;
const UNDERDOG = 369;
const PAYOFF = 404;
const PAYOFF2 = 444;
const HEAL = 478;
const FOLD = [0, 0, 508, 499, 490, 481]; // FOLD[k] = caller k folds (5 first)
const OUTRO = 524;
const END = ACES_CROWD_FRAMES;

// ---- the card ----
const COLS = 76;
const ROWS = 106;
const PITCH = 8;
const U = COLS / 50; // the marks below are laid out on a 50-column card
const CARD_W = COLS * PITCH;
const CARD_H = ROWS * PITCH;
const HOME = { x: 540, y: 1340 };
const BIG = 1.46; // the card runs off the bottom of the frame: it is the stage, not an object on it // card centre in the stage layout
const FOCAL = 1700;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Tile {
  x: number; y: number; // centre, relative to the card centre (px)
  dark: boolean; // part of the spade or the corner index
  shade: number; // small brightness variation
  r: number; // crack order, uniform 0..1 (low = breaks first)
  stage: number; // which caller knocks it out (1..5), 0 = never
  frac: number; // position inside its stage's wave, 0..1
  vx: number; vy: number; vz: number; spin: number;
}

function spadePath(p: Path2D, cx: number, cy: number, s: number) {
  p.moveTo(cx, cy - s);
  p.bezierCurveTo(cx + 0.08 * s, cy - 0.72 * s, cx + 0.98 * s, cy - 0.2 * s, cx + 0.98 * s, cy + 0.28 * s);
  p.bezierCurveTo(cx + 0.98 * s, cy + 0.74 * s, cx + 0.42 * s, cy + 0.84 * s, cx + 0.09 * s, cy + 0.46 * s);
  p.quadraticCurveTo(cx + 0.12 * s, cy + 0.86 * s, cx + 0.4 * s, cy + 1.0 * s);
  p.lineTo(cx - 0.4 * s, cy + 1.0 * s);
  p.quadraticCurveTo(cx - 0.12 * s, cy + 0.86 * s, cx - 0.09 * s, cy + 0.46 * s);
  p.bezierCurveTo(cx - 0.42 * s, cy + 0.84 * s, cx - 0.98 * s, cy + 0.74 * s, cx - 0.98 * s, cy + 0.28 * s);
  p.bezierCurveTo(cx - 0.98 * s, cy - 0.2 * s, cx - 0.08 * s, cy - 0.72 * s, cx, cy - s);
  p.closePath();
}

function buildTiles(): Tile[] {
  const ctx = document.createElement("canvas").getContext("2d")!;
  const big = new Path2D();
  spadePath(big, COLS / 2, ROWS / 2 - 0.5 * U, 13.5 * U);
  const small = new Path2D();
  spadePath(small, 6.5 * U, 17.4 * U, 2.6 * U);
  const letter = new Path2D();
  letter.moveTo(3.4 * U, 12.8 * U); letter.lineTo(6.5 * U, 3.4 * U); letter.lineTo(9.6 * U, 12.8 * U);
  letter.moveTo(4.6 * U, 9.6 * U); letter.lineTo(8.4 * U, 9.6 * U);
  ctx.lineWidth = 1.5 * U;
  ctx.lineJoin = "round";
  const inCorner = (c: number, r: number) => ctx.isPointInPath(small, c, r) || ctx.isPointInStroke(letter, c, r);
  const inMark = (c: number, r: number) => ctx.isPointInPath(big, c, r) || inCorner(c, r) || inCorner(COLS - c, ROWS - r);

  // crack lines from an impact point, in grid units
  const rand = rng(7);
  const impact = { c: 31 * U, r: 27 * U };
  const segs: number[][] = [];
  for (let i = 0; i < 9; i++) {
    let a = (i / 9) * Math.PI * 2 + rand() * 0.5;
    let c = impact.c, r = impact.r;
    const steps = 9 + Math.floor(rand() * 6);
    for (let k = 0; k < steps; k++) {
      a += (rand() - 0.5) * 0.9;
      const len = (3 + rand() * 5) * U;
      const c2 = c + Math.cos(a) * len, r2 = r + Math.sin(a) * len;
      segs.push([c, r, c2, r2]);
      if (rand() < 0.22) {
        const b = a + (rand() < 0.5 ? 1 : -1) * (0.6 + rand() * 0.6);
        segs.push([c2, r2, c2 + Math.cos(b) * 7 * U, r2 + Math.sin(b) * 7 * U]);
      }
      c = c2; r = r2;
    }
  }
  const dist = (c: number, r: number) => {
    let best = 1e9;
    for (const [x1, y1, x2, y2] of segs) {
      const dx = x2 - x1, dy = y2 - y1;
      const t = clamp(((c - x1) * dx + (r - y1) * dy) / (dx * dx + dy * dy));
      const d = Math.hypot(c - (x1 + t * dx), r - (y1 + t * dy));
      if (d < best) best = d;
    }
    return best;
  };

  const tiles: (Tile & { raw: number })[] = [];
  const R = 3.2 * U; // corner radius in tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = c + 0.5, cy = r + 0.5;
      const ex = Math.max(R - cx, cx - (COLS - R), 0), ey = Math.max(R - cy, cy - (ROWS - R), 0);
      if (Math.hypot(ex, ey) > R) continue;
      const dark = inMark(cx, cy);
      const ox = cx - impact.c, oy = cy - impact.r;
      const d = Math.hypot(ox, oy) || 1;
      const sp = 3 + rand() * 9;
      tiles.push({
        x: (cx - COLS / 2) * PITCH, y: (cy - ROWS / 2) * PITCH, dark,
        shade: 0.9 + rand() * 0.1,
        raw: dist(cx, cy) + rand() * 1.4 * U + d * 0.035,
        r: 0, stage: 0, frac: 0,
        vx: (ox / d) * sp + (rand() - 0.5) * 3, vy: (oy / d) * sp + (rand() - 0.5) * 3 - 2,
        vz: -(5 + rand() * 26), spin: (rand() - 0.5) * 0.5,
      });
    }
  }
  const order = [...tiles].sort((a, b) => a.raw - b.raw);
  order.forEach((t, i) => {
    t.r = i / order.length;
    for (let k = 1; k <= 5; k++) {
      if (t.r >= LOSS[k - 1] && t.r < LOSS[k]) {
        t.stage = k;
        t.frac = (t.r - LOSS[k - 1]) / (LOSS[k] - LOSS[k - 1]);
      }
    }
  });
  return tiles;
}

/** How many frames a tile has been flying at frame f (0 = in place). */
function flight(t: Tile, f: number): number {
  if (t.stage === 0) return 0;
  if (f < REWIND_END) {
    // the hook: everything five callers will ever take breaks at once, then winds back
    const out = Math.max(0, Math.min(f, HOOK_END) - (BLAST + (t.r / LOSS[5]) * 14));
    return f <= HOOK_END ? out : out * (1 - ease((f - HOOK_END) / (REWIND_END - HOOK_END - 4)));
  }
  const out = Math.max(0, f - (S[t.stage] + 1 + t.frac * 13));
  if (f < HEAL) return out;
  const back = FOLD[t.stage === 1 ? 2 : t.stage] + (1 - t.frac) * 10 + (t.stage === 1 ? 12 : 0);
  if (f < back) return out;
  return 56 * (1 - easeOut((f - back) / 20));
}

/** Close-ups on the break: [first frame, length, yaw]. "Takes a piece", then callers two and four. */
const CLOSE: [number, number, number][] = [[EVERY + 8, 40, 0.5], [S[2], 17, -0.5], [S[4], 17, 0.45]];

interface Cam { zoom: number; yaw: number; pitch: number; cx: number; cy: number; dim: number }

function camera(f: number): Cam {
  const hook: Cam = { zoom: 2.3, yaw: -0.36, pitch: 0.14, cx: 640, cy: 1760, dim: 1 };
  const home: Cam = { zoom: BIG, yaw: 0, pitch: 0, cx: HOME.x, cy: HOME.y, dim: 1 };
  const mix = (a: Cam, b: Cam, t: number): Cam => ({
    zoom: lerp(a.zoom, b.zoom, t), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t),
    cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), dim: lerp(a.dim, b.dim, t),
  });
  if (f < HOOK_END) return { ...hook, zoom: hook.zoom + f * 0.003 + Math.exp(-Math.max(0, f - BLAST) / 5) * (f >= BLAST ? 0.14 : 0), yaw: hook.yaw + f * 0.002 };
  if (f < REWIND_END) {
    const from = { ...hook, zoom: hook.zoom + HOOK_END * 0.003, yaw: hook.yaw + HOOK_END * 0.002 };
    return mix(from, home, ease((f - HOOK_END) / (REWIND_END - HOOK_END)));
  }
  if (f < PAYOFF) {
    // each caller lands as a punch-in that decays, over a slow orbit
    let punch = 0, shakeX = 0, shakeY = 0;
    for (let k = 1; k <= 5; k++) {
      const d = f - S[k];
      if (d >= 0 && d < 26) {
        const e = Math.exp(-d / 6);
        punch += (0.07 + k * 0.012) * e;
        shakeX += Math.sin(d * 2.9 + k) * 14 * e;
        shakeY += Math.cos(d * 3.7 + k) * 10 * e;
      }
    }
    const hold = ease((f - S[5] - 10) / 60);
    const wide: Cam = {
      zoom: BIG * (1 + punch + hold * 0.08), yaw: 0.2 * Math.sin((f - REWIND_END) / 26) + hold * 0.12,
      pitch: 0.08 * Math.sin((f - REWIND_END) / 19) + 0.04, cx: HOME.x + shakeX, cy: HOME.y + shakeY, dim: 1,
    };
    // callers two and four land in close-up, on the break itself
    for (const [at, len, yaw] of CLOSE) {
      const d = f - at;
      if (d >= 0 && d < len) {
        const z = 3.3 + d * 0.03;
        return { zoom: z, yaw, pitch: 0.3, cx: 540 - 73 * z * 0.8 + shakeX * 2 - d * yaw * 5, cy: 1180 + 96 * z + shakeY * 2 + d * 3, dim: 1 };
      }
    }
    return wide;
  }
  const away: Cam = { zoom: BIG * 0.9, yaw: -0.16, pitch: 0.1, cx: 540, cy: 1400, dim: 1 };
  if (f < HEAL) {
    const at = camera(PAYOFF - 1);
    const c = mix(at, away, easeOut((f - PAYOFF) / 14));
    const press = f >= PAYOFF2 ? Math.exp(-(f - PAYOFF2) / 7) : 0;
    return { ...c, zoom: c.zoom + (f - PAYOFF) * 0.0012 + press * 0.06, cx: c.cx + Math.sin(f * 2.7) * 12 * press, yaw: c.yaw + (f - PAYOFF) * 0.004 };
  }
  if (f < OUTRO) return mix(camera(HEAL - 1), home, ease((f - HEAL) / 34));
  return mix(home, hook, ease((f - OUTRO) / (END - OUTRO)));
}

function draw(ctx: CanvasRenderingContext2D, tiles: Tile[], f: number) {
  const cam = camera(f);
  ctx.clearRect(0, 0, W, H);
  const cyw = Math.cos(cam.yaw), syw = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const project = (x: number, y: number, z: number) => {
    const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
    const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const s = (FOCAL / (FOCAL + z2)) * cam.zoom;
    return [cam.cx + x1 * s, cam.cy + y1 * s, s] as const;
  };
  // the wound: what shows where a tile is gone (so a hole never reads as the spade)
  ctx.globalAlpha = cam.dim;
  ctx.fillStyle = "#35160f";
  ctx.beginPath();
  const hw = CARD_W / 2 - 3, hh = CARD_H / 2 - 3, rad = 3.2 * U * PITCH;
  const pts: number[][] = [];
  for (const [ox, oy, a0] of [[hw - rad, -hh + rad, -Math.PI / 2], [hw - rad, hh - rad, 0], [-hw + rad, hh - rad, Math.PI / 2], [-hw + rad, -hh + rad, Math.PI]] as const)
    for (let i = 0; i <= 6; i++) pts.push([ox + Math.cos(a0 + (i / 6) * Math.PI / 2) * rad, oy + Math.sin(a0 + (i / 6) * Math.PI / 2) * rad]);
  pts.forEach(([x, y], i) => { const q = project(x, y, 0); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
  ctx.fill();
  const half = PITCH * 0.43;
  const flying: [Tile, number][] = [];
  ctx.globalAlpha = cam.dim;
  for (const t of tiles) {
    const p = flight(t, f);
    if (p > 0) { flying.push([t, p]); continue; }
    const a = project(t.x - half, t.y - half, 0), b = project(t.x + half, t.y - half, 0);
    const c = project(t.x + half, t.y + half, 0), d = project(t.x - half, t.y + half, 0);
    const v = Math.round(t.shade * 255);
    ctx.fillStyle = t.dark ? "#1c1b1d" : `rgb(${Math.round(v * 0.925)},${Math.round(v * 0.906)},${Math.round(v * 0.863)})`;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
    ctx.fill();
  }
  for (const [t, p] of flying) {
    const alpha = clamp(1 - (p - 34) / 22);
    if (alpha <= 0) continue;
    const [sx, sy, s] = project(t.x + t.vx * p, t.y + t.vy * p + 0.16 * p * p, t.vz * p);
    if (s <= 0 || s > 9) continue;
    const m = clamp(p / 3);
    const base = t.dark ? [28, 27, 29] : [236 * t.shade, 231 * t.shade, 220 * t.shade];
    const red = t.dark ? [120, 46, 32] : [214, 92, 64];
    ctx.globalAlpha = alpha * cam.dim;
    ctx.fillStyle = `rgb(${Math.round(lerp(base[0], red[0], m))},${Math.round(lerp(base[1], red[1], m))},${Math.round(lerp(base[2], red[2], m))})`;
    const size = PITCH * 0.86 * s;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t.spin * p);
    ctx.fillRect(-size / 2, -size / 2, size, size * (0.55 + 0.45 * Math.abs(Math.cos(t.spin * p * 2.2))));
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---- type and the callers ----

const caps: React.CSSProperties = { fontFamily: SANS, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" };
const em = (color: string): React.CSSProperties => ({ fontStyle: "italic", fontWeight: 400, color });

function pctAt(f: number): { value: number; callers: number } {
  let callers = 0;
  for (let k = 1; k <= 5; k++) if (f >= S[k]) callers = k;
  for (let k = 5; k >= 2; k--) if (f >= FOLD[k]) callers = k - 1;
  const healing = f >= HEAL && callers < 5;
  const since = healing ? f - FOLD[callers + 1] : f - S[callers];
  const prev = healing ? PCT[callers] : callers > 1 ? PCT[callers - 2] : 100;
  const now = callers ? PCT[callers - 1] : 100;
  return { value: Math.round(lerp(prev, now, easeOut(since / 9))), callers };
}

/** Where each caller's two cards come from and where they land, pressing on the ace. */
const SEAT = [
  null,
  { x: 118, y: 900, rot: -13, fx: -460, fy: -120 },
  { x: 958, y: 985, rot: 11, fx: 460, fy: -160 },
  { x: 112, y: 1370, rot: 9, fx: -470, fy: 140 },
  { x: 962, y: 1455, rot: -10, fx: 470, fy: 160 },
  { x: 500, y: 1790, rot: 4, fx: 0, fy: 520 },
];

function Caller({ k, f }: { k: number; f: number }) {
  const seat = SEAT[k]!;
  const inAt = f - S[k];
  if (inAt < 0) return null;
  const out = k >= 2 ? (f >= FOLD[k] ? f - FOLD[k] : -1) : f >= OUTRO ? f - OUTRO : -1;
  if (out > 14) return null;
  // slam in past the mark, settle; lean on the ace while the table is "crowded"; leave on the fold
  const arrive = interpolate(inAt, [0, 6, 11], [1, -0.07, 0], { extrapolateRight: "clamp" });
  const squeeze = f >= PAYOFF2 && f < HEAL ? 0.1 * easeOut((f - PAYOFF2) / 8) + 0.015 * Math.sin(f * 0.9) : 0;
  const leave = out >= 0 ? ease(out / 14) : 0;
  const x = seat.x + seat.fx * (arrive + leave * 1.2) + (540 - seat.x) * squeeze;
  const y = seat.y + seat.fy * (arrive + leave * 1.2) + (HOME.y - seat.y) * squeeze;
  const w = 206, h = 290;
  const back: React.CSSProperties = {
    position: "absolute", width: w, height: h, borderRadius: 14, boxSizing: "border-box",
    background: `repeating-linear-gradient(45deg, ${C.ink2} 0 9px, #1b1b1e 9px 10px), ${C.ink2}`,
    border: `3px solid ${C.paper}`, outline: `7px solid ${C.ink}`,
  };
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${seat.rot + leave * 40 * Math.sign(seat.fx || 1)}deg) scale(${1 + clamp(1 - inAt / 5) * 0.5})`, opacity: 1 - leave }}>
      <div style={{ ...back, transform: "translate(-26px, 8px) rotate(-8deg)" }} />
      <div style={{ ...back, transform: "translate(26px, -4px) rotate(7deg)" }} />
    </div>
  );
}

function Headline({ f, from, to, children, size = 128, top = 320 }: { f: number; from: number; to: number; children: React.ReactNode; size?: number; top?: number }) {
  if (f < from || f >= to) return null;
  const inn = easeOut((f - from) / 7);
  return (
    <div style={{ position: "absolute", left: 70, right: 110, top, fontFamily: SERIF, fontWeight: 500, fontSize: size, lineHeight: 0.98, letterSpacing: "-0.02em", color: C.paper, opacity: clamp((to - f) / 3), transform: `translateY(${(1 - inn) * 46}px) scale(${lerp(1.06, 1, inn)})`, transformOrigin: "left top" }}>
      {children}
    </div>
  );
}

export function AcesCrowd() {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const tiles = useMemo(buildTiles, []);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) draw(ctx, tiles, f);
  }, [f, tiles]);

  const { value, callers } = pctAt(f);
  const flash = f >= FLASH && f < FLASH + 5;
  const showStat = (f >= S[1] - 4 && f < PAYOFF) || (f >= HEAL && f < END - 16);
  const statIn = f < PAYOFF ? easeOut((f - (S[1] - 4)) / 8) : easeOut((f - HEAL) / 10) * clamp((END - 16 - f) / 8);
  const bump = Math.max(0, ...[1, 2, 3, 4, 5].map((k) => (f >= S[k] && f < S[k] + 10 ? 1 - (f - S[k]) / 10 : 0)));
  const under = value < 50;
  const log = f >= S[1] && f < PAYOFF && !flash;
  const dealt = Math.floor(interpolate(f, [S[1], PAYOFF], [1, data.iterations], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t * t }));
  const line = f >= HEAL + 2 ? "raise" : f >= UNDERDOG ? "underdog" : f >= FIVE ? "five" : f >= EVERY ? "every" : "";

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />
      {[1, 2, 3, 4, 5].map((k) => <Caller key={k} k={k} f={f} />)}
      {/* in the close-ups the card runs under the stat: give the numbers their own ground */}
      {CLOSE.some(([at, len]) => f >= at && f < at + len) && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 672, background: C.ink, borderBottom: `2px solid ${C.ruleStrong}` }} />}

      {/* the hook */}
      <Headline f={f} from={1} to={HOOK_END + 2} size={132} top={296}>
        <span style={{ whiteSpace: "nowrap" }}>Aces <span style={{ opacity: f >= BLAST ? 1 : 0 }}>cracked.</span></span>
        <div style={{ ...em(C.paper), fontSize: 132, marginTop: 2, opacity: clamp((f - AGAIN) / 3) }}>Again.</div>
      </Headline>
      <Headline f={f} from={HOOK_END + 4} to={S[1] - 6} size={150} top={300}>
        It isn’t<br /><span style={em(C.sage)}>bad luck.</span>
      </Headline>

      {/* the stat */}
      {showStat && (
        <div style={{ position: "absolute", left: 70, right: 110, top: 292, opacity: statIn }}>
          <div style={{ ...caps, fontSize: 26, color: C.text2 }}>Aces win · if all stay to the river</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: -8 }}>
            <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 250, lineHeight: 1, letterSpacing: "-0.03em", color: under ? C.vermilion : C.paper, transform: `scale(${1 + bump * 0.16})`, transformOrigin: "left bottom" }}>
              {value}<span style={{ fontSize: 128 }}>%</span>
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 70, color: C.text2 }}>
              vs {callers} {callers === 1 ? "player" : "players"}
            </div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1, marginTop: 6, color: C.paper, height: 70 }}>
            {line === "every" && <span style={{ opacity: easeOut((f - EVERY) / 6), color: C.text2 }}>Every caller takes <span style={em(C.vermilion)}>a piece.</span></span>}
            {line === "five" && <span style={{ opacity: easeOut((f - FIVE) / 5) }}>Five callers?</span>}
            {line === "underdog" && <span style={{ opacity: easeOut((f - UNDERDOG) / 6) }}>Now you’re the <span style={em(C.vermilion)}>underdog.</span></span>}
            {line === "raise" && <span style={{ opacity: easeOut((f - HEAL - 2) / 6) }}>So raise. <span style={em(C.sage)}>Thin the crowd.</span></span>}
          </div>
        </div>
      )}

      {/* the turn: one paper frame, then the two lines that pay it off */}
      {flash && (
        <AbsoluteFill style={{ background: C.paper, justifyContent: "center", paddingLeft: 70 }}>
          <div style={{ ...caps, fontSize: 30, color: C.ink }}>Five callers</div>
          <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 520, lineHeight: 0.9, letterSpacing: "-0.04em", color: C.ink }}>49<span style={{ fontSize: 260 }}>%</span></div>
        </AbsoluteFill>
      )}
      <Headline f={f} from={PAYOFF} to={PAYOFF2} size={152} top={300}>
        Your aces aren’t <span style={em(C.vermilion)}>cursed.</span>
      </Headline>
      <Headline f={f} from={PAYOFF2} to={HEAL} size={152} top={300}>
        Your table is <span style={em(C.brass)}>crowded.</span>
      </Headline>

      {/* the deals, as they run */}
      {log && (
        <div style={{ position: "absolute", left: 74, top: 232, fontFamily: MONO, fontSize: 22, lineHeight: 1.5, color: C.text3, opacity: 0.8, whiteSpace: "pre" }}>
          {[2].map((i) => {
            const h = data.hands[(Math.floor(f / 2) + i) % data.hands.length];
            return (
              <div key={i} style={{ opacity: 0.4 + i * 0.3 }}>
                {String(Math.max(1, dealt - (2 - i) * 7)).padStart(7, " ")}  {h.board}  <span style={{ color: h.won ? C.sage : C.vermilion }}>{h.won ? "aces hold" : h.made.toLowerCase()}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* sound: a first layer, to be redone once the motion is final */}
      <Audio src={staticFile("vo/aces-crowd/vo.wav")} volume={1} />
      <Audio src={staticFile("music/bed.wav")} volume={0.16} />
      <Sequence from={BLAST}><Audio src={staticFile("sfx/boom.wav")} volume={0.6} /></Sequence>
      <Sequence from={HOOK_END}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} /></Sequence>
      {[1, 2, 3, 4, 5].map((k) => (
        <Sequence key={k} from={S[k]}><Audio src={staticFile("sfx/stamp.wav")} volume={0.3 + k * 0.05} /></Sequence>
      ))}
      <Sequence from={FLASH}><Audio src={staticFile("sfx/boom.wav")} volume={0.5} /></Sequence>
      <Sequence from={PAYOFF}><Audio src={staticFile("sfx/reveal.wav")} volume={0.35} /></Sequence>
      {[5, 4, 3, 2].map((k) => (
        <Sequence key={k} from={FOLD[k]}><Audio src={staticFile("sfx/fold.wav")} volume={0.4} /></Sequence>
      ))}
      <Sequence from={OUTRO}><Audio src={staticFile("sfx/riser.wav")} volume={0.25} /></Sequence>
    </AbsoluteFill>
  );
}
