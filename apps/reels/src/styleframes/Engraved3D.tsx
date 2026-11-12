/**
 * Style frame 1 (research round 4): the hook's aces as real 3D objects rendered as copperplate
 * engraving. Every surface is drawn with cream lines on near-black whose weight follows the light
 * (bright = dense, crossed lines; shadow = sparse or none), so the camera can move around the cards
 * and the shading stays engraved. Card faces keep exact, crisp type (a canvas texture), because the
 * teaching layer must always read.
 */

import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { C, SERIF } from "../theme";

/* ---------- the engraving material ---------- */

const VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vW; varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

// mode 0: straight lines in the surface's world plane (card edges, backs)
// mode 1: concentric rings around the table centre (an engraved round table)
const FRAG = /* glsl */ `
  uniform vec3 ink; uniform vec3 paper; uniform vec3 lightPos; uniform vec3 spotDir;
  uniform float freq; uniform float angle; uniform int mode; uniform float gain;
  uniform vec4 shadowA; uniform vec4 shadowB; // card footprints: centre xz, half size xz
  varying vec3 vN; varying vec3 vW; varying vec2 vUv;

  float stripe(float x, float w) {
    float d = abs(fract(x) - 0.5) * 2.0;           // 0 at the line centre, 1 between lines
    float aa = fwidth(x) * 2.0;
    return 1.0 - smoothstep(w - aa, w + aa, d);
  }
  float inRect(vec2 p, vec4 r) {
    vec2 q = abs(p - r.xy) - r.zw;
    return 1.0 - smoothstep(0.0, 0.18, max(q.x, q.y));
  }
  void main() {
    vec3 L = normalize(lightPos - vW);
    float lambert = max(dot(normalize(vN), L), 0.0);
    float spot = smoothstep(0.955, 0.993, dot(-L, normalize(spotDir)));
    float t = clamp(lambert * (0.04 + 0.96 * spot) * gain, 0.0, 1.0);
    // contact shadows under the cards
    t *= 1.0 - 0.85 * max(inRect(vW.xz, shadowA), inRect(vW.xz, shadowB));

    vec2 p = vW.xz + vW.y * 0.7;
    float a = angle;
    float base = mode == 1 ? length(vW.xz) : dot(p, vec2(cos(a), sin(a)));
    // line weight follows the light: a hairline in the half-light, crossed lines under the lamp
    float l1 = stripe(base * freq, t * 0.42);
    float l2 = stripe(dot(p, vec2(cos(a + 1.1), sin(a + 1.1))) * freq * 1.15, max(t - 0.55, 0.0) * 0.7);
    float l3 = stripe(dot(p, vec2(cos(a - 0.7), sin(a - 0.7))) * freq * 1.4, max(t - 0.85, 0.0) * 1.2);
    float line = max(l1, max(l2, l3));
    // where lines get finer than a pixel (far away), let them sink into the black, no moire
    float tooFine = clamp(fwidth(base * freq) * 1.6 - 0.4, 0.0, 1.0);
    line *= 1.0 - tooFine;
    gl_FragColor = vec4(mix(ink, paper, line * 0.9), 1.0);
  }
`;

function engraving(opts: { freq: number; angle?: number; mode?: 0 | 1; gain?: number }) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    extensions: { derivatives: true } as never,
    uniforms: {
      ink: { value: new THREE.Color(C.ink) },
      paper: { value: new THREE.Color(C.paper) },
      lightPos: { value: new THREE.Vector3(1.2, 6.5, 2.0) },
      spotDir: { value: new THREE.Vector3(-1.2, -6.5, -2.4) },
      freq: { value: opts.freq },
      angle: { value: opts.angle ?? 0.6 },
      mode: { value: opts.mode ?? 0 },
      gain: { value: opts.gain ?? 1.25 },
      shadowA: { value: new THREE.Vector4(0, 0, 0, 0) },
      shadowB: { value: new THREE.Vector4(0, 0, 0, 0) },
    },
  });
}

/* ---------- card faces: exact type on cream, drawn once ---------- */

function cardFace(rank: string, glyph: string, red: boolean) {
  const cv = document.createElement("canvas");
  cv.width = 500;
  cv.height = 700;
  const g = cv.getContext("2d")!;
  g.fillStyle = C.paper;
  g.beginPath();
  g.roundRect(0, 0, 500, 700, 36);
  g.fill();
  g.fillStyle = red ? C.vermilion : C.ink;
  g.font = `400 150px ${SERIF}`;
  g.textBaseline = "top";
  g.fillText(rank, 46, 40);
  g.font = `400 300px ${SERIF}`;
  g.textBaseline = "alphabetic";
  g.textAlign = "right";
  g.fillText(glyph, 460, 660);
  // a fine engraved border
  g.strokeStyle = red ? C.vermilion : C.ink;
  g.globalAlpha = 0.35;
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(22, 22, 456, 656, 24);
  g.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const ease = {
  inQuad: (x: number) => Math.min(1, Math.max(0, x)) ** 2,
  outExpo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, x))),
  inOut: (x: number) => {
    const t = Math.min(1, Math.max(0, x));
    return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
};

