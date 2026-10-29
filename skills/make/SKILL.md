---
name: make
description: Make a product launch film for any product, from brief to posted master. Covers the questions, the story, a song-first beat grid, scenes whose picture and sound are written together, frame-by-frame review, rounds of notes, a shutter-blurred final and a clearance check. New films start from the plugin's Remotion starter kit. Use when the user asks for a launch video, product video, announcement film, teaser, trailer or sizzle. Also use when they want a new version of an existing launch film, or send timestamped notes on a cut. Routes to launch-film:craft, :sound, :assets, :team and :review.
argument-hint: "[product name, or path to an existing film]"
---

# Make a launch film

The product, or the path to an existing film, is whatever follows `/launch-film:make`. If nothing follows it, use the latest message. This skill runs the whole job and hands each stage to the skill that owns it.

The worked example throughout is the Auni film (an AI agent that turns your take into a real position): 39.4s, seven rounds of notes, from "it's decent, but doesn't quite feel premium enough" to "this is so fire dude". Read [worked-example.md](worked-example.md) once, early, to see the whole film in beats.

## 1. What you are making, and the bar

- **The film:** 30 to 40s, 1920x1080 at 30fps, no voiceover, works muted. One song, its drop at 5 to 10s. Auni's drop is at 9.7s. A teaser of 8 to 15s budgets differently: section 8.
- **The bar is "premium, top-studio level"**, the user's own words. "Be ambitious" is the default, not a request. Every round that played it safe got "be more ambitious & creative".
- **Length follows content, not a number.** 53s got "the pacing feels too slow, things hang around too long". 39.4s was loved, because the extra time went to reads the user asked for. The complaint is dead time, not total seconds.
- **The stack:** Remotion 4 for picture, Blender for real 3D, Python for audio. All of it is in the kit.

## 2. The flow

```
BRIEF -> RESEARCH -> STORY -> SONG -> GRID + BUDGET -> BUILD -> REVIEW -> SHOW -> NOTES
                                                         ^                          |
                                                         +--- directly, or a team --+
                                    when the user is happy: FINAL -> CLEARANCE -> POST
```

| Stage | Owner |
|---|---|
| BRIEF | this skill, with [questions.md](questions.md) |
| RESEARCH | this skill; the analyst fan-out is `launch-film:team` ([../team/SKILL.md](../team/SKILL.md)) |
| STORY | `launch-film:craft` ([../craft/SKILL.md](../craft/SKILL.md)) |
| SONG | `launch-film:sound` ([../sound/SKILL.md](../sound/SKILL.md)) |
| GRID + BUDGET | this skill, on the grid from `launch-film:sound` |
| BUILD | `launch-film:craft`, `launch-film:sound`, `launch-film:assets` ([../assets/SKILL.md](../assets/SKILL.md)) |
| REVIEW | `launch-film:review` ([../review/SKILL.md](../review/SKILL.md)) |
| SHOW, NOTES | this skill; a broad round goes to `launch-film:team` |
| FINAL | this skill |
| CLEARANCE | `launch-film:assets` |
| POST | this skill |

## 3. Start a film

- New film: `bash ${CLAUDE_PLUGIN_ROOT}/kit/scripts/new-film.sh <dir>`. It copies the kit into a standalone git repo, installs everything, makes the first mix, and commits (about 1.5 min). The repo holds a 12.8s demo film for a made-up product, Acme, that already works end to end.
- If `${CLAUDE_PLUGIN_ROOT}` shows up literally (you opened this file by path, not as a loaded skill), use the plugin's folder instead: the one holding `skills/` and `kit/`, two folders up from this file.
- Then run `npm run doctor`. Fix anything red before writing a frame.
- Existing film: read its `notes.md` and run `npm run frames` before anything else.

