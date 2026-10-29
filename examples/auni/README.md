# The Auni launch film (worked example, read-only)

The source of the Auni launch film, copied from its own repo at commit `1cef948` (v6.1, 39.4s,
"this is so fire dude"). A few things were changed for sharing: the real people who copy the
position are fictional placeholders, reference and song names are generic, and machine paths come
from the environment. The plugin's starter kit (`../../kit`) was generalized from these files. Read
them to see how a real film used each piece, at full size and with all its specifics.

**It won't build.** It has no `package.json`, no `public/` folder (no song, no SFX pack, no faces, no
logos, no 3D frames), no `src/vendor/` components and no `brand.css`. Some scripts take tool and song
paths from the environment (`FFMPEG`, `PYTHON`, `SHEETS`, `TRACKS`). To make a film, start from the kit:
`bash ../../kit/scripts/new-film.sh <dir>`.

How the film is laid out, scene by scene and beat by beat, and how it got there over seven rounds:
`../../skills/make/worked-example.md`.

## What each file shows, and what it became in the kit

| File | What it shows | Kit piece it became | The lesson behind it |
|---|---|---|---|
| `src/beats/*.json` | Each scene's moments in beats, counted from its own start, with a `length` | `kit/src/beats/` (contract C3) | One shared timeline meant one edit moved every later number. Relative beats let five agents grow five scenes at once with no conflicts |
| `src/motion.ts` | `place()` and `timeline()` chaining scenes onto the song's grid (drop = beat 0); `beat`, `bf`, `ramp`, `land`, the brand's curves | `kit/src/engine/motion.ts`, with the scene order moved to `kit/src/film.ts` | Scenes before the drop chain backward from it, so the drop and the reveal stay locked whatever the opening's length |
| `src/music.json` | The grid: drop at 83.49s in the file, beat 0.3454s, sections in beats, the licence note | `kit/src/music.json` (contract C2), written by `npm run music:grid` | Beats instead of seconds: changing the song changes one file |
| `src/sound.ts` | The `Cue` and `Add` types, the levels guide, a list of whoosh files | `kit/src/engine/sound.ts`, with roles (`v("whoosh", i)`) in place of file names | Levels in tiers: transitions -10 to -14 dB, UI -14 to -18, texture -20 to -26 |
| `src/cues.ts` | `cues()` gathering every scene's `sounds(add)`; `song()` jumping the track back whole 16-beat phrases on the cut into social | `kit/src/engine/cues.ts`, with the splice generalized to `breakOn` / `spliceAt` in `kit/src/score.ts` | When scenes grow, the song's break must still land on the close. The build refuses an offset that isn't whole phrases |
| `src/scenes/*.tsx` | Each scene's picture and its `sounds(add)` on the same beats | `kit/src/scenes/` plus the one registry in `kit/src/scenes/index.ts` | Cues listed apart from the picture kept getting missed. Written together, "add a sound to every motion" is one line |
| `src/scenes/reveal.tsx` | The keyed 3D camera over one stage (`camera`, `project`); the `Cursor` that glides, presses at 0.82 and ripples | `kit/src/engine/camera.ts`, `kit/src/parts/Cursor.tsx` | The flagship-grade 3D showcase: orbit, push in, rack to the button, tap, land face-on |
| `src/scenes/flip.tsx` | The reveal frozen on its real last frame (`<Freeze>`) and carried off by the whip | `kit/src/parts/LastFrameOf.tsx` | A whip that starts from nothing is "not a real transition". Drawing the neighbour's real last frame can never drift out of sync |
| `src/scenes/offerings.tsx` | The accelerating roller and `rollTicks()`, used by both the picture and the sound | `kit/src/parts/Count.tsx` and `reaches()` | Derive cue times from the same function the animation uses, so picture and sound can't drift |
| `src/scenes/build.tsx` | The typed opening, posts stacking, the wall, the punch and shake, the question | `kit/src/parts/Typed.tsx`; the demo's `hook` scene | Start slow (typing over a fading-in song), then accelerate |
| `src/scenes/close.tsx` | The mascot big and centred through the break, then dropping into the lockup | the demo's `close` scene | "why's he kinda just chilling on the right side really small at the end" |
| `src/Root.tsx` | The `Film` composition at a fractional `shift`, scenes as `Sequence`s inside a `Freeze` | `kit/src/Root.tsx`, with a leading shutter (`frame + shift`) | This file freezes at `frame - shift`, a trailing shutter, so 15 of 16 passes draw the old scene on a cut frame. The kit leads instead |
| `src/parts.tsx` | Brand colours and headline type, `Sky` (the site's background), `MascotIris` | `kit/src/brand.ts`, `kit/src/parts/Backdrop.tsx`, `kit/src/parts/Iris.tsx` | One world for the whole film, from the product's own site |
| `src/card.tsx` | The CSS 3D position card, `Gloss`, `Coins`, `Confetti` | `kit/src/parts/Gloss.tsx` | perspective 1600, 8 stacked layers for thickness, a 115-degree sweep in screen blend |
| `src/ui.tsx` | X posts, avatars, `Mark` (a logo in a disc), `reaches()` for counts, `Mascot3D` playing rendered frames | `kit/src/parts/Mark.tsx`, `Count.tsx`, `Shot.tsx` | Floor sub-frames, loop with a safe modulo, retime a shot instead of re-rendering it |
| `src/data.ts` | Every word, person and logo; `logoFile` and `logoFit` per logo | `kit/src/content.ts` (contract C8) | One fit rule per logo; real accounts marked as real |
| `src/LogoSheet.tsx` | Every logo drawn as the film draws it, labelled | `kit/src/parts/AssetSheet.tsx`, `npm run assets` | It caught the off-looking Aave, Base, Jupiter, xStocks and Polymarket marks |
| `scripts/mix.py` | Each cue placed by its measured peak, ducking, the song's jumps, loudness to about -14 LUFS | `kit/scripts/mix.py` | Its `tanh` "limiter" never limited; the kit measures true peak and limits only when over |
| `scripts/final.sh` | 16 shifted ProRes passes averaged in ffmpeg at 10 bits | `kit/scripts/final.sh` | Remotion's in-browser blur rounds each copy to 8 bits and bands every gradient |
| `scripts/scene.sh` | One scene, half size, muted, plus contact sheets | `kit/scripts/scene.sh` and `sheet.py`, labelled in film time | Notes come as film timestamps; sheets must speak the same time |
| `3d/mascot.py` | The mascot built in Blender from its own SVG paths: inflate, raycast features, shots | `kit/3d/character.py` reading `kit/3d/character.json` | Real 3D from the brand's own shapes, after a 2D fake was rejected |

## Not copied

- `public/`: the song, the user's SFX pack, profile pictures, logos and rendered 3D frames. Licensed
  or personal; none of it may ship.
- `src/vendor/` and `brand.css`: components copied from Auni's app.
- `src/belief.tsx` and an older song's grid file: Auni-only.
