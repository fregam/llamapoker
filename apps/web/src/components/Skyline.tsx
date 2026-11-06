/**
 * <CityBackdrop> — the decorative fixed background: Manhattan at night, seen softly out of
 * focus through a loft window. Painted once onto a <canvas> (and again on resize) — no
 * animation, so it costs nothing while the app is in use.
 * How it reads as a photograph rather than a game:
 *   - three depth layers, each blurred differently (far = hazy, near = out of focus)
 *   - atmospheric haze over the far layer, light pollution glowing on the horizon
 *   - window lights in mixed colour temperatures (tungsten / sodium / LED), lit floor by
 *     floor, drawn soft rather than as crisp squares
 *   - rooftop details (setbacks, water towers, antennas), two landmark towers with
 *     floodlit crowns and red aviation lights
 *   - soft bokeh discs in the foreground and a vignette
 * Seeded RNG, so the city is the same every time. Purely visual and aria-hidden; the CSS
 * (.backdrop / .skyline-canvas) dims it and fades it out towards the top.
 * Used by: App.tsx.
 */

import { memo, useEffect, useRef } from "react";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Window light colours: warm tungsten, orange sodium, cool LED.
const LIGHTS: [number, string][] = [
  [0.55, "255, 214, 160"],
  [0.25, "255, 170, 105"],
  [0.2, "205, 225, 255"],
];
function lightColour(r: () => number): string {
  let x = r();
  for (const [w, c] of LIGHTS) {
    if ((x -= w) <= 0) return c;
  }
  return LIGHTS[0][1];
}

interface LayerSpec {
  minW: number;
  maxW: number;
  minH: number; // as a fraction of the viewport height
  maxH: number;
  colour: string;
  lit: number; // share of windows lit
  alpha: [number, number];
  win: [number, number]; // window width, height (px)
  gap: [number, number]; // window spacing x, y (px)
  blur: number;
  roofs: boolean;
}

type Ctx = CanvasRenderingContext2D;

function drawBuilding(c: Ctx, r: () => number, x: number, top: number, w: number, base: number, s: LayerSpec, scale: number) {
  c.fillStyle = s.colour;
  c.fillRect(x, top, w, base - top);

  // Setback crown on some towers.
  if (w > 30 * scale && r() < 0.35) {
    const sw = w * (0.45 + r() * 0.3);
    const sh = (8 + r() * 26) * scale;
    c.fillRect(x + (w - sw) / 2, top - sh, sw, sh);
    if (r() < 0.4) c.fillRect(x + w / 2 - 0.75, top - sh - 22 * scale, 1.5, 22 * scale); // antenna
  }
  // Water tower on some low roofs.
  if (s.roofs && r() < 0.28 && w > 40 * scale) {
    const tx = x + w * (0.2 + r() * 0.5);
    const tw = 10 * scale;
    c.fillRect(tx, top - 13 * scale, tw, 9 * scale);
    c.beginPath();
    c.moveTo(tx - 1, top - 13 * scale);
    c.lineTo(tx + tw / 2, top - 18 * scale);
    c.lineTo(tx + tw + 1, top - 13 * scale);
    c.fill();
    c.fillRect(tx + 1, top - 4 * scale, 1, 4 * scale);
    c.fillRect(tx + tw - 2, top - 4 * scale, 1, 4 * scale);
  }

  // Windows, lit floor by floor: each building has its own occupancy, each floor varies.
  const occupancy = s.lit * (0.35 + r() * 1.3);
  const [ww, wh] = s.win;
  const [gx, gy] = s.gap;
  const tint = lightColour(r);
  for (let y = top + gy; y < base - wh; y += gy) {
    const floor = occupancy * (r() < 0.18 ? 2.6 : r() < 0.4 ? 0.2 : 1);
    for (let wx = x + gx * 0.6; wx < x + w - ww - 1; wx += gx) {
      if (r() >= floor) continue;
      const a = s.alpha[0] + r() * (s.alpha[1] - s.alpha[0]);
      c.fillStyle = `rgba(${r() < 0.75 ? tint : lightColour(r)}, ${a})`;
      c.fillRect(wx, y, ww, wh);
    }
  }
}

function drawLayer(c: Ctx, r: () => number, W: number, H: number, s: LayerSpec, scale: number) {
  let x = -20;
  while (x < W + 20) {
    const w = (s.minW + r() * (s.maxW - s.minW)) * scale;
    const h = H * (s.minH + Math.pow(r(), 1.7) * (s.maxH - s.minH));
    drawBuilding(c, r, x, H - h, w, H, s, scale);
    x += w + (r() < 0.25 ? r() * 8 * scale : 0);
  }
}

