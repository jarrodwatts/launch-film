# Music: find it, check it, lock it, fit the film to it

Every number here was measured on the Auni film's real files. Commands are the film repo's.

## 1. Choose the tempo band and the sections you need, before searching

- **Tempo bands:** fast about 150 BPM, medium about 120, slow about 100. The user pasted an agency's advice at the start: "Choose the right BPM before doing the video ... Working on the music after the animation is done. Definitely, definitely, definitely do the opposite." It held up.
- **Fast suits a launch.** The user asked to go from about 50s down to about 30s; it settled at 39.4s. At 173.7 BPM one beat is 0.345s, so a "one item per beat" montage moves at about 3 a second without feeling rushed.
- **List the sections the story needs**, then look for a song that has them in that order. Auni needed:

```
 energy (takes stack) -> quiet bar (the question) -> DROP (reveal) -> long high-energy run
                      -> break (mascot hero shot) -> re-drop (logo lockup)
```

- **Song shape decides film shape.** A song with drops every 12s (the multi-drop library track, 161 BPM) suits a film with several acts. One long build into one massive drop (the working track) suits one big reveal.
- **One song for the whole film**, and the drop comes early: "i think we only use one song btw and should probably drop earlier than 30s". Auni's drop is at 9.7s.

## 2. Learn what the references use

Run `npm run refs -- <video> out/refs/<name>` on each reference film. It reports tempo, beats, the 25 strongest transients, loudness and brightness per 0.5s, cuts, a transcript, Shazam IDs and a spectrogram with cut lines (`audio_vs_cuts.png`).

- **Cuts land on sound hits, not on beats.** The reference studio's showreel: 26 of 28 cuts within 80 ms of a transient, 14 of 28 on a beat. Film A: 11 of 12 vs 3 of 12. "Beat-synced" really means "SFX-synced", and SFX are the part you fully control.
- **Shazam at three points (start, middle, end)** catches edits that splice songs. Film I switched from one song to another under a push-in at 15.3s. Another film used a remix only from 25s.
- **Read the spectrogram, since you can't hear.** A drop is a sudden jump in loudness and low end. A riser is rising brightness. A whoosh is a broad sweep. A UI click is a tiny high transient.
- **Their mixes are flat and loud.** Film A sits at -15.5 to -21 dB for the whole body; the only dynamics are the intro dip and the drop. Film A saves its shimmer sound for its three "reward" moments.
- **Most top launches have no voiceover.** The film must work muted (60 to 70% of X plays are muted, a third-party figure).

What the reference studio used, all Shazam-confirmed (a taste reference, not a shopping list): about a dozen hard-hitting tracks, a mix of Epidemic Sound library music and major-label songs. Its biggest hit (film A) ran on a sped-up instrumental of a library track; film I spliced two major-label songs.

## 3. Get clean copies, and verify them

- **Never rip audio from a reference film.** It has their SFX baked in. Download the song itself: `npm run music:fetch -- "<artist> <title> [instrumental]"`.
- **Shazam every download.** A search for one song returned a different artist's track. The script refuses when Shazam's name lacks any word of your query.
- **Shazam confirms the song, not the version.** The first download of the multi-drop library track was a "(feat. ...)" vocal version. Ask for "instrumental" where one exists; vocals fight on-screen text. The script refuses a vocal result when you asked for an instrumental, and warns when it can't confirm the version. Run `npm run refs` on the file to get a Whisper transcript: lyrics mean vocals.

## 4. Check the licence early

