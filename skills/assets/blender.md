# Blender: a brand character from its SVG, rendered as frames

The kit's `3d/character.py` is the Auni mascot script made generic. Everything product-specific is
in `3d/character.json`. The kit's `3d/README.md` lists every field. This file explains how the build
works, what went wrong on Auni, and how to run it.

## 1. Inputs

- **The brand's own vector art.** Auni's mascot lived in the web app as a React component: a body path, a fold (a hair-like flap), a crease, a brow, two eye ellipses with glints, and gradients in the SVG `<defs>`. Copy the path strings and hex stops straight from the source into `character.json`. Don't redraw them.
- **A look reference**: the app's own rendered mascot image. Every look decision on Auni was made side by side with it.
- **The film's palette.** The body colour at the end of the fly-through becomes a wipe colour in the film, so it must be a brand colour.

## 2. How the build works

```
SVG path strings --parse (every command)--> polyline --resample(160)--> even outline
      |                                                        |
      |                       inflate(): rings shrink toward a centre point on an elliptic profile,
      |                       front depth and back depth separately, a tip vertex closes each side
      v                                                        v
 features (fold, brow) -- every vertex raycast onto the body (BVH) + a lift --> decals that hug it
 eyes -- a sphere scaled (rx, depth, ry), placed at the raycast hit, oriented by an explicit basis
 gradient stops -- shader nodes in object space (linear ramp + radial blush), sRGB converted to linear
 all parts --parent--> one empty "rig" at the base of the body (turns and squashes happen here)
```

1. **Parse the path.** A small pure-Python parser handles every SVG command, absolute and relative: `M L H V C S Q T A Z`, including arcs and packed arc flags. It has to be hand-written because Blender's Python can't pip install. Auni's first parser handled only `M C L Z`; most brand SVGs use more. The first closed shape in a path is used.
2. **Resample evenly** to 160 points, so the mesh rings are even and smoothing doesn't pucker.
3. **Inflate.** Concentric copies of the outline shrink toward a centre point: `cos(theta)` for size, `sin(theta) x depth` for height, 22 rings, on the front and (with a smaller depth) the back. Then subdivision level 2 and smooth shading.
   - This only works if every outline point can "see" the centre in a straight line (the shape is *star-shaped* from it). Auni's body needed a hand-picked centre `(136, 138)`, not the average. Set `body.centre`.
   - For shapes with deep notches, arms or holes, use another method: Blender's curve to mesh, solidify, voxel remesh, smooth.
4. **Lay features on the surface.** Build each feature as its own thin inflated mesh, then move every vertex onto the body: cast a ray along +Y at that SVG point, take the hit and the normal, add the vertex's own height plus a lift. A feature built flat and pushed out by a constant floats or sinks on a curved body.
5. **Eyes.** A UV sphere scaled to (width, depth, height), placed at the raycast hit, **oriented by an explicit basis**: local -Y along the surface normal, local Z as close to world up as it can be (`side = back x up_world; up = side x back`). Auni's first version used the shortest rotation from -Y to the normal, which adds an arbitrary twist on a curved surface: tall eyes came out wide.
6. **Materials.** The SVG's linear gradient is rebuilt in object space, `t = dot(p - A, B - A) / |B - A|^2`, with math nodes into a colour ramp with the SVG's stops. An optional radial blush is mixed in by distance. Every hex goes from sRGB to linear first, or colours come out pale.
7. **Rig.** One empty at the base of the body, the point it squashes from. Every part is parented to it.

## 3. Problems hit, and the rule each one teaches

