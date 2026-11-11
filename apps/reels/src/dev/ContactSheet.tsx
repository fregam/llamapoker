/**
 * Review tool, not a deliverable: a still that tiles frames extracted from a render so a whole
 * reel can be checked in one image (composition `contact-sheet`, see Root.tsx).
 *
 *   FF=node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe
 *   for i in $(seq 0 29); do $FF -y -ss $((i*3)) -i out/<id>.mp4 -frames:v 1 -vf scale=360:-1 public/_review/<id>/$(printf %02d $i).png; done
 *   npx remotion still src/index.ts contact-sheet out/contact-<id>.png --props='{"dir":"_review/<id>","count":30,"every":3}'
 *
 * `public/_review/` is git-ignored.
 */

import { Img, staticFile } from "remotion";
import { C, SANS } from "../theme";

export type ContactSheetProps = Record<string, unknown> & { dir: string; count: number; every: number; cols?: number };

export const SHEET_W = 2160;
export const SHEET_H = 3200;

export function ContactSheet({ dir, count, every, cols = 6 }: ContactSheetProps) {
  const w = SHEET_W / cols;
  const h = w * (16 / 9);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#222", display: "flex", flexWrap: "wrap", alignContent: "flex-start", fontFamily: SANS }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: w, height: h, position: "relative", boxSizing: "border-box", border: "1px solid #444" }}>
          <Img src={staticFile(`${dir}/${String(i).padStart(2, "0")}.png`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          <div style={{ position: "absolute", top: 6, left: 8, fontSize: 22, color: C.brass, background: "rgba(0,0,0,0.6)", padding: "2px 8px" }}>{i * every}s</div>
        </div>
      ))}
    </div>
  );
}
