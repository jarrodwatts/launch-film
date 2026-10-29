# Text, UI, frame and look

How words appear, how the product's UI becomes the hero, how to use the frame, the look of the whole
film, and the end card. Evidence tags as in [SKILL.md](SKILL.md).

---

## 1. Typography

- **Few words, said once each.** The whole Auni film has five headlines: "Everyone has a take." /
  "Your take. Now a position." / "Every market. One chat." / "Get paid when people copy you." /
  "Put your money behind what you believe." Couplets and short punches. PROVEN.
- **One type voice.** The product site's heavy, tight headline: weight 700, -0.042em tracking, 1.03
  line height, about 150px on a 1080p frame, in ink with one word in the brand colour. Inter stood in
  for SF Pro, which can't be licensed for video. Two families at most, extreme size contrast, one
  accent colour. Set it once as `HEADLINE` in `src/brand.ts`. PROVEN.
- **Key text is 34px or more on screen**, at the zoom it is shown at. The reference studio and film E lose words
  under 1.5 to 4% of frame height on a phone. Auni's copy cards went from 23px to 34px. RESEARCH,
  PROVEN.
- **Give text its own clear part of the frame.** "the text should be visible on the right without
  overlapping the left side". PROVEN.
- **Copy style:** no em dashes, no middle dots, no status-dot prefixes. Write counts the way the
  platform writes them ("1K", not "1.0K"). PROVEN.

## 2. Text is a scene, not an overlay

The user's code word for text laid over a shot is "lazy" (see [rejected.md](rejected.md)).

- **Text enters with motion that means something:** typed into a field (`<Typed>`), rolled in a slot,
  flipped over on the back of a card, landed word by word on half beats, blurred in from scale 1.4.
  PROVEN.
