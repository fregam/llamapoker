// Renders scripts/og-image.html to public/og.png (1200×630 link-preview image) with
// headless Chrome. Run by hand after editing the HTML: `node scripts/og-image.mjs`.
// Not part of `npm run build`; the PNG is committed. Set CHROME to override the path.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const candidates = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) throw new Error("Chrome not found; set CHROME=/path/to/chrome");

const out = resolve("public/og.png");
execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  "--virtual-time-budget=5000",
  `--screenshot=${out}`,
  pathToFileURL(resolve("scripts/og-image.html")).href,
]);
console.log("wrote", out);
