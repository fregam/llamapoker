/**
 * Research round 4: style frames. Reel 002's real hook (voice, captions, sound, headline, cost,
 * folds: frames 0-262) with one visual direction swapped in, so the founder picks a direction
 * before we A/B inside it. Camera + quieter mix (rounds 1-2 winners) underneath every look.
 */

import { VariantProvider } from "../ab";
import { Hook, SCRIPT, SoundDesign, VO } from "../reels/OnlyAces";
import { Narration, Shake } from "../stage";
import { DrawOn } from "./DrawOn";
import { Engraved3D } from "./Engraved3D";
import { GentlemanHost } from "./GentlemanHost";

export type Look = "current" | "engraved3d" | "drawon" | "gentleman" | "gentleman-drawon" | "layered";

export const HOOK_LOOK_FRAMES = 262;

export function HookLooks({ look }: { look: Look }) {
  return (
    <VariantProvider variant={{ camera: true, bedDb: -6, fxDb: -6 }}>
      <Narration script={SCRIPT} vo={VO}>
        {look === "engraved3d" && <Engraved3D slamAt={0} costAt={80} />}
        <Shake cue="cost">
          {look === "drawon" && <DrawOn />}
          {look === "gentleman" || look === "gentleman-drawon" ? <GentlemanHost drawOn={look === "gentleman-drawon"} /> : <Hook cards={look === "current"} headline={look !== "drawon"} />}
        </Shake>
        <SoundDesign />
      </Narration>
    </VariantProvider>
  );
}
