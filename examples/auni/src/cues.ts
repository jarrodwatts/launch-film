/** Every sound in the film: each scene's own cues (see sound.ts), plus when the music fades in. */
import { beat, T } from "./motion";
import music from "./music.json";
import { sounds as build } from "./scenes/build";
import { sounds as close } from "./scenes/close";
import { sounds as flip } from "./scenes/flip";
import { sounds as offerings } from "./scenes/offerings";
import { sounds as reveal } from "./scenes/reveal";
import { sounds as social } from "./scenes/social";
import type { Add, Cue } from "./sound";

export function cues(): Cue[] {
  const out: Cue[] = [];
  const add: Add = (sfx, at, db, extra = {}) => out.push({ sfx, at, db, ...extra });
  for (const scene of [build, reveal, flip, offerings, social, close]) scene(add);
  return out.sort((a, b) => a.at - b.at);
}

/**
 * Which part of the song plays when: from the film's first beat, on from the drop. The song's
 * break (music.json) has to land on the close, so when the scenes before it run longer than the
 * song's drop does, the track jumps back whole phrases (it repeats every 16 beats) on the cut
 * into social, where a seam can't be heard under the picture's own cut.
 */
function song() {
  const late = T.close.start - music.sections_beats.break[0]!;
  if (late % 16) throw new Error(`The close starts ${late} beats after the song's break; make the scenes before it ${late - (late % 16)} or ${late - (late % 16) + 16} beats longer than the drop.`);
  const track = (n: number) => music.drop_file_s + n * music.beat_s;
  const first = { at_s: 0, track_s: track(T.start) };
  return late ? [first, { at_s: beat(T.social.start), track_s: track(T.social.start - late) }] : [first];
}

/** What scripts/mix.py needs: the film's length, which part of the song plays when, the music's fade-in, every cue. */
export function sound() {
  return {
    length_s: beat(T.end),
    song: song(),
    // The music fades in under the typed opening, reaching full level as the first take posts.
    fade_in_s: [beat(T.build.hero), beat(T.build.posted)],
    cues: cues(),
  };
}