const CW = 1.25; // card width (world units); height 1.75

function Card({ face, edge, frame, start, x, rz }: { face: THREE.Texture; edge: THREE.Material; frame: number; start: number; x: number; rz: number }) {
  const f = frame - start;
  const fall = ease.inQuad(f / 7); // accelerating drop, lands on frame 7
  const bounce = f >= 7 && f < 12 ? Math.sin(((f - 7) / 5) * Math.PI) * 0.05 : 0;
  const y = f < 0 ? 6 : 5.5 * (1 - fall) + 0.012 + bounce;
  const tilt = f < 7 ? (1 - fall) * 0.9 : 0;
  const mats = useMemo(() => {
    const top = new THREE.MeshBasicMaterial({ map: face });
    return [edge, edge, top, edge, edge, edge];
  }, [face, edge]);
  if (f < 0) return null;
  return (
    <mesh position={[x, y, 0]} rotation={[-tilt * 0.6, rz + (1 - fall) * 0.5, tilt * (x > 0 ? -0.4 : 0.4)]} material={mats}>
      <boxGeometry args={[CW, 0.024, CW * 1.4]} />
    </mesh>
  );
}

function Scene({ frame, slamAt, costAt }: { frame: number; slamAt: number; costAt: number }) {
  const faces = useMemo(() => [cardFace("A", "♠", false), cardFace("A", "♥", true)], []);
  const table = useMemo(() => engraving({ freq: 30, mode: 1, gain: 1.2 }), []);
  const edge = useMemo(() => engraving({ freq: 90, angle: 1.2, gain: 1.4 }), []);
  const cards = [
    { x: -0.72, rz: 0.1, start: slamAt },
    { x: 0.72, rz: -0.08, start: slamAt + 4 },
  ];
  // contact shadows appear as each card lands
  const sh = (i: number) => {
    const c = cards[i];
    const on = frame - c.start >= 5 ? 1 : 0;
    // a card not yet landed casts nothing: park its footprint far off the table
    return on ? new THREE.Vector4(c.x, 0, CW / 2, CW * 0.7) : new THREE.Vector4(100, 100, 0, 0);
  };
  table.uniforms.shadowA.value = sh(0);
  table.uniforms.shadowB.value = sh(1);

  // Camera: a low, close start that settles as the cards land, a slow orbit, then a rise to look
  // down on the cards as the cost stamps (the cards sit above the DOM "-10 bb").
  const settle = ease.outExpo((frame - slamAt) / 30);
  const rise = ease.inOut((frame - costAt + 6) / 26);
  const orbit = -0.32 + 0.0016 * frame;
  const dist = 12.5 - 1.4 * settle + 0.8 * rise;
  const height = 3.6 + 0.6 * settle + 2.0 * rise;
  const shake = frame >= costAt && frame < costAt + 8 ? Math.sin(frame * 5.1) * 0.03 * (1 - (frame - costAt) / 8) : 0;
  const cam = new THREE.Vector3(Math.sin(orbit) * dist + shake, height, Math.cos(orbit) * dist);
  return (
    <>
      <CameraRig position={cam} target={[0, 0, -0.2 - 0.35 * rise]} shiftY={0.105 + 0.045 * rise} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={table}>
        <circleGeometry args={[16, 192]} />
      </mesh>
      {cards.map((c, i) => (
        <Card key={i} face={faces[i]} edge={edge} frame={frame} start={c.start} x={c.x} rz={c.rz} />
      ))}
    </>
  );
}

function CameraRig({ position, target, shiftY }: { position: THREE.Vector3; target: [number, number, number]; shiftY: number }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = 30;
  cam.position.copy(position);
  cam.lookAt(...target);
  // shift the image up so the cards sit where the 2D cards did (screen y ~ 650-900), above the cost
  cam.setViewOffset(size.width, size.height, 0, size.height * shiftY, size.width, size.height);
  cam.updateProjectionMatrix();
  return null;
}

export function Engraved3D({ slamAt = 0, costAt = 80 }: { slamAt?: number; costAt?: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // the card faces need Bodoni loaded before the canvas texture is drawn
  const [handle] = useState(() => delayRender("fonts for the card faces"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
  return (
    <ThreeCanvas width={width} height={height} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }} camera={{ fov: 30, position: [0, 2, 5] }}>
      <color attach="background" args={[C.ink]} />
      <Scene frame={frame} slamAt={slamAt} costAt={costAt} />
    </ThreeCanvas>
  );
}
