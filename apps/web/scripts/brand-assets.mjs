// Builds every derived brand image from the sources in ../../brand. Run by hand after the
// brand art or a template changes:   node scripts/brand-assets.mjs   (from apps/web)
// Outputs are committed; this is not part of `npm run build`.
//
//   brand/.build/            art with its blacks lifted to --ink (#0a0a0b), used by templates (git-ignored)
//   public/brand/            web images for the site (gentleman-*.webp, llama-icon.svg)
//   public/favicon.svg, favicon-32.png, apple-touch-icon.png
//   public/og.png            link-preview card        ← brand/templates/og.html
//   brand/social/            avatar.png (the Read), x-banner.png, youtube-banner.png, newsletter-header.png
//
// Templates are rendered with headless Chrome (fonts load from Google Fonts); set CHROME to
// override its path. Images are processed with sharp.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const BRAND = resolve("../../brand");
const PUB = resolve("public");
const BUILD = resolve(BRAND, ".build");
const SOCIAL = resolve(BRAND, "social");
for (const d of [BUILD, SOCIAL, resolve(PUB, "brand")]) mkdirSync(d, { recursive: true });

// The generated art's background is about #050507; lift it to the brand ink (#0a0a0b) while
// keeping the cream highlights where they are, so the art sits on pages with no visible box.
const lift = (img) => img.linear(0.978, 5.2);

const chrome = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean).find((p) => existsSync(p));

function render(template, width, height, out) {
  if (!chrome) throw new Error("Chrome not found; set CHROME=/path/to/chrome");
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    "--force-device-scale-factor=1", `--window-size=${width},${height}`, "--virtual-time-budget=8000",
    `--screenshot=${out}`, pathToFileURL(resolve(BRAND, "templates", template)).href,
  ], { stdio: "ignore" });
  console.log("rendered", template, "→", out);
}

// 1. Lifted art for the templates.
for (const name of ["gentleman", "the-read"]) {
  await lift(sharp(resolve(BRAND, "assets", `${name}.png`))).png().toFile(resolve(BUILD, `${name}.png`));
}

// 2. Web images.
for (const w of [640, 1100]) {
  await lift(sharp(resolve(BRAND, "assets", "gentleman.png"))).resize(w).webp({ quality: 82 })
    .toFile(resolve(PUB, "brand", `gentleman-${w}.webp`));
}
copyFileSync(resolve(BRAND, "logo", "llama-icon-round.svg"), resolve(PUB, "brand", "llama-icon.svg"));
// (The newsletter header is copied to public/brand/ after it renders, below, so Beehiiv can import it by URL.)

// 3. Favicons (the square icon has its own ink background).
const icon = resolve(BRAND, "logo", "llama-icon.svg");
copyFileSync(icon, resolve(PUB, "favicon.svg"));
await sharp(icon, { density: 300 }).resize(32, 32).png().toFile(resolve(PUB, "favicon-32.png"));
await sharp(icon, { density: 300 }).resize(180, 180).png().toFile(resolve(PUB, "apple-touch-icon.png"));

// 4. Social kit.
await sharp(resolve(BUILD, "the-read.png")).resize(1024).png().toFile(resolve(SOCIAL, "avatar.png"));
render("x-banner.html", 1500, 500, resolve(SOCIAL, "x-banner.png"));
render("youtube-banner.html", 2560, 1440, resolve(SOCIAL, "youtube-banner.png"));
render("newsletter-header.html", 1200, 400, resolve(SOCIAL, "newsletter-header.png"));
copyFileSync(resolve(SOCIAL, "newsletter-header.png"), resolve(PUB, "brand", "newsletter-header.png"));

// 5. Link-preview card.
render("og.html", 1200, 630, resolve(PUB, "og.png"));
console.log("done");