| Command | What it does |
|---|---|
| `npm run setup` | Installs node deps, the Python venv, ffmpeg, stand-in audio, then mixes |
| `npm run doctor` | Checks node, python, ffmpeg filters, Remotion, cores, RAM, disk, Blender |
| `npm run studio` | Opens Remotion Studio |
| `npm run check` | Types, cue list, splice guard, missing SFX, banned blur imports, clearance (draft) |
| `npm run frames` | Each scene's film frames, seconds and beats |
| `npm run where -- <s>` | A timestamp to its scene and beat: `13.20s f396: scene reveal, local beat 4.5` |
| `npm run scene -- <scene>` | Half-size muted render of one scene, contact sheets labelled in film time |
| `npm run stills -- <f...>` | Full-size stills from one bundle, plus a sheet |
| `npm run blurstill -- <f>` | One frame with the final's 16-pass shutter blur |
| `npm run sheets -- <mp4> [fps]` | Contact sheets of a whole draft or final, labelled in film time |
| `npm run assets` | Every logo, face and 3D shot on one labelled sheet, `out/assets.png` |
| `npm run mix` | Cues to `out/sound.json`, then `public/mix.wav` |
| `npm run audio:check` | The no-ears audio bar, and `out/cue-sheet.png` |
| `npm run draft -- <out.mp4>` | One-pass full-size review cut with the mix |
| `npm run final -- <out.mp4> --release` | 16-pass shutter-blurred master, then measured LUFS and true peak |
| `npm run clearance` | Song licence, consent of each real person, 3D quality. `--release` blocks |

