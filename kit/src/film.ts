/**
 * The film's size and its scenes, in order. This list is the ONLY place the scene order lives:
 * the timeline, the render, the sound, the previews and `npm run frames` all walk it.
 *
 * `drop: true` marks the first scene after the song's drop. Scenes before it are chained
 * backward so they end exactly on the drop (beat 0); the rest follow it. So any scene can grow
 * or shrink without moving the drop off the music.
 *
 * Adding a scene: write src/beats/<key>.json, src/scenes/<key>.tsx (Scene + sounds), add it here
 * and in src/scenes/index.ts. tsc fails until both lists agree.
 */
import close from "./beats/close.json";
import hook from "./beats/hook.json";
import reveal from "./beats/reveal.json";

export const FILM = { width: 1920, height: 1080, fps: 30 } as const;

export const SCENES = [
  { key: "hook", beats: hook },
  { key: "reveal", beats: reveal, drop: true },
  { key: "close", beats: close },
] as const;

export type SceneKey = (typeof SCENES)[number]["key"];
