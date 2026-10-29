export const meta = {
  name: 'launch-film-rework',
  description: 'Lanes rework a launch film from the user notes: build, independent judge, fix, final judge, per lane',
  whenToUse: 'A round of notes on a launch-film kit film spans three or more scenes, the structure is stable, and lanes exist (npm run lane)',
  phases: [
    { title: 'Build', detail: 'one agent per lane, each in its own git clone' },
    { title: 'Judge', detail: 'an independent reviewer renders and scores against the notes' },
    { title: 'Fix', detail: 'fixes what the judge found' },
    { title: 'Final judge', detail: 're-checks after each fix' },
  ],
}

// How to use this template (launch-film:team, skills/team/SKILL.md):
// 1. Copy this file. Replace every block marked REPLACE with your film's text, following
//    skills/team/brief-template.md. As shipped it describes the kit's Acme demo film, so it runs
//    against a fresh `new-film.sh` copy.
// 2. Create one lane per LANES entry first: npm run lane -- <key> <owned paths...>, and smoke-test
//    one with npm run scene -- <scene>.
// 3. Run it with args: { film: "/abs/path/to/film", plugin: "/abs/path/to/launch-film plugin" }
//    (or just the film path as a string). Lanes are expected at <film>-lanes/<key>.
// 4. It is a Workflow script body (top-level await and return), so `node --check` rejects it. To
//    check it parses: node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8").replace(/^export /m,"");
//    new (Object.getPrototypeOf(async function(){}).constructor)("args",s)' <file>

const A = typeof args === 'string' ? { film: args } : args || {}
if (!A.film) throw new Error('Pass the film repo path as args: { film: "/abs/path/to/film", plugin: "/abs/plugin/root" }')
const FILM = A.film.replace(/\/+$/, '')
const CHECKLIST = A.plugin ? `${A.plugin.replace(/\/+$/, '')}/skills/review/checklist.md` : null
const MAX_FIX_ROUNDS = 2

// ---------------------------------------------------------------------------------------------
// REPLACE: the COMMON block (skills/team/brief-template.md section 1). Every agent gets it.
// ---------------------------------------------------------------------------------------------
const COMMON = `
You are working on the Acme launch film: a Remotion 4 (React) video, 1920x1080 at 30fps, for a launch post on X, for people who plan trips in group chats. Acme turns a group chat's plan into real bookings: the friends talk, Acme books the flights, the stay and the tables, and everyone is in.

THE BAR is premium, top motion-design studio launch-film polish. Concretely:
- the camera is always moving, with eased, intentional motion (a slow creep counts);
- every element has a reason to be there and reads to someone seeing it for one second on a phone;
- nothing is cut off by the frame edge or by another element; nothing overlaps or clashes;
- text is big (34px or more on screen) and a short phrase is sharp and still for about 1s or more;
- the frame is used generously: no tiny content floating in empty space, no empty bands;
- depth of field (blur) separates foreground from background.

THE WHOLE FILM right now (v1, 12.8s; beats are on the music grid, 1 beat = 0.4s, beat 0 = the drop):
1. hook (8 beats, before the drop): five chat messages slam in, accelerating, as the camera pulls back; in the quiet bar a line types: "ok but who's actually booking it?"; the camera dives into it.
2. reveal (16 beats, from the drop): the Acme card fills the frame; four booking rows deal in; a cursor taps "Book it"; a count rolls to "4 of 4 booked"; a coin turns; a light sweeps the card; the camera orbits, pushes in, settles, then accelerates out.
3. close (8 beats): the reveal's last frame whips off; the coin turns big and centred through the song's break; on the re-drop the logo lands through an iris; "Plans that actually happen." word by word; a "Try Acme" button and acme.example.
The user just watched v1 and gave notes. You own one area of them (below). Other agents are reworking the other areas at the same time, each in their own copy of the film.

HOW THE PROJECT WORKS (read the files, they are short):
- Your lane is a git clone of the film at LANE, on its own branch. Work only there. Never touch the main film or other lanes.
- src/beats/<scene>.json holds each scene's moments in beats from the scene's own start, plus its "length". src/engine/motion.ts chains scenes (scenes before the drop end on it, the rest follow) into T, with beat() and bf() for seconds and frames, ramp(), land() (fast in, hard brake, slow creep) and the curves. You can change your scene's length and moments without touching any other.
- Each scene file exports its picture and sounds(add), which writes its cues on the same beats. Use roles, not files: v("whoosh", i). Roles (public/sfx/roles.json): whoosh, whoosh_heavy, air, pop, tick, click, button, switch, typing, shine, impact, boom, riser, ding, notify, cash. The user's standing rule: ANY movement, click, cursor move, transition, spinner, landing or count-up gets a sound. Don't be afraid to use a lot. Every move of the 3D coin gets a prominent whoosh.
- Shared parts in src/parts/ (Backdrop, Gloss, Iris, Cursor, Count, Typed, LastFrameOf, Shot, Mark, Avatar), src/brand.ts and src/engine/ are READ-ONLY for you. Need a variant? Make it locally in your own file.
- 3D shots (public/3d/manifest.json): spin. New shots: npm run shot -- <shot> (slow on CPU; only if truly needed).
- Every word on screen, person and logo is in src/content.ts.
- Check your work:
  npm run frames                  each scene's film-frame range
  npm run scene -- <scene> [name] half-size muted render + contact sheets labelled in film time
  npm run stills -- <frames...>   full-size stills from one bundle (never many parallel stills)
  npm run blurstill -- <frame>    one frame with the final's shutter blur, for fast moves
  npm run check                   types, cues, splice guard
  npm run mix, npm run audio:check (then read out/cue-sheet.png)
  Look at your scene at full size at its key moments and every cut, not just the sheets: edges, overlaps, legibility, hold times counted in frames.${CHECKLIST ? `\n- Walk ${CHECKLIST} before you report.` : ''}

RULES:
- Brand: the colours, type and easings in src/brand.ts, one type voice. No AI design tells: no em dashes, middle dots, status-dot prefixes, gradient washes on cards, stickers, generated blobs, or labels a viewer can't parse. No prices on screen: show the mechanism.
- Code: match the surrounding code. A short doc comment per component saying what the viewer sees. Delete what you replace. No dead code.
- Timing: big moments on whole or half beats, as named beats in your beats file. Your budget is a ceiling: use only as many beats as the moment needs.
- Commit only your owned files: git add <file>..., never git add -A. The lane's hook refuses anything else.
`

