import { Freeze } from "remotion";

import { span } from "../engine/motion";
import type { SceneKey } from "../film";
import { scenes } from "../scenes";

/**
 * Another scene, frozen on its real last frame. Draw it under a move (a whip pan, a push) at the
 * start of the next scene, so the transition is one camera move across the cut instead of a whip
 * that starts from nothing. The outgoing scene must end on a frame that can be cut from.
 */
export function LastFrameOf({ scene }: { readonly scene: SceneKey }) {
  const { Scene } = scenes[scene];
  return (
    <Freeze frame={span(scene).frames - 1}>
      <Scene />
    </Freeze>
  );
}
