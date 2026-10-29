/**
 * Each scene's picture and sound, by key. `satisfies Record<SceneKey, ...>` makes tsc fail when a
 * scene in src/film.ts has no entry here, or the other way round.
 */
import type { ReactNode } from "react";

import type { Add } from "../engine/sound";
import type { SceneKey } from "../film";
import * as close from "./close";
import * as hook from "./hook";
import * as reveal from "./reveal";

export const scenes = {
  hook: { Scene: hook.Scene, sounds: hook.sounds },
  reveal: { Scene: reveal.Scene, sounds: reveal.sounds },
  close: { Scene: close.Scene, sounds: close.sounds },
} satisfies Record<SceneKey, { readonly Scene: () => ReactNode; readonly sounds: (add: Add) => void }>;
