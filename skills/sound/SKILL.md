---
name: sound
description: Music and sound design for a launch film. Pick the song first, by ear, from auditions cut so their drop lands on the film's drop. Lock its beat grid and drop, and fit the film to it with phrase splices. Give every movement a matching sound, placed by its measured peak. Mix to about -14 LUFS with true peak under -1 dBTP, measured on the delivered file. Use when choosing, auditioning or swapping music, bringing your own SFX pack, adding or fixing sound effects, mixing or checking licences. Also use when a note says the sound or music isn't premium or hype enough.
---

# Sound for a launch film

Sound is half of "premium". On the Auni film the first critique opened with it: "the sound effects kinda suck which i think ruins the premium feeling". The fix was not cleverer code. It was a real SFX pack, a real song, and a sound on every movement. This skill covers the song, the effects and the mix. Commands are the film repo's (`npm run ...`), made by `${CLAUDE_PLUGIN_ROOT}/kit/scripts/new-film.sh`.

## 1. The ten rules

1. **Real SFX are the single biggest jump in perceived quality.** Generated sounds are for timing only. Auni v1's sounds were synthesised from code; the user's verdict above came first in the first round of notes.
2. **Every movement makes a sound.** The user: "any movement or click or mouse move or transition or loading spinner or anything should have an associated sound effect... sound effects secretly apply a polished premium feel. Dont be afraid to really use a lot of sound effects." The final film had 352 cues in 39.4s, about 9 a second.
3. **A sound matches something on screen.** "sound effects should try *match* some visual effect": a shine sound on a gloss sweep, a riser into a glow. No sound without a cause, and big moments get a visible flourish for the sound to sit on.
4. **Pick the song before you animate.** The film is cut to the song's grid, not the other way round. Fast is about 150 BPM, medium 120, slow 100.
5. **Count everything in beats.** Beat 0 is the drop. `beat_s` turns beats into seconds. Picture and sound read the same beat names, so they can't drift apart.
6. **The drop is the reveal.** Tension before it (a quiet bar holding the question), the product's first appearance exactly on it.
7. **Place each sound by its loudest point, not its start.** A whoosh peaks on the cut; a riser ends on the drop. The kit measures every file's peak once (`public/sfx/stats.json`).
8. **Write cues next to the picture**, in the scene's own `sounds(add)`, on the same beats and the same helper functions the motion uses.
9. **Measures shortlist, ears choose.** You can't hear. The best-measured track of 465 (+71 dB bass jump) was "not hype enough". Check the licence before anyone falls in love with a song.
10. **Measure the file you deliver.** Encoding to AAC raised Auni's true peak by 4 dB. Loudness is read off the final mp4, never the wav.

## 2. The pipeline

```
 refs -> identify (Shazam) -> licence -> candidates -> scan drops -> auditions
                                                                        |
                                                    USER PICKS BY EAR <-+
                                                            |
 lock grid (BPM, drop, phase) -> music.json -> scenes in beats -> sounds(add)
                                                                        |
 measure the delivered mp4 <- draft/final <- mix.wav <- splice (song()) <+
```

## 3. The steps