// ---------------------------------------------------------------------------------------------
// REPLACE: one entry per lane (skills/team/brief-template.md section 2). The notes below are
// EXAMPLES for the demo film; real notes are the user's words, verbatim.
// ---------------------------------------------------------------------------------------------
const LANES = [
  {
    key: 'hook',
    scene: 'hook',
    notes: `"EXAMPLE NOTE: the messages come in so fast i can't read any of them"
(previous round) "EXAMPLE NOTE: the question should feel more tense"`,
    brief: `AREA: the opening, before the drop: the group chat piling up plans nobody acts on, then the question. In v1 film time 0-3.2s.
YOUR JOB:
1. Readable messages. The meaning that must land: "everyone talks, nobody books". Ideas (pick the best or better): hold the first message about 1s and accelerate the rest; let the camera pull back so the pile reads as a wall; keep only the first and last sharp.
2. Tension into the drop. Ideas: hold the quiet bar nearly silent; type the question slower; a slow push toward it before the dive.
NEIGHBOURS: you open the film. The reveal (another agent is reworking it) opens on the Acme card filling the frame on the drop. Hand-off contract: your dive accelerates into the centre of the frame; the card appears centred; your last frame is mid-dive, so a hard cut works.
YOU OWN: src/scenes/hook.tsx, src/beats/hook.json, COPY.hook in src/content.ts.
FROZEN: nothing of yours is imported elsewhere.
BUDGET: hook is 8 beats and stays 8: it must end exactly on the drop.
REAL PEOPLE you may show: none. Everyone is fictional; no faces.`,
  },
  {
    key: 'reveal',
    scene: 'reveal',
    notes: `"EXAMPLE NOTE: the card doesn't use enough of the frame and the tap is easy to miss"`,
    brief: `AREA: the drop: the product appears and does its one job. In v1 film time 3.2-9.6s.
YOUR JOB:
1. Fill the frame and make the tap obvious. The meaning that must land: "one tap books everything". Ideas (pick the best or better): push the camera in so the card fills about 70% of the frame; rack down to the button as the cursor arrives; a ripple and a press at 0.82 scale; hold "4 of 4 booked" sharp for 0.6s or more.
NEIGHBOURS: the hook ends mid-dive into the centre (another agent is reworking it). The close opens by whipping your real last frame off screen (LastFrameOf), so your last frame must be clean and readable.
SHARED THINGS YOU USE: Gloss (light sweep, any rounded box), Count and reaches() (rolling digits, tick timing), Cursor, Shot "spin".
YOU OWN: src/scenes/reveal.tsx, src/beats/reveal.json, COPY.reveal in src/content.ts.
FROZEN: the close imports nothing from you, but LastFrameOf renders your Scene: keep its export name.
BUDGET: reveal is 16 beats now and may grow to 24. Why: the close must start on the song's break, and the song can only jump whole 8-beat phrases.
REAL PEOPLE you may show: none.`,
  },
]

