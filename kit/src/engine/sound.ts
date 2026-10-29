/**
 * Sound effects are written by each scene, next to its picture, in `export function sounds(add)`,
 * on the same beats and the same helper functions the picture uses. When a beat moves, its sound
 * moves with it. The rule: anything that moves, lands, clicks, types, counts or cuts makes a sound.
 *
 * `at` is where the sound's LOUDEST point lands (measured per file in public/sfx/stats.json),
 * not where the file starts. That is what makes hits feel tight.
 *
 * Levels (`db` sets the sound's peak, in dB below full scale):
 *   transitions and hits    -10 to -14
 *   UI clicks and pops      -14 to -18
 *   small motion and ticks  -20 to -26   (texture that doesn't crowd the music)
 *   a cue on the drop       +2 to 3 dB over its neighbours
 * Two sounds on one instant mask each other: lead one by 30 to 60 ms and/or set it 1 to 2 dB apart.
 */
import roles from "../../public/sfx/roles.json";
import { beat, FPS } from "./motion";

export type Cue = {
  /** A file stem in public/sfx/ (use v() to pick one by role). */
  readonly sfx: string;
  /** Seconds from the film's first frame where the sound's peak lands. */
  readonly at: number;
  readonly db: number;
  /** -1 left to 1 right: where it happens on screen. */
  readonly pan?: number;
  /** Cut the file to its first `keep` seconds (a 25 ms fade): typing that stops when the typing stops. */
  readonly keep?: number;
  /** Play every event in a multi-hit file. Without it the mix keeps only the event that holds the peak. */
  readonly whole?: boolean;
};
export type Add = (sfx: string, at: number, db: number, extra?: { readonly pan?: number; readonly keep?: number; readonly whole?: boolean }) => void;

export type Role = keyof typeof roles;

/** A frame as seconds, for a cue inside a motion rather than on a beat. */
export const s = (frame: number) => frame / FPS;
/** One beat, in seconds. */
export const one = beat(1) - beat(0);

/**
 * The `i`th sound for a role (public/sfx/roles.json), rotating through the role's files, so a
 * repeated move doesn't sound copy-pasted: v("whoosh", 0), v("whoosh", 1), ...
 */
export function v(role: Role, i = 0) {
  const files: readonly string[] = roles[role];
  if (!files.length) throw new Error(`public/sfx/roles.json: role "${String(role)}" has no files.`);
  return files[((i % files.length) + files.length) % files.length]!;
}
