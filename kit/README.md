# Launch film kit

A Remotion 4 engine for a 30 to 40 second product launch film (1920x1080, 30 fps, one song, no
voiceover), plus a 12.8 second demo film for a made-up product, Acme, that renders out of the box
with generated stand-in audio. It was generalized from a real 39.4 s launch film: 7 scenes, 352
sound cues, a 16-pass shutter blur. Nothing in the engine knows what your product is.

## Start a film

```
bash <plugin>/kit/scripts/new-film.sh ~/films/my-product
cd ~/films/my-product
npm run doctor        # all green?
npm run studio        # the demo, live
```

`new-film.sh` copies the kit into its own folder and git repo, runs `npm run setup` (node packages,
a Python venv in `.tools/`, a full ffmpeg, the demo's stand-in audio and 3D shot, a first mix) and
commits. About 1.5 minutes. The film owns its copy, so it never breaks when the plugin moves. Needs
node 20+, Python 3.11+, and network for npm, pip, ffmpeg, Google Fonts and Remotion's headless Chrome.

## How it fits together

```
 public/music/<song>  --music:grid-->  src/music.json   (beat 0 = the drop; sections in beats)
                                            |
 src/beats/<scene>.json  (moments in beats, from the scene's own start, plus its length)
                                            v
 src/film.ts  SCENES = the order  -->  src/engine/motion.ts  T.reveal.tap, beat(), bf()
                                            |
        +-----------------------------------+------------------------------+
        v                                                                  v
 src/scenes/<scene>.tsx  export Scene()  (picture)          export sounds(add)  (cues, same beats)
        |                                                                  |
 src/Root.tsx: one Sequence per scene,               src/engine/cues.ts + song() splice guard
 inside <Freeze frame={frame + shift}>                      |  npm run mix
        |                                            out/sound.json --scripts/mix.py--> public/mix.wav
        v                                                                  |
 npm run scene / stills / blurstill / draft     npm run final: 16 shifted passes, averaged in ffmpeg
```

- **Time is beats.** Scenes before the `drop: true` scene end exactly on beat 0; the rest follow.
  Any scene can grow or shrink without touching another, and every cut stays on the music.
- **Picture and sound are written together.** Each scene file exports its picture and
  `sounds(add)`, using the same beats and the same helper functions (`reaches()` for count
  ticks), so a moved beat moves its sound.
- **The mix places each sound by its measured loudest point**, not its file start.
- **The song is edited by the code.** If the scenes before the song's break run long or short, the
  track jumps whole phrases on a hidden cut (`src/score.ts`), or the build stops and says how many
  beats to add or cut.
- **Blur is real shutter blur**, from passes averaged in ffmpeg at 10 bits. Never Remotion's
  `CameraMotionBlur` (8-bit stacking bands every gradient); `npm run check` rejects it.

## Commands

| Command | What it does |
|---|---|
| `npm run setup` | Installs everything into the project; fills in the demo's stand-ins only where yours are missing. `-- --extras` adds the music-hunt tools. |
| `npm run doctor` | Node, Python, ffmpeg filters, Remotion, cores, RAM, disk, Blender, song, SFX. |
| `npm run studio` | Remotion Studio: scrub the film live. |
| `npm run check` | Types, the song splice guard, every cue measured, no motion-blur or `Math.random`, clearance. Run before any render and after every merge. |
| `npm run frames [-- <scene>]` | Each scene's film frames, seconds and beats. |
| `npm run where -- <s>` | A timestamp from a note to scene, frame and local beat: `5.00s f150: scene reveal, local beat 4.5`. |
| `npm run scene -- <scene>` | One scene, half size, muted, about 5 to 50 s, plus 4x4 contact sheets labelled in film time (`out/scenes/<scene>/`). |
| `npm run stills -- <f> [f...]` | Full-size stills from ONE bundle, 4 at a time, plus labelled sheets of 16 (`out/stills/`; every sheet is printed). |
| `npm run blurstill -- <f> [n]` | One frame with the final's shutter blur (16 shifts, averaged): `out/blur/f<f>.png`. |
| `npm run sheets -- <mp4> [fps=3]` | Contact sheets of any rendered cut (a draft, a final), labelled in film time: `out/sheets/<name>/`. |
| `npm run assets` | Every logo, face and 3D shot as the film draws them: `out/assets.png`. |
| `npm run mix` | Cues to `out/sound.json`, then `public/mix.wav`: -14 LUFS, true peak at most -1.5 dBTP. |
| `npm run audio:check [-- --mp4 f]` | The no-ears bar, and `out/cue-sheet.png` (spectrogram, beat grid, cuts, every cue). |
| `npm run sfx:stats` | Measures `public/sfx` into `stats.json`. |
| `npm run music:grid -- <song> [--drops] [--bpm n] [--drop s] [--phrase 16]` | Finds drops, locks the beat grid, writes `src/music.json`. |
| `npm run draft -- out/<name>-vN-draft.mp4` | The review cut: one pass, no blur, with the mix. |
| `npm run final -- out/<name>-vN.mp4 --release` | The master: 16 ProRes passes, averaged, x264 crf 16, AAC 256k; checks frame count, prints LUFS and true peak. On 16 cores 7 to 10 min for the 12.8 s demo and 16 min for 40 s (each pass has a fixed start-up cost), and about 0.5 GB of temporary disk per second of film; it prints an estimate after the first pass. Ctrl-C stops every pass. |
| `npm run clearance [-- --release]` | Song licence, consent per real person, face sources, 3D quality. |
| `npm run refs`, `music:fetch`, `music:scan`, `music:audition`, `music:seams` | Music hunt (needs `setup -- --extras`). See `launch-film:sound`. |
| `npm run people -- <handle>...` | Real accounts' pictures and Person entries (consent "pending"). |
| `npm run blender:install`, `shot`, `shot:debug`, `shot:compare` | Real 3D shots from `3d/character.json`. See `3d/README.md`. |
| `npm run lane -- <name> <paths...>`, `merge-lane -- <name>` | A git clone per area of notes, and a merge that refuses files the lane doesn't own. |

## Files

| Path | What it is | Yours to change? |
|---|---|---|
| `src/film.ts` | Size, fps, and the scene order. | Yes |
| `src/brand.ts` | Colours, font, headline style, easing curves, the logo mark path. | Yes |
| `src/content.ts` | Every word on screen, `PEOPLE`, `LOGOS`. | Yes |
| `src/score.ts` | Which scene meets the song's break, where the song may jump, the fade-in. It names scene keys: update it when you rename or replace scenes. | Yes |
| `src/music.json` | The song's grid (from `music:grid`) and its licence. | Yes |
| `src/beats/*.json` | Each scene's moments in beats. | Yes |
| `src/scenes/*.tsx`, `scenes/index.ts` | Each scene's picture and sounds, and the registry. | Yes |
| `src/engine/` | Timeline, camera, sound plan, splice guard. | No: fix bugs here for every film |
| `src/parts/` | Backdrop, Gloss, Iris, Cursor, Count, Typed, LastFrameOf, Shot, Mark, Avatar, AssetSheet. | Add props; keep defaults |
| `scripts/` | Everything the commands run. | No |
| `public/` | Your song, SFX pack, logos, faces and 3D shots. | Yes |
| `notes.md` | The ledger of the user's notes, verbatim, round by round. | Yes |

Making it your product: replace `brand.ts` (including `markOutline`, the mark's outer edge, which
the iris cuts), `content.ts`, `score.ts`, `music.json` (via `music:grid`), `beats/` and `scenes/`.
Then `scripts/py scripts/make_demo_shot.py` re-skins the stand-in coin with your mark and colour; if
you don't use it, delete `public/3d/spin/`, its key in `public/3d/manifest.json` and the
`<Shot shot="spin">` uses, or it stays on the Assets sheet and in clearance. To add a scene: `src/beats/<key>.json`, `src/scenes/<key>.tsx`, then one
line in `film.ts` and one in `scenes/index.ts` (tsc fails until both agree).

## The demo

Acme turns a group chat's plan into bookings. 32 beats at 150 BPM (one beat is exactly 12 frames).

| Scene | Frames | Song | What happens |
|---|---|---|---|
| hook | 0-95 | energy, then the quiet bar | Five messages slam in faster and faster, the camera pulls back, the chat falls away, "ok but who's actually booking it?" types alone, the camera dives into it. |
| reveal | 96-287 | the drop | The card slams in on beat 0, rows deal in, a cursor taps "Book it", the count rolls to 4 of 4 with a tick per number, the coin rises and turns, a light sweeps the card face-on, orbit, push in, settle, then the camera accelerates out. |
| close | 288-383 | the break, then the re-drop | The reveal's real last frame is carried off by the pan that brings the coin in; the coin turns through the break; a dive into it fills the frame with the brand colour; the logo's shape opens onto the lockup on the re-drop; the line lands; the CTA holds. |

The song is laid out so the splice really runs: the close starts 8 beats before the song's break,
so the track jumps forward one 8-beat phrase on the cut into the close. Make `reveal` 3 beats
longer and `npm run check` says: "The close starts 5 beats before the song's break; make the
scenes before it 5 beats longer or 3 beats shorter."

## Bring your own

- **SFX pack:** copy into `public/sfx`, `npm run sfx:stats`, map `public/sfx/roles.json`, `npm run check`. See `public/sfx/README.md`. This matters most: generated sounds are for timing only.
- **Song:** copy into `public/music`, `npm run music:grid -- public/music/<file> --bpm <n>`, set `licence` in `src/music.json`, `npm run check` (the splice guard tells you any beat fixes). See `public/music/README.md`.
- **3D:** `npm run blender:install`, edit `3d/character.json` from your brand's SVG, `npm run shot -- spin`. See `3d/README.md`.
- **Logos and people:** files in `public/logos` and `public/faces`, entries in `src/content.ts`, `npm run people -- <handle>`, then `npm run assets` and look.

Licensed audio is never committed (the `.gitignore` keeps songs and packs out) and never copied into the plugin.

## What each script prevents

Every one of these broke the film this kit came from.

| Failure | Prevented by |
|---|---|
| Shutter passes ask for frame 12.375 of an image sequence, which doesn't exist | `Shot` floors every index |
| `".".repeat(-1)` and negative `%` before a moment happens | `ramp`/`land` clamp; `mod()` stays positive; scenes are safe at any frame |
| Remotion's motion blur banded every gradient and ran Chrome out of memory | `final.sh` passes averaged at 10 bits; `check` rejects `@remotion/motion-blur` |
| Twelve parallel `remotion still` calls hung on webpack's cache | `stills.sh` and `blurstill.sh` bundle once, 4 at a time |
| A lane committed its `node_modules` symlink; the merge deleted the real folder | `.gitignore` has `node_modules` with no slash; `merge-lane` refuses files a lane doesn't own |
| A merge dropped an export another scene imported | `merge-lane` runs `check` (tsc) after every merge |
| A fresh clone 404'd on the generated `mix.wav`, even muted | `Root` mounts the audio only if it exists |
| Tools in `/tmp`, a borrowed component in a deleted worktree | Everything lives in the project: `.tools/`, `src/parts/` |
| Remotion's ffmpeg has no `mix` filter | `setup` fetches a full ffmpeg; `doctor` checks the filters |
| Contact sheets in scene time, notes in film time | Sheets label film seconds and frames; `npm run where` |
| Scenes grew past the song's break; the close played out of sync | `song()` splices whole phrases or stops the build with the fix |
| A fast whip or pan stamped sharp copies under the shutter ("YYYour tttake.") | `speedBlur()` in `engine/motion.ts`: a CSS blur from the move's own speed, used on the demo's exit and pan |
| An iris opened with the logo's holes flying over the picture as coloured bars | `Iris` cuts `BRAND.markOutline`, the outer edge only |
| Cuts landed one frame late in the final (a trailing shutter) | The shutter leads: `<Freeze frame={frame + shift}>`; the cut frame is all new shot |
| A multi-event SFX placed by its peak played a stray ping 6.6 s early | `sfx_stats` counts events; `mix` keeps only the peak's event unless `keep`/`whole` |
| A tanh "limiter" never limited; AAC added 4 dB of peak | A true-peak look-ahead limiter only when needed; `final` measures the delivered mp4 |
| A pack's own peak data was off by 50 ms or more on 13 of 57 sounds | `sfx_stats` measures every file; `check` fails on an unmeasured cue |
| A real person's consent, a song's licence, a preview-quality shot forgotten at release | `npm run clearance -- --release`, run by `final --release` |

## Licence

Remotion is free for individuals and companies of up to 3 people; larger companies need a
company licence (remotion.dev/license). The kit itself, its demo and its generated audio are yours to use.
