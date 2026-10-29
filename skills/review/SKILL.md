---
name: review
description: Check a launch-film render before anyone sees it, or judge another agent's scene. Look at contact sheets plus full-size stills at every key moment and every cut. Count hold times in frames. Hunt cut-offs, overlaps, hand-offs, blur artefacts and gaps in sound coverage, check each of the user's notes, and score against a fixed bar. Use before showing any cut, when judging or fixing a lane, and after merging lanes.
---

# Review

Claude can't watch or listen to a film. It checks with pictures and numbers instead: contact sheets, full-size stills, blurred stills, frame counts, a cue sheet. This skill is the loop that turns those into a cut the user won't call "sloppy".

Why it matters: across the Auni v6 rework, judges raised 77 problems. 37 of them were legibility and layering (things colliding, held too briefly, double exposures, cut off, uneven space). None of those show on a contact sheet. All of them show on a full-size still.

## 1. When

- Before any cut is shown to the user. No exceptions.
- As a judge of another agent's scene or lane (prompt and schema in [judge.md](judge.md)).
- After every merge of lanes, across every cut.
- Inside a notes round (run by `launch-film:make`): look at the frame each note names, before and after the fix.

## 2. The loop

```
 npm run scene -- <scene>          half-size, muted; contact sheets labelled "<film s>s f<frame>"
        |
 read every sheet in order         finds structure: pacing, empty frames, what's on screen when
        |
 npm run stills -- <frames>        full size, one bundle: every key moment, and every cut at
        |                          -3..+3 frames, plus a few frames into the neighbouring scenes
 npm run blurstill -- <frame>      the fastest moves with the final's 16-pass shutter blur
        |
 npm run audio:check               coverage, masking, density; read out/cue-sheet.png
        |
 npm run assets                    only if logos, faces or 3D shots changed; read out/assets.png
        |
 walk checklist.md  ---->  fix  ---->  back to the top, until clean
```

## 3. Commands

The loop uses these. The full table is in `launch-film:make` section 3.

- `npm run frames` and `npm run where -- <s>`: frame numbers for scenes and for the user's timestamps.
- `npm run scene -- <scene>`: half size, muted, 4x4 sheets labelled in film time. `npm run sheets -- <mp4>` does the same for a whole draft or final.
- `npm run stills -- <f...>`: full size, from one bundle. Never run many `remotion still` calls in parallel: twelve of them, each bundling on its own, stalled until a time limit killed them.
- `npm run blurstill -- <f>`: one frame averaged from 16 shifted passes, exactly as the final will look.
- `npm run audio:check`: the no-ears audio bar and `out/cue-sheet.png` (spectrogram, beat grid, cuts, every cue).

## 4. How to look

- **Sheets find structure. Only full-size stills find the rest:** cut-offs, 5px margins, double exposures, and anything that lasts 1 to 3 frames (a blank frame at a cut, "Now a / take." for 2 frames, a one-frame pop of a background card).
- **Count hold time in frames where the text is sharp and still, not merely present.** "'Stocks' is sharp for 4 frames, 'Perps' for about 1." "The full line is readable from 855 to 886: 31 frames, right at the 1s minimum." A number a fixer can hit beats a feeling.
- **Look a few frames past each end of the scene.** Hand-offs were 10 of 77 problems.
- **Check every user note on the exact element it names.** Pull the still at the user's timestamp (mapped with `npm run where` on the version they watched) and the matching frame now.
- **Compare against the previous version at the same moment.** Regressions hide in parts nobody touched.
- **Check the bottom fifth.** The user's player controls cover it. Anything to be read there reads as cut off.

## 5. Judging

- **Don't trust the builder's report. Render it yourself.** In Auni v6 the intro builder reported "ghosting fixed", "goes out of focus" and "counts read the way X writes them". The judge rendered and found each only partly true.
- **Rate each user note separately**, so a scene can't pass on polish while dodging the actual ask.
- **Every problem names the frames, the element, the cause in code, and a specific fix.** "rows at [4.5,4.75,5,5.25] so the card is complete by f551, giving 0.6s before out."
- **Pass bar: score 8 or more and no high-severity problem.** In v6 no lane passed on its first build. The judge-then-fix loop is where the quality came from.
- **Keep lane-fixable `problems` apart from `orchestrator_issues`.** Only `problems` count toward the score. Three v6 lanes sat at 7 partly on things they were told not to touch.
- **Judges propose. Stills decide.** Test each suggested fix on stills before keeping it. A judge's eased push-in made rings swing over "Every market."; it was reverted.
- The full judge prompt, the JSON schema shared with `launch-film:team`, and the fixer rules: [judge.md](judge.md).

## 6. Before showing the user

- Every open note in `notes.md` is addressed on the exact element named, and checked on a still.
- [checklist.md](checklist.md) is clean on the cut you are about to show.
- `npm run check` passes and `npm run clearance` is printed, so the before-you-post list is current.
- The message follows `launch-film:make` section 11: path, seconds-to-scene map, each note and what changed, the one judgement call, the before-you-post list.

## 7. Reference files

- [checklist.md](checklist.md): the full pre-flight checklist, one line per item, grouped Read, Layer, Space, Move, Hand-off, Truth, Sound and timing, Contracts, Render, Notes. Walk it on every scene before it goes to a judge or the user.
- [defects.md](defects.md): the 13 kinds of defect behind all 77 judge problems, with counts and examples. Read it to know where to look first.
- [judge.md](judge.md): the judge prompt, the verdict schema, the fixer prompt and rules. Read when judging or fixing, or when writing a team workflow.
