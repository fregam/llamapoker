/**
 * Brand values for the reels, read from ../../../brand/tokens.json (the single source of
 * truth shared with the website) plus the two Google fonts, loaded through Remotion so
 * frames never render before the fonts are ready.
 * Used by every component and reel in this app.
 */

import tokens from "../../../brand/tokens.json";
import { loadFont as loadBodoni } from "@remotion/google-fonts/BodoniModa";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const C = tokens.color;

export const SERIF = loadBodoni("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
loadBodoni("italic", { weights: ["400"], subsets: ["latin"] });
export const SANS = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily;

/** Reel canvas: vertical 9:16 at 30fps. */
export const W = 1080;
export const H = 1920;
export const FPS = 30;

/** Instagram Reels safe area on the 1080×1920 canvas: UI covers ~270px at the top, ~440px at the
 * bottom (caption, actions) and ~120px on the right (buttons). Everything that must be read sits
 * inside; the caption block's baseline is SAFE.bottom. */
export const SAFE = { top: 290, bottom: 450, right: 120 };
