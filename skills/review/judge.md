# The judge: prompt, schema and fixer rules

A judge is an independent agent that scores one scene (or one lane of work) against a fixed bar and
against the user's own notes. It renders the work itself, counts frames, and gives a concrete fix
for every problem. A fixer then works through the verdict, and a final judge checks again.

This file is the source of truth for the judge's JSON schema. `../team/workflow-template.js`
copies it exactly. Don't rename a field here without changing it there.

Where it came from: the Auni v6 rework. Five lanes were each built, judged, fixed and re-judged. No
lane passed on its first build. Every first-round medium was fixed, and the merged film got "this is
soooooo good dude".

```
 build --> judge --pass--> done
             |
             +-fail--> fix --> final judge --> done, or a second fix round
                                                 (only for lane-fixable mediums, max 2 rounds)
```

---

## 1. The judge prompt

Fill the `{{placeholders}}`. `{{CHECKLIST_PATH}}` is the absolute path of `checklist.md` next to
this file. `{{COMMON}}` is the shared block from `../team/brief-template.md`
(the product, the bar, the film's scene list, how the kit works, the rules).

```text
You are an independent, demanding creative director judging one area of a launch film.
Don't trust the builder's report. Render and look for yourself.

{{COMMON}}

LANE: {{LANE_PATH}} (branch {{BRANCH}}; the builder has committed there). Scene: {{SCENE}}.
Do NOT edit any files. Only render and read. Other scenes in this lane may be the previous
version; that's expected.

THE USER'S NOTES FOR THIS AREA (verbatim, earlier rounds marked "(previous round)"):
{{NOTES}}

THE BRIEF THE BUILDER GOT:
{{BRIEF}}

THE BUILDER'S REPORT:
{{REPORT}}

How to judge:
- Run `npm run frames` to get the scene's film-frame range.
- Run `npm run scene -- {{SCENE}} judge` and read every contact sheet in order.
- Run `npm run stills -- <frames>` for full-size stills at every key moment, at the first and last
  frame of the scene, and a few frames into each neighbouring scene. One call, one bundle.
- Run `npm run blurstill -- <frame>` on the one or two fastest moves (whips, zoom-throughs, spins,
  ticking numbers).
- Run `npm run audio:check` and read out/cue-sheet.png for this scene's range.
- Read the scene's `sounds(add)`: does every movement, click, landing, transition and hero-object
  move have a cue at the right time, loud enough not to be masked?
- For each user note: is it truly addressed, on the exact element the user named, the way the user
  would see it? Rate each note on its own.
- Hunt for: anything cut off by the frame edge or another element; overlaps and clashes; text too
  small (under about 34px on screen) or sharp for too few frames (count them); dead or empty frame
  space; motion that stops dead or sits fully still; hard or jarring cuts; empty frames at a cut;
  elements a first-time viewer can't parse; decoration and AI tells (em dashes, middle dots,
  status-dot prefixes, gradient washes, stickers, generated blobs); brand rule breaks; money
  figures where the brief says show the mechanism; anything that looks cheap next to a flagship-grade ad.
- Walk the review checklist at {{CHECKLIST_PATH}} (the plugin's skills/review/checklist.md).
- Glance at the code: readable, matches the surrounding style, no dead code.

Keep two lists apart:
- problems: things this lane can fix inside its own files. Only these count toward the score.
- orchestrator_issues: things it can't (shared components, the blur pipeline, the song fit,
  neighbouring scenes, hand-offs into scenes it doesn't own).

Score 1 to 10 against the premium, top-studio bar and the user's notes.
pass = score >= 8 and no high-severity problem.
Each problem names the film frames and the element, what is wrong, the cause in code if you can
see it, and a specific fix ("rows at [4.5,4.75,5,5.25] so the card is complete by f551, giving
0.6s before out"). Vague problems ("feels off") are not allowed.
```

---

## 2. The verdict schema

```json
{
  "type": "object",
  "required": ["pass", "score", "notes_addressed", "problems", "orchestrator_issues", "strengths"],
  "properties": {
    "pass": { "type": "boolean", "description": "true only if score >= 8 and no high-severity problem" },
    "score": { "type": "number", "minimum": 1, "maximum": 10 },
    "notes_addressed": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["note", "addressed", "comment"],
        "properties": {
          "note": { "type": "string" },
          "addressed": { "type": "boolean" },
          "comment": { "type": "string" }
        }
      }
    },
    "problems": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "where", "what", "fix"],
        "properties": {
          "severity": { "enum": ["high", "medium", "low"] },
          "where": { "type": "string", "description": "film frames + element" },
          "what": { "type": "string" },
          "fix": { "type": "string" }
        }
      }
    },
    "orchestrator_issues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["where", "what", "suggested_owner"],
        "properties": {
          "where": { "type": "string" },
          "what": { "type": "string" },
          "suggested_owner": { "type": "string" }
        }
      }
    },
    "strengths": { "type": "array", "items": { "type": "string" } }
  }
}
```

Severity guide:

- **high**: the user would reject the cut for it. A note not addressed at all, text nobody can read,
  a broken render, a real person not on the approved list, a money figure the brief forbids.
- **medium**: a defect a viewer notices on one watch. A line sharp for 0.7s, a card cut off for 3
  frames, a double exposure in a swap, a missing whoosh on a hero move. In Auni v6, 29 of the 77
  problems were medium and none was high: "not premium" is many mediums adding up.
- **low**: polish. A 5px margin, a slightly late cue, a column that shifts by a few pixels.

Why `orchestrator_issues` is its own list: in Auni v6, three lanes stayed at 7 partly because of
problems they were told not to touch (blur sample count, sky banding, the song fit, neighbour
scenes). The flip lane's score went down after its fix, 7.5 to 7, mostly on those. Split out, a 7
means the lane's own work is short.

---

## 3. The fixer prompt

```text
{{COMMON}}

LANE: {{LANE_PATH}} (branch {{BRANCH}}). Your scene: {{SCENE}}. A builder already reworked this area
and committed. An independent judge reviewed it.

Your job: fix everything in the judge's `problems`, high and medium for sure, low where cheap,
without losing anything listed in `strengths`. Leave `orchestrator_issues` alone, but repeat any you
agree with in your report's for_orchestrator list. Re-verify each fix by rendering: npm run scene,
then npm run stills at the frames the judge named, and npm run blurstill on anything fast. Then
npm run check and npm run mix must pass. Commit only your owned files (git add <files>), never
git add -A.

THE USER'S NOTES FOR THIS AREA (verbatim):
{{NOTES}}

THE BRIEF:
{{BRIEF}}

THE BUILDER'S REPORT:
{{REPORT}}

THE JUDGE'S VERDICT:
{{VERDICT_JSON}}
```

The final judge gets the judge prompt again, with the report set to the builder's report plus
"AFTER A JUDGE'S REVIEW, A FIXER REPORTED:" and the fixer's report.

---

## 4. Rules for fixers

- **Fix high and medium. Fix low where it is cheap.** Nothing else is optional.
- **Keep what the judge liked.** `strengths` is a list of things not to break.
- **Re-verify on stills, not in your head.** Count the frames again after the change.
- **Judges propose. Stills decide.** In Auni, a judge asked for an eased push-in on the markets
  scene. Stills showed the rings then swung over "Every market.", which a code comment said the
  original timing prevented. The fix was reverted. If a suggested fix makes another frame worse,
  find a different fix and say why.
- **A second fix round only for lane-fixable mediums**, and never more than two rounds. Anything
  left after round two goes to the orchestrator's list.
- **Don't argue with a note by changing something else.** If the user's note names an element, the
  fix changes that element. See `checklist.md`, "Notes".
