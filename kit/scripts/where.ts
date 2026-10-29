/**
 * Turns a film timestamp from a note ("around 5 seconds") into the scene, frame and beat to change.
 * Usage: npm run where -- 5.0   ->   5.00s f150: scene reveal, local beat 4.5, film beat 4.5
 */
import music from "../src/music.json";
import { DURATION, FPS, T } from "../src/engine/motion";
import { SCENES } from "../src/film";

const seconds = Number(process.argv[2]);
if (!Number.isFinite(seconds)) throw new Error("Usage: npm run where -- <seconds>");
// The frame on screen at that moment.
const frame = Math.floor(seconds * FPS + 1e-6);
if (frame < 0 || frame >= DURATION) throw new Error(`The film is 0 to ${(DURATION / FPS).toFixed(2)}s.`);
const filmBeat = T.start + seconds / music.beat_s;
const scene = [...SCENES].reverse().find(({ key }) => T[key].start <= filmBeat + 1e-9) ?? SCENES[0];
const round = (n: number) => String(Math.round(n * 100) / 100);
console.log(`${seconds.toFixed(2)}s f${frame}: scene ${scene.key}, local beat ${round(filmBeat - T[scene.key].start)}, film beat ${round(filmBeat)}`);
