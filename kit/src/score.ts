/**
 * How the film sits on the song (src/music.json):
 * - breakOn: the scene that must start exactly on the song's break (the hero shot; the logo then
 *   lands on the re-drop).
 * - spliceAt: the scene whose first frame hides the song's jump, if the scenes before the break
 *   ran long or short. A hard picture cut hides a seam; pick a cut where the song repeats itself.
 * - fadeIn: the music rises from silence to full between these two beats, under the opening. Set
 *   from the film's first beat (T.start), so renaming a scene or its moments never breaks it.
 */
import { T } from "./engine/motion";

export const MUSIC = {
  breakOn: "close",
  spliceAt: "close",
  fadeIn: [T.start, T.start + 1],
} as const;
