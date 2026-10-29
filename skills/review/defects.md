# What the judges kept finding

All 77 problems from the ten judge verdicts in the Auni v6 rework (5 first judges, 5 final judges),
sorted into 13 kinds. 29 were medium, 48 low, none high. Read this to know where to look first.

| # | Defect | Count | Medium | Typical examples |
|---|---|---|---|---|
| 1 | Two things collide: something covers what the viewer is reading, or settled items touch | 11 | 4 | the first payout coin crosses the question post; copy cards with 0px gap to the post; the pointer on top of the button label; logos stacked on the mascot's belly; a name tag over the view count |
| 2 | Scene hand-off: empty first frame, blank frames at a cut, an exit that lands on nothing, debris or a pop at the cut | 10 | 3 | frame 684 is empty sky; flat cyan for 3 frames after the fly-through; confetti from the last scene on the new hero frame; the zoom heads right but the next subject appears centre |
| 3 | Held too briefly to read, or never comes into focus | 9 | 5 | the finished card holds 7 to 9 frames; roller words sharp 1 to 4 frames; "One chat." readable 0.75s; a key line 1px blurred for 38 frames because blur followed a slow creep curve |
| 4 | Payoff underpowered or generic | 8 | 3 | the climax happens on a 75px mascot with a static wide camera; the coins "don't pour" (2 to 5 on screen); the final lockup is a plain white pill; coins read as stickers |
| 5 | Double exposure in a swap (two sharp layers of text), or the opposite, an empty flicker frame | 7 | 4 | "Found 4 moves" and the title on top of each other; "Buy" and "Bought" crossfading in place; an arriving card see-through over the one below |
| 6 | Motion-blur artefacts | 7 | 3 | ticking counts ghost into "5.7KK"; whips render as 6 to 8 stamped copies; fast coins become rings; gradient banding; columns shifting as digits grow |
| 7 | Cut off by the frame edge or by another element | 6 | 1 | the mascot half-hidden behind the card on the hand-off frame; a header clipped by the top edge while the camera follows; a 5px margin; a name truncated with an ellipsis |
| 8 | Composition: frame not used evenly | 4 | 1 | the crowd sits high with a 220px empty band below; 350px of empty header; a card 60px from one edge and 100px from the other; copy-card text 23px on screen |
| 9 | Placeholder or not-credible content | 4 | 1 | the same face twice in a pile plus letter avatars; "1.0K" where X writes "1K"; identical logos lining up in spokes; the showcased brand's own logo is the blurry one |
| 10 | Timing off the grid or off the song | 3 | 2 | a scene grew 6 beats so the close missed the song's break; sub-moments written as frame offsets instead of named beats |
| 11 | Cross-scene contract or continuity | 3 | 1 | a shared component's new behaviour makes a count go backwards in another scene; the next scene re-shows a near-copy of the card just seen |
| 12 | Motion stops dead or freezes | 3 | 1 | a push-in accelerates into a dead stop; a frame fully still for 0.4s before the exit; "the least alive moment" |
| 13 | Sound cue missing, late or masked | 2 | 0 | a button arms with no cue; an exit whoosh peaks 6 frames after the move starts; mascot cues buried under the drop |

## What the clusters say

- **Legibility and layering (kinds 1, 3, 5, 7 and 8) are 37 of 77.** These are what the user kept
  calling "sloppy". They are mechanical, so they belong in the builder's own pre-flight check
  ([checklist.md](checklist.md)), before a judge ever sees the scene. A judge's time is better spent
  on taste.
- **Hand-offs (kind 2) are 10 of 77**, and most could not be fixed inside a lane, because each lane
  rendered its new scene between old neighbours. Plan a hand-off pass at integration, frame by frame
  across every cut, and give lanes their neighbours' boundary stills up front.
- **Six of the final judges' remaining problems were not lane-fixable:** the blur sample count, sky
  banding, the song fit, neighbour scenes, a shared component. They kept three lanes at 7. That is why
  the schema now splits `problems` from `orchestrator_issues`.
- **No problem was high, and still no lane passed on its first build.** "Not premium" is many
  mediums adding up, not one big miss. Fix every medium.
- **Sound gaps were rare (2)** because every scene writes its cues next to its picture. Keep it that
  way.
