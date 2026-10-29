/**
 * Where each scene sits in the film, in frames, seconds and beats. With a scene name, prints just its
 * film frame range "first-last" (what scene.sh renders); with --total, the film's length in frames.
 * Usage: npm run frames [-- <scene> | --total]
 */
import { beat, bf, DURATION, FPS, span, T } from "../src/engine/motion";
import { SCENES, type SceneKey } from "../src/film";

const arg = process.argv[2];
const range = (key: SceneKey) => `${span(key).from}-${span(key).from + span(key).frames - 1}`;
if (arg === "--total") console.log(DURATION);
else if (arg) {
  if (!SCENES.some((s) => s.key === arg)) throw new Error(`No scene "${arg}". Scenes: ${SCENES.map((s) => s.key).join(" ")}`);
  console.log(range(arg as SceneKey));
} else {
  console.log("scene        frames      seconds          beats (0 = drop)");
  for (const { key } of SCENES) {
    const { start, end } = T[key];
    console.log(`${key.padEnd(12)} ${range(key).padEnd(11)} ${(bf(start) / FPS).toFixed(2).padStart(6)}-${(bf(end) / FPS).toFixed(2).padEnd(7)} ${String(start).padStart(5)} to ${end} (${end - start})`);
  }
  console.log(`film         0-${DURATION - 1}       ${beat(T.end).toFixed(2)}s, ${T.end - T.start} beats`);
}