// ---------------------------------------------------------------------------------------------
// Schemas. JUDGE is copied exactly from skills/review/judge.md; change both together.
// ---------------------------------------------------------------------------------------------
const ISSUES = {
  type: 'array',
  items: {
    type: 'object',
    required: ['where', 'what', 'suggested_owner'],
    properties: { where: { type: 'string' }, what: { type: 'string' }, suggested_owner: { type: 'string' } },
  },
}

const REPORT = {
  type: 'object',
  required: ['notes', 'length_beats', 'evidence', 'could_not', 'for_orchestrator'],
  properties: {
    notes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['note', 'change', 'why'],
        properties: { note: { type: 'string' }, change: { type: 'string' }, why: { type: 'string' } },
      },
    },
    length_beats: { type: 'number', description: "the scene's length in beats now" },
    evidence: { type: 'array', items: { type: 'string' }, description: 'film frames or still paths that best show the result' },
    could_not: { type: 'array', items: { type: 'string' } },
    for_orchestrator: { ...ISSUES, description: 'everything outside this lane: shared parts, neighbours, hand-offs, the song fit, render problems' },
  },
}

const JUDGE = {
  type: 'object',
  required: ['pass', 'score', 'notes_addressed', 'problems', 'orchestrator_issues', 'strengths'],
  properties: {
    pass: { type: 'boolean', description: 'true only if score >= 8 and no high-severity problem' },
    score: { type: 'number', minimum: 1, maximum: 10 },
    notes_addressed: {
      type: 'array',
      items: {
        type: 'object',
        required: ['note', 'addressed', 'comment'],
        properties: { note: { type: 'string' }, addressed: { type: 'boolean' }, comment: { type: 'string' } },
      },
    },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'where', 'what', 'fix'],
        properties: {
          severity: { enum: ['high', 'medium', 'low'] },
          where: { type: 'string', description: 'film frames + element' },
          what: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
    orchestrator_issues: ISSUES,
    strengths: { type: 'array', items: { type: 'string' } },
  },
}

// ---------------------------------------------------------------------------------------------
// Prompts (skills/team/brief-template.md section 3, skills/review/judge.md sections 1 and 3).
// ---------------------------------------------------------------------------------------------
const laneOf = (l) => `${FILM}-lanes/${l.key}`
const show = (x) => (typeof x === 'string' ? x : JSON.stringify(x, null, 1))

const lane = (l) => `
LANE: ${laneOf(l)} (branch ${l.key}). Your scene: ${l.scene}.

THE USER'S NOTES FOR YOUR AREA (verbatim; earlier rounds marked "(previous round)"):
${l.notes}

${l.brief}`

const RETURN = `
YOUR FINAL ANSWER (structured): for each user note, what you changed and why; the scene's length in beats now; the film frames or still paths that best show the result; anything you could not do; and for_orchestrator, every problem outside your lane (shared parts, neighbour scenes, hand-offs, the song fit, render problems) as { where, what, suggested_owner }.`

const buildPrompt = (l) => `${COMMON}${lane(l)}

Work iteratively: render, look at full-size stills of the key moments, improve, repeat until it truly meets the bar. Then npm run check and npm run mix must pass. Commit your owned files.
${RETURN}`

const judgePrompt = (l, report) => `You are an independent, demanding creative director judging one area of a launch film. Don't trust the builder's report. Render and look for yourself.
${COMMON}
LANE: ${laneOf(l)} (branch ${l.key}; the builder has committed there). Scene: ${l.scene}. Do NOT edit any files. Only render and read. Other scenes in this lane may be the previous version; that's expected.

THE USER'S NOTES FOR THIS AREA (verbatim, earlier rounds marked "(previous round)"):
${l.notes}

THE BRIEF THE BUILDER GOT:
${l.brief}

THE BUILDER'S REPORT:
${show(report)}

How to judge:
- Run npm run frames to get the scene's film-frame range.
- Run npm run scene -- ${l.scene} judge and read every contact sheet in order.
- Run npm run stills -- <frames> for full-size stills at every key moment, at the first and last frame of the scene, and a few frames into each neighbouring scene. One call, one bundle.
- Run npm run blurstill -- <frame> on the one or two fastest moves (whips, zoom-throughs, spins, ticking numbers).
- Run npm run audio:check and read out/cue-sheet.png for this scene's range.
- Read the scene's sounds(add): does every movement, click, landing, transition and hero-object move have a cue at the right time, loud enough not to be masked?
- For each user note: is it truly addressed, on the exact element the user named, the way the user would see it? Rate each note on its own.
- Hunt for: anything cut off by the frame edge or another element; overlaps and clashes; text too small (under about 34px on screen) or sharp for too few frames (count them); dead or empty frame space; motion that stops dead or sits fully still; hard or jarring cuts; empty frames at a cut; elements a first-time viewer can't parse; decoration and AI tells (em dashes, middle dots, status-dot prefixes, gradient washes, stickers, generated blobs); brand rule breaks; anything the brief forbids; anything that looks cheap next to a flagship-grade ad.${CHECKLIST ? `\n- Walk the review checklist at ${CHECKLIST}.` : ''}
- Glance at the code: readable, matches the surrounding style, no dead code.

Keep two lists apart:
- problems: things this lane can fix inside its own files. Only these count toward the score.
- orchestrator_issues: things it can't (shared components, the blur pipeline, the song fit, neighbouring scenes, hand-offs into scenes it doesn't own).

Score 1 to 10 against the premium, top-studio bar and the user's notes. pass = score >= 8 and no high-severity problem.
Each problem names the film frames and the element, what is wrong, the cause in code if you can see it, and a specific fix ("rows at [4.5,4.75,5,5.25] so the card is complete by f551, giving 0.6s before out"). Vague problems ("feels off") are not allowed.`

