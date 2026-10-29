---
name: team
description: Run launch-film work as a team of agents. Either a research fan-out over reference films, or a rework where each area of the user's notes gets its own git clone, owned files and beat budget, with a builder, an independent judge that renders for itself, a fixer and a final judge. One integrator then merges, fixes the hand-offs between scenes, refits the music and watches the full render. Use when the user asks to fan out agents or subagents, or when one round of notes spans three or more scenes and the film's structure is stable.
---

# Make the film as a team

Agents helped the Auni film twice: to study reference films before anything existed, and to rework five areas of the film at once (v6). The v6 rework is the version the user called "this is soooooo good dude". This skill is how to run both shapes again, and the mistakes not to repeat. Commands are the film repo's (`npm run ...`).

## 1. When, and when not

- **Not while the engine or shared parts still change every round.** Auni v1 to v5 were built by one agent, because the timeline, the mix and the UI kit moved every round. Lanes need files they can own.
- **Not for two small notes.** v6.1 (a faster fly-through, a recentred close) was done directly in minutes.
- **Yes when one round of notes spans three or more scenes** and the structure is stable, or when the user asks: "Please fan out subagents to take on each of these if possible, and use judge subagents to review each agents work". Offer it yourself next time.
- **Know the cost.** v6: 5 lanes, 20 agents, 2.93M subagent tokens, 956 tool calls (about 530 of them image reads), 47 minutes for all lanes, then 5 minutes of merging and about 80 minutes of render fixes.

## 2. Two shapes

```
 RESEARCH FAN-OUT
 prep evidence once (npm run refs on every reference film)
      |
      +--> research agents, one question each --+
      +--> video analysts, one shared brief -----+--> verify surprising claims
                                                          |
                                                          v
                         decision board: real frames + 3 or 4 directions --> the user picks

 REWORK (one lane per area of the notes, each in its own clone)
 build --> judge --pass--> done
             |
             +--fail--> fix --> final judge --pass--> done
                                     |
                                     +--fail, lane-fixable mediums left--> fix 2 --> final judge 2
 then: integrate (merge, hand-offs, music refit, half-size render, final)
```

- **Research fan-out.** Prep the evidence once, centrally, before spawning anyone: `npm run refs -- <video> out/refs/<name>` on every reference film, in parallel. Then 4 research agents, one question each (the product from its code, what winning launch films do with primary sources only, hooks and controversy, the production stack), each writing a full report to a file and replying with a 300 to 400 word summary. Video analysts share one brief (`launch-film:make` [../make/research-brief.md](../make/research-brief.md)), 1 to 3 films each, with depth assigned on purpose ("spend the most depth here" on the flagship). Before writing anything up, check the most surprising claims at the source.
- **Rework.** The rest of this skill.

## 3. Preconditions for a rework

- **Every scene owns its beats and its sounds.** The kit already does: `src/beats/<scene>.json` and each scene's `sounds(add)`. On Auni this restructure came first and was proved a no-op by a cue-list diff ("236 236 identical") and a render compare.
- **The notes ledger is current** (`notes.md`): every note verbatim, its scene, its round, its status.
- **Cross-lane decisions are settled up front**, so two lanes can't decide them differently (Auni: which account asks the question, the one shared brand icon).
- **`.gitignore` has `node_modules` and `.tools` with no trailing slash.** A trailing slash doesn't match a symlink, and lanes symlink both.
- **`npm run check` is clean** and everything is committed. Lanes clone commits only.
- **The final render is proven** on a calm frame and the fastest whip (`npm run blurstill`). On Auni the blur pipeline failed after the lanes, and cost 80 minutes.

## 4. Cutting lanes