- **"Every market. One chat." took four versions.** An overlay ("feels very lazy ... not just a lazy
  overlay on top"), then two chat bubbles ("be more ambitious & creative"), then a roller with a weak
  transition ("be more ambitious in both the design and the transition"). What landed: a
  slot-machine roller of market types speeds up and lands on "Every market.", the galaxy of logos
  spirals into the mascot, and the mascot opens a chat box where "One chat." types itself. The
  words became the product doing the thing they say. PROVEN BY REJECTION, then PROVEN.
- **Swaps go one at a time, never two sharp layers.** Two lines swap by lifting and blurring the old
  one out while the next rises in. Never a frame with both sharp ("Found 4 moves" over the card
  title), never a half-swapped state ("Now a / take." for 2 frames), never a frame with an empty
  label. PROVEN.

## 3. UI as the hero

- **Rebuild the UI as vector components with real data. Never screen-record.** Screen recordings go
  soft when you punch in (film F). Copy the product's own components into the film, each with a note
  naming its source, and keep the film standalone. RESEARCH, PROVEN.
- **Make it the most ambitious version of the UI**, not a literal copy. "we don't necessarily have to
  faithfully EXACTLY use our exact ui either, try the most ambitious version of our UI to get the
  point across". PROVEN.
- **Show the mechanism as a tiny scene the eye reads at once.** For the social feature the user
  rejected a toggle ("meaningless to a viewer") and a leaderboard ("kinda out of context"). What
  worked was the loop itself: people click Copy, the same position lands in their hands, a coin
  flies back to you, then more and more. PROVEN BY REJECTION.
- **Show the thinking, not just the result.** Research steps name concrete findings: "Read 14
  stories", "NVDA $186.40", "Longs are crowded", "Reports in 3 weeks". PROVEN.
- **Show the user's interaction.** "doesn't show the interactions the user makes" was a complaint.
  The kit's `<Cursor>`: glides in on a curve, presses at 0.82 scale with a filled ripple, aims at the
  button's empty end so it never covers the label, then slips away. The button becomes the progress
  ("Placing 1 of 4"), and rows turn over one at a time, Buy to Bought. Put the click on the real
  target: "why does the click happen above auni. it should be on the send button". PROVEN.
- **Make familiar surfaces exact.** "shaped like proper tweets with X watermark and stuff but keep
  text big and visible": the real layout, counts written as the platform writes them ("1K"), a check
  mark only where the account really has one, real avatars. Faces are real (with permission) or
  generated people who don't exist, never letter circles, never the same face twice. PROVEN.
- **Counts animate in from zero.** "the engagement stats ... should start at 0". Roll them in fixed
  columns so growing digits never shift their neighbours. PROVEN.
- **A celebration proves the result.** "really solidify hey yeah the positions were placed". The
  good version: the button turns green, "All 4 moves placed", the holdings burst across the frame as
  coins in the margins and behind the card. A "You're in." sticker was "ai slop"; the same
  celebration in a corner was "a poor use of space". PROVEN BY REJECTION.
- **A continuous layer over cuts** (RESEARCH, film G): keep a price or chart layer on top while footage
  cuts underneath, so the eye stays on the number.

## 4. The CSS 3D card

For flat things that tilt (cards, coins, phones), plain CSS is enough:

- `perspective: 1600px` on the stage, `transformStyle: preserve-3d` on the card;
- 8 stacked copies of the card at `translateZ(-i * DEPTH / 8)` for a visible edge;
- a blurred shadow further back;
- details (receipts, chips) popping forward in Z;
- a gloss band (`<Gloss>` in the kit): a 115-degree linear gradient sweeping across in
  `mix-blend-mode: screen`, with a shine sound.

Then make it flagship-grade: fill the frame, keep the camera moving (swoop in, orbit, push in), show
the user's tap, gloss on landing. "this 3d card effect is the perfect idea, but execution is mid - it
should be more 3d and kinda zoomed / moving, and shiny". PROVEN after three rounds.

**Use Blender instead** for characters and anything that turns more than about 30 degrees. See
`launch-film:assets`.

## 5. Using the frame

```
 +--------------------------------------------------------------+
 |  >= 40px margin                                              |
 |      hero subject: big, sharp, roughly centred or in its     |
 |      own half; background blurred and hazed behind it        |
 |                                                              |
 |      settled cards >= 60px apart                             |
 |..............................................................|
 |  bottom fifth: nothing that must be read                     |
 |  (the user's player controls cover it)                       |
 +--------------------------------------------------------------+
```

- **Fill it.** "at around 1 second, the screen should be filled with tweets ... it shouldn't have so
  much empty space". No tiny subject in empty sky, no empty bands. PROVEN BY REJECTION.
- **The hero takes proper space.** The 3D card "doesn't take up proper space on the screen"; the
  climax on a 75px mascot was flagged. Push the camera in. PROVEN BY REJECTION.
- **Separate foreground from background.** "the stuff in the background should probably be blurred
  because right now it's kinda clashing with the content in front". PROVEN.
- **Nothing cut off, nothing overlapping.** "the bottom card highlighted in blue border looks really
  sloppy. its cut off in several areas", "several things are overlapping with each other". At rest,
  40px or more from every frame edge, margins balanced on both sides. PROVEN BY REJECTION.
- **Keep the bottom fifth clear.** The user watches in a small embedded player whose controls cover
  the bottom fifth. Anything that must be read there reads as cut off.
- **Nothing moving crosses text while it is being read.** Check the whole path of coins, pointers,
  tags and rings, not just where they end.

## 6. The look

- **One world for the whole film:** the product site's background on every scene, its palette, flat
  surfaces, hairline borders. Auni used its site's soft sky. Film E proves a single
  background reads as native in the feed. "Just take the branding and theming and design frmo auni
  ... don't go over the top but just make it consistent". PROVEN.
- **One palette, one type system.** A style change per scene is a reel's feature and a single
  product film's bug. RESEARCH.
- **Depth through focus:** background layers in haze and blur, the subject sharp, and deep layers
  never showing through the ones on top. PROVEN.

## 7. The end card

- **The teardowns' shared weak spot is the ending.** Almost none shows a URL or a clear next step.
  RESEARCH.
- **The hero owns the break, big and centred.** Auni v6 had the mascot at 60% size, nudged 200px
  right, alone during the break: "why's he kinda just chilling on the right side really small at the
  end, polish that up to something better". v6.1: it turns to camera about half the frame tall,
  centred, under a lamp of its own colour, with the opening's takes drifting faintly behind. PROVEN
  BY REJECTION, then PROVEN.
- **On the re-drop, the lockup.** The hero drops into its place as the wordmark slams in with a
  shine; the line lands word by word; then the product's own CTA button and the URL, held about
  2.8s. PROVEN.
- **Reuse the product's real CTA and tagline** from its landing page, so the film and the site say the
  same thing. PROVEN.
- **Don't let the end card run long.** Film C spends 25% of its runtime on captions after the
  product. RESEARCH.

## 8. No AI design tells

The user's standing rule, from the same day's product design work. Never:

- em dashes or middle dots in any copy;
- status-dot prefixes (a coloured dot before a label);
- decorative gradient washes on cards or tiles;
- decorative grids;
- tilted "playful" pills;
- clip-art icons;
- stickers ("the 'youre in' is ai slop");
- generated blobs or orbs standing in for a real mark ("change the icon from being randomly generated
  slop to something auni themed or more relevant and premium feeling").

Use the real thing instead: the product's own mark, a partner's real logo, a real face. PROVEN BY
REJECTION.