| What went wrong | Cause | Fix | General rule |
|---|---|---|---|
| First render was "thin spiky sheets" | x and y were scaled from SVG units to metres, depth was not: the body was 110 m deep | Scale depth too; ray origins and fallbacks in SVG units too | **One unit function for every coordinate** (`Units` in the script). Print sizes and boxes before the first render: `npm run shot:debug` |
| Whole model sat 0.9 m low | Parenting read a stale `matrix_world`: Blender doesn't refresh it after you set `location` | `bpy.context.view_layer.update()` before parenting | After moving anything in a script, update the view layer before reading world matrices |
| Eyes wide instead of tall | Shortest-arc rotation to the normal adds a twist | Explicit basis from the normal and world up | Anything with a "this way up" gets a basis you build yourself |
| Washed out, grey, glassy | Key light 900 W, world 0.55, subsurface 0.12, coat 0.35, emissive glints at 1.2 | Key 230, fill 60 (cool, low right), rim 350, world 0.35, exposure 0.35, roughness 0.5, subsurface 0.04, coat 0.12; glints removed | Use the **Standard** view transform so brand hexes survive (AgX and Filmic desaturate them). Start with dim lights and tune side by side with the brand art: `npm run shot:compare` |
| Brow sank into the body | Too thin a lift on a subdivided surface | Thicker (5 vs 3) and lifted 1.4 units | Subdivision shrinks the body a little; lift features to allow for it |
| Fold too thin, glints looked like crescents | Coat reflections on tiny emissive spheres | Thicker fold, glints dropped | Keep to features that read at 150 px. Small specular details become noise |
| Too small and low in frame | Camera at 9.5 m with a small tilt | Camera at 6.2 m, level, 85 mm lens | Frame each shot so the body fills about 60 to 70% of the square. The film can scale down; scaling up loses detail |

The kit's defaults in `character.json` `look` and `camera` are the fixed values from this table.

## 4. Shots

Each shot is a pure function of the frame number, so a re-render gives the same frames.

| Shot | Frames | What it does | Used for |
|---|---|---|---|
| `still` | 1 | Front pose | Avatar, posters, compare |
| `spin` | 30 | Turns in from -80 degrees to 0, ease-out cubic, slight tilt | Entrances. Play over half the frames for a whip |
| `idle` | 60 | Breathing sway (plus or minus 4 degrees yaw, 1.5 pitch) and one blink at frame 40 (eye height x 0.1) | Any hold. Loops |
| `hop` | 36 | Crouch, stretch, airborne, squash, settle (scale pairs like 1.12/0.84 and 0.9/1.16), with a wider camera (8.8 m) so the jump fits | "It worked" moments |
| `fly` | 28 | A full 360 degree turn with a little pitch and roll while the camera dollies from 6.2 m to 0.6 m on `t^2.2`, speeding up into the body until it fills the frame | The transition into the next scene |

## 5. Running Blender

### Portable Blender without root (Linux)

The official tarball fails on a headless box with `libSM.so.6: cannot open shared object file`. `npm run blender:install` fixes that without installing anything system-wide: it downloads the tarball, asks `ldd` what's missing, fetches those libraries with `apt-get download`, unpacks them with `dpkg-deb -x` into `.tools/blender/libs`, and writes a `blender.sh` wrapper that sets `LD_LIBRARY_PATH`. Tested: on this kind of machine the missing set was `libSM`, `libICE` and `libGL`. On macOS, install Blender normally and set `BLENDER`.

Headless runs pass the script's own arguments after `--`: `blender -b -P 3d/character.py -- <out> <shot> --preview`. `npm run shot` does it for you.

### Quality tiers

| Tier | Size | Samples | Where | Speed seen |
|---|---|---|---|---|
| `preview` | 400 | 24 | Local CPU | about 12 s a frame including the build: fine for look work |
| `cpu-final` | 600 | 40 | Local CPU, 16 threads | a 28-frame fly in about 5 min |
| `gpu` | 800 | 96 | A mid-range NVIDIA GPU with OptiX | about 10 to 20 s a frame including kernel load |

All tiers denoise, render a transparent film and write RGBA PNGs. On Auni only `still`, `spin` and `idle` ever got the GPU render; `hop` and `fly` shipped as CPU renders because the GPU machine was asleep both times, and the planned GPU re-render never happened. The manifest now records the tier, and `npm run clearance` lists anything below `gpu`.

### The remote GPU box checklist

Auni's GPU box was a Windows machine reached over SSH. It was offline at 00:03, 02:04 and 06:36, and timed out in the middle of a hop render.

