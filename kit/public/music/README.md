# Your song goes here

The film runs on one song's beat grid (`src/music.json`). The demo ships a generated 150 BPM beat
(`demo.wav`, made by `scripts/make_demo_audio.py`) so it renders with sound. It is for timing only.

## Bring your own song

1. Pick it by ear. Measurements make a shortlist; only ears choose. (The measured-best track of
   one film, a +71 dB bass jump, was "not hype enough".)
2. Settle the licence before anyone falls in love with it. Library music (Mixkit, Pixabay, or
   Epidemic and Artlist on a tier that allows ads), AI music on a paid plan, or a commissioned
   producer. A major-label song needs sync and master licences, often five figures, and may be
   refused.
3. Copy the file here, then lock its grid:
   ```
   npm run music:grid -- public/music/<file> --drops          # where are its drops?
   npm run music:grid -- public/music/<file> --bpm <n> --drop <seconds near the drop>
   ```
   That writes `src/music.json`. A fit error of 30 ms or less is fine at 30 fps.
4. Set `track` and `licence` in `src/music.json` (`library:<service>`, `ai:<service>`,
   `commissioned`, `licensed:<how>`; anything else stays pending in `npm run clearance`).
5. Check the sections it proposed (`energy`, `quiet`, `drop`, `break`, `redrop`). `break` is
   required: the close lands on it.
6. `npm run check`. If the scenes no longer meet the song's break, the error says how many beats
   to add or cut.

## Never commit licensed audio

Everything in this folder except this README is gitignored. Keep it that way, and never copy a
song into the plugin.
