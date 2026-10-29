# 3d: a brand character, built from its SVG and rendered as frames

Blender turns your brand's flat mascot (or logo mark) into a soft 3D character and renders short
shots as transparent PNG frames. The film plays those frames like a flip-book with `<Shot>`, so
Remotion never needs 3D, and the shots mix with everything else (blur, masks, camera moves).

```
character.json (SVG paths, colours, lights)
      |
      v
character.py --debug   (npm run shot:debug: sizes and boxes, no render, 4 s)
      |
      v
character.py still     (npm run shot:compare -- brand.png: side by side with the brand art)
      |   repeat until it matches
      v
render-shot.sh <shot>  (npm run shot -- spin [--tier ...] [--host gpu-box])
      |
      v
public/3d/<shot>/0001.png ...  +  public/3d/manifest.json  -->  <Shot shot="spin"/>
```

## Commands

| Command | What it does |
|---|---|
| `npm run blender:install` | Portable Blender in `.tools/blender/` without root. Skipped if `$BLENDER` or `~/opt/blender.sh` exists |
| `npm run shot:debug` | Builds the model, prints each part's size and bounding box. Run after every config change |
| `npm run shot:compare -- <brand.png>` | Renders the still and puts it next to the brand art: `out/3d/compare.png` |
| `npm run shot -- <shot> [--tier preview\|cpu-final\|gpu] [--host <ssh host>]` | Renders a shot into its own job folder, checks every PNG, installs it, updates the manifest |

## Shots

| Shot | Frames | What the viewer sees | Typical use |
|---|---|---|---|
| `still` | 1 | Front pose | Avatar, poster, compare |
| `spin` | 30 | Turns in from -80 degrees and settles, hard ease-out | Entrances; play it over half the frames for a whip |
| `idle` | 60 | Breathing sway, one blink at frame 40 | Any hold. Loops |
| `hop` | 36 | Crouch, stretch, airborne, squash, settle (wider camera) | "It worked" moments |
| `fly` | 28 | A full turn while the camera dollies into the body until it fills the frame | A transition: the last frame is solid body colour |

## Tiers

| Tier | Size | Samples | Speed seen (16-core CPU / a mid-range NVIDIA GPU) |
|---|---|---|---|
| `preview` | 400 | 24 | about 12 s a frame on CPU, scene build included |
| `cpu-final` | 600 | 40 | a 28-frame fly in about 5 min on 16 threads |
| `gpu` | 800 | 96 | 10 to 20 s a frame with OptiX |

Render at least the size the shot is shown at. The manifest records the tier, so
`npm run clearance -- --release` can list shots still at preview or cpu-final.

## character.json

All lengths are in the SVG's own units. `scale` (metres per unit) is the only conversion, used for
every coordinate, depth and lift. Copy path strings and hex colours exactly from the brand's SVG.

| Field | Meaning |
|---|---|
| `origin` | SVG point that becomes the centre of the 3D scene |
| `scale` | Metres per SVG unit. Aim for a body 1.5 to 2 m wide |
| `base` | SVG point the character squashes and turns from (default: bottom centre of the body) |
| `body.path` | The silhouette. Any SVG path commands; the first closed shape is used |
| `body.centre` | Inflate centre. Every outline point must "see" it in a straight line (star-shaped) |
| `body.front`, `body.back` | How far the body bulges toward and away from the camera |
| `body.material` | `gradient` (`from`, `to`, `stops`, optional radial `blush`) or `colour`, plus `roughness`, `subsurface`, `coat` |
| `features[]` | Flaps, brows, marks: `path`, `front`, `back`, `rings`, `lift`, `material`. Each is laid onto the body by raycast |
| `eyes[]` | `at` (SVG centre), `r` (x and y radius), `depth`, `material` |
| `camera` | `base` distance (m), `hop` distance, `fly_end` distance, `height` |
| `look` | `lens` (mm), `exposure`, `world` strength, `lights.key/fill/rim.energy` and `colour` |

Shapes with deep notches, arms or holes are not star-shaped from any point, so inflate can't do
them. Build those with Blender's curve, solidify, voxel remesh and smooth instead.

## Running on a GPU box

`--host <ssh host>` checks the box answers within 8 s, copies `character.py` and `character.json`
into a fresh `lf-<shot>-<time>` folder there, renders, and pulls the frames only after Blender
exits. If the box doesn't answer it renders here at `cpu-final` and says so. Set `REMOTE_BLENDER`
to the remote Blender path. Windows hosts run PowerShell: see the notes at the top of `render-shot.sh`.

## Manifest (public/3d/manifest.json)

```json
{ "fly": { "frames": 28, "size": 800, "camera": 6.2, "base": 6.2, "anchorY": 0.85, "loop": false,
           "quality": "gpu", "lastFrameFill": "#8decd0", "source": "3d/character.py@a1b2c3d" } }
```

`camera / base` is the zoom the player applies so shots rendered from different distances match.
`anchorY` is where the character's base sits in the frame (0 top, 1 bottom). `lastFrameFill` is
sampled from the last frame's centre, and only set when the body covers the whole frame.