- **Study the references.** `npm run refs -- <video> out/refs/<name>` for each reference film. Read `analysis.json` and `audio_vs_cuts.png`. Expect cuts on sound hits more than on beats (the reference studio: 26 of 28 cuts on a transient, 14 of 28 on a beat). Shazam runs at 3 points, which catches films that switch songs.
- **Fetch clean copies.** `npm run music:fetch -- "<artist> <title> [instrumental]"`. It refuses a file Shazam names differently. Prefer instrumentals: vocals fight on-screen text.
- **Licence first.** Before shortlisting, write each song's route in the table from [music.md](music.md). A major-label song needs sync plus master licences: five figures, weeks, and it may be refused.
- **Find the drops.** `npm run music:scan -- <folder>` ranks a folder on three measures. `npm run music:grid -- <file> --drops` lists every drop in one song, with its build.
- **Audition.** `npm run music:audition -- <file> <drop_s> [--film-drop 9]` cuts a 20s clip with the drop where the film's drop is, and refuses clips with no real bass jump. Send YouTube links timed about 9s before each drop (the script prints them) **in your final message**. Links written above a question box were never seen: "where ? i cant see them here".
- **If the user delegates the pick** ("your pick bro. use your best judgement"), build on your best guess but call it provisional. Auni's delegated pick was rejected on the next listen. Swapping is a re-map of beats, not a rebuild.
- **Lock the grid.** `npm run music:grid -- public/music/<file> --bpm <n>`. It fixes the tempo, finds the drop from the bass, fits the phase to the kicks, and fails above 30 ms of error. It prints a bar table and writes `src/music.json`. Then set `licence` in it.
- **Map sections to scenes.** Quiet bar holds the question, drop is the reveal, break is the hero shot, re-drop is the logo. See [music.md](music.md) section 6.
- **Check the seams.** `npm run music:seams` scores every phrase jump. The engine's `song()` splices on a scene cut when scenes run long or short, and `npm run check` throws a message with both fixes when the lateness isn't whole phrases.
- **Write `sounds(add)`** next to each scene's picture, using roles (`v("whoosh", i)`), not file names. The event-to-sound table is [sfx-vocabulary.md](sfx-vocabulary.md).
- **Mix and check.** `npm run mix` prints cues, length, LUFS and true peak. `npm run audio:check` runs the no-ears bar and writes `out/cue-sheet.png`. Read the PNG.

## 4. What you can and can't hear

You can't judge taste. You can prove a lot without ears:

| Question | How to check it |
|---|---|
| Did a refactor change the sound? | Diff `out/sound.json` cue lists before and after (Auni: "236 236 identical") |
| Is it loud enough, and safe? | `npm run final` prints LUFS and true peak of the mp4 |
| Is the splice invisible? | `npm run music:seams`: 0.9 or more, under 3 dB step |
| Does every motion have a sound? | `npm run audio:check` lists named beats with no cue within 2 frames |
| Is a cue buried? | `audio:check` flags a cue within 40 ms of a louder one on the same side |
| Where are the gaps and pile-ups? | Cues per second, printed by `audio:check`, and the cue sheet PNG |

Say the limit out loud to the user: "My numbers can only tell you a track has a drop, not that it sounds expensive."

## 5. Bring your own audio

The kit ships generated stand-ins so timing works on day one. They are not good enough to show anyone. Full steps are in [sourcing.md](sourcing.md).

- **SFX pack:** copy files into `public/sfx/`, run `npm run sfx:stats`, map each file to a role in `public/sfx/roles.json`, run `npm run check` (it fails on any cue whose file is missing).
- **Song:** put it in `public/music/`, run `npm run music:grid -- public/music/<file> --bpm <n>`, set `licence` in `src/music.json`, run `npm run check`. The splice guard tells you how many beats to add or cut.
- **Never commit licensed audio** to a public repo, and never put any audio into the plugin itself. The kit's `.gitignore` already keeps `public/music` and `public/sfx` audio out.

## 6. Reference files

| File | What it holds | Read it when |
|---|---|---|
| [music.md](music.md) | Tempo bands, reference songs, clean copies, licences, scanning, drop maps, auditions, the grid lock with numbers, `music.json`, mapping sections to scenes, the phrase splice | Choosing, auditioning, locking or swapping a song |
| [sfx-vocabulary.md](sfx-vocabulary.md) | Visual event to sound, by kit role, with timing and level; layering, density, panning, the levels guide | Writing or reviewing any scene's `sounds(add)` |
| [mix.md](mix.md) | The mix steps, the measured loudness table, every failure and how the kit prevents it, the no-ears bar | Running or debugging the mix, before the final |
| [sourcing.md](sourcing.md) | Where SFX and music come from and their licences, installing your own pack and song, what never ships | Day one of a real film; any licence question |

Related: `launch-film:make` owns the grid and budget ([../make/SKILL.md](../make/SKILL.md)); `launch-film:review` checks sound coverage before any cut is shown ([../review/SKILL.md](../review/SKILL.md)); `launch-film:assets` covers sounds for 3D moves ([../assets/SKILL.md](../assets/SKILL.md)).
