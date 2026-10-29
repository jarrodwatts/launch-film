# Sourcing sound: where it comes from, how to install it, what never ships

## 1. Where sound effects come from

The kit's SFX are generated stand-ins: clean enough to time picture to, not good enough to show
anyone. On Auni, generated sounds got "the sound effects kinda suck which i think ruins the premium
feeling", and swapping in a real pack was the biggest single jump in quality.

In order of preference:

1. **A real, curated pack.** Auni used a free 57-file creator pack the user found on a "Sound Effects Creators Actually Use" page, when asked about paying: "hmmm surely we can get it free right ?". Free creator packs are fine for timing and often for use. Read each pack's terms before a public post, and drop anything whose origin is unclear (that pack included known meme sounds).
2. **Pixabay or Mixkit SFX.** Free libraries whose licences are written for commercial use; read the current terms once.
3. **ElevenLabs SFX.** Generates designed sound effects from a prompt. Check the plan's commercial terms. Better than code-made sounds; still check each one by its stats and the cue sheet.
4. **Your own recordings or a sound designer**, for a signature sound (the brand's own click or chime).

A pack needs, at minimum, files for every kit role (`whoosh`, `whoosh_heavy`, `air`, `pop`, `tick`, `click`, `button`, `switch`, `typing`, `shine`, `impact`, `boom`, `riser`, `ding`, `notify`, `cash`). Several files per role helps: the kit rotates them.

## 2. Where music comes from

| Route | Cost | Ad licence | Notes |
|---|---|---|---|
| Mixkit, Pixabay | Free | Yes, no credit | Huge catalogues; scan them with `npm run music:scan`. Auni's best measured pick was "not hype enough" |
| Epidemic Sound, Artlist | Subscription | On the tier that allows ads (Epidemic Pro or Enterprise, Artlist Pro) | The reference studio's biggest hit (film A) used a sped-up Epidemic track |
| ElevenLabs Music | Paid plan | Online commercial use on paid plans | Can edit sections to land a drop on an exact second |
| Suno and similar AI | Varies | Murkier | Read the terms; record them in `licence` |
| Commissioned producer | $500 to $5k | Clean, by contract | Brief them with your beat grid and sections. Never ask for a sound-alike of a famous song |
| Major-label song | Five figures, weeks | Needs sync (publisher) and master (label) licences | May be refused for some categories (crypto was the Auni risk). X processes DMCA notices in about 3 business days; a takedown at peak attention hurts most |

A downloaded song is a timing track, not a release track. Write its route into `src/music.json`
`licence` the day it enters the film. `npm run clearance -- --release` blocks the final until it is
cleared.

## 3. Install your own SFX pack

```
1. Copy the files into public/sfx/       (mp3 or wav; file stems become their names)
2. npm run sfx:stats                     measures every file: peak, events, brightness, low end
3. Read the warnings it prints           multi-event files, files whose pack-supplied peak data disagree
4. Edit public/sfx/roles.json            map each role to the stems that fit it
5. npm run check                         fails on any cue whose file is missing from stats.json
6. npm run mix && npm run audio:check    then read out/cue-sheet.png
```

Choosing files for a role:

- `stats.json` gives `bright_hz` (spectral centre) and `low_share` (share of energy under 150 Hz). A `shine` should be bright; a `boom` or `whoosh_heavy` should be mostly low.
- `events` lists separate hits inside a file. A file with more than one event is trimmed to the event holding its peak, unless a cue passes `whole`. Better: pick single-event files for roles, or trim them yourself.
- `peak` is measured, not trusted from the pack. On Auni, 13 of 57 files differed from the pack's own `peaks.json` by more than 50 ms (`swoosh_01`: 0.27s measured, 0.50s listed).
- Listen to nothing; you can't. Pick by role name, stats and the cue sheet, then let the user's ears judge the result in the draft.

## 4. Install your own song

```
1. Put it in public/music/               or: npm run music:fetch -- "<artist> <title> [instrumental]"
2. npm run music:grid -- public/music/<file> --drops        pick the drop you want
3. npm run music:grid -- public/music/<file> --bpm <n> [--drop <s>]   locks the grid, writes src/music.json
4. Set "track" and "licence" in src/music.json
5. Check the proposed sections against the bar table; fix them by hand if needed ("break" is required)
6. npm run check                         the splice guard says how many beats to add or cut
7. npm run music:seams                   choose the cut that hides the splice; set spliceAt in src/score.ts
8. npm run mix && npm run audio:check
```

## 5. What must never be committed or shipped

- **Licensed songs and SFX packs, in any public repo.** The kit's `.gitignore` keeps `public/music/*` and `public/sfx/*` out (except `README.md`, `roles.json` and `stats.json`). Don't force-add them.
- **Any audio in the plugin itself.** The plugin ships code and generated stand-ins made at setup, never files.
- **Songs ripped from reference films.** Their SFX are baked in, and they belong to someone else.
- **Fonts you don't have a licence to redistribute** (SF Pro). Auni used Inter, which is open.
- Downloaded copies of major-label songs stay local, for timing only, until a licence exists.
