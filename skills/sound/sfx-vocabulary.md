# The SFX vocabulary: which sound for which thing on screen

Scenes ask for sounds by **role**, never by file name: `v("whoosh", i)` picks the `i`th file of the
`whoosh` role in `public/sfx/roles.json`, rotating. Swap the pack and every scene still works.

The kit's roles: `whoosh`, `whoosh_heavy`, `air`, `pop`, `tick`, `click`, `button`, `switch`,
`typing`, `shine`, `impact`, `boom`, `riser`, `ding`, `notify`, `cash`.

Levels are the `db` values used on Auni: the sound's peak in dB below full scale. Relative levels
are what count. The last column is the Auni pack's file, to show what a good file in that role
sounds like; any good pack has equivalents.

## 1. Event to sound

| Visual event | Roles, in layering order | Timing | Level | Auni pack example |
|---|---|---|---|---|
| Text typing on screen | `typing`, trimmed with `keep` to the typing | starts on the first character | -15 to -20 | keyboard_typing |
| A post or message is sent, an item lands | `pop`, then `shine` 0.12 to 0.15s later, plus a soft `whoosh` | pop on the land frame | pop -12 to -17, shine -14 to -17 | pop_03, main_pop, shine |
| A first like | `notify` (or a dedicated like sound) | on the heart pop | -13 | favorite |
| Counts rolling up, "flooding in" | `tick` at accelerating gaps, rising level, panned around | first like to the next big moment | -23 rising to -17 | tick |
| A face drops into a pile | `pop`, rotated, panned to its side | on landing | -17 | pop_02 |
| A card flies in | `whoosh` (rotate), a quiet `pop` 0.18s later, a `tick` | whoosh on the beat it arrives | whoosh -12/-13, pop -22 | fast_woosh_01 to 04 |
| Things flying past the lens | one `whoosh` per flyer, panned by side | peak as it passes | -12 | fast_woosh_02 |
| Camera pull-back, push-in, orbit | `air`; `whoosh_heavy` for big moves | peak mid-move | -13 to -19 | stereo_air_whoosh, bass_swoosh |
| Whip pan, zoom-through, exit | `whoosh` + a second `whoosh`; `impact` as it brakes | peak at the fastest point; hit on the brake | -10 to -15 | fast_woosh, swoosh_02, whoosh_hit |
| A big beat lands (a headline) | `impact` | on the beat | -10 to -15 | impact_whoosh_drum |
| Camera shake | `impact` (low) | on the shake | -15 | quick_bass_impact |
| Into the quiet bar, the question appears | a short reverse `riser` + `notify` + `shine` | on the bar's first beat | -12 to -20 | reverse_cymbal_ping, positive_notification |
| Into the drop | `riser` peaking 30 ms before beat 0 | | -15 | perfect_riser |
| The drop, the reveal | `impact` (+30 ms), `whoosh_heavy` (+120 ms), `air` (+350 ms) | stacked just after the downbeat | -9, -10, -15 | whoosh_hit, bass_swoosh, stereo_air_whoosh |
| Cursor moves to a button | `whoosh` panned toward the button | peak mid-move | -16/-17 | swoosh_01 |
| Click or tap | `click`, then `button` 10 ms later | on the press frame | -9, then -13/-15 | mouse_click_01, button_click |
| A button arms (any state change) | `switch` | on the change | -18/-19 | switch_click_01 |
| 3D character spin or fly-through | `whoosh`, `whoosh`, `whoosh_heavy` at 13%, 39% and 65% of the move; `whoosh_heavy` + `impact` as it opens | spread along the motion | -10 to -15, prominent | swoosh_02, fast_woosh_02, bass_swoosh, shockwave_whoosh_01 |
| A research step appears (spinner) | rotated `whoosh` + a soft `notify` pluck + `tick` 0.4 beat later | one set per step | whoosh -21, pluck -27, tick -15 | sonar_pluck |
| A result lights up ("found") | `impact` + `shine` + `whoosh` + a `pop` per chip | on the beat | -13/-14 | cinematic_hit (trimmed to one hit) |
| A card forms or grows | `whoosh` + `whoosh` + `pop` + `shine` | across the form | -12 to -18 | whoosh_04, main_pop |
| Each item placed or bought | `cash` + `tick` | on each row | -14, -20 | item_purchase |
| All done, success | `ding` + `impact` + `shine` + `boom` + pops left and right + `cash` 3 frames later | on the beat | -9 to -16 | pay_ding, swish_boom_02, cha_ching |
| Confetti or coins burst | rapid `pop`s alternating pan plus or minus 0.45 | every 2 frames | -19 | pop_03 |
| A card flips over | `whoosh` as it lifts, `boom` + `switch` edge-on, `impact` + `shine` as it lands | on the motion's own frames | -11 to -18 | fast_woosh_04, swish_boom_02 |
| Rows dealt out | alternating `pop` + `tick` + a quiet `whoosh`, panned | each row | -16, -20, -24 | pop_01, pop_03 |
| A word roller speeding up | a `tick` per word (plus a `click` every other), louder each step; `impact` + `shine` on the last word | on each word | -14 rising; hit -11 | tick, mouse_click_01 |
| Things swallowed | low `impact` + reverse `riser` + `shine`, a `riser` peaking on it | | -11 to -18 | quick_bass_impact, orb |
| Money arrives | `ding` and `cash` alternating, `cash` till on the last | on each coin landing | -10 first, -14 to -20 rest, -12 till | pay_ding, cash_register_01 |
| Logo lockup | `whoosh` 60 ms early (-9), `riser` peaking on it, `boom`, `shine`, a `tick` per word | on the re-drop | -9 to -14, ticks -23 | cinematic_boom_01 |
| CTA button | `impact` + `shine` + `button` | | -12 to -16 | whoosh_hit, button_click |

