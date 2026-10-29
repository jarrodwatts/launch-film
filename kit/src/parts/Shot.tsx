import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";

import manifest from "../../public/3d/manifest.json";
import { mod } from "../engine/motion";

/** One pre-rendered shot (public/3d/manifest.json, written by the shot renderers). */
export type ShotInfo = {
  readonly frames: number;
  readonly size: number;
  /** The camera distance it was rendered with, and the library's standard one: drawn at camera/base so every shot shows the subject at one size. */
  readonly camera: number;
  readonly base: number;
  /** Where the zoom is anchored, 0 top to 1 bottom: a hop rendered with room above sits lower. */
  readonly anchorY: number;
  readonly loop: boolean;
  readonly quality: "generated" | "preview" | "cpu-final" | "gpu" | "standin";
  /** The colour at the centre of the last frame, for a match-on-colour cut out of a dive. */
  readonly lastFrameFill: string | null;
  readonly source: string;
};
export const SHOTS = manifest as Record<string, ShotInfo>;

/**
 * A pre-rendered shot (Blender, or anything else the browser can't draw) played as an image
 * sequence: public/3d/<shot>/0001.png onward. `frame` is frames since the shot started; it may be
 * negative or fractional. Shutter passes ask for sub-frames (12.375), so it floors; a one-shot
 * clamps to its first and last frames; a loop wraps with a safe modulo. `span` retimes: the whole
 * shot plays over `span` film frames, so a 28-frame fly can last 15 frames with no re-render.
 * Render shots at the size they are shown.
 */
export function Shot({ shot, frame, size, span, style }: { readonly shot: string; readonly frame: number; readonly size: number; readonly span?: number; readonly style?: CSSProperties }) {
  const info = SHOTS[shot];
  if (!info) throw new Error(`No 3D shot "${shot}" in public/3d/manifest.json. Render it, or run npm run setup for the demo's.`);
  const t = Math.floor(span ? (frame * info.frames) / span : frame);
  const index = info.loop ? mod(t, info.frames) : Math.min(info.frames - 1, Math.max(0, t));
  const zoom = info.camera / info.base;
  return (
    <div style={{ width: size, height: size, position: "relative", ...style }}>
      <Img
        src={staticFile(`3d/${shot}/${String(index + 1).padStart(4, "0")}.png`)}
        style={{ position: "absolute", width: size * zoom, height: size * zoom, left: (size - size * zoom) / 2, top: (size - size * zoom) * info.anchorY }}
      />
    </div>
  );
}
