# Research brief for analyst agents

A shared brief for agents that tear down reference launch films. Every analyst gets the same brief
and 1 to 3 videos each. Fill the `{{placeholders}}`, then paste the brief (section 3) into each
analyst's prompt. The research fan-out itself is run by `launch-film:team`.

Why one brief: when each agent fights its own downloads and tools, you get thirteen different kinds
of report. With the evidence prepped once and one fixed outline, the reports line up and you can
compare them side by side.

---

## 1. Questions to answer before any film exists

Four research agents, one question each, in parallel. Each writes a full report to a file and
replies with a 300 to 400 word summary. Read the summaries first; the files are for depth.

1. **The product itself.** From its code, its site and real usage: what it does, the magic moment,
   the real components, colour and easing tokens, the real CTA and tagline, the logo or mascot SVG.
2. **What winning launch films do.** Primary sources only, with dates. Keep measured results (views,
   likes per follower, signups) apart from opinion. Flag inflated or paid impressions.
3. **Hooks and controversy.** What gets attention in this category, and what backfires.
4. **The production stack.** How the best ones are made, and what of that can be built in code.

Then verify before you synthesise: grep the reports for the most surprising claims (a survey
figure, a shutdown date, a viral number) and check each at its source.

## 2. Headline findings to start from (RESEARCH, from X data in Oct 2026)

- **Length bands.** Teaser 5 to 12s. Product launch 20 to 40s. Flagship "new category" 45 to 110s.
  Deep demo 2 to 6 minutes. Launch posts of 20 to 90s had the best reach and likes per follower in a
  study of 3,854 posts. Under 20s reached about half as many people per follower. X's own ad advice
  (under 15s) is tuned for paid completion, not organic launches.
- **Hooks for the first 1 to 3s:** a headline on frame 1; a money number; a known thing, transformed;
  a mystery or question; a human scene with the product as an overlay; the founder to camera;
  the problem as comedy. Weakest: a logo, a title card, a disclaimer, a static hold. Only about 1 in
  4 impressions becomes a 2-second view, so frame 1 carries most of the message.
- **Drop timing.** Strong films lock their biggest visual payoff to the music's biggest change, at
  about 2 to 10s: a coin into a phone at 2s, the first action at 5s, the first UI at 6.8s, a whip
  reveal at 9.0s, a reveal at 10.0s.
- **No narrator.** Every top organic launch in the set had no voiceover. About 60 to 70% of X plays
  are muted (third-party figure). For a chat product, on-screen chat bubbles carry the script.
- **Control is necessary but not shareable.** Money products that led with safety got the lowest
  organic engagement. Winners lead with leverage or ease and show control as one quick beat.
- **Around the post:** a teaser the day before often beats the launch; the link in the first reply;
  the founder replying for the first hour.

## 3. The analyst brief

```text
Goal: reverse-engineer how these launch films are made, so we can make a launch film for
{{PRODUCT}} at that level or better, built in code (Remotion, Blender, Python audio tools).

DATA YOU HAVE, per video, in {{PACK_DIR}}/<name>/ (made by `npm run refs`):
- analysis.json: duration, resolution, fps; hard cuts (scene score > 0.30) and soft cuts (> 0.15);
  shot stats; audio: tempo, beat times, strongest transients (loudest onsets, usually SFX hits and
  drops), loudness dB per 0.5s, brightness per 0.5s, how many cuts land within 80ms of a beat vs a
  transient; transcript (Whisper, may mishear lyrics); music IDs (Shazam at 3 points).
- sheets/sheet_NN_<start>s.jpg: contact sheets at 4 frames per second, 16 per sheet, each frame
  labelled with its time. VIEW EVERY SHEET, in order. This is your main evidence.
- shots/shot_NNN_<t>s.jpg: one full-width frame from the middle of each hard-cut shot, to read text.
- audio_vs_cuts.png: spectrogram and loudness with cut lines and beats. View it.
- The source video: {{VIDEO_DIR}}/<name>.mp4.

TRAPS:
- Hard-cut detection undercounts badly. These films move by camera moves, morphs, zooms and masks,
  not cuts. Count visual beats (a new idea or state appearing) yourself, from the sheets.
- You can't hear. Infer sound from the spectrogram: whooshes are broadband noise sweeps; risers are
  rising pitch and brightness; impacts are broadband vertical spikes with low end; UI clicks are tiny
  short high transients; drops are a sudden jump in loudness and low end. Say how confident you are.

TOOLS for a deeper look (an easing curve, small text): ffmpeg at {{FFMPEG}} (a full-res frame:
ffmpeg -ss 12.4 -i <video> -frames:v 1 <scratch>/f.jpg; or every frame over 1s to measure easing,
overshoot and blur). Python with librosa, numpy and PIL at {{PYTHON}}, run with -I. Keep scratch
scripts in {{SCRATCH_DIR}}/<you>/, never inside the video folder.

PRODUCT CONTEXT for section 9: {{PRODUCT_CONTEXT}} (two sentences, the brand's colours, type and
easing, and its design rules).

DEPTH: {{DEPTH}} (for example: "this is the flagship, spend the most depth here", or "this is a
showreel: build a technique library of 25+ entries").

OUTPUT: one file per video at {{OUT_DIR}}/<name>.md, with exactly these sections:
1. Overview: product, what it launches, length, aspect, fps, results (given), and a 2-sentence
   verdict on why it works or doesn't.
2. Beat-by-beat timeline (a table, every visual beat, usually 0.5 to 3s each): time range | on
   screen | camera and motion (push, pan, orbit, speed, easing feel, blur) | transition into the next
   (cut, whip, match cut, mask wipe, morph, zoom-through) | exact on-screen text and how it animates |
   sound (music section, SFX type, VO) | story job.
3. Story structure: the hook (exactly what happens in 0 to 1s and 1 to 3s), setup, feature reveals,
   the peak, the end card and CTA, with the time spent on each. What the viewer is made to want.
4. Motion language: easing (measure at least one move frame by frame), speed ramps, motion blur, real
   3D or 2.5D, depth of field, parallax, how UI is shown (rebuilt vector or screen recording; device
   frame or floating panels; cursor or finger), typography (weight, size relative to frame, kinetic
   tricks), palette and backgrounds, light and particles, the logo animation.
5. Sound and music: the track (Shazam), genre, BPM, energy curve and drop times, how the edit follows
   the music (on beat, or on SFX hits), SFX density and types per section, silences, VO if any.
6. Pacing numbers: visual beats per 5s window (counted by you), average beat length per act, where it
   slows down and why.
7. Techniques worth stealing: 6 to 12, each with its timestamp, what it is, and how to build it in
   code (interpolate parameters, CSS 3D transforms, masks, blur).
8. Weak spots and what to avoid.
9. Applying to {{PRODUCT}}: 3 to 5 concrete ideas, each tied to a moment of the product.

Be specific and measured: timestamps, counts, exact text. No adjective without evidence.
```

## 4. After the analysts

- Read every report's sections 2, 7 and 9 side by side.
- Build a decision board: real reference frames next to 3 or 4 storyboarded directions.
- Ask the user to pick with the question tool (see [questions.md](questions.md), round 2).