## 2. Patterns behind the table

- **Three layers: transient, body, tail.** A click or pop for the instant, a whoosh or impact for the weight, a shine or air for the tail. 145 cue pairs in the Auni film sit within 40 ms of each other.
- **Shine means reward.** It goes on posts landing, results found, success, the lockup and the CTA, the same way the reference studio's biggest hit (film A) saves its sparkle for wins. It also sits on a visual gloss sweep, as the user asked: "maybe like a glow effect or a shine effect animation".
- **Low sounds for big moves, bright sounds for UI.** `whoosh_heavy`, `impact` and `boom` carry camera moves and hits; `tick`, `click` and `pop` carry interface. `stats.json` records each file's `bright_hz` and `low_share` for this choice.
- **Density follows the music.** Auni's cues per second, second by second:
  `1 0 7 25 11 19 6 2 0 5 5 10 8 9 3 5 8 16 5 1 17 6 10 9 7 16 3 6 4 5 24 22 12 40 10 4 11 0 0 0`.
  The quiet bar before the drop (7 to 8s) is nearly empty, and the end card is silent apart from the song. Contrast makes the drop land.
- **Accelerating ticks sell "flooding in"** more than the numbers do (a judge: the flood "depends mostly on sound"). Start with gaps of 4 frames, each gap 0.86 times the last, down to 1.2 frames, rising from -23 to -17 dB into a riser. A word roller's ticks get 0.4 dB louder each step.
- **Rotate variants.** `v("whoosh", i)` with a changing `i`, so repeated events don't sound like a machine gun.
- **Pan by where it happens on screen**, plus or minus 0.2 to 0.6. 186 of Auni's 352 cues are panned. A card on the left is panned left; coins pouring in spread across the field.
- **Repeats fade back.** Each later copy of an event is 0.5 dB quieter (down to -3 dB), so the first reads as the moment and the rest as a crowd.
- **`keep` trims long files** to the on-screen action, with a 25 ms fade: typing stops when the typing stops.
- **Derive cue times from the function the animation uses.** The kit's `Count` exports `reaches(total, n)` (when a rolling count passes n); the demo's ticks call it, so they speed up exactly as the digits do. Auni did the same with `rollTicks()` for the word roller and a `fly(t)` fraction for the 3D fly. When the timing changes, picture and sound move together.

```ts
// In the scene file, next to the picture, on the same beat names (src/scenes/reveal.tsx in the kit).
export function sounds(add: Add) {
  add(v("impact"), beat(R.land) + 0.02, -8);            // the drop: louder, it competes with the song's own hit
  R.rows.forEach((at, i) => {
    add(v("whoosh", i), beat(at) - 0.03, -24, { pan: 0.15 });
    add(v("pop", i), s(bf(at) + 2), -15 - i * 0.5, { pan: i % 2 ? 0.15 : -0.15 });  // repeats fade back
  });
  add(v("click"), beat(R.tap), -10, { pan: 0.25 });
  add(v("button"), beat(R.tap) + 0.02, -14);             // offset so the two don't mask
}
```

## 3. Never use

- **Meme sounds:** Vine Boom, Record Scratch. Murky rights and the wrong tone. They were in the user's pack and stayed out of the film.
- Long builds and booms mostly went unused on Auni (`long_riser`, `bass_drop`, `boom_01`, `transition_boom`, `trailer_accent`), most likely because the song already carries the big drop.
- **Any file with several events, placed whole.** Auni's `iphone_message` holds two pings, so a stray ping played 6.6s before the send it belonged to. The kit's mix keeps only the event that holds the peak unless you pass `whole`. See [mix.md](mix.md).

## 4. Levels guide

```
 -9 to -12   transitions and hits that must cut through: the drop stack, the key tap's click,
             hero-object whooshes ("prominently"), the success ding, the lockup swish
 -12 to -14  standard hits, whooshes on scene moves, a post's first pop
 -14 to -18  UI pops, clicks, shine, air whooshes, second layers
 -20 to -27  texture: ticks, quiet whoosh layers, plucks, repeated crowd events
```

Auni's distribution: 48 cues at -12 to -9, 98 at -16 to -13, 114 at -20 to -17, 57 at -24 to -21, 35 at -25 and below. Most of the sound is texture; a few loud cues carry the beats.

`db` sets the sound's **peak**. A 10 ms tick and a 3s whoosh at the same `db` differ a lot in how loud they feel. Short sounds can sit higher; long ones lower.

Rules:

- **A cue on the drop needs +2 to 3 dB** to be heard over the song's own hit. Auni's drop-spin cues at -12 were buried; the fix was -9 and -10.
- **Two sounds on one instant mask each other.** Lead the one that must read by 30 to 60 ms and/or set it 1 to 2 dB louder. A judge caught the lockup swish masked by a boom and a riser on the same frame.
- **Repeats get quieter; the first instance is the loudest.**
- **The music dips a little under effects** (2.5 dB at most, the mix does it), never pumps.
- **Hero objects get loud, prominent movement sounds.** "the auni 3d should have swooshing or like movements sound effects prominently". Auni's mascot whooshes went to -9 to -12.
- **Peak an exit whoosh at the fastest point**, and start an air whoosh with the move. A judge flagged an exit whoosh peaking 6 frames after the move started.
- **Every visual state change is an event.** A send button arming with no sound was flagged; a soft `switch` fixed it.
