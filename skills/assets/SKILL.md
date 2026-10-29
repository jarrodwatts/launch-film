---
name: assets
description: 3D, logos, faces and real people for a launch film. Build a brand mascot or object in Blender from its own SVG and render shots as PNG sequences. Play and retime the shots in Remotion. Register and QA every logo. Fetch real profile pictures, use generated faces for fictional people, and track consent and licences until release. Use when a film needs a 3D character or object, partner or token logos, social posts with avatars or real accounts, or a pre-release clearance check.
---

# 3D, logos, faces and people

Everything on screen that isn't type or UI: the brand's character in real 3D, partner and token logos, profile pictures, and the real people who appear. Plus the clearance check that keeps consent and licences from slipping to "after we post". Commands are the film repo's (`npm run ...`), made by `${CLAUDE_PLUGIN_ROOT}/kit/scripts/new-film.sh`. The worked example is the Auni film's mascot, its 40-odd venue and token logos, and its real crypto-Twitter accounts.

## 1. The ten lessons

1. **Build the mascot in 3D from the brand's own SVG, with a script.** A headless Blender script that inflates the silhouette and lays the features on by raycast went from nothing to an on-brand 3D character in about 20 minutes. Every later change (a faster turn, a wider hop) was code and a re-render, not modelling.
2. **Render shots, not a model.** Blender writes transparent PNG sequences, one folder per shot. The film plays them like a flip-book, so Remotion never needs 3D.
3. **Fake 3D gets caught.** Auni v4's "fly" was a 2D spin scaled 15x in CSS. The user: "it's not 3d at all its just a 2d spinning and zoom". If a move changes perspective, render it.
4. **Match the brand art, not a "nice render".** The first render was washed out and glassy. It matched only after side-by-sides with the app's own mascot art: Standard view transform, dim lights, matte material, the SVG's gradient rebuilt in the shader.
5. **The GPU box sleeps; plan for it.** Check it's awake, render to a per-job folder, copy only after the job exits, check every PNG, keep a CPU fallback.
6. **One logo registry, one fit rule per logo, one QA sheet.** The Assets sheet caught five broken logos at once.
7. **Use real things, not generated symbols.** A generated "orb" icon was rejected in three rounds: "randomly generated slop". The real asset (the stock's own logo on a coin) fixed it.
8. **A real person in an ad reads as an endorsement.** Every real account needs that person's yes before posting. Never put invented words in a real person's mouth.
9. **Look up identity facts; don't invent them.** The brand handle (`@auni_io`, not a guessed `@auni`), the real picture, and whether there's a check mark all come from the X API.
10. **Track clearance like a build input.** Song licence, consent and face sources lived in chat replies on Auni. The kit holds them in data and prints them before every final.

## 2. Choose the tool

| Thing | Tool | Why |
|---|---|---|
| A character, or any object that turns more than about 30 degrees | Blender (`3d/character.py`), rendered as frames | Real perspective, real light, the brand's exact gradient |
| Flat things that tilt: cards, coins, phones, receipts | CSS 3D in Remotion (perspective 1600, 8 stacked layers for thickness, a gloss sweep) | Stays crisp, cheap to change. See `launch-film:craft` text-and-ui.md |
| Anything else the browser can't draw (physics, generated footage) | Pre-rendered frames played with `<Shot>` | Same flip-book pattern |

Rejected for the mascot: React Three Fiber in Remotion (the look built twice, soft Cycles light is hard in WebGL), Spline or a 3D artist (every change through a person), AI video (won't hold an exact character shot to shot; the user found Higgsfield unreliable), moving the app's static PNGs in 2D (can't turn or squash: "2D").

## 3. The 3D loop

```
 brand SVG --copy paths and hex stops exactly--> 3d/character.json
      |
      v
 npm run shot:debug  (sizes and boxes, 4 s) --> fix units until the body is 1.5 to 2 m wide
      |
      v
 npm run shot -- still --tier preview
 npm run shot:compare -- <brand reference.png> --> out/3d/compare.png --> tune look, repeat
      |
      v
 npm run shot -- spin | idle | hop | fly   (--host <gpu box> if awake, else cpu-final here)
```

- **Install Blender** with `npm run blender:install`. It sets up a portable copy without root (Linux), or uses `$BLENDER` or `~/opt/blender.sh` if present.
- **Find the brand's vector art in the product's code** (Auni's lived in a React component) and a rendered reference image. Copy path strings and gradient stops. Never redraw them.
- **Debug geometry before rendering.** Auni's first render was "thin spiky sheets": depth skipped the unit scale and the body was 110 m deep. One printout shows that in 4 seconds.
- **Iterate the look on side-by-sides**, one change at a time: exposure, light energies, gradient stops, roughness. Start dim.
- **Render the library**: GPU host if it answers, otherwise `cpu-final` here. While real frames cook, a stand-in (the still copied into each frame) keeps the film rendering. Mark it `"quality": "standin"` in `public/3d/manifest.json`, or it ships.
- Full build steps, the problems table, tiers and the GPU host checklist are in [blender.md](blender.md).

## 4. Using shots in the film

- **`<Shot shot="spin" frame={f} size={600}/>`** floors sub-frames (the shutter passes ask for frame 12.375), clamps one-shots to their first and last frame, and loops `idle` with a safe modulo.
- **Retime with `span` before re-rendering.** "i'd like the auni 3d animation at around 11 seconds to be faster": v6.1 played the same 28 frames (about 1s) over 1.5 beats (about 0.5s), with no re-render. Place its sounds as fractions of the same span, so they move with it.
- **Render at the size it's shown.** Auni's fly was drawn up to 2000 px from 800 px frames; it held only because the motion was fast and the end was covered by a flat fill. A big, slow hero shot needs frames at least that size.
- **Every 3D move gets loud whooshes**, spread along the motion: on Auni's fly, at 13%, 39% and 65% of the shot, then an impact as it opens, at -10 to -15 dB. "the auni 3d should have swooshing or like movements sound effects prominently". See [../sound/sfx-vocabulary.md](../sound/sfx-vocabulary.md).
- **Give the character a job in every scene**: react, celebrate (the hop), carry a transition (the spin, the fly). **It is the hero of the close**, big and centred, never parked small: "why's he kinda just chilling on the right side really small at the end".
- **The brand iris.** The fly ends with the body filling the frame; its last frame is solid body colour (`lastFrameFill` in the manifest, sampled, not typed). Cover the frame with that colour, then `<Iris>` cuts the brand's silhouette out of it and grows it to reveal the next scene. Hold the shape at about 0.3 scale for 2 or 3 frames first: a judge flagged that a fast iris hides the shape.

## 5. Logos

- **Keys, not paths.** `LOGOS` in `src/content.ts` maps `kind:name` (`partner:a`, `token:NVDAx`) to a file and a fit. Scenes only use keys, through `<Mark name=.../>`.
- **One fit rule per logo:** `cover` for marks drawn as discs, `{ inset: 0.18 }` for glyphs that cropping would cut, `{ scale: 1.42 }` for art with corners that peek past the circle (1.22 still showed slivers).
- **Render the Assets sheet after any change**: `npm run assets` draws every logo, face and shot end exactly as the film does, labelled, into `out/assets.png`.
- **Then check every logo-heavy scene at full size.** The sheet can't see collisions, spokes or repeats.
- Sources in order, the five broken Auni logos, and the in-context checks: [logos.md](logos.md).

## 6. People

| Kind | Who | Rule |
|---|---|---|
| `self` | The founder or poster | Safest recognisable face: "use my twitter account" |
| `brand` | The product's own account | Look up the real handle and check mark |
| `real` | Real third parties | Need consent before posting; only shown doing what they agreed to |
| `fictional` | Invented people | Generated faces with a recorded source; never a real face on an invented opinion |

- **The hardest line:** a real person never "says" something they didn't say. Auni's intro agent refused to put real faces on invented hot takes: "putting their faces on hot takes would read as them saying it".
- **Fetch real accounts** with `npm run people -- <handle>...`. It saves 400x400 pictures and prints `Person` entries with `consent: "pending"` for `src/content.ts`.
- **Give lanes the exact approved list.** Asked for "real CT accounts", an Auni lane added six famous people nobody approved.
- Fetching, generated faces, realism details and the legal rules: [people.md](people.md).

## 7. Clearance

- `npm run clearance` prints the song and its licence, each real person and their consent, fictional faces without a source, and 3D shots still at preview, cpu-final or stand-in.
- `npm run final -- <out.mp4> --release` runs `clearance -- --release`, which fails on anything pending. Drafts only print.
- In the final reply, list what is still pending (each person to ask, the song's licence, CPU-tier shots), with links. Never above a question box: the user missed links placed there.

## 8. Reference files

| File | What it holds | Read it when |
|---|---|---|
| [blender.md](blender.md) | The build step by step, problems and the rule each teaches, shots, tiers, portable Blender, the GPU host checklist, playing shots, the brand iris | Building or re-rendering any 3D asset |
| [logos.md](logos.md) | Keys and fits with numbers, where logos come from, the Assets sheet, in-context checks | Adding or fixing any logo |
| [people.md](people.md) | The four kinds, the X API fetch, generated faces and their licence, realism details, the 8 legal rules, lane limits | Any social scene, any real account, before release |

Related: `launch-film:craft` for CSS 3D and UI as the hero ([../craft/SKILL.md](../craft/SKILL.md)); `launch-film:review` for full-size checks ([../review/SKILL.md](../review/SKILL.md)); `launch-film:team` for briefing lanes with the approved people list ([../team/SKILL.md](../team/SKILL.md)).
