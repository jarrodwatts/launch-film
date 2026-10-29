# launch-film

A Claude Code plugin for making product launch films at the level of the best motion-design studios,
for any product, in code.

- **What you get:** a 30 to 40s, 1080p film with no voiceover, cut to one song, where every motion
  has a sound and the product's own UI is the hero.
- **How:** six skills that teach Claude the method, learned over one long day and seven rounds of
  notes on a real launch film. Plus a Remotion starter kit with the whole engine working on day one.
- **The worked example:** the Auni launch film, which went from "it's decent, but doesn't quite feel
  premium enough" to "this is so fire dude".

## The six skills

| Skill | Triggers when |
|---|---|
| `launch-film:make` | You ask for a launch video, product video, announcement film, teaser, trailer or sizzle, a new version of one, or send timestamped notes on a cut. The entry point: it runs the whole process and hands off to the others. |
| `launch-film:craft` | Writing a script or storyboard, designing a scene or transition, writing on-screen copy, or (inside a notes round) a note says too slow, too fast, lazy, sloppy, empty, cut off or not premium. |
| `launch-film:sound` | Choosing or swapping music, adding or fixing sound effects, bringing your own SFX pack, mixing, or checking licences. |
| `launch-film:assets` | A 3D character or object, logos, social posts with real accounts or faces, or the pre-release clearance check. |
| `launch-film:team` | You ask to fan out agents, or one round of notes spans three or more scenes. Builders, judges and fixers in parallel git clones, then one integrator. |
| `launch-film:review` | Before any cut is shown, when judging another agent's scene, and after merging. Contact sheets, full-size stills, frame counts. |

All six trigger on their own from what you ask. You can also call them directly, for example
`/launch-film:make Acme`.

## Install

```
# inside Claude Code
/plugin marketplace add jarrodwatts/launch-film     # or a local clone: /plugin marketplace add <path>
/plugin install launch-film@launch-film
/reload-plugins

# or from a shell
claude plugin marketplace add jarrodwatts/launch-film && claude plugin install launch-film@launch-film
```

A marketplace added from a local path loads the plugin in place, so edits take effect after
`/reload-plugins` with no version bump. Then type `/launch-film:make <product>`, or just ask "make a
launch video for <product>".

## Start a film

```
bash <plugin>/kit/scripts/new-film.sh ~/films/acme
cd ~/films/acme && npm run doctor && npm run studio
```

`new-film.sh` copies the kit into its own git repo, installs everything, makes the first mix and
commits. The repo holds a 12.8s demo film for a made-up product, Acme, that renders out of the box.
Each film owns its copy of the engine, so nothing depends on where the plugin is installed.

Every command (`npm run doctor`, `check`, `scene`, `stills`, `blurstill`, `mix`, `draft`, `final`,
`clearance` and the rest) is in one table in `kit/README.md`, with what each one prevents.

## Requirements

- Node 20 or newer, Python 3.11 or newer.
- About 0.5 GB of free temporary disk per second of film for a final render (16 ProRes passes; 20 GB
  for 40s). On 16 cores a final takes 7 to 10 minutes for a 12s film and 16 minutes for 40s.
- Linux is tested. macOS is untested (`brew install ffmpeg` first). Windows only as a remote GPU
  host for Blender.
- Blender is optional, for real 3D. `npm run blender:install` fetches a portable copy.
- Network access at render time for Google Fonts, and once for Remotion's Chrome download.

## What doesn't ship, and how to bring your own

No audio, faces or licensed material is in this repo. The kit generates stand-ins so the timing
works, and they sound like stand-ins on purpose.

- **SFX pack.** Real designed sound effects are the single biggest jump in perceived quality. Copy
  your pack into `public/sfx`, run `npm run sfx:stats`, map its files to roles in
  `public/sfx/roles.json`, run `npm run check`.
- **The song.** Put it in `public/music`, run `npm run music:grid -- public/music/<file> --bpm <n>`,
  set its `licence` in `src/music.json`, run `npm run check`. A major-label song needs sync and master
  licences before posting.
- **Fonts.** The kit uses Inter from Google Fonts. Load the brand's own font in `src/brand.ts` if you
  have a licence to use it in video.
- **Faces and logos.** In `src/content.ts`. `npm run people -- <handles>` fetches real profile
  pictures; every real person needs their consent before release.

Never commit licensed audio to a public repo, and never copy it into this plugin.

## Licence

The plugin (skills and kit) is MIT licensed: see `LICENSE`.

### Remotion

The kit is built on Remotion, which is free for individuals and companies of up to 3 people. Larger
companies need a Remotion company licence. Check remotion.dev/license before using it for work.

## The worked example

- `examples/auni/`: the Auni film's source, read-only, with a map from each file to the kit piece it
  became.
- `skills/make/worked-example.md`: the film beat by beat, the music in beats, the seven versions and
  what the user said about each.
