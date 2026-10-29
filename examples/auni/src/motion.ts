import { Easing, interpolate, useCurrentFrame } from "remotion";

import build from "./beats/build.json";
import close from "./beats/close.json";
import flip from "./beats/flip.json";
import offerings from "./beats/offerings.json";
import question from "./beats/question.json";
import reveal from "./beats/reveal.json";
import social from "./beats/social.json";
import music from "./music.json";

/** The app's own curves (tokens.css): both arrive early and ease to rest. */
export const settle = Easing.bezier(0.22, 1, 0.36, 1);
export const drift = Easing.bezier(0.16, 1, 0.3, 1);
/** Speeds up into a cut, so the next shot can start at the same speed. */
export const accelerate = Easing.bezier(0.55, 0, 0.9, 0.35);

export const FPS = 30;

type Section = { readonly length: number } & Record<string, number | readonly number[]>;
type Placed<S extends Section> = { readonly [K in Exclude<keyof S, "length">]: S[K] } & { readonly start: number; readonly end: number };

/** A scene's beats (written from its own start, in src/beats/) moved to film beats, where the drop is 0. */
function place<S extends Section>(section: S, start: number): Placed<S> {
  const out: Record<string, number | readonly number[]> = { start, end: start + section.length };
  for (const [key, value] of Object.entries(section)) {
    if (key !== "length") out[key] = typeof value === "number" ? value + start : value.map((n) => n + start);
  }
  return out as Placed<S>;
}

/**
 * Every moment in the film, in beats on the track's grid (music.json): beat 0 is the drop, one
 * beat is about 0.35s. Each scene keeps its own beats in src/beats/<scene>.json, counted from its
 * own start, with its `length`; scenes before the drop end on it, the rest follow one another.
 * So a scene can grow or shrink without touching any other.
 */
function timeline() {
  const q = place(question, -question.length);
  const b = place(build, q.start - build.length);
  const r = place(reveal, 0);
  const f = place(flip, r.end);
  const o = place(offerings, f.end);
  const s = place(social, o.end);
  const c = place(close, s.end);
  return { start: b.start, end: c.end, build: b, question: q, reveal: r, flip: f, offerings: o, social: s, close: c };
}
export const T = timeline();

/** A beat on the track's grid (0 is the drop), as seconds from the film's start. */
export const beat = (n: number) => (n - T.start) * music.beat_s;
/** A beat as a frame. */
export const bf = (n: number) => Math.round(beat(n) * FPS);
/** A moment, in seconds, as a frame. */
export const at = (seconds: number) => Math.round(seconds * FPS);

export const DURATION = bf(T.end);

/** `frame` mapped from [start, start + length] onto [from, to], held at both ends. */
export function ramp(
  frame: number,
  start: number,
  length: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = settle,
) {
  return interpolate(frame, [start, start + length], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * The reference studio's landing: fast in, hard brake, then a slow creep so nothing ever sits still.
 * Returns 0 before `start`, about 0.9 after `length` frames, then keeps creeping to 1.
 */
export function land(frame: number, start: number, length = 8, creep = 40) {
  return ramp(frame, start, length, 0, 0.92) + ramp(frame, start + length, creep, 0, 0.08, Easing.linear);
}


/** The film's frame inside a scene that starts at `startBeat`, so scenes can speak in beats. */
export function useFilmFrame(startBeat: number) {
  return useCurrentFrame() + bf(startBeat);
}
