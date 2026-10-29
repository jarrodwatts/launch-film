# The mix, and how to check it without ears

`npm run mix` runs two steps: `scripts/cues.ts` writes `out/sound.json` from every scene's
`sounds(add)` and the song's splice, then `scripts/mix.py` turns it into `public/mix.wav`. Renders
are muted; `draft` and `final` mux `mix.wav` onto the picture.

## 1. What the mix does, in order

1. **Song parts.** `sound.json` lists where each part of the track plays (`at_s` in the film, `track_s` in the file). Each part plays until the next starts, stereo, 48 kHz, with a 12 ms crossfade at each jump so it doesn't click.
2. **Each cue.** Load it, find its peak (from `public/sfx/stats.json`, or the loudest point inside `keep`), and start it at `at - peak`, so the **loudest point lands on `at`**. Normalise it to its own sample peak, then scale to `db`. Pan with equal power (`sqrt(0.5 * (1 plus or minus pan))`, times 1.41 so centre is unity).
3. **Multi-event files.** A file with several separate events (in `stats.json` `events`) is trimmed to the event that holds its peak, unless the cue says `whole`. `keep` trims to the first `keep` seconds with a 25 ms fade.
4. **Music fade-in** between two film beats (`MUSIC.fadeIn` in `src/score.ts`), on a squared curve. On Auni the music rose under the typed opening, as the user asked: the music "might be kinda fading in or ramping up".
5. **Ducking.** An envelope of the effects' loudness, smoothed over 30 ms. Music gain is `1 - 0.25 * env / env.max()`, so the music dips at most about 2.5 dB under the loudest effect. Music also sits at 0.8 (-1.9 dB).
6. **Ends.** A 40 ms fade in and a 0.6s fade out.
7. **Loudness.** Normalise to the target (-14 LUFS integrated). Then measure true peak with 4x oversampling. Only if it is over the ceiling (-1.5 dBTP), apply a look-ahead limiter (5 ms look-ahead, 50 ms release).
8. **Report.** It prints the cue count, length, LUFS and true peak, and warns on any cue missing from `stats.json`.

Both numbers live as constants at the top of `scripts/mix.py`. Pick one target and keep it in one place.

## 2. Why the target is measured on the mp4

Measured on the Auni film's files with ffmpeg `ebur128`:

| File | Integrated | Sample peak | True peak |
|---|---|---|---|
| `public/mix.wav` | -13.4 LUFS | -4.3 dBFS | -4.3 dBTP |
| before its "limiter" | -13.0 LUFS | -2.5 dBFS | |
| `film-v6.1.mp4` (AAC 256k) | -13.4 LUFS | -2.1 dBFS | **-0.6 dBTP** |

What these numbers taught:

- **The tanh "limiter" never limited.** Peaks were already at -2.5 dBFS. tanh is a waveshaper on every sample, not a peak limiter: it cost 0.4 LU and added mild distortion to the whole mix. The kit uses a real look-ahead limiter, and only when the measured true peak needs it.
- **Encoding raised the peak by 4 dB** (at 22.09s, a burst of bright pops and fast whooshes). Sharp, bright transients overshoot in AAC, and X re-encodes again. That's why the kit limits to -1.5 dBTP before encoding and `npm run final` measures the mp4 and warns above -1.0 dBTP.
- **The target:** X publishes no loudness spec. -14 LUFS integrated with true peak at -1 dBTP or lower is the common social-video target; -13 to -14 is right for a hype launch. Auni's code said "near -14", tuned to -13 "to land near -14 after limiting", and delivered -13.4. One constant and one printed measurement would have avoided all of that.
- **Loudness range stays tiny** (Auni: LRA 2.2 LU), the same flat, loud style as the reference studio's films. The only quiet moments are the opening fade-in and the quiet bar before the drop (3s windows at -16.4 LUFS against about -13 elsewhere).

## 3. Failures, and how the kit prevents each

