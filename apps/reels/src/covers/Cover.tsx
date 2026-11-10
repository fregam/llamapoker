/**
 * Instagram cover (1080×1350, the grid crop) so the profile reads as one series: a giant Bodoni
 * question over a library engraving, hairline frame, LLAMAPOKER kicker. One composition, props
 * per reel (see Root.tsx). Render: npx remotion still src/index.ts cover-<id> out/cover-<id>.png
 */

import { Frame } from "../components";
import { Engraving } from "../teaching";
import { C, SERIF } from "../theme";

export type CoverProps = Record<string, unknown> & {
  line1: string;
  /** Italic emphasised word(s), on its own line. */
  line2: string;
  file: string;
  /** Position of the engraving inside the frame. */
  art?: React.CSSProperties;
}

export function Cover({ line1, line2, file, art }: CoverProps) {
  return (
    <Frame>
      <Engraving file={file} fade={0.45} style={{ position: "absolute", top: 400, left: -60, width: 1200, height: 860, ...art }} />
      <div style={{ position: "absolute", top: 180, left: 60, right: 60, textAlign: "center", fontFamily: SERIF, fontSize: 160, lineHeight: 0.92, letterSpacing: "-0.02em", color: C.paper }}>
        {line1}
        <br />
        <em>{line2}</em>
      </div>
      <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center", fontSize: 28, letterSpacing: "0.3em", color: C.text3, fontWeight: 500 }}>
        FREE TOOL · LLAMAPOKER.COM
      </div>
    </Frame>
  );
}
