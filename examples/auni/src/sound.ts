/**
 * The film's sound effects, written by each scene next to its picture (`sounds` in each scene
 * file), on the same beats. The rule: anything that moves, clicks, loads, lands or changes scene
 * makes a sound. scripts/mix.py lays each cue so the sound's loudest point
 * (public/sfx/stats.json) falls on `at`, in seconds from the film's start.
 *
 * Levels: transitions and hits around -10 to -14 dB, UI clicks and pops -14 to -18, small
 * movement and ticks -20 to -26 so they add texture without crowding the music.
 */
import { beat, FPS } from "./motion";

export type Cue = { readonly sfx: string; readonly at: number; readonly db: number; readonly pan?: number; readonly keep?: number };
/** Adds a cue: `sfx` (a file in public/sfx/) peaking at `at` seconds; `keep` cuts it to its first seconds. */
export type Add = (sfx: string, at: number, db: number, extra?: { readonly pan?: number; readonly keep?: number }) => void;

/** A frame as seconds, for cues placed on frames rather than beats. */
export const s = (frame: number) => frame / FPS;
/** One beat, in seconds. */
export const one = beat(1) - beat(0);
export const WOOSH = ["fast_woosh_01", "fast_woosh_02", "fast_woosh_03", "fast_woosh_04"] as const;
