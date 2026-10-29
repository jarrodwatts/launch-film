# Worked example: the Auni launch film

Auni is an AI agent you chat with. You tell it a take ("Nvidia is going to $10 trillion"), it
researches, builds a real position across markets in your own wallet, and lets other people copy
you. The film launched it on X, crypto Twitter first. Final cut: v6.1, 39.4s, 1182 frames, 7 scenes,
352 sound cues, cut to the working track (a major-label song).

The code is in `examples/auni/` at the plugin's root, two folders up from this file
(`../../examples/auni/`). It is read-only and doesn't build without Auni's assets. Read this file to see what a finished film looks like in beats, and how it got there.

---

## 1. The film, beat by beat

One beat = 0.3454s. Beat 0 is the drop. Film beats run from -28 to 86.

| s | Beat | Music | On screen | Job |
|---|---|---|---|---|
| 0.0 | -28 | fades in | The founder's real X post types out: "Nvidia is going to $10 trillion." | Hook: a known face, a hot take, a money number |
| 2.2 | -21.5 | full | Counts start at 0, roll up like an odometer, likes pop, repliers' faces pile in | "Engagement is flooding in" |
| 4.1 | -16 | energy | 5 counter-takes slam in, 0.5s then 0.2s apart | Build, accelerating |
| 5.4 | -12.5 | energy | Camera pulls back onto an endless wall of takes, posts whip past the lens | Scale |
| 5.9 | -11 | energy | "Everyone has a take." Punch and shake on the next hit | Name the tension |
| 6.9 | -8 | quiet | Alone: @auni_io asks "ok but are you positioned?" | The question, in near-silence |
| 9.4 | -0.75 | riser | Camera dives into the question, speeding up into the cut | Zoom-through into the drop |
| **9.7** | **0** | **DROP** | The take lands in Auni's box. 3D mascot spins in, a cursor clicks send | The answer starts |
| 10.9 | 3.5 | drop | 3D fly-through: the mascot turns, the lens dives into its body | Hero transition, 0.5s |
| 11.4 | 5 | drop | 6 research steps, one per beat, then faster: "Read 14 stories", "NVDA $186.40", "Longs are crowded" | Show the thinking |
| 13.5 | 11 | drop | "Found 4 moves" floods blue. The step grows into the position card | Input becomes output |
| 15.2 | 16 | drop | One 3D camera orbits the card, pushes in on the belief, racks down to the button | Flagship showcase |
| 16.4 | 19.5 | drop | A cursor taps "Start with $100". Each row flips Buy to Bought | The one tap |
| 17.6 | 23 | drop | "All 4 moves placed". Coins and confetti fill the frame | Payoff |
| 18.8 | 26.5 | drop | Whip pan to the take: "Your take." It turns over: "Now a position." | The point, said plainly |
| 21.8 | 35 | drop | Venues land (the partner first), markets pour in, a galaxy; a roller goes Stocks, Perps, Predictions, faster and faster | Breadth |
| 25.2 | 45 | drop | Roller lands on "Every market." The galaxy spirals into the mascot, who opens a chat: "One chat." | Breadth folds into one product |
| 27.6 | 52 | song jumps back 16 beats | You reply "I am." to Auni's question with your position attached. Ten real people click Copy; a coin flies back to you per copy | The social loop as a scene |
| 32.4 | 65.5 | drop | Your face lifts out of the crowd, coins pour in: "Get paid when people copy you." | Why it spreads |
| **34.5** | 72 | **break** | The mascot turns to camera, big and centred, under its own blue lamp | Hero moment |
| **35.9** | 76 | **re-drop** | It drops into the lockup as the wordmark slams in; "Put your money behind what you believe." lands word by word | Brand |
| 36.6 | 78 | | "Join the waitlist with X" button and the URL, held about 2.8s | CTA |

**Time split:** hook and build 25%, tension 7%, product reveal 23%, point 7%, breadth 15%, social
loop 18%, close 13%.

**Scenes and their beats** (`src/beats/<scene>.json`, each counted from its own start):

| Scene | Length (beats) | Film beats | Seconds |
|---|---|---|---|
| build | 20 | -28 to -8 | 0.0 to 6.9 |
| question | 8 | -8 to 0 | 6.9 to 9.7 |
| reveal | 26.5 | 0 to 26.5 | 9.7 to 18.8 |
| flip | 8.5 | 26.5 to 35 | 18.8 to 21.8 |
| offerings | 17 | 35 to 52 | 21.8 to 27.6 |
| social | 20 | 52 to 72 | 27.6 to 34.5 |
| close | 14 | 72 to 86 | 34.5 to 39.4 |

---

## 2. The music in beats

The working track, measured with the grid lock in `launch-film:sound`: 173.7 BPM (0.3454s per beat),
drop at 83.49s in the file, kick-phase fit error 11.7 ms.

```
beats  song s  bass   all   air
 -16   77.96   56.2  67.3  53.9    energy: takes stack here
 -12   79.35   53.8  67.8  55.2
  -8   80.73   -2.2  58.1  48.2    bass cut out: the quiet bar (question)
  -4   82.11   -1.4  62.3  54.5    riser
   0   83.49   55.9  68.1  55.4    DROP: reveal
 ...   (steady 0 to 56)
  56  102.83   45.8  61.3  37.2    break: mascot hero shot
  60  104.21   57.5  66.9  53.9    re-drop: logo lockup
```

```json
{ "drop_file_s": 83.49, "beat_s": 0.3454,
  "sections_beats": { "energy": [-16,-8], "quiet": [-8,0], "drop": [0,56], "break": [56,60], "redrop": [60,72] } }
```

