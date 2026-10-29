# Pre-flight checklist

Walk this on full-size stills (`npm run stills`) at every key moment and every cut, plus blurred
stills (`npm run blurstill`) of the fastest moves. Every builder runs it before a judge sees the
scene; every judge runs it again; the orchestrator runs it on the merged film before the user sees
it. Each item came from a real defect in the Auni film.

## Read

- [ ] Every key phrase of 2 to 5 words is sharp and still for about 1s (30 frames) or more, counted on stills. More words, longer.
- [ ] The scene's showcase (the finished card, the result, the payoff) is complete and still for 0.6s or more, ideally 0.85s, before anything moves it.
- [ ] In a speeding-up roller, the first 3 words get 8+ sharp frames each; later words 6+ (0.2s); blur only in the fast tail.
- [ ] Blur-in reaches 0 when the move lands: blur is driven by the fast part of the move, never by a slow creep curve.
- [ ] Key text is 34px or more on screen, at the zoom it is shown at.
- [ ] A first-time viewer can parse every element in one second on a phone. No app jargon.
- [ ] Nothing hangs once it has been read.

## Layer

- [ ] At every frame, only one layer of text is sharp.
- [ ] Swaps are sequenced: old out, then new in, or a clipped vertical roll. No crossfade in place, no frame with an empty label.
- [ ] An arriving card is opaque from its first frame (it enters with blur and scale, not opacity).
- [ ] When a stack hands over to the layer behind it: blur the front, then fade it, then sharpen the back.
- [ ] The background is blurred and hazed behind the subject, and never clashes with it.

## Space

- [ ] At rest, everything is 40px or more from the frame edge, and margins are balanced on both sides.
- [ ] Settled cards keep 60px or more apart and from their parent.
- [ ] The bottom fifth holds nothing that must be read (the user's player controls cover it).
- [ ] Nothing moving crosses text while it is being read: check the whole path of coins, pointers, tags and rings.
- [ ] Pointers aim at empty space on the target, never over its label, and land on the real target.
- [ ] No character or mascot touches or hides behind a card edge, especially on a scene's last frame.
- [ ] No truncation ellipsis on anything a viewer reads.
- [ ] The climax subject is big (push the camera in): no tiny subject in empty sky, no empty bands.
- [ ] Orbits and rings are round enough that items don't bunch; repeated marks are offset so they don't line up into spokes.

## Move

- [ ] The camera is always moving (a slow creep counts). No frame is fully still for more than about 0.3s.
- [ ] Every move brakes into its rest: fast in, hard brake, slow creep. Nothing accelerates into a dead stop.
- [ ] The camera never overshoots; only objects bounce.
- [ ] Nothing ticks or spins fast while the camera moves fast: counts settle first, rotations slowed to about 25 degrees.
- [ ] Number rows keep fixed columns, so growing digits never shift their neighbours.

## Hand-off

- [ ] The first frame of every scene has a subject already in frame: no empty-sky frame, no blank frames.
- [ ] The last frame is clean and settled, or mid-move toward where the next scene's subject appears.
- [ ] A whip spans the cut: the outgoing picture moves too (`<LastFrameOf>`).
- [ ] The incoming shot is already moving, in the outgoing direction.
- [ ] Nothing from the previous scene lingers as debris; nothing new pops in on frame one.
- [ ] The next scene doesn't re-show the same object unless it is a deliberate callback.
- [ ] No black flash, no tiny mask, no plain cut where a designed transition belongs.

## Truth

- [ ] Every face is distinct and real-looking; no letter avatars, no repeats in a crowd.
- [ ] Platform UI matches the platform exactly: number formats ("1K" not "1.0K"), check marks only where real, layout, icons.
- [ ] No number goes backwards between scenes (a like count, a balance).
- [ ] The brand being showcased is sharp and prominent, never the blurred one.
- [ ] Every logo looks right on the Assets sheet and in context at full size.
- [ ] Real people appear only from the list the user approved.
- [ ] No money figures where the brief says show the mechanism; no claim the product can't back.
- [ ] No AI tells: em dashes, middle dots, status-dot prefixes, gradient washes, decorative grids, tilted pills, clip-art icons, stickers, generated blobs.

## Sound and timing

- [ ] Every movement, click, state change, landing, spinner and transition has a cue, placed by its loudest point.
- [ ] Exit whooshes peak mid-move; hero-object moves get loud whooshes.
- [ ] Cues sharing a beat with a big hit or the drop are raised 1 to 3 dB or nudged 30 to 60 ms so they aren't masked.
- [ ] Every moment is a named beat in the scene's beats file, on a whole or half beat.
- [ ] The scene's length fits its budget and the song's landmarks; `npm run check` shows no splice error.
- [ ] `npm run audio:check` passes; the cue sheet shows no gap where something moves.

## Contracts

- [ ] No shared export or shared component behaviour changed that another scene uses (owners may add props, never change defaults).
- [ ] `npm run check` passes, `npm run mix` runs, and only owned files are committed (`git add <files>`, never `-A`).

## Render

- [ ] `npm run blurstill` on the fastest whip, pan and flight: no stamped copies ("YYYour tttake."); fast moves use `speedBlur()`.
- [ ] `npm run blurstill` on any frame where a scene uses the frame as an index, file name, `.repeat()` count or `%` loop: no crash (finals ask for fractional frames).
- [ ] `npm run blurstill` on ticking numbers: no ghosted digits ("5.7KK").
- [ ] `npm run blurstill` on a calm gradient frame: no banding rings.
- [ ] The first frame of every cut is wholly the new scene.
- [ ] No blank sky frame anywhere in the sheets.
- [ ] The final prints integrated loudness within 0.5 LU of -14 LUFS and true peak at or under -1 dBTP, measured on the mp4.

## Notes

- [ ] Every open and standing note in `notes.md` is checked on the exact element it names.
- [ ] Every repeated note: the named element itself changed, not its surroundings.
- [ ] Everything marked `protect` is still there and still as good.
