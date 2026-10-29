---
name: craft
description: The craft of a premium launch film. Covers the story spine (build, a quiet question, the drop as the reveal), hooks and controversy, pacing with read times in frames, motion curves and camera moves, transitions that span the cut, text as its own scene, UI as the hero, the 3D product showcase and the end card. Use when writing a script or storyboard, designing or reworking a scene or transition, or writing on-screen copy. Also use, from inside a launch-film:make notes round, for notes about how a scene looks or moves: too slow, too fast, lazy, sloppy, boring, empty, cut off, overlapping, slop or not premium.
---

# Craft

How to make each second of a launch film look and read like a film from a top motion-design studio. The rules are written for any product. The examples come from the Auni film (39.4s, "this is so fire dude").

Each claim carries its evidence: **PROVEN** (the final film does it and the user approved), **PROVEN BY REJECTION** (the user rejected the other way, often more than once), **RESEARCH** (measured in teardowns, not tested by us), **THEORY** (reasoning only). Nothing is proven in the market yet. The reference films are named by letter (film A, film B and so on), the same letter in every file; "the reference studio" is the motion-design studio that made most of them.

## 1. The 10 rules that mattered most

1. **Pick the song first, then cut everything to its beat grid.** Every event on a whole, half or quarter beat, so cuts hit the music for free. PROVEN. See `launch-film:sound`.
2. **Story = build tension, drop, obvious reveal.** The user's brief: "stack takes up on top of eachother, focus on building up tension, and then reach a climax where the beat migth drop and then we reveal". PROVEN BY REJECTION (v1 had "a random statement").
3. **Every movement makes a sound, matched to what you see.** "sound effects actually secretly apply a polished premium feel". PROVEN.
4. **Fast in, hard brake, slow creep. Nothing is ever fully still.** A dead hold reads as a frozen frame. PROVEN.
5. **Show the mechanism as a tiny scene, never a list of facts or a settings toggle.** "'Public on Discover' toggle is meaningless to a viewer". PROVEN BY REJECTION.
6. **Text is its own scene, born from the motion before it.** "not just a lazy overlay on top", rejected three times. PROVEN BY REJECTION.
7. **Fast between ideas, about 1s of sharp read per key line.** "too slow" and "too fast to even process" were both real, about different things. PROVEN.
8. **Use the product's own world:** its site's background, type, easing tokens and real components, as the most ambitious version of the UI. "it doesnt feel very auni themed rigth now". PROVEN BY REJECTION.
9. **Real 3D for the hero object and mascot, never a 2D fake.** "it's not 3d at all its just a 2d spinning and zoom". PROVEN BY REJECTION.
10. **End on the hero, big and centred, then the lockup, one line and a real CTA.** "why's he kinda just chilling on the right side really small at the end". PROVEN BY REJECTION.

## 2. The spine

```
 HOOK    BUILD              TENSION        DROP = REVEAL          POINT    BREADTH   LOOP      BREAK       RE-DROP
 one     more voices,       one question   input -> work ->       said     every     why it    hero alone  logo, line,
 voice   faster, a wall,    in near-quiet  output -> one tap      plainly  option    spreads   big, still- CTA
         a headline                        -> done                                             moving
 |------- music: intro / energy / quiet ----|------------------------ drop -------------------|--break--|-re-drop-|
```

- Auni's time split: hook and build 25%, tension 7%, reveal 23%, point 7%, breadth 15%, loop 18%, close 13%.
- The drop sits at 5 to 10s (Auni: 9.7s). RESEARCH, then PROVEN.
- One hero input runs the whole film. Auni's one take is typed, sent, researched, carded, flipped, posted and copied. PROVEN.
- Full structure lessons, hooks and controversy: [story.md](story.md).

## 3. Read-time floors

| Thing | Minimum sharp, still-ish time on screen |
|---|---|
| A key line (headline, the point, the pitch) | about 1s (30 frames). 0.7s was flagged. |
| A word in a speeding roller | 0.2s (6 frames); the first 3 words 0.3s or more (8+ frames) |
| A finished state the scene exists to show | 0.6s or more (18+ frames). 7 to 9 frames was flagged. |
| A hero 3D transition | short: 0.5s. Auni's fly-through went from 1s to 0.5s on request. |