- For a real product, replace `src/brand.ts` (colours, font, easings, the mark and its outer outline for the iris), `src/content.ts` (every word, people, logos), `src/score.ts` (which scene meets the song's break; it names scene keys), `src/music.json` (via `npm run music:grid`), `src/beats/` and `src/scenes/`. Keep `src/film.ts` as the one scene order.
- The demo's 3D coin is a stand-in. `scripts/py scripts/make_demo_shot.py` re-skins it from `brand.ts`. To drop it, delete `public/3d/spin/`, its key in `public/3d/manifest.json` and its `<Shot>` uses.
- Never fork `src/engine/` or `src/parts/` for one film. If the engine has a bug, fix it in the kit so every film gets it.

## 4. Brief: ask early, ask well

- Ask with the question tool in the first minutes. 2 to 4 multiple-choice items per round, the recommended option first and marked.
- Give concrete previews: ASCII mock-ups of 4 visual worlds, 4 scripted directions from calm to provocative. The user mostly took the recommendation or wrote back a sharper idea.
- Ask only what only the user knows: audience, risk appetite, brand, who may appear, legal stance, what their own phrase meant. "tap into famous CT personalities" turned out to mean "Real accounts in the social bit", not memes.
- Infrastructure is your job. Find the GPU host, the token, the font yourself. Asking twice about a GPU box wasted two rounds ("figure it out").
- The full question bank, with options and picks: [questions.md](questions.md).

## 5. Research

- Study the product from its code and site: real components, colour and easing tokens, the real CTA and tagline, the mascot or logo SVG. The film reuses all of them.
- Study 5 to 15 reference films. `npm run refs -- <video> <outdir>` turns each into cuts, BPM, transients, loudness, transcript, Shazam IDs, labelled sheets and a spectrogram.
- Fan out analysts with one shared brief, [research-brief.md](research-brief.md), using `launch-film:team`.
- Verify the most surprising claims at the source before writing them up.

## 6. Story

- Write 3 or 4 directions, each as a beat list, from calm to provocative. The user picks one.
- Then load `launch-film:craft` for the spine (build, quiet question, drop as the reveal), hooks and read times.

## 7. Song first

- Load `launch-film:sound`. Picture is cut to the song, never the other way. Pasted agency advice the user endorsed: "Definitely, definitely, definitely do the opposite."
- Audition links go in your final message, never before a question box. The user asked three times ("where ? i cant see them here").
- A taste pick the user delegated ("your pick bro") is provisional. Keep the song swappable: one `music.json`, scenes in beats.

## 8. Grid and budget, top down

- Order: total length, then the song's landmarks, then each scene's share in beats.
- Landmarks: the quiet bar holds the question, the drop is the reveal, the break is the hero shot, the re-drop is the logo.
- Auni: beat_s 0.3454, film beats -28 to 86, drop at beat 0, break at film beat 72, CTA at 78. Seven scenes: 20, 8, 26.5, 8.5, 17, 20, 14 beats.
- A budget is a ceiling, and every lane spends its ceiling. In Auni v6 the post-drop scenes grew 15.5 beats and the close missed the song's break. Make the ceilings sum to a landmark, or a landmark plus whole phrases.
- The rule `npm run check` enforces: the beats from the drop to the start of the close, minus the song's break beat, must be a whole number of phrases. Scenes before the drop never count: they end on beat 0.

**Teasers (8 to 15s).** RESEARCH: a 5 to 12s mystery teaser the day before often beat the launch itself on organic reach (Linear 11s, Robinhood 7s). Not made by us yet.

- The budget is `seconds / beat_s` beats. 12s at 150 BPM (beat 0.4s) is 30 beats.
- The "drop at 5 to 10s" rule is for 30 to 40s films. For a teaser (THEORY): the drop about a third of the way in, 2.5 to 5s, so the hook has time for one question.
- Worked on the kit's demo song (break at song beat 24, 8-beat phrases, a close of 8 beats: the 4-beat break plus 4 beats of re-drop for the logo):

```
 30 beats = hook + (drop -> close) + close 8
 close 24 beats after the drop (no jump):        hook -2            impossible
 close 16 beats after the drop (song jumps 8):   hook 6,  reveal 16  drop at 2.4s, most product
 close  8 beats after the drop (song jumps 16):  hook 14, reveal 8   drop at 5.6s, most tension
```

- Pick the row that fits what the teaser must show, or pick a song whose break comes sooner. `npm run frames` then confirms the split.

## 9. Build

- Each scene is `src/beats/<scene>.json` plus `src/scenes/<scene>.tsx`, exporting the picture and `sounds(add)` on the same beats.
- Eight rules. Every one was paid for with a rejected cut:
  - every motion makes a sound (Auni: 352 cues in 39.4s);
  - nothing is ever fully still;
  - fast in, hard brake, slow creep;
  - text is its own scene, never an overlay;
  - show the mechanism as a tiny scene, not a list of facts;
  - real assets, never generated decoration;
  - fill the frame;
  - about 1s of sharp read per key line.
- Load `launch-film:craft` for any scene, `launch-film:sound` for cues, `launch-film:assets` for 3D, logos and people.

## 10. Review before showing

- Always run `launch-film:review` before a cut leaves your hands.
- Prove the final render early, on one calm frame and the fastest whip (`npm run blurstill`), not at the end. In Auni the browser's blur banded every gradient, and it was found after a 25-minute render.

## 11. Show

- `npm run draft -- out/<name>-vN-draft.mp4`.
- The message holds, in this order:
  - the file path;
  - a seconds-to-scene map from `npm run frames`;
  - each of the user's notes, then what changed for it;
  - the one judgement call you made;
  - the before-you-post list (licence, consent, stand-ins).
- All links and media go in the final message.
- The user ends rounds with "Any questions?". Answer with real questions or a clear "no questions".
- During long renders, give an ETA and say what is in the cut.

## 12. Notes rounds

- Keep the ledger in `notes.md`. Format and rules: [notes-ledger.md](notes-ledger.md).
- Read each note literally. "the top of the card" meant its generated icon, not the header colour. Claude restyled the header three times and got "i've asked you sevreal times to change the card style at the top".
- A repeated note means the exact element named was not changed. Check that element before showing again.
- Protect what the user praised ("I love the transition"). It survived every later version.
- Route timestamps with `npm run where -- <s>`. Timestamps go stale when scene lengths change.
- Fix how a scene looks or moves with `launch-film:craft`, its sound with `launch-film:sound`, then check each note's element with `launch-film:review`.
- Small notes: do them directly (v6.1 was two notes, done by hand). A round spanning 3 or more scenes, once the structure is stable: `launch-film:team`.

## 13. Final and post

- `npm run final -- out/<name>-vN.mp4 --release`. On 16 cores, 7 to 10 minutes for a 12s film and 16 minutes for 40s (each pass has a fixed start-up cost), and about 0.5 GB of temporary disk per second of film. It prints an estimate once the first pass is done; pass that on to the user.
- Read the measured LUFS and true peak it prints. Target about -14 LUFS, true peak under -1 dBTP, measured on the mp4.
- Clearance must pass: the song's licence, each real person's consent, CPU-tier or stand-in 3D shots replaced.
- Posting tips are RESEARCH only, untested: the link in the first reply, a 4:5 cut, a 5 to 12s teaser the day before, the founder replying for the first hour.

## 14. What moved the film from "decent" to "so fire"

Sound density first, then story, real 3D, every idea as a scene, frame discipline, reading time and process. The ranked list, with the version where each landed: [worked-example.md](worked-example.md) section 6.
