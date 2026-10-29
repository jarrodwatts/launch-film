# Pre-rendered shots

Anything the browser can't draw (real 3D, physics, generated footage) is rendered elsewhere as a
PNG sequence and played by `<Shot>` (`src/parts/Shot.tsx`) like any other layer.

```
public/3d/manifest.json
public/3d/<shot>/0001.png, 0002.png, ...      1-based, 4 digits, RGBA
```

`manifest.json`, one entry per shot:

```json
{ "spin": { "frames": 24, "size": 600, "camera": 1.0, "base": 1.0, "anchorY": 0.5, "loop": true,
            "quality": "generated", "lastFrameFill": "#fc7f5f", "source": "scripts/make_demo_shot.py" } }
```

- `frames`, `size`: how many PNGs, and their pixel size. Render at the size the film shows it.
- `camera`, `base`: the camera distance the shot was rendered with, and the library's standard
  one. `<Shot>` draws the frame at `camera / base`, so a shot framed wider for a jump shows the
  subject at the same size as the others.
- `anchorY`: where that zoom is anchored, 0 top to 1 bottom.
- `loop`: loops wrap with a safe modulo; one-shots hold their first and last frames.
- `quality`: `generated`, `preview`, `cpu-final`, `gpu` or `standin`. `npm run clearance`
  holds a release while any shot is `preview` or `standin`.
- `lastFrameFill`: the colour at the centre of the last frame, for a cut that dives into the
  object until its colour fills the frame.
- `source`: what made it (`3d/character.py@<sha>`).

The demo's `spin` is a coin drawn by `scripts/make_demo_shot.py`. Real characters come from
`3d/` (`npm run shot -- spin`).
