/**
 * Every reel registered as a Remotion composition (id = the render name). Add new reels here.
 * Render one: npx remotion render src/index.ts <id> out/<id>.mp4
 */

import { Composition } from "remotion";
import { ShouldYouCall, SHOULD_YOU_CALL_FRAMES } from "./reels/ShouldYouCall";
import { FPS, H, W } from "./theme";

export function Root() {
  return (
    <>
      <Composition id="should-you-call" component={ShouldYouCall} durationInFrames={SHOULD_YOU_CALL_FRAMES} fps={FPS} width={W} height={H} />
    </>
  );
}
