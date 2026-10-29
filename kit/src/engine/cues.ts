/**
 * The film's sound plan for scripts/mix.py: every scene's cues, which part of the song plays when,
 * and the music's fade-in. Written to out/sound.json by scripts/cues.ts (`npm run mix`).
 */
import music from "../music.json";
import { SCENES } from "../film";
import { scenes } from "../scenes";
import { MUSIC } from "../score";
import { beat, mod, T } from "./motion";
import type { Add, Cue } from "./sound";

/** Every scene's cues, in time order. */
export function cues(): Cue[] {
  const out: Cue[] = [];
  const add: Add = (sfx, at, db, extra = {}) => out.push({ sfx, at, db, ...extra });
  for (const { key } of SCENES) scenes[key].sounds(add);
  return out.sort((a, b) => a.at - b.at);
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Which part of the song plays when. The song's break (music.json `sections_beats.break`) has to
 * land on the scene MUSIC.breakOn names. When scenes grow or shrink, the break drifts off it by
 * `late` beats; the track then jumps by `late` at the start of MUSIC.spliceAt, a cut that hides the
 * seam. Back if the scenes ran long, forward if they ran short. A jump only sounds seamless when
 * it is a whole number of the song's phrases, so anything else stops the build with the fix.
 *
 *   film beats:  -8 ...... 0 .......... 16 | 16 ...... 20 [re-drop]
 *   track beats: -8 ...... 0 .......... 16 | 24 ...... 28 [re-drop]    (late = -8: jump forward 8)
 */
export function song() {
  const late = T[MUSIC.breakOn].start - music.sections_beats.break[0]!;
  const phrase = music.phrase_beats;
  const off = mod(late, phrase);
  if (Math.min(off, phrase - off) > 1e-6) {
    const where = late < 0 ? "before" : "after";
    throw new Error(
      `The ${MUSIC.breakOn} starts ${fmt(Math.abs(late))} beats ${where} the song's break; make the scenes before it ` +
        `${fmt(mod(-late, phrase))} beats longer or ${fmt(mod(late, phrase))} beats shorter. ` +
        `(The song can only jump whole ${phrase}-beat phrases: src/music.json phrase_beats.)`,
    );
  }
  if (T[MUSIC.spliceAt].start > T[MUSIC.breakOn].start) throw new Error("src/score.ts: spliceAt must start at or before breakOn.");
  const track = (n: number) => music.drop_file_s + n * music.beat_s;
  const first = { at_s: 0, track_s: track(T.start) };
  if (Math.abs(late) < 1e-6) return [first];
  return [first, { at_s: beat(T[MUSIC.spliceAt].start), track_s: track(T[MUSIC.spliceAt].start - late) }];
}

/** What scripts/mix.py reads (out/sound.json). */
export function sound() {
  return {
    length_s: beat(T.end),
    song: song(),
    fade_in_s: [beat(MUSIC.fadeIn[0]), beat(MUSIC.fadeIn[1])],
    cues: cues(),
  };
}