/** A stepped tower with a floodlit crown, a spire and a red aviation light. */
function drawLandmark(c: Ctx, cx: number, H: number, base: number, tiers: [number, number][], colour: string, scale: number) {
  let y = H - base * H;
  c.fillStyle = colour;
  c.fillRect(cx - (tiers[0][0] * scale) / 2, y, tiers[0][0] * scale, H - y);
  for (const [w, h] of tiers) {
    y -= h * scale;
    c.fillStyle = colour;
    c.fillRect(cx - (w * scale) / 2, y, w * scale, h * scale);
  }
  // A soft floodlit halo around the crown (not a lit block — that reads as a game asset).
  const crownTop = y;
  const hx = cx;
  const hy = crownTop + 14 * scale;
  const halo = c.createRadialGradient(hx, hy, 0, hx, hy, 46 * scale);
  halo.addColorStop(0, "rgba(255, 214, 160, 0.08)");
  halo.addColorStop(1, "rgba(255, 214, 160, 0)");
  c.fillStyle = halo;
  c.fillRect(hx - 46 * scale, hy - 46 * scale, 92 * scale, 92 * scale);
  // Spire + aviation light.
  c.fillStyle = colour;
  c.fillRect(cx - 1, crownTop - 44 * scale, 2, 44 * scale);
  c.fillStyle = "rgba(255, 70, 50, 0.9)";
  c.beginPath();
  c.arc(cx, crownTop - 44 * scale, 2.2 * scale, 0, Math.PI * 2);
  c.fill();
}

function paint(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.max(0.75, Math.min(1.35, W / 1440));
  const r = rng(1977);

  // Sky, with light pollution rising off the horizon.
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#040508");
  sky.addColorStop(0.5, "#07080d");
  sky.addColorStop(0.82, "#0d0c0e");
  sky.addColorStop(1, "#121011");
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W * 0.55, H * 1.05, 0, W * 0.55, H * 1.05, W * 0.75);
  glow.addColorStop(0, "rgba(255, 170, 110, 0.05)");
  glow.addColorStop(0.5, "rgba(255, 160, 100, 0.015)");
  glow.addColorStop(1, "rgba(255, 130, 70, 0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);

  // Each layer is drawn on its own canvas, then composited with its own blur.
  const off = document.createElement("canvas");
  off.width = canvas.width;
  off.height = canvas.height;
  const o = off.getContext("2d")!;
  const composite = (blur: number) => {
    c.filter = blur > 0 ? `blur(${blur}px)` : "none";
    c.drawImage(off, 0, 0, W, H);
    c.filter = "none";
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, off.width, off.height);
    o.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  o.setTransform(dpr, 0, 0, dpr, 0, 0);

  const far: LayerSpec = { minW: 14, maxW: 46, minH: 0.1, maxH: 0.33, colour: "#15151d", lit: 0.16, alpha: [0.12, 0.4], win: [1.6, 2.2], gap: [4, 5.5], blur: 1.6, roofs: false };
  const mid: LayerSpec = { minW: 26, maxW: 84, minH: 0.08, maxH: 0.36, colour: "#0c0c12", lit: 0.2, alpha: [0.25, 0.85], win: [2.4, 3.4], gap: [6, 8], blur: 1, roofs: true };
  const near: LayerSpec = { minW: 70, maxW: 170, minH: 0.05, maxH: 0.2, colour: "#050506", lit: 0.12, alpha: [0.35, 0.95], win: [5, 7], gap: [13, 16], blur: 4.5, roofs: true };

  drawLayer(o, r, W, H, far, scale);
  composite(far.blur);
  // Haze between the far and middle distance.
  const haze = c.createLinearGradient(0, H * 0.45, 0, H);
  haze.addColorStop(0, "rgba(30, 30, 34, 0)");
  haze.addColorStop(1, "rgba(34, 33, 36, 0.18)");
  c.fillStyle = haze;
  c.fillRect(0, 0, W, H);

  drawLandmark(o, W * 0.74, H, 0.32, [[58, 34], [44, 30], [30, 28], [18, 22], [10, 16]], mid.colour, scale);
  drawLandmark(o, W * 0.27, H, 0.29, [[46, 30], [32, 26], [20, 30], [10, 26]], mid.colour, scale);
  drawLayer(o, r, W, H, mid, scale);
  composite(mid.blur);

  drawLayer(o, r, W, H, near, scale);
  composite(near.blur);

  // Out-of-focus lights in the foreground (bokeh).
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 46; i++) {
    const bx = r() * W;
    const by = H * (0.58 + r() * 0.42);
    const br = (5 + Math.pow(r(), 2) * 26) * scale;
    const a = 0.02 + r() * 0.05;
    const col = lightColour(r);
    const g = c.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, `rgba(${col}, ${a * 0.7})`);
    g.addColorStop(0.75, `rgba(${col}, ${a})`);
    g.addColorStop(1, `rgba(${col}, 0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(bx, by, br, 0, Math.PI * 2);
    c.fill();
  }
  c.globalCompositeOperation = "source-over";

  // Vignette.
  const v = c.createRadialGradient(W / 2, H * 0.6, Math.min(W, H) * 0.3, W / 2, H * 0.6, Math.max(W, H) * 0.85);
  v.addColorStop(0, "rgba(0, 0, 0, 0)");
  v.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
}

/** The whole backdrop: the city at night, painted once per viewport size. */
export const CityBackdrop = memo(function CityBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    paint(canvas);
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => paint(canvas), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, []);
  return (
    <div className="backdrop" aria-hidden="true">
      <canvas ref={ref} className="skyline-canvas" />
    </div>
  );
});