- Count frames where the text is sharp and still, not merely present. PROVEN by the v6 judges.
- **Fast between ideas, held within one.** About 2 new things per second in the body. PROVEN.
- **When two screens are too fast, merge them into one screen with two phases.** Don't just slow both down. "those two screens move way too fast to even process what they say, maybe combine them into one screen with two phases". PROVEN.
- Teach a pattern slowly once, then accelerate it. Takes slammed in 0.5s then 0.17s apart. PROVEN.

## 4. Motion curves

| Name | Curve | Use |
|---|---|---|
| land | 8 frames to 92% on settle bezier(0.22, 1, 0.36, 1), then the last 8% linear over 40 frames | Every arrival |
| drift | bezier(0.16, 1, 0.3, 1) | Slow arrivals, camera rests |
| accelerate | bezier(0.55, 0, 0.9, 0.35) | Exits and zoom-throughs into a cut |
| whip | bezier(0.3, 0, 0.1, 1) over 9 frames, across the cut | Whip pans |
| hard brake | bezier(0.2, 0.9, 0.3, 1) | Landing face-on, dropping into a lockup |
| anticipation | bezier(0.5, -0.3, 0.25, 1) | A rock back before a turn |

- Replace settle and drift with the product's own easing tokens if it has them (Auni copied its app's `tokens.css`).
- **The camera never overshoots. Objects may bounce.** RESEARCH, PROVEN.
- Use the kit: `ramp()` and `land()` from `src/engine/motion.ts`, `camera(keys)` and `project()` from `src/engine/camera.ts`. Everything is a pure function of the frame. No springs with state, no `Math.random`.
- **The frame is fractional in the final and negative before a moment.** The final's shutter asks for frame 12.375, and `frame - moment` is below 0 until the moment comes. So floor any frame used as an index or file name, clamp counts with `Math.max(0, ...)`, and loop with `mod()`, not `%`. Or just use `ramp`/`land`, which clamp. Auni's draft was fine and the final crashed twice ("source image cannot be decoded", "Invalid count value: -1"). PROVEN.
- **Fast moves get `speedBlur()`** from `src/engine/motion.ts`, driven by the same function that moves the thing. Without it the final's 16 passes stamp sharp copies on whips and flights; the kit's own demo pan did until it got one. Checked with `npm run blurstill`, before and after.
- Camera keys, moves that worked with their numbers, hand-offs and blur-safe motion: [motion.md](motion.md).

## 5. Frame and taste

- **Use the frame.** Fill it: no tiny subject in empty sky ("it shouldn't have so much empty space"). The hero is big, centred or in its own half. The background is blurred behind it ("kinda clashing with the content in front"). A celebration in a corner was "a poor use of space". PROVEN BY REJECTION.
- **Nothing cut off, nothing overlapping.** 40px or more from every frame edge at rest, settled cards 60px or more apart, the bottom fifth clear of anything to read (the user's player controls cover it). "its cut off in several areas", "several things are overlapping with each other". PROVEN BY REJECTION.
- **No AI tells.** No em dashes or middle dots in copy, no status-dot prefixes, gradient washes, decorative grids, tilted pills, clip-art icons, stickers or generated blobs. Use the real mark, logo or face instead. "the 'youre in' is ai slop". PROVEN BY REJECTION. The full list: [text-and-ui.md](text-and-ui.md) sections 5 and 8.

## 6. Moves to avoid

- **A black flash or a tiny mask as a transition.** Auni v1's black frame through a tiny mascot silhouette: "that transition is really bad". PROVEN BY REJECTION.
- **Accelerating into a dead stop.** It reads as a jump cut. Ease the last frames.
- **An empty frame at a cut.** A blank sky before the next thing arrives reads as a dropped frame. The next shot is on screen from its first frame.
- **A style change per scene.** That is a showreel's feature and a single product film's bug. One world, one type voice. RESEARCH.

## 7. Reference files

- [story.md](story.md): the spine part by part, structure lessons, hooks for the first 3 seconds, controversy rules, the claims check, how to write 3 or 4 directions. Read when writing or reworking the script.
- [motion.md](motion.md): curves with teardown measurements, camera keys, every move that worked with its numbers, accelerating sequences, hand-offs across a cut, blur-safe motion. Read when building or fixing any scene or transition.
- [text-and-ui.md](text-and-ui.md): the type voice, text as a scene, UI as the hero, the cursor, the CSS 3D card, frame use, the look, the end card, no AI tells. Read when a scene has words or product UI in it.
- [rejected.md](rejected.md): everything the user rejected, in their words, with what replaced it, and the user's code words "lazy" and "slop". Read before every notes round and before showing a cut.
