/**
 * One 3D camera over a flat stage: the flagship "showcase" move. Lay the scene out once on a stage
 * (stage pixels, like a 1920x1080 page), then key where the camera looks, how close it is and how
 * it is turned. Things on the stage never move to fake a camera; the camera moves.
 *
 *   keys:  {at: frame, x, y (stage point at screen centre), zoom, rx, ry (degrees), ease?}
 *   stage: <div style={{ ...stage(cam) }}> holds the layout
 *   project(cam, x, y): where a stage point lands on screen, for overlays drawn flat on top
 *                       (a cursor, a ripple) that must sit exactly on a 3D element.
 *
 * The camera never overshoots (no bounce): the default ease between keys is in-out cubic, and a
 * key's `ease` sets how the camera arrives at it (use `brake` from motion.ts for a hard landing).
 */
import type { CSSProperties } from "react";
import { Easing } from "remotion";

import { FILM } from "../film";

export type Cam = { readonly x: number; readonly y: number; readonly zoom: number; readonly rx: number; readonly ry: number };
export type Key = Cam & { readonly at: number; readonly ease?: (t: number) => number };

/** The perspective distance in px. Smaller is a wider lens with more depth. */
export const LENS = 2400;

/** The camera at a frame: held before the first key and after the last, eased between. Keys must be in frame order. */
export function camera(keys: readonly Key[]) {
  return (frame: number): Cam => {
    const next = keys.findIndex((k) => k.at > frame);
    if (next === 0) return keys[0]!;
    if (next < 0) return keys[keys.length - 1]!;
    const a = keys[next - 1]!;
    const b = keys[next]!;
    const t = (b.ease ?? Easing.inOut(Easing.cubic))((frame - a.at) / (b.at - a.at));
    const mix = (k: keyof Cam) => a[k] + (b[k] - a[k]) * t;
    return { x: mix("x"), y: mix("y"), zoom: mix("zoom"), rx: mix("rx"), ry: mix("ry") };
  };
}

/** The style for the stage element (a FILM-sized box at the top left). Put `perspective` on its parent: use `lens`. */
export function stage(c: Cam): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: FILM.width,
    height: FILM.height,
    transformOrigin: "0 0",
    transformStyle: "preserve-3d",
    transform: `translate(${FILM.width / 2}px, ${FILM.height / 2}px) scale(${c.zoom}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) translate(${-c.x}px, ${-c.y}px)`,
  };
}

/** The style for the stage's parent. */
export const lens: CSSProperties = { position: "absolute", inset: 0, perspective: LENS };

/** Where a stage point lands on screen, through the same transform and perspective as `stage`. */
export function project(c: Cam, x: number, y: number) {
  const ry = (c.ry * Math.PI) / 180;
  const rx = (c.rx * Math.PI) / 180;
  const vx = x - c.x;
  const vy = y - c.y;
  const x1 = vx * Math.cos(ry);
  const z1 = -vx * Math.sin(ry);
  const y2 = vy * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 = vy * Math.sin(rx) + z1 * Math.cos(rx);
  const k = LENS / (LENS - z2);
  return { x: FILM.width / 2 + x1 * c.zoom * k, y: FILM.height / 2 + y2 * c.zoom * k };
}