- **Check it's awake first.** `render-shot.sh --host <host>` runs `ssh -o BatchMode=yes -o ConnectTimeout=8 <host> echo up`. No answer: it renders here at `cpu-final` and says so.
- **GPU settings in the script:** OptiX as the compute type, every OptiX device on, `scene.cycles.device = "GPU"`. A harmless `HIPEW initialization failed` warning shows on NVIDIA machines.
- **One folder per job.** On Auni a CPU fallback hop and a still-running remote hop both wrote to the same folder; only the remote job timing out saved the CPU frames. The kit renders into `lf-<shot>-<time>` remotely and `out/3d/<shot>-<host>-<time>/` locally.
- **Copy only after the job exits.** Frames pulled while the remote machine was still writing were suspected of a "source image cannot be decoded" error. The real cause was elsewhere (sub-frames, section 6), but the risk is real.
- **Check every PNG** by opening and decoding it, and check the count, before installing.
- **Install in one step**: the finished folder replaces `public/3d/<shot>/` by a rename, and the manifest is updated after.
- **Windows hosts run PowerShell.** `&&`, `&` and `%VAR%` fail; use `;`. Filter logs with `Select-String`. Install portable Blender with `curl.exe -sL <url> -o b.zip ; tar -xf b.zip`. `scp` the script over before each run (the kit does). Set `REMOTE_BLENDER` to the remote Blender path.
- **Long jobs:** generous timeout (`timeout 3000 ssh ...`), and pull frames in the same command after it ends.
- **Stand-ins** (the still copied into each missing frame) keep the film rendering while frames cook. Mark them `"quality": "standin"` in the manifest so clearance lists them.
- **Finding the box is your job.** On Auni, asking the user twice where the GPU host was wasted two rounds ("figure it out", then a pointer to a GPU machine you can SSH into).

## 6. Playing shots in the film

- **Floor sub-frames.** Shutter blur asks for fractional frames (12.375). A file name built from 12.375 doesn't exist, and Remotion reports it as `EncodingError: The source image cannot be decoded`, which looks like a corrupt PNG. `<Shot>` floors before building the name.
- **Clamp one-shots, loop idles.** Negative frames show the first frame, frames past the end hold the last, `idle` wraps with a positive modulo.
- **Retime with `span`** to play a shot over any number of film frames, and place its sounds as fractions of the same span.
- **The framing manifest.** Auni's hop was rendered from 8.8 m instead of 6.2 m, so the player hard-coded a zoom of 8.8 / 6.2 and a vertical nudge. A re-render with another camera would silently break it. Now the renderer writes `camera`, `base` and `anchorY` into `public/3d/manifest.json`, and `<Shot>` reads them.
- **Sample the fill colour.** Auni's hand-typed `#bae5ff` happened to be within 1 of the real pixel (`#bae6ff`). The renderer writes `lastFrameFill` from the last frame's centre, and only when the body covers the whole frame.
- **Render the size it's shown.** A big, slow hero (Auni's close showed the mascot at 750 px) needs frames at least that big.
- **A transparent PNG as an avatar** needs a background colour behind it, or the backdrop shows through the circle.
- **Banding shows first in 3D renders.** Soft gradients band when 8-bit layers are averaged in the browser. The kit's `final` averages shifted passes in ffmpeg at 10 bits instead. Never use Remotion's `CameraMotionBlur`.

## 7. The brand iris

`<Iris>` draws a full-frame colour with any SVG path cut out of it, scaled from 0.02 to 22. Auni used the mascot's body path twice: black to sky before the first drop, and the fly's fill colour into the research scene. The character becomes the wipe. Give it the OUTER outline only (the kit's `BRAND.markOutline`): any hole or inner piece in the path stays coloured and flies over the picture as bars for the first frames of the opening.

- Hold the hole at about 0.3 scale for 2 or 3 frames first so the shape reads before it blows past the frame edges.
- The best way in is a dive into an object of that colour: the fly ends filled with body colour, the iris opens out of it.
- Any product with a recognisable silhouette (a logo mark, a mascot, a product outline) can use it.
