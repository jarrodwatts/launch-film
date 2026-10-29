/**
 * Writes the film's sound plan (src/engine/cues.ts) to out/sound.json for scripts/mix.py, and the
 * timeline (scene spans and every named moment, in seconds) to out/timeline.json for
 * scripts/check_audio.py. Fails loudly on a song splice that can't be heard as seamless, and on
 * any cue whose sound isn't measured in public/sfx/stats.json (a missing file, or a stale stats).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import music from "../src/music.json";
import { sound } from "../src/engine/cues";
import { beat, bf, FPS, T } from "../src/engine/motion";
import { SCENES } from "../src/film";

const plan = sound();
const statsFile = "public/sfx/stats.json";
if (!existsSync(statsFile)) throw new Error(`${statsFile} is missing: run npm run sfx:stats.`);
const stats = JSON.parse(readFileSync(statsFile, "utf8")) as Record<string, unknown>;
const unknown = [...new Set(plan.cues.map((c) => c.sfx).filter((sfx) => !(sfx in stats)))];
if (unknown.length) throw new Error(`No measurement in ${statsFile} for: ${unknown.join(", ")}. Add the files to public/sfx (or fix roles.json), then npm run sfx:stats.`);

const scenes = SCENES.map(({ key }) => {
  const placed = T[key] as Record<string, number | readonly number[]>;
  const moments: Record<string, number[]> = {};
  for (const [name, value] of Object.entries(placed)) {
    if (name !== "end") moments[name] = (typeof value === "number" ? [value] : [...value]).map((n) => bf(n) / FPS);
  }
  return { key, start_s: bf(T[key].start) / FPS, end_s: bf(T[key].end) / FPS, moments };
});

mkdirSync("out", { recursive: true });
writeFileSync("out/sound.json", JSON.stringify(plan, null, 1));
writeFileSync("out/timeline.json", JSON.stringify({ fps: FPS, beat_s: music.beat_s, first_beat: T.start, length_s: beat(T.end), scenes }, null, 1));
console.log(`${plan.cues.length} cues, ${plan.length_s.toFixed(2)}s`);
