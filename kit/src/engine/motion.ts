/**
 * Time in the film is counted in beats of the song (src/music.json): beat 0 is the drop. Each
 * scene writes its moments in src/beats/<scene>.json, counted from its own start, and this file
 * places them on the song's grid. Everything else is a pure function of the frame: no state, no
 * springs, no randomness, so every frame renders the same way every time.
 */
import { Easing, interpolate, useCurrentFrame } from "remotion";

import { settle } from "../brand";
import { FILM, SCENES, type SceneKey } from "../film";
import music from "../music.json";

export const FPS = FILM.fps;

/** Speeds up into a cut, so the next shot can start at the same speed. */
export const accelerate = Easing.bezier(0.55, 0, 0.9, 0.35);
/** Fast in, hard brake: for things that land with weight (a card going face-on, a logo dropping in). */
export const brake = Easing.bezier(0.2, 0.9, 0.3, 1);
/** A whip pan across a cut: about 9 frames, nearly all of the travel in the middle. */
export const whip = Easing.bezier(0.3, 0, 0.1, 1);
/** Rocks back a little before it goes: for a turn or a throw. */
export const anticipate = Easing.bezier(0.5, -0.3, 0.25, 1);

type Beats = { readonly length: number } & Readonly<Record<string, number | readonly number[]>>;
/** A scene's beats moved onto the film's grid, plus its `start` and `end`. */
type Placed<B extends Beats> = { readonly [K in Exclude<keyof B, "length">]: B[K] } & { readonly start: number; readonly end: number };
type Scene = (typeof SCENES)[number];
type Timeline = { readonly [S in Scene as S["key"]]: Placed<S["beats"]> } & { readonly start: number; readonly end: number };

function place(beats: Beats, start: number) {
  const out: Record<string, number | readonly number[]> = { start, end: start + beats.length };
  for (const [key, value] of Object.entries(beats)) {
    if (key !== "length") out[key] = typeof value === "number" ? value + start : value.map((n) => n + start);
  }
  return out;
}

/** Scenes before the drop scene end on beat 0, chained backward; the drop scene and those after follow it. */
function timeline(): Timeline {
  const drop = SCENES.findIndex((s) => "drop" in s && s.drop);
  if (drop < 0) throw new Error("src/film.ts: mark the first scene after the song's drop with `drop: true`.");
  const out: Record<string, unknown> = {};
  let start = 0;
  for (let i = drop - 1; i >= 0; i--) {
    start -= SCENES[i]!.beats.length;
    out[SCENES[i]!.key] = place(SCENES[i]!.beats, start);
  }
  let end = 0;
  for (const s of SCENES.slice(drop)) {
    out[s.key] = place(s.beats, end);
    end += s.beats.length;
  }
  return { ...out, start, end } as Timeline;
}

/** Every moment in the film, in beats on the song's grid: `T.reveal.tap`, `T.close.start`, `T.end`. */
export const T = timeline();

/** A beat as seconds from the film's first frame. */
export const beat = (n: number) => (n - T.start) * music.beat_s;
/** A beat as a film frame. Scenes and every moment inside them use this same rounding, so cuts never gap. */
export const bf = (n: number) => Math.round(beat(n) * FPS);
/** Seconds as a film frame. */
export const at = (seconds: number) => Math.round(seconds * FPS);
/** The film's length in frames. */
export const DURATION = bf(T.end);
/** A scene's first frame and its length in frames, exactly as the render places it. */
export const span = (key: SceneKey) => ({ from: bf(T[key].start), frames: bf(T[key].end) - bf(T[key].start) });

/** A modulo that stays positive for negative numbers (JS's % keeps the sign: -1 % 3 is -1). For loops. */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** `frame` mapped from [start, start + length] onto [from, to], held at both ends. Safe before and after.
 * The default curve is the brand's own `settle` (brand.ts). */
export function ramp(frame: number, start: number, length: number, from = 0, to = 1, easing: (t: number) => number = settle) {
  return interpolate(frame, [start, start + Math.max(length, 1e-6)], [from, to], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

/**
 * The landing: about 92% of the way in `length` frames, then a linear creep over the last 8% for
 * `creep` frames, so nothing ever sits dead still. 0 before `start`, 1 at the end of the creep.
 */
export function land(frame: number, start: number, length = 8, creep = 40) {
  return ramp(frame, start, length, 0, 0.92) + ramp(frame, start + length, creep, 0, 0.08, Easing.linear);
}

/**
 * Blur in px for a fast move, from how far it travels this frame. The final averages 16 passes
 * spread over half a frame, so a thing moving d px a frame is drawn as 16 sharp copies about d/32 px
 * apart. Past about 30 px a frame those show as stamped edges ("YYYour tttake."). A blur about
 * that gap wide melts them into one smear: 0.035 px per px of travel, capped at `max`.
 * `position` is the same function that places the thing, so blur peaks exactly where speed does
 * and is gone by the time it lands:
 *   const x = (f: number) => -700 * ramp(f, out, 12, 0, 1, accelerate);
 *   <div style={{ transform: `translateX(${x(frame)}px)`, filter: `blur(${speedBlur(x, frame)}px)` }}>
 */
export function speedBlur(position: (frame: number) => number, frame: number, max = 30) {
  return Math.min(max, Math.abs(position(frame) - position(frame - 1)) * 0.035);
}

/**
 * The film's frame inside a scene, so scene code works in film frames (`bf(T.reveal.tap)`) and
 * can move between scenes without rebasing. Under the final's shutter passes it is fractional.
 */
export function useFilmFrame(key: SceneKey) {
  return useCurrentFrame() + bf(T[key].start);
}