The scenes after the drop ran to 72 beats, but the song's drop section is 56. So the mix jumps the
track back one 16-beat phrase on the cut into social (film beat 52), and the song's break (song beat
56) lands on the close (film beat 72). The code refuses to build if the lateness isn't a whole
number of phrases.

---

## 3. Versions, and what the user said

| Version | Length, song | What it was | User's first words |
|---|---|---|---|
| v0 | 12s, synth made in code | Opening only. "AI keeps winning." post, takes, black + riser, drop, card. Grey grid, 2D mascot | "hmmm it's decent, but doesn't quite feel premium enough" |
| v1 | 12s, a free library track | Same, with the user's SFX pack, the brand's sky, frosted cards, blur. Black frame through the mascot's silhouette | "the music is not hype enough ... the story line is kinda lacking" |
| v2 | 21s, a half-time hype track | New story: concrete hot takes stack, wall, "ok but are you positioned?", drop into the product, 3D mascot, card, montage | "okay, improving, but lowk i don't really like this song ... I love the transition." |
| v3 | 53s, a multi-drop library track | Real-looking X posts, research, 3D card, offerings, social, close | "its pretty good overall ... the pacing feels too slow" |
| v4 | 29s, the working track (drop at 5.5s) | Cursor clicks send, research per beat, card with gloss, per-phase cameras, real accounts copy | "Great work dude this is cool." then 14 notes: "The big one is sound effects" |
| v5 | 32.5s | 236 cues, typed opening, packed wall, @auni asks, real Blender fly-through, flip, roller, "I am." bridge | 9 notes, "i've asked you sevreal times to change the card style" |
| v6 | 39.4s | Five parallel lanes, each judged, fixed, re-judged; merged; banding-free shutter blur | "this is soooooo good dude" + two notes |
| v6.1 | 39.4s | Fly-through twice as fast; mascot big and centred through the break | "this is so fire dude" |

## 4. The arc

```
v0  "decent ... not premium"        synth sound, grey grid, abstract hook
 |   + real SFX pack, brand look, motion blur
v1  "not hype enough ... story lacking"
 |   + hype track, concrete hot takes, tension -> climax -> drop -> reveal
v2  "improving ... I love the transition"
 |   + real X posts, research on screen, offerings, 3D card, social story
v3  "pretty good overall ... pacing too slow"     (53s)
 |   + 29s cut, drop at 5.5s, per-phase cameras, real accounts
v4  "Great work dude this is cool"    "the big one is sound effects"
 |   + 236 cues, typed start, packed wall, real 3D fly, @auni asks, "I am." bridge
v5  "sloppy" in places, "i've asked you several times"
 |   + 5 parallel agent lanes, each judged at 8/10, fixed, re-judged; banding fix
v6  "this is soooooo good dude"
 |   + faster fly-through, big centred hero at the end
v6.1 "this is so fire dude"
```

- **v0 to v1, the premium floor.** Real sound and the brand's own look. Without these, nothing else
  gets judged.
- **v1 to v2, story.** The biggest structural change: a tension build on concrete takes, a one-line
  callout as the climax, the drop on the reveal. The first love ("I love the transition") came here,
  and that section survived every later version.
- **v2 to v3, scope.** From "it makes a portfolio" to the whole product. Length ballooned to 53s.
- **v3 to v4, pace.** Cut to 29s, drop at 5.5s, each phase its own camera.
- **v4 to v5, density of polish.** Every motion got a sound, the opening starts slow, 3D became real.
  Notes shrank from story problems to craft problems (space, overlap, slop, readability).
- **v5 to v6, craft at scale.** One agent per area, judged against the user's exact notes, then one
  integrator watching every frame. Plus the blur rewrite.
- **v6 to v6.1, the last frame.** The speed of one hero move and a strong final image.

---

## 5. How the user reviews

- **Watches the render and sends timestamped notes, often with a screenshot:** "around 9 seconds",
  "at 24 seconds", "this part hear at 12 seocnds". So every cut ships with a seconds-to-scene map
  (`npm run frames`), and every note is routed with `npm run where -- <s>`.
- **Watches in a small embedded player whose controls cover the bottom fifth of the frame.** Content
  crammed at the bottom edge reads as cut off ("the bottom card ... its cut off in several areas").
  Keep the bottom fifth free of anything that must be read.
- **Ends almost every round with "Any questions?"** and expects real questions or a clear "no
  questions, here's my one judgement call".
- **Mixes praise into critique.** Name what was loved in the ledger so the rework protects it.
- **Asked for agents in parallel with judges, twice.** Offer it yourself next time.
- **Checks in during long renders** ("hows it progressing", "update?"). Give an ETA and say what is
  in the cut while it renders.

---

## 6. What moved the film from "decent" to "so fire"

In order of weight, with the version where each landed:

1. **Sound density and fit** (real pack in v1, a sound on every motion in v5). "The big one is sound effects", said even after "Great work".
2. **A story with tension and a drop** (v2). A recognizable, slightly spicy opening; a one-line callout as the climax.
3. **Real 3D and a flagship showcase** (v5, v6) that shows the user's own tap and the result landing.
4. **Every idea as a scene** (v5, v6): taglines, transitions, the pitch, the celebration. No overlays, stickers or generated icons.
5. **Frame discipline** (v6): filled frames, nothing clipped or overlapping, blurred background, a big hero at the end.
6. **Reading time** (v6): fast between ideas, held within one.
7. **Process** (v6): parallel lanes with judges scoring the user's literal notes, one integrator watching the whole render, and a point-by-point report.
