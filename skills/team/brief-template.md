# Briefing a lane: the two templates

Every builder, judge and fixer in a rework gets the same COMMON block plus its own LANE block.
Fill every `{{placeholder}}`. `workflow-template.js` holds the same two blocks as JavaScript
strings; keep them in step.

Why the brief matters this much: a lane agent sees only its own scene between old neighbours. Every
thing it needs to know about the rest of the film, the user's taste and the shared code has to be in
the brief. On Auni v6 the briefs below produced five lanes that merged with no conflicts, and the
merged film got "this is soooooo good dude".

## 1. The COMMON block

```text
You are working on the {{PRODUCT}} launch film: a Remotion 4 (React) video, 1920x1080 at 30fps,
for {{WHERE_IT_POSTS_AND_FOR_WHOM}}. {{PRODUCT_IN_TWO_SENTENCES}}

THE BAR is {{BAR, e.g. "premium, top motion-design studio launch-film polish"}} (reference notes:
{{TEARDOWN_PATHS}}). Concretely:
- the camera is always moving, with eased, intentional motion (a slow creep counts);
- every element has a reason to be there and reads to someone seeing it for one second on a phone;
- nothing is cut off by the frame edge or by another element; nothing overlaps or clashes;
- text is big (34px or more on screen) and a short phrase is sharp and still for about 1s or more;
- the frame is used generously: no tiny content floating in empty space, no empty bands;
- depth of field (blur) separates foreground from background.

THE WHOLE FILM right now ({{VERSION}}, {{LENGTH}}s; beats are on the music grid, 1 beat =
{{BEAT_S}}s, beat 0 = the drop):
{{NUMBERED_SCENE_LIST, one line per scene: name, what the viewer sees, how it hands off}}
The user just watched {{VERSION}} and gave notes. You own one area of them (below). Other agents
are reworking the other areas at the same time, each in their own copy of the film.

HOW THE PROJECT WORKS (read the files, they are short):
- Your lane is a git clone of the film at LANE, on its own branch. Work only there. Never touch the
  main film or other lanes.
- src/beats/<scene>.json holds each scene's moments in beats from the scene's own start, plus its
  "length". src/engine/motion.ts chains scenes (scenes before the drop end on it, the rest follow)
  into T, with beat() and bf() for seconds and frames, ramp(), land() (fast in, hard brake, slow
  creep) and the curves. You can change your scene's length and moments without touching any other.
- Each scene file exports its picture and sounds(add), which writes its cues on the same beats.
  Use roles, not files: v("whoosh", i). Roles are in public/sfx/roles.json:
  {{ROLE_LIST}}
  The user's standing rule: ANY movement, click, cursor move, transition, spinner, landing or
  count-up gets a sound. Don't be afraid to use a lot. {{HERO_OBJECT}} moves get prominent whooshes.
- Shared parts in src/parts/ (Backdrop, Gloss, Iris, Cursor, Count, Typed, LastFrameOf, Shot, Mark)
  and {{OTHER_SHARED_FILES}} are READ-ONLY for you. Need a variant? Make it locally in your file.
- 3D shots (public/3d/manifest.json): {{SHOT_LIST}}. New shots: npm run shot -- <shot> (slow on
  CPU; only if truly needed).
- Every word on screen, person and logo is in src/content.ts.
- Check your work:
  npm run frames                  each scene's film-frame range
  npm run scene -- <scene> [name] half-size muted render + contact sheets labelled in film time
  npm run stills -- <frames...>   full-size stills from one bundle (never many parallel stills)
  npm run blurstill -- <frame>    one frame with the final's shutter blur, for fast moves
  npm run check                   types, cues, splice guard
  npm run mix, npm run audio:check (then read out/cue-sheet.png)
  Look at your scene at full size at its key moments and every cut, not just the sheets: edges,
  overlaps, legibility, hold times counted in frames.
- Walk {{PLUGIN_ROOT}}/skills/review/checklist.md before you report.

RULES:
- Brand: {{BRAND_RULES: colours, type, the look}}. No AI design tells: no em dashes, middle dots,
  status-dot prefixes, gradient washes on cards, stickers, generated blobs, or labels a viewer
  can't parse. {{CONTENT_RULES, e.g. "No money figures in earning moments: show the mechanism"}}
- Code: match the surrounding code. A short doc comment per component saying what the viewer sees.
  Delete what you replace. No dead code.
- Timing: big moments on whole or half beats, as named beats in your beats file. Your budget is a
  ceiling: use only as many beats as the moment needs.
- Commit only your owned files: git add <file>..., never git add -A. (A lane once committed its
  node_modules symlink, and the merge deleted the real folder.) The lane's hook refuses others.

YOUR FINAL ANSWER:
- for each user note: what you changed and why;
- your scene's length in beats now;
- the film frames or still paths that best show the result;
- anything you could not do;
- for_orchestrator: a list of { where, what, suggested_owner } for everything outside your lane:
  shared components, neighbour scenes, hand-offs, the song fit, render problems. Don't bury these
  in prose.
```

