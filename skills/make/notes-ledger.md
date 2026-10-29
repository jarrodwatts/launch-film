# The notes ledger (`notes.md`)

Every film keeps one file, `notes.md` at its root, with one row per note the user ever gave. It is
the memory of what the user asked for. Every brief, every judge and every "here's the new cut"
message reads from it.

Why it exists: before the Auni v6 round, notes lived only in the chat. The user had to repeat
themselves: "please i've asked you sevreal times to change the card style at the top", "Again i
don't think you've nailed the social part". From v6 on, briefs carried earlier notes verbatim and
marked "(previous round)", the judges checked each one, and repeats stopped.

## Format

```markdown
# Notes

| # | round | at (s) | scene | note (verbatim) | status | what changed |
|---|---|---|---|---|---|---|
| 1 | v4 | 6 | reveal | "at around 6 seconds, why does the click happen above auni. it should be on the send button" | done v5 | Cursor aims at the send button from the composer's layout, ring on press |
| 2 | v4 | - | all | "any movement or click or mouse move or transition or loading spinner or anything should have an associated sound effect" | standing rule | 236 cues in v5, 352 in v6 |
| 3 | v5 | 13 | reveal | "i've asked you sevreal times to change the card style at the top i.e. change the icon from being randomly generated slop" | done v6 | Generated orb replaced by the real logo on an ink coin |
| 4 | v6 | 11 | reveal | "i'd like the auni 3d animation at around 11 seconds to be faster" | done v6.1 | Fly-through 28 frames over 1.5 beats (0.5s), no re-render |
| 5 | v2 | - | build | praised: "I love the transition." | protect | Kept in every version |
```

Columns:

- **#**: a running number. Never reuse one.
- **round**: the version the user was watching when they wrote it.
- **at (s)**: their timestamp, as they wrote it, or `-` for a note about the whole film.
- **scene**: the scene it belongs to, from `npm run where -- <s>` on the version they watched.
- **note (verbatim)**: the user's exact words, typos kept. Split a long message into one row per ask.
- **status**: `open`, `done vN`, `standing rule`, `protect` (praise), or `declined: <reason>`.
- **what changed**: the change, in one line, naming the element.

## Rules

- **Verbatim, always.** The judge checks against the user's words, not your paraphrase. Add your
  reading of it in "what changed", never in the note.
- **Praise goes in too, as `protect`.** "I love the transition" in v2 meant that section had to
  survive every rework. It did.
- **Standing rules stay open forever.** "Every movement gets a sound" is checked on every cut.
- **Carry open notes forward.** Every brief and every judge prompt gets all `open` rows and all
  `standing rule` rows, the older ones marked "(previous round)".
- **Read each note literally.** The user's v2, v4 and v5 notes on the card's top were about its
  generated icon. Claude changed the header colour, then a gloss, then a ring, and kept the icon.
  Before marking a note `done`, name the exact element the user named and confirm on a still that
  it changed.
- **A repeated note means the element was not changed.** When a note comes back, don't do more of
  the same. Find what the user actually pointed at.
- **Timestamps go stale.** When any scene changes length, every later timestamp moves. Map a note
  with `npm run where -- <s>` on the version the user watched (check out that commit if needed),
  record the scene, and from then on talk about the scene and its beat, not the second.
- **Report against the ledger.** When you show the next cut, list each note the round touched, then
  what changed. That is the user's checklist for watching it.
- **Decline in the open.** If you think a note is wrong, say so with the reason and mark it
  `declined`. Don't quietly skip it.
