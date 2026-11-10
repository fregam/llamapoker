/**
 * Every reel registered as a Remotion composition (id = the render name), plus the Instagram
 * covers as stills. Add new reels and covers here.
 *   npx remotion render src/index.ts <id> out/<id>.mp4
 *   npx remotion still  src/index.ts cover-<id> out/cover-<id>.png
 */

import { Composition, Still } from "remotion";
import { Cover } from "./covers/Cover";
import { OnlyAces, ONLY_ACES_FRAMES } from "./reels/OnlyAces";
import { ShouldYouCall, SHOULD_YOU_CALL_FRAMES } from "./reels/ShouldYouCall";
import { FPS, H, W } from "./theme";

export function Root() {
  return (
    <>
      <Composition id="should-you-call" component={ShouldYouCall} durationInFrames={SHOULD_YOU_CALL_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="only-aces" component={OnlyAces} durationInFrames={ONLY_ACES_FRAMES} fps={FPS} width={W} height={H} />
      <Still id="cover-only-aces" component={Cover} width={1080} height={1350} defaultProps={{ line1: "Only playing", line2: "aces?", file: "expr-4.png" }} />
      <Still id="cover-should-you-call" component={Cover} width={1080} height={1350} defaultProps={{ line1: "Should you", line2: "call?", file: "pose-4.png" }} />
    </>
  );
}