## 2. The LANE block

```text
LANE: {{FILM}}-lanes/{{KEY}} (branch {{KEY}}). Your scene: {{SCENE}}.

THE USER'S NOTES FOR YOUR AREA (verbatim; earlier rounds marked "(previous round)"):
"{{NOTE}}"  [screenshot: {{ABSOLUTE_PATH}}]
(previous round) "{{OLDER_NOTE}}"

AREA: {{what this part of the film is for}}. In {{VERSION}} film time {{FROM}}-{{TO}}s
({{e.g. "12s = research, 13s = found -> card"}}). The user's timestamps go stale as soon as any
scene changes length, so this maps them.

YOUR JOB, one item per note:
1. {{THE_NOTE_RESTATED_AS_A_GOAL}}. The meaning that must land: "{{MEANING}}". Ideas (pick the best
   or better): {{IDEA_A}}; {{IDEA_B}}; {{IDEA_C}}.
2. ...

NEIGHBOURS: the scene before ends {{HOW_IT_ENDS}} (stills: {{PREV_LAST_FRAMES}}); the scene after
opens {{HOW_IT_OPENS}} (stills: {{NEXT_FIRST_FRAMES}}). Another agent may be redesigning them.
Hand-off contract: you enter {{DIRECTION_OF_TRAVEL}}; the next subject appears {{WHERE}}; your last
frame is {{A_CLEAN_SETTLED_FRAME | MID-MOVE TOWARD WHERE THE NEXT SUBJECT APPEARS}}, one a cut or
whip works from. To show the previous scene's real last frame, use <LastFrameOf scene="..."/>.

SHARED THINGS YOU USE, and their contracts: {{e.g. "BrandIcon: a square-ish icon, size prop only;
another agent is redesigning it"}}

YOU OWN: {{FILES, and named exports inside shared files}}
FROZEN: other lanes import {{EXPORTS}} from your files. Keep those exports and their props. You may
add props, but keep every default unchanged for existing callers.

BUDGET: {{SCENE}} is {{NOW}} beats now and may grow to {{CEILING}}. Why the ceiling: {{MUSIC_REASON,
e.g. "the close must still start on the song's break at film beat 56"}}.

REAL PEOPLE you may show: exactly {{HANDLES}} (pictures in public/faces/x/). Anyone else is a
fictional person with a generated face. Never put invented words on a real account. Fetch accounts
with npm run people; never print the token.
```

## 3. How each agent's prompt is assembled

| Agent | Prompt |
|---|---|
| Builder | COMMON + LANE + "Work iteratively: render, look at full-size stills of the key moments, improve, repeat until it truly meets the bar. Then npm run check and npm run mix must pass. Commit your owned files." |
| Judge | The judge prompt from `../review/judge.md` (COMMON, the lane, the notes, the brief, the builder's report) |
| Fixer | The fixer prompt from `../review/judge.md` (COMMON, the lane, the builder's report, the judge's verdict JSON) |
| Final judge | The judge prompt again, with the report set to the builder's report plus "AFTER A JUDGE'S REVIEW, A FIXER REPORTED:" and the fixer's report |

## 4. What made the Auni briefs work, and what they missed

Worked:

- **Notes verbatim, plus the orchestrator's reading.** Judges check against the user's words, not a paraphrase. Earlier rounds' notes marked "(previous round)" stopped notes from silently dropping: before v6 the user had to say "please i've asked you sevreal times to change the card style at the top".
- **One numbered job per note, with 2 or 3 concrete ideas and "pick the best or better".** It aims the agent without capping it.
- **The meaning that must land, in plain words** ("all those markets, one conversation"). Agents build toward a meaning far better than toward a layout.
- **The whole film as a scene list**, so each lane knew what came before and after.

Missed, and now in the template:

- **Frozen exports.** Only one shared export was protected; a lane dropped another and the merge broke the build.
- **Neighbours' boundary stills and a hand-off contract.** 10 of 77 judge problems were hand-offs no lane could see.
- **The music reason for the budget.** Every lane spent its full ceiling and the close missed the song's break by 16 beats.
- **The exact list of real people.** "A few more real accounts" let a lane add six famous people nobody approved.
- **A structured `for_orchestrator` list.** Cross-lane effects were flagged only in prose.
- **Commit named files only.** `git add -A` committed a symlink.
