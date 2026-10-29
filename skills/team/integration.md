# Integration: merging lanes into one film

The lanes are done when their final judges have spoken. The film is not. On Auni v6 the merge itself
took 5 minutes; getting a clean final render took another 80. Most of what follows is the order
that would have saved those 80 minutes.

## 1. The checklist, in order

Run everything from the film root.

1. **Collect results.** Read the workflow's result: each lane's scores, the final judge's remaining `problems`, every `orchestrator_issues` item and every `for_orchestrator` item. Put them in one list.
2. **Check each lane is clean.** `git -C ../<film>-lanes/<lane> status` and `git -C ../<film>-lanes/<lane> log --oneline <base>..HEAD`. Uncommitted work is not merged.
3. **Merge, lane by lane.** `npm run merge-lane -- <lane>`. It refuses any change outside the lane's owned paths and any `node_modules` or `.tools` entry, merges with a merge commit, then runs `npm run check`. Fix a failed check before the next merge, so you know which lane broke it.
4. **Fix what the merge broke.** Typical: an export another lane imported was removed (Auni: the flip scene imported `AuniCard`, which the card lane had deleted). Prefer making the consumer render the real previous scene (`<LastFrameOf>`) over re-creating its components.
5. **Do the hand-off pass, frame by frame, across every cut.** No lane could see this: each rendered its new scene between old neighbours. `npm run frames` for the cut frames, then `npm run stills` at each cut minus 3 to plus 3 frames. Check: the first frame already has a subject; the last frame can be cut from; the incoming shot is already moving; nothing from the old scene lingers; nothing pops in on frame one; the next scene doesn't re-show the same object by accident. Auni's best fix: the flip scene renders the reveal scene frozen on its real last frame and whips it off screen, so the hand-off can never drift out of sync.
6. **Settle cross-lane data.** A lane that changed a shared component's behaviour changes other scenes. Auni: the intro lane made counts flood from zero whenever a post time was given, so a like count went backwards between two scenes. Restore the old default for existing callers.
7. **Fix the final judges' cheap remaining mediums.** On Auni: number columns in a fixed grid so digits don't shift; blur driven from the fast part of a move so the key line lands sharp; a rounder orbit.
8. **Test each judge fix on stills before keeping it.** Judges propose; stills decide. A judge asked for an eased push-in on the markets scene; stills showed the rings then swung over "Every market.", which a code comment said the original timing prevented. Reverted.
9. **Refit the music.** See section 3. Then `npm run mix` and `npm run audio:check`.
10. **Render the whole film at half size, muted, and read every sheet** before any expensive render: `npx remotion render Film out/half.mp4 --scale=0.5 --muted`, or `npm run scene -- <scene>` for each scene in order.
11. **Act on the infra flags.** Lanes park shared problems ("Sky banding, not my file"). On Auni, banding under motion blur was reported four times and owned by nobody, until a 25-minute render showed it.
12. **Prove the final render on two frames first:** one calm frame and the fastest whip, with `npm run blurstill -- <frame>`. Read both at full size.
13. **Render the final and watch it.** `npm run final -- out/<name>-vN.mp4 --release`. Read its sheets and full-size frames, compare against the previous version at the same timestamps, and read the printed LUFS and true peak.
14. **Report point by point against the user's notes**, then a "before you post" list: real people who need to agree, generated faces for fictional people, the song's licence, shots below GPU quality.

## 2. What went wrong on Auni, and how to prevent it

