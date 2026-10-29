# Your SFX pack goes here

The demo ships generated stand-ins (`scripts/make_demo_audio.py`): one or a few files per role,
good for timing and nothing else. Real, curated sound effects are the single biggest jump in how
premium a film feels. On one real film's first cut the director said: "the sound effects kinda suck which i
think ruins the premium feeling".

## Bring your own pack

1. Copy the sound files (wav, mp3, flac, ogg or m4a) into this folder. If the pack has its own
   `peaks.json`, copy it too: the stats will warn where it disagrees with the measurement.
2. Measure them: `npm run sfx:stats`. That writes `stats.json`: each file's length, its loudest
   point (the mix lands that point on the cue), its separate events, brightness and bass share.
   Read the warnings: a file with several events needs `keep` or `whole` when you place it.
3. Map the pack in `roles.json`: each role lists file stems (names without the extension).
   Scenes ask for sounds by role, `v("whoosh", i)`, and rotate through the list, so list
   several variants for anything that repeats (whooshes, pops). Required roles:
   `whoosh whoosh_heavy air pop tick click button switch typing shine impact boom riser ding notify cash`.
   You may add roles; `v()` accepts any key in this file.
4. `npm run check` (it fails on any cue whose file isn't measured), then `npm run mix`.

Pick by measurement as well as by ear: a shine should be bright (`bright_hz` high), a boom
should be mostly bass (`low_share` near 1).

## What is committed

`roles.json` and `stats.json` are committed. The sound files are not: packs are licensed.
A fresh clone needs the pack copied back in before `npm run mix`.