| Source | Ads and brand use | What happened on Auni |
|---|---|---|
| Major-label song (the half-time track, the working track, most of the reference studio's picks) | Needs sync (publishers) and master (label) licences. Third-party ranges $5k to $500k+; expect low to mid five figures for paid social; may be refused for crypto | X processes DMCA notices in about 3 business days, and publishers mass-notice X. A takedown during the launch hurts most |
| Epidemic Sound (the multi-drop track sped up, a second hype track) | Ads allowed on Pro and Enterprise | The YouTube titles said "Royalty Free Music"; the uploader channel was Epidemic itself. Check the channel, not the title |
| Artlist | Pro tier for paid ads | |
| Mixkit, Pixabay | Free licence covers ads and social marketing, no credit | 465 Mixkit tracks scanned; the best measured were "not hype enough" |
| ElevenLabs Music | Paid plans allow online commercial use; section editing helps land a drop on an exact second | The best clean-rights AI option found |
| Suno and similar | Murkier rights | |
| Commissioned producer | Clean | $500 to $5k. Never commission a sound-alike of a famous song |

- Write the route into `src/music.json` `licence` the moment you shortlist a song. `npm run clearance -- --release` blocks the final while it says something like `major-label-unlicensed`.
- Keep a licensable fallback mapped on the same grid. Auni shipped its review cuts on the working track, a major-label song, with two Epidemic tracks as the analysed fallbacks. The licence was still open at the end of the day.
- The user never let licensing veto the pick during production. Flag it every version; don't block work on it.

## 5. Scan a catalogue for real drops

`npm run music:scan -- <folder> [--bpm 140-180]` slides a candidate drop every 0.25s through each track and keeps the best one. It ranks tracks on three measures (bass jump, energy hold, loudness lift) by summed rank. Then it writes `scan.json` and prints a table with titles and artists from the file tags.

Two failures it now prevents:

- **Silence fooled the first scan.** It was topped by "+130 dB drops": tracks starting from digital silence. The fix: a candidate counts only if its 4s "before" window is louder than the track's median minus 18 dB. "Music playing but no bass" is a build; silence is not.
- **One capped score flattened the ranking.** Clamped at 30, it tied 91 of 465 tracks at the top. Ranking on several measures, plus a BPM band, separates them. Then filter by genre by ear (the Mixkit list had drop country, children's music and film score).

Bare numeric file names can't be shown to a person. Fetch titles, artists, genre and licence with the files (Mixkit's pages carry them as JSON-LD).

## 6. Map one song's drops

`npm run music:grid -- <file> --drops` lists every drop with its bass jump, loudness jump, how hard the next 12s hit, whether the 8s before brighten (a build), and whether there's a near-silent gap right before. It keeps the strongest drop in each 6s window. This is how to choose a section of a long song: the multi-drop track shows drops at 11.3, 29.3 and 53.7s; the working track's best is at 83.5s after a long riser.

## 7. Auditions

- `npm run music:audition -- <file> <drop_s> [--film-drop 9] [--len 20]` cuts each candidate so its drop lands at the same second as the film's drop. The clip is 20s long, fades in for 0.3s and out for 1.5s. The user hears every option in the film's own shape.
- **It checks each clip.** It compares the bass for 3s before and after the drop and refuses under 10 dB. On Auni, 2 of 10 Mixkit clips had no real drop where the scan said (+3.8 dB and +10.5 dB) and were cut before the user heard them.
- **Deliver where the user can see.** Audio links written in a message that then opened a question box never showed: "link me them to listen on youutube", then "can you link me the songs again sorry?", then "where ? i cant see them here". Send YouTube links with `&t=` about 9s before each drop, in the final reply. The audition script prints them for files from `music:fetch`.
- **Say what numbers can't tell:** "My numbers can only tell you a track has a drop, not that it sounds expensive."
- **If the user doesn't pick, build on a sensible default**, and say switching later is a re-map of beat numbers, not a rebuild.

The taste record on Auni: a free Mixkit track (152 BPM, the hardest measured drop of 465) got "the music is not hype enough for a launch video". A half-time major-label track got "lowk i don't really like this song for our video. try another one." The multi-drop library track got "maybe a different song might be better". The working track (a major-label song, 173.7 BPM) went in as Claude's default in v4 and was never objected to.

## 8. Lock the grid (the most technical step)

`librosa.beat.beat_track` alone is not good enough. On the half-time track (syncopated, 140 BPM) its grid was off by a median of 162 ms, useless for cuts. Its tempo can also be an octave off on half-time music (64.6 and 80.7 BPM readings).

`npm run music:grid -- public/music/<file> --bpm <n> [--drop <s>] [--phrase 16]` does what worked:

1. **Fix the tempo to the true value.** Either the median beat interval of a steady region after the drop, or `beat_track` with `start_bpm` near the right value and `tightness` 400 (the working track: `start_bpm=172` gave 173.71 BPM). The half-time track is exactly 140, a beat of 0.428571s.
2. **Find the drop from the bass, not the onset detector.** The first frame after the build where 30 to 120 Hz power comes within 6 dB of the post-drop median. The half-time track: 20.643s. The "strongest onset" said 20.869s, 226 ms late.
3. **Fit the phase to the kicks.** Onsets on the low band only, then try phase shifts over plus or minus 200 ms in 401 steps, keeping the smallest median distance from kicks to the half-beat grid. The half-time track went from 162 ms of error to 28.7 ms; the working track fit at 11.7 ms. Under 30 ms is fine at 30fps, where one frame is 33 ms. The script fails above 30 ms.
4. **Map the build's hits onto the grid.** The half-time track's strongest build hits fell on whole beats before the drop (-20, -17 a vocal shout, -12, -10, -6, -5), so each take could slam in on a real hit.
5. **Read the bar table** (median bass, all and air dB per 4 beats). It shows the sections at a glance. The working track:

```
 beats  song s  bass   all   air
  -16   77.96   56.2  67.3  53.9    energy: takes stack here
  -12   79.35   53.8  67.8  55.2
   -8   80.73   -2.2  58.1  48.2    bass cut out: the quiet bar (question)
   -4   82.11   -1.4  62.3  54.5    riser
    0   83.49   55.9  68.1  55.4    DROP: reveal
  ...   (steady 0 to 56)
   56  102.83   45.8  61.3  37.2    break: mascot hero shot
   60  104.21   57.5  66.9  53.9    re-drop: logo lockup
```

6. **It writes `src/music.json`**, keeping your `track` and `licence`:

```json
{ "track": "Working track (major-label song)", "licence": "major-label-unlicensed",
  "file": "public/music/working-track.mp3", "bpm": 173.71, "beat_s": 0.3454, "drop_file_s": 83.49,
  "phrase_beats": 16, "fit_error_ms": 11.7,
  "sections_beats": { "energy": [-16, -8], "quiet": [-8, 0], "drop": [0, 56], "break": [56, 60], "redrop": [60, 72] } }
```

Section names are free, but `break` is required: the splice guard aligns it with a scene. Check its proposed sections against the bar table yourself.

## 9. Map scenes to sections

- The first take lands on the first beat of `energy`. The question owns the `quiet` bar. The reveal starts on 0. The hero shot owns the `break`. The wordmark lands on the `redrop`.
- `src/score.ts` names the scene that must start on the break (`breakOn`) and the scene whose first frame hides a jump (`spliceAt`).
- The kit's demo: 150 BPM, `beat_s` 0.4 (exactly 12 frames), 8-beat phrases. Hook is 8 beats before the drop, reveal 16 after it, close 8. The close starts at film beat 16 but the song's break is at 24, so the song jumps forward 8 beats on the cut into the close.
- **Swapping songs keeps the structure but not the seconds.** Everything is in beats, so a swap changes `music.json` and maybe scene lengths. But the film's length scales with tempo (20 beats is 6.9s at 173.7 BPM, 7.5s at 161), and the new song's sections sit at different beats. Re-check which scene meets which section.
- Half and quarter beats are fine inside a scene (rows dealt a quarter beat apart). Big moments go on whole or half beats, never on frame offsets: a judge flagged hits placed at `morph + 13 frames` as off the grid.

## 10. The phrase splice

When the v6 lanes merged, the social scene had grown from 14 to 20 beats and the others grew too. The close (hero shot through the break, wordmark on the re-drop) started 16 beats after the song's break: "the close plays out of sync with the music". Two judges flagged it; no single lane could fix it.

```
film beats:  -28 ........ 0 ................ 52 | 52 ...... 72 [break] 76 [re-drop]
track beats: -28 ........ 0 ................ 52 | 36 ...... 56 [break] 60 [re-drop]
                                             jump back 16 beats on the cut into social
```

- **Songs repeat in phrases** (the working track every 16 beats), and some points are good places to jump. `npm run music:seams` compares, for every even beat X, the 4 beats from track beat X with the 4 beats from X minus the jump (chroma for harmony, mel for timbre), plus the loudness step. On the working track, good seams scored about 0.99 (beats 20, 34 to 36, 50 to 52) and bad ones about 0.5 (24 to 26, 40 to 42, 56).
- **Put the jump on a hard picture cut at a good seam.** Auni jumped at film beat 52, the cut into social: both a 0.99 seam and a cut that hides it. The mix crossfades 12 ms at the jump.
- **The guard turns silent drift into a loud error.** `song()` in `src/engine/cues.ts` computes `late` from the timeline. If it isn't a whole number of phrases, `npm run check` fails with the fix, for example: "The close starts 5 beats before the song's break; make the scenes before it 5 beats longer or 3 beats shorter."
- **Check it without ears:** RMS continuity across the seam (the seams script's `rms dB` column, under 3), and the beat phase still on the grid across the cut.
- **Music structure is a film-level constraint.** Lanes can't see it, so the orchestrator owns it. Set budgets so the scenes' sum lands on a landmark (see `launch-film:team`, [../team/SKILL.md](../team/SKILL.md)).