| What happened | How to prevent it |
|---|---|
| **3.1** Lanes symlinked `node_modules`. `.gitignore` said `node_modules/`, which matches directories, not a symlink. The brief said `git add -A`; the social lane committed the link; merging it replaced the real 853 MB folder with a link to itself, and the next `npx tsc` fetched an unrelated npm package called `tsc` | Ignore `node_modules` and `.tools` with no trailing slash (the kit does). Commit named files only. `merge-lane` refuses `node_modules` and anything outside the owned list; the lane's pre-commit hook refuses it earlier |
| **3.2** A lane removed an export another lane imported. Only one export had been protected in the brief | Before launch, grep which exports of each owned file other lanes import, and list them as frozen in the owner's brief. Better: consume the previous scene's real frame (`LastFrameOf`) |
| **3.3** A lane changed a shared component's behaviour (counts flooding from zero), silently changing two other scenes. The builder mentioned it only in prose | Owners may add props but keep defaults. Every report carries a structured `for_orchestrator` list |
| **3.4** Every lane spent its whole budget. Post-drop scenes grew 15.5 beats in total, the close came 15.5 beats past the song's break, and the film ended at 39.4s against a "~30s, fast" direction | Budgets top down: total length, then the song's landmarks, then each lane's share, so the sum of ceilings lands on a landmark. Tell lanes the music reason. Keep the splice guard as the safety net |
| **3.5** Hand-offs couldn't be judged inside a lane: 10 of 77 problems | Give lanes the neighbours' boundary stills and a hand-off contract. Budget the hand-off pass (step 5). Judges list hand-offs under `orchestrator_issues` |
| **3.6** Banding and stamped whips were flagged four times; nobody owned the shared render code. Doubling blur samples (8 to 16) made banding worse. The real fix (16 shifted passes averaged in ffmpeg at 10 bits) cost about 80 minutes of renders | Run an infra lane during the run (see SKILL.md section 8). Prove the final render on a calm frame and the fastest whip at the very start of the project. The kit ships `final.sh`, never the browser blur |
| **3.7** Three lanes stayed at 7 partly on problems they were told not to touch; one lane's score fell after its fix, 7.5 to 7 | Judges split `problems` (lane-fixable, scored) from `orchestrator_issues` (not scored). See `../review/judge.md` |
| **3.8** One fix round wasn't enough for three of five lanes | Allow a second fix round only for lanes whose remaining problems are lane-fixable mediums, capped at two. The rest goes to the orchestrator |
| **3.9** A lane went past the approved list of real people | Give lanes the exact list. Real people go on the "before you post" list every time |
| **3.10** 16 blur samples at concurrency 10 ran Chrome out of memory; twelve parallel `remotion still` calls each bundled on their own and stalled until killed | Bundle once (`npm run stills` does). Set concurrency from measured memory, not cores. Prove on 2 frames before a full render. Full renders only after the half-size muted pass is clean |
| **3.11** In solo rounds the user had to repeat notes: "please i've asked you sevreal times to change the card style at the top"; "Again i don't think you've nailed the social part" | Keep `notes.md` (one line per note, its scene, status, round) and feed the open ones into every brief and judge |
| **3.12** What paid off | Restructure for parallel work first and prove it's a no-op (cue-list diff, a render compare). Verbatim notes plus your reading in every brief. `pipeline()` with no barrier. Judges that count frames and give a fix per problem. Code comments that state a constraint ("never faster than the ring shrinks, so nothing swings over the words") saved a regression |

## 3. Refitting the music

The song's structure is a film-level constraint no lane can see. After the merge:

```
 sum scene lengths -> where does breakOn start? -> late = that start - the song's break
        |
        +- late = 0                     done
        +- late = whole phrases         song() jumps on spliceAt's cut; check the seam
        +- anything else                npm run check fails with the fix; grow or shrink a scene
```

1. `npm run frames` and add up the scenes against the landmarks in `src/music.json` (quiet, drop, break, re-drop).
2. If `npm run check` throws, it says how many beats to add or cut. Grow or shrink the scene that can best spare it. On Auni the close started 15.5 beats late; one scene grew half a beat so the lateness was exactly 16, one whole phrase.
3. `npm run music:seams -- --jump <late>`. Pick a scene cut that sits on a good seam (score 0.9 or more, step under 3 dB) and set `spliceAt` in `src/score.ts`. Auni jumped back 16 beats at the cut into social, a 0.99 seam.
4. `npm run mix`, `npm run audio:check`, and read the cue sheet across the seam.