const fixPrompt = (l, report, verdict) => `${COMMON}
LANE: ${laneOf(l)} (branch ${l.key}). Your scene: ${l.scene}. A builder already reworked this area and committed. An independent judge reviewed it.

Your job: fix everything in the judge's problems, high and medium for sure, low where cheap, without losing anything listed in strengths. Leave orchestrator_issues alone, but repeat any you agree with in your for_orchestrator list. Re-verify each fix by rendering: npm run scene, then npm run stills at the frames the judge named, and npm run blurstill on anything fast. Judges propose; stills decide: if a suggested fix makes another frame worse, find a different fix and say why. Then npm run check and npm run mix must pass. Commit only your owned files (git add <files>), never git add -A.

THE USER'S NOTES FOR THIS AREA (verbatim):
${l.notes}

THE BRIEF:
${l.brief}

THE BUILDER'S REPORT:
${show(report)}

THE JUDGE'S VERDICT:
${JSON.stringify(verdict, null, 1)}
${RETURN}`

// ---------------------------------------------------------------------------------------------
// The run.
// ---------------------------------------------------------------------------------------------

/** The infra lane: surface every cross-lane flag the moment it arrives, not after the run. */
const flagged = {}
function flag(l, who, items) {
  for (const i of items || []) {
    ;(flagged[l.key] = flagged[l.key] || []).push({ from: who, ...i })
    log(`[${l.key}] ${who} flags for the orchestrator: ${i.where}: ${i.what} (owner: ${i.suggested_owner})`)
  }
}

const judge = async (l, report, phaseName, label) => {
  const v = await agent(judgePrompt(l, report), { label, phase: phaseName, schema: JUDGE, effort: 'high' })
  if (v) flag(l, label, v.orchestrator_issues)
  if (v) log(`[${l.key}] ${label}: ${v.score}/10, ${v.pass ? 'pass' : 'fail'}, ${v.problems.length} problems`)
  return v
}

/** Round 1 runs on any fail. Round 2 only if lane-fixable problems at medium or above remain; the rest goes to the orchestrator. */
const needsFix = (v, round) => !!v && !v.pass && (round === 1 || v.problems.some((p) => p.severity !== 'low'))

const results = await pipeline(
  LANES,
  async (l) => {
    const report = await agent(buildPrompt(l), { label: `build:${l.key}`, phase: 'Build', schema: REPORT, effort: 'high' })
    if (report) flag(l, `build:${l.key}`, report.for_orchestrator)
    return report
  },
  async (report, l) => ({ report, verdict: await judge(l, report, 'Judge', `judge:${l.key}`) }),
  async (r, l) => {
    let report = show(r.report)
    let verdict = r.verdict
    const rounds = []
    for (let round = 1; round <= MAX_FIX_ROUNDS && needsFix(verdict, round); round++) {
      const fix = await agent(fixPrompt(l, report, verdict), { label: `fix${round}:${l.key}`, phase: 'Fix', schema: REPORT, effort: 'high' })
      if (!fix) break
      flag(l, `fix${round}:${l.key}`, fix.for_orchestrator)
      report = `${report}\n\nAFTER A JUDGE'S REVIEW, A FIXER REPORTED:\n${show(fix)}`
      verdict = await judge(l, report, 'Final judge', `final-judge${round}:${l.key}`)
      rounds.push({ fix, verdict })
    }
    if (verdict && !verdict.pass && rounds.length) log(`[${l.key}] still failing after ${rounds.length} fix round(s): its remaining problems go to the orchestrator`)
    return { ...r, rounds, final: verdict }
  },
)

return LANES.map((l, i) => ({
  lane: l.key,
  scene: l.scene,
  path: laneOf(l),
  ...(results[i] || { failed: true }),
  for_orchestrator: flagged[l.key] || [],
}))
