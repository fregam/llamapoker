#!/usr/bin/env node
// Find the figures on a character sheet and build a 4-view input for Pixal3D multi-view.
//
//   node scripts/split-sheet.mjs <sheet.png>                         print the detected figure columns
//   node scripts/split-sheet.mjs <sheet.png> <out.png> f,l,b,r       compose panels (1-based figure indices)
//
// Pixal3D panel order is front, left, back, right, where "left" faces screen-right and "right"
// faces screen-left (checked against the template's example sheet). Each panel is the figure's
// column range plus padding, centred on a canvas of equal width; the result is 4 equal panels.
import sharp from "../apps/web/node_modules/sharp/lib/index.js";

const [src, out, order] = process.argv.slice(2);
const img = sharp(src);
const { width, height } = await img.metadata();
// Median filter removes paper speckle so it doesn't read as figure.
const { data, info } = await sharp(src).removeAlpha().median(9).raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

// Background = median of the four corner pixels; a column is "figure" if enough pixels differ.
const px = (x, y) => { const i = (y * width + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
const corners = [px(2, 2), px(width - 3, 2), px(2, height - 3), px(width - 3, height - 3)];
const bg = [0, 1, 2].map((c) => corners.map((p) => p[c]).sort((a, b) => a - b)[1]);
const isFig = (p) => Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > 60;
const yTop = Math.floor(height * 0.02), yBot = Math.floor(height * 0.9); // skip ground shadows
const cols = Array.from({ length: width }, (_, x) => {
  let n = 0;
  for (let y = yTop; y < yBot; y += 2) if (isFig(px(x, y))) n++;
  return n;
});
const minPix = (yBot - yTop) / 2 * 0.004;
const runs = [];
let start = -1;
cols.forEach((n, x) => {
  if (n > minPix && start < 0) start = x;
  if ((n <= minPix || x === width - 1) && start >= 0) { runs.push([start, x]); start = -1; }
});
// Merge runs separated by small gaps (an arm or tail detached from the body).
const merged = [];
for (const r of runs) {
  const last = merged.at(-1);
  if (last && r[0] - last[1] < width * 0.012) last[1] = r[1]; else merged.push([...r]);
}
const figures = merged.filter(([a, b]) => b - a > width * 0.03);
console.log(`sheet ${width}x${height}, background rgb(${bg.join(",")}), ${figures.length} figures:`);
figures.forEach(([a, b], i) => console.log(`  ${i + 1}: x ${a}-${b} (width ${b - a})`));

if (out) {
  const idx = order.split(",").map((s) => Number(s) - 1);
  const pad = Math.round(width * 0.01);
  const panelW = Math.max(...idx.map((i) => figures[i][1] - figures[i][0])) + 2 * pad;
  const panels = await Promise.all(idx.map(async (i) => {
    const [a, b] = figures[i];
    const left = Math.max(0, a - pad), w = Math.min(width, b + pad) - left;
    return { input: await sharp(src).extract({ left, top: 0, width: w, height }).toBuffer(), w };
  }));
  await sharp({ create: { width: panelW * 4, height, channels: 3, background: { r: bg[0], g: bg[1], b: bg[2] } } })
    .composite(panels.map((p, k) => ({ input: p.input, left: k * panelW + Math.floor((panelW - p.w) / 2), top: 0 })))
    .png().toFile(out);
  console.log(`wrote ${out}: 4 panels of ${panelW}x${height} (crop x = 0, ${panelW}, ${2 * panelW}, ${3 * panelW})`);
}