| Failure | What happened on Auni | What the kit does |
|---|---|---|
| Synthetic SFX | v1's generated sounds "kinda suck", ruining the premium feel | Generated sounds ship only as timing stand-ins; [sourcing.md](sourcing.md) says to bring a real pack |
| Drop detection fooled by silence | +130 dB "drops" from tracks starting at digital silence | `music:scan` ignores windows quieter than the median minus 18 dB |
| One capped score | 91 of 465 tracks tied at 30 | `music:scan` ranks on three measures |
| Grid off | 162 ms median error on a syncopated half-time track | `music:grid` fixes BPM, finds the drop from the bass, fits phase to kicks, fails above 30 ms |
| Tempo octave errors | 64.6 and 80.7 BPM readings on half-time music | Pass `--bpm`; `music:scan` flags readings under 90 as possibly half-time |
| Wrong download or version | Another artist's song; a vocal version | `music:fetch` Shazams and refuses mismatches |
| Audition with no drop | 2 of 10 clips flat at the drop point | `music:audition` refuses clips under a 10 dB bass jump |
| User never saw the auditions | Links above a question box were invisible | The skill: links go in the final reply |
| Licence found late | Major-label songs carried into v6 | `licence` lives in `music.json`; `clearance -- --release` blocks the final |
| Scenes outgrew the song | The close 16 beats late against the break | `song()` splices whole phrases on a cut and throws with the fix otherwise |
| Cues far from their picture | One central cue file drifted | Each scene exports `sounds(add)` |
| Cues off the grid | Hits at `morph + 13 frames` skipped the grid | Big moments are named beats in `beats/<scene>.json`; `audio:check` checks coverage |
| Masked cue | Lockup swish on the same instant as a boom and a riser | `audio:check` flags a cue within 40 ms of a louder one on the same side |
| Exit whoosh late | Peaked 6 frames after the move started | Peak placement, plus the cue sheet PNG to see it |
| **Stray ping** | `iphone_message` holds two pings (6.0s and 12.55s in the file). It was placed by the second, so the first played at 20.7s, **6.6s before the send** it belonged to. Shipped in v6.1 | `sfx_stats.py` counts separate events; the mix keeps only the event holding the peak; `audio:check` flags multi-event files placed without `keep` or `whole` |
| **Off-grid hits** | `cinematic_hit` is a 24s file of many hits peaking at 16.3s. Placed on "found" (13.5s), its earlier hits played at about 1.2, 4.2, 6.3, 8.7 and 11.3s, off the grid, 8 to 10 dB under its peak. Shipped in v6.1 | Same as above |
| Pack's own peak data wrong | 13 of 57 files differed from the pack's `peaks.json` by more than 50 ms (`iphone_message`: 12.68s measured vs 6.125s listed) | `sfx_stats.py` measures every file and warns where they disagree |
| tanh "limiter" | Coloured the whole mix, never limited | A real look-ahead limiter, only when needed |
| Encoder overshoot | AAC raised the peak 4 dB to -0.6 dBTP | Limit to -1.5 dBTP before encoding; `final` measures the mp4 |
| Agents can't hear | Judges: "I checked the cue code against the motion code but did not listen to the mix" | `audio:check` and its cue sheet PNG |

## 4. The no-ears bar: `npm run audio:check`

What it checks, and what a pass means:

- The delivered mp4, when given one: integrated loudness within 0.5 LU of -14, true peak at -1 dBTP or lower.
- Every cue's file exists. No cue starts before 0 or ends after the film.
- No multi-event file is placed without `keep` or `whole`.
- **Coverage:** named moments in each `beats/<scene>.json` with no cue within 2 frames. This is the every-movement rule made checkable. Some moments are intentionally silent (the quiet bar); say why in the scene.
- **Masking:** a cue within 40 ms of a louder cue on the same side.
- **Density:** cues per second, printed, so quiet bars and pile-ups show.
- **Song parts:** each jump is on a phrase boundary and on a scene cut, with an RMS step under 3 dB.
- **`out/cue-sheet.png`:** the mix's spectrogram with the beat grid, scene boundaries and every cue labelled. Judges read this instead of guessing. Look at it for the scene you changed.

After any refactor that shouldn't change the sound, diff the cue list: save `out/sound.json` before, run `npm run mix`, and compare count and times. When Auni's cues moved from one file into the scenes, the check read "236 236 identical".