- **One lane per area of the notes**, not strictly one per scene. Auni v6 had five: intro (two scenes plus the close's sounds), card, flip, markets, social.
- **Ownership by file, and by named export inside a shared file** ("you own `src/scenes/social.tsx`, `src/beats/social.json`, and COPIERS in `src/content.ts`"). Everything else is read-only: "if you need a variant of a shared component, make it locally in your own file". Disjoint ownership gave Auni a five-way merge with no conflicts.
- **Grep which exports of each owned file other lanes import**, and list them in the owner's brief as frozen. Auni protected one shared export and lost another; the merge failed to type-check.
- **Owners may add props, but keep every default.** A changed default silently changes every other scene that uses the component.

## 5. Budgets, top down

- Order: the film's total length, then the song's landmarks, then each lane's share. **The sum of the ceilings must land on a landmark** (the break), or on a landmark plus whole phrases.
- **Tell each lane the music reason** for its ceiling ("the close must still start on the break").
- Expect every lane to spend its full ceiling. On Auni all five did; the film grew from 32.5s to 39.4s and the close slid 16 beats past the break. The splice guard caught it, but budgets should have.

## 6. Create the lanes

- `npm run lane -- <name> <owned paths...>` makes `../<film>-lanes/<name>`: a clone on branch `<name>`, `node_modules` and `.tools` symlinked, the ignored audio and 3D frames copied, `.lane-owned` written, and a pre-commit hook that refuses files outside it.
- **Why a clone each, not one shared folder:** Remotion bundles the whole film for every render, so one agent's half-written file breaks every other agent's renders at once. A clone also keeps each lane's diff to its own files, which is what lets `merge-lane` check ownership.
- **Smoke-test one lane before launching agents:** `npm run scene -- <scene>` inside it must render.

## 7. Run it

- **With the Workflow tool:** adapt [workflow-template.js](workflow-template.js). Replace its COMMON and LANES placeholders from [brief-template.md](brief-template.md), and pass the film path as `args`. It runs `pipeline()` with no barrier (a fast lane is judged while a slow one builds), every agent at high effort, the judge schema from [../review/judge.md](../review/judge.md), a pass at score 8 or more with no high problem, and at most two fix rounds (the second only for lane-fixable mediums).
- **Without it:** run Agent subagents with the same prompts, lanes in parallel, judge after build, fix after a failed judge.
- **Briefs** come from [brief-template.md](brief-template.md): the user's notes verbatim with earlier rounds marked "(previous round)" and screenshot paths, one numbered job per note with 2 or 3 ideas, the neighbours' boundary stills and the hand-off contract, owned and frozen exports, the budget and its reason, and the exact list of real people allowed.
- **Judges render for themselves** and may not edit files. "Don't trust the builder's report" earned its place: the Auni intro builder reported "ghosting fixed" and "counts read the way X writes them"; the judge rendered and found each only partly true.

## 8. During the run: the infra lane

You are the orchestrator, and you run an infra lane while the others build.

- Collect every `for_orchestrator` item (from builders and fixers) and every `orchestrator_issues` item (from judges) **as it arrives**. The template logs them.
- Investigate the shared ones at once: shared components, the render pipeline, the song fit, hand-offs. On Auni, banding under the shutter blur was flagged by three agents ("in shared code, so I didn't touch it") and only found after a 25-minute render.
- Don't edit a lane's owned files while it runs. Fix shared code in the film root; it reaches the lanes at merge.

## 9. Integrate

Follow [integration.md](integration.md): merge each lane with `npm run merge-lane -- <name>` (it refuses files outside the lane and runs `npm run check`), fix what the merge broke, do the hand-off pass frame by frame across every cut, refit the music, render half-size muted before anything expensive, prove the final on two frames, then render and watch the final against the previous version.

## 10. Report

- **Point by point against the user's notes**, in their order, each with what changed and the timestamp to look at in the new cut (`npm run frames`; the old timestamps are stale).
- **Then the "before you post" list:** real people who need to agree, generated faces for fictional people, the song's licence, 3D shots below GPU quality (`npm run clearance`).
- Put every link and file path in this final reply.

## Reference files

| File | What it holds | Read it when |
|---|---|---|
| [brief-template.md](brief-template.md) | The COMMON and LANE brief templates, how each agent's prompt is built, what the Auni briefs got right and missed | Writing any lane brief |
| [integration.md](integration.md) | The 14-step integration checklist, every process failure from Auni with its prevention, the music refit | After the run, before showing the merged cut |
| [workflow-template.js](workflow-template.js) | A Workflow script: build, judge, fix, final judge, optional second fix, per lane | Running a rework with the Workflow tool |
| [../review/judge.md](../review/judge.md) | The judge and fixer prompts and the verdict schema | Judging, fixing, or editing the template's schema |
