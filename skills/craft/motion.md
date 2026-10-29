# Motion and camera

How things move, how the camera moves, how one shot hands off to the next, and how to keep fast
motion clean under the final shutter blur. Evidence tags as in [SKILL.md](SKILL.md).

---

## 1. Curves

Everything in the kit is a pure function of the frame number: no state, no physics springs, no
`Math.random`. So frame 412 renders the same every time, in any order, on any machine. The curves
live in `src/engine/motion.ts` (`settle`, `accelerate`, `brake`, `whip`, `anticipate`) and
`src/brand.ts` (the brand's own `settle` and `drift`).

| Name | Curve | Use |
|---|---|---|
| `land()` | 8 frames to 92% on settle, then the last 8% linear over 40 frames | Every arrival: fast in, hard brake, slow creep |
| settle | bezier(0.22, 1, 0.36, 1) | Arrive early, ease to rest |
| drift | bezier(0.16, 1, 0.3, 1) | Slower arrivals and camera rests |
| accelerate | bezier(0.55, 0, 0.9, 0.35) | Exits and zoom-throughs speeding into a cut |
| whip | bezier(0.3, 0, 0.1, 1) over 9 frames, across the cut | Whip pans |
| brake | bezier(0.2, 0.9, 0.3, 1) | Landing face-on, dropping into a lockup |
| anticipate | bezier(0.5, -0.3, 0.25, 1) | Rocks back before it turns or throws |

Auni's settle and drift are copied from its app's `tokens.css`, so the film moves like the product.
Do the same: find the product's easing tokens and put them in `brand.ts`. PROVEN.

**Measured in the teardowns (RESEARCH)**, all the same family:

- The reference studio's "Cash out." headline: about bezier(0.65, 0, 0.15, 1), then 0.5px per frame of drift.
- Film B: 80% of the travel in 0.2s, then 2px per frame of drift forever.
- Film C: 90% of the travel in 4 frames.
- Film D: rises on bezier(0.16, 1, 0.3, 1) over 20 frames, drifts 1% of the frame per second, exits
  with a 4-frame ease-in.
- Film A: pulls back slightly first (anticipation), then an asymmetric push of about 1.1s peaking on a
  transient; its snap pull-out is exponential over 16 frames.

**Rules:**

- **Never fully still.** Every hold has a 1 to 5% scale creep or a drift. The v6 judges flagged every
  still stretch (the flip's first second, frozen coins after the pour). Nothing sits dead for more
  than about 0.3s. PROVEN.
- **The camera never overshoots. Objects may bounce** (films A, C and E, Auni's copy cards).
  RESEARCH, PROVEN.
- **`ramp(frame, start, length, from, to, easing)` is the building block.** It clamps at both ends,
  so it is safe before and after its window. Write moments as named beats in the scene's beats file
  and turn them into frames with `bf()`, never as raw frame offsets.
- **The frame is fractional in the final and negative before a moment.** The final's shutter passes
  ask for frame 12.375, and `frame - moment` is below 0 until the moment comes. JS's `%` keeps the
  sign (-1 % 3 is -1). So: floor any frame used as an array index, file name or `.repeat()` count;
  clamp with `Math.max(0, ...)`; loop with `mod()` from `motion.ts`; or just use `ramp`/`land`,
  which clamp. Auni's drafts were fine and its finals crashed: "source image cannot be decoded"
  (an image sequence asked for frame 12.375) and "RangeError: Invalid count value: -1". Run
  `npm run blurstill` on any frame where a scene indexes by frame. PROVEN.

## 2. The camera

One camera over one stage. Lay the scene's things out on a flat stage (in stage pixels), then move a
camera over it. `camera(keys)(frame)` from `src/engine/camera.ts` eases between keys:

```ts
// Each key: the frame, where the camera looks (stage x, y), how close, and how it's turned.
const R = T.reveal;
const cam = camera([
  { at: bf(R.formed),  x: 960,  y: 520, zoom: 0.98, rx: 10, ry: -24 },          // pulled back, edge showing
  { at: bf(R.look),    x: 960,  y: 330, zoom: 1.42, rx: 6,  ry: -15 },          // push in on the hero line
  { at: bf(R.tap) - 4, x: 1040, y: 760, zoom: 1.5,  rx: 10, ry: -4 },           // rack down to the button
  { at: bf(R.end),     x: 1070, y: 500, zoom: 0.88, rx: 0,  ry: -3, ease: brake }, // land face-on
])(frame);
const p = project(cam, x, y); // where a stage point lands on screen, through the perspective
```

- `project()` puts a stage point on screen, so a cursor, a coin or a label can follow an object the
  camera is moving past.
- Depth of field: blur each layer by its distance from the camera's focus. Background in haze, the
  subject sharp.
- Things grow into each other on the stage ("Found 4 moves" became the card's header) instead of
  cutting. The user: "you could do a better relationship transition from the '4 picks found' to the
  formation of a conviction card". PROVEN.

## 3. Moves that worked

All PROVEN in the Auni film unless marked.

- **Zoom-through into the drop.** Push into the last thing before the drop, accelerating, blur
  rising, and cut at peak speed. Film F: 1.42x over 2.2s. Auni: the camera dives into the question
  from beat -0.75. This is the transition the user said "I love".
- **Whip off the real last frame.** The next scene renders the previous scene frozen on its actual
  last frame (`<LastFrameOf scene="reveal"/>` in the kit) and carries it off with the same whip that
  brings the new shot in. The cut becomes one camera move. Earlier, the whip started from nothing,
  and the judge called it "not a real transition".
- **Match on colour through a 3D object.** The lens dives into the mascot until its body colour fills
  the frame, then an iris (`<Iris>`) opens on the next scene.
- **The flagship showcase:** orbit the hero object, push in on its key detail, rack focus down to
  the button, the cursor taps, land face-on. "a really nice 3d zoom showcase effect that I'd expect
  from like a premium ad".
- **A different camera for each phase of a montage:** close and tilted, then dolly out, then whip out
  to all of it, then push in as it collapses. "for each ring / phase, it should have some kind of
  different camera effect".
- **Crowd to one.** Pull out to everyone, then lift one face out while the crowd falls out of focus
  (the reference studio does this too).
- **Punch and shake on a headline hit:** scale 1 to 1.12 to 1.06 over 10 frames, plus a decaying
  horizontal shake on the next beat.
- **Pull back for scale.** A stack of posts racks out of focus onto an endless wall. Things flying
  past the lens sell depth. "you zoom out and keep zooming out to like a tonne of takes".
- **Accelerate into the cut, so the next shot starts at that speed** (the reference studio's "every" into
  "single"). Auni: the question dives into the drop, the flip rushes through the card, the chat
  whips up and away into social. RESEARCH, PROVEN.

## 4. Accelerating sequences

Teach the pattern slowly once, then speed it up. The first one teaches; the rest are rhythm.

| Sequence | Timing |
|---|---|
| Takes slamming in | 0.5s apart, then 0.17s |
| Research steps | one per beat, then faster |
| A word roller | each word held 11, 10, 9, 5, 3.5 frames... landing on the last word |
| Copies arriving | slow for the first, then quicker and quicker |
| Engagement ticks | slow, then a rattle; gaps shrink 0.86x each tick down to 1.2 frames |
| The first coin landing on your face | play it slowly with the camera held until it lands, then speed up |

The roller's first 3 words each get 8+ sharp frames before the speed-up. Blur only in the fast tail.
"a shuffling/cycling effect of the text ... and it increases in speed". PROVEN.

## 5. Hand-offs across a cut

Each scene is its own `Sequence`, so by default every cut is a hard cut. The v6 judges flagged every
transition that wasn't built on purpose. Hand-offs were 10 of 77 judge problems. Three rules:

```
 OUTGOING SCENE                     CUT                    INCOMING SCENE
 ... last frame is clean, settled,   |   first frame already has its subject in frame,
 or mid-move toward where the        |   already moving in the outgoing direction,
 next subject will appear            |   content about a third into frame
                                     |
 <LastFrameOf scene="prev"/> lets the incoming scene draw the outgoing one and move it,
 so a whip really spans the cut.
```

- **The first frame already has a subject.** No empty-sky frame, no blank frames. Frame 684 of v6 was
  empty sky: "reads as a dropped frame".
- **The last frame can be cut from.** Nothing half-hidden, nothing still settling, nothing tucked
  behind a card edge.
- **The incoming shot is already moving**, in the outgoing motion's direction.
- **Nothing lingers as debris** (confetti from the last scene on the new hero frame), and nothing pops
  in on frame one.
- **Don't re-show the same object** in the next scene unless it is a deliberate callback.
- **Fix hand-offs at integration**, frame by frame across every cut. A scene built between old
  neighbours can't see its own hand-offs.

## 6. Blur-safe motion

The final is rendered 16 times, each pass shifted a fraction of a frame, and averaged (see
`launch-film:make`, section 13). That is real shutter blur, so anything that changes in steps between
passes gets averaged too. What that does, and the fix:

| Problem under blur | Example | Fix |
|---|---|---|
| A count ticking under a moving camera ghosts | likes read "5.7KK", "9.3KK" | Settle counts before the camera moves; roll digits in fixed-width columns (`<Count>`) |
| A label crossfading in place double-exposes | "Buy NVIDIA" over "Bought NVIDIA" | Roll labels: the old one slides out over 3 frames, then the new one slides in |
| A fast spin becomes rings | coins rocking 50 degrees per frame | Spin along the path, or keep rotation to 0.15 rad (about 9 degrees) per frame or less |
| A very fast whip, pan or flight stamps copies | "YYYour tttake."; the kit demo's coin and card on the pan across the cut | `speedBlur(position, frame)` from `motion.ts` as a CSS `blur()`; also slow the peak if it is still stamped |
| A key line still soft when it lands | 1px blur for 38 frames | Drive blur from the fast part of the move, never from a slow creep curve, so it reaches 0 on landing |

**Speed blur.** 16 passes over half a frame draw a thing moving d px a frame as 16 sharp copies
about d/32 px apart. Past about 30 px a frame the gaps show. `speedBlur(position, frame)` returns a
CSS blur of 0.035 px per px of travel this frame (capped at 30), from the same function that places
the thing, so it peaks where the speed does and is 0 once it lands:

```
const x = (f: number) => -700 * ramp(f, bf(R.out), 12, 0, 1, accelerate);
<div style={{ transform: `translateX(${x(frame)}px)`, filter: `blur(${speedBlur(x, frame)}px)` }}>
```

Any whip you copy from the demo needs it: the demo's reveal exit and its pan across the cut into the
close both use it. Without it, frames 288 and 289 of the demo final showed stamped rings on the coin
and the rows. A second film built from the kit had the same defect on its flying notes and its whip until each
got its own.

- Nothing ticks or spins fast while the camera moves fast. Slow rotations to about 25 degrees.
- Check every fast move with `npm run blurstill -- <frame>` before calling a scene done. It takes
  seconds; the full final takes 10 to 16 minutes.
- Never use Remotion's `CameraMotionBlur` or `@remotion/motion-blur`. It stacks 16 see-through copies,
  the browser rounds each to 8 bits, and every gradient bands. `npm run check` fails on it. PROVEN.
