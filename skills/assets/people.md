# People: real accounts, generated faces, and what may be shown

## 1. The four kinds

Every person on screen is one entry in `PEOPLE` in `src/content.ts`, with a `kind`. Scenes never
hard-code a face, so swapping a person is a one-line change, and `npm run clearance` can see them all.

| Kind | Auni example | Source | Rule |
|---|---|---|---|
| `self` (the founder or poster) | `@jarrodwatts` posts the hero take | X API picture | The safest recognisable face. The user asked for it: "the first intro should be recognizable ... use my twitter account" |
| `brand` (the product's own account) | `@auni_io` asks "ok but are you positioned?" | X API picture, real verification | Look the handle up. Drafts used a guessed `@auni` (the obvious handles belong to others) and the user had to correct it: "auni's account is auni_io on twitter." It has no check mark, so none is drawn |
| `real` (real third parties) | Real accounts from the partner's team and investors, shown pressing Copy | X API pictures | **Each needs to say yes before posting.** In an ad, appearing reads as endorsing. Only shown doing what they agreed to |
| `fictional` | The people posting hot takes on the timeline | Generated faces, or the product's own cartoon avatars | Never a real person's face on an invented opinion. No face twice in one shot. No letter-circle placeholders in a crowd: a judge called that pile "fake and placeholder-ish" |

**The hardest line: a real person never "says" something they didn't say.** Auni's intro agent
refused to put the partner team's faces on invented hot takes: "putting their faces on hot takes would
read as them saying it". Real people appear only *doing* what they agreed to (copying a position),
and only once they've agreed. Fictional takes go on fictional people.

**Clarify the user's own words first.** "Tap into famous CT personalities" could have meant memes,
parody or real people. One question got "Real accounts in the social bit", then "monad team + angel
investors would be cool".

## 2. Fetching real accounts

```
npm run people -- marachen _tomasr            # real third parties: consent "pending"
npm run people -- yourhandle --kind self      # the founder
npm run people -- yourbrand --kind brand      # the product's account
```

It calls the X API v2 `users/by` endpoint with `user.fields=name,profile_image_url,verified_type`, and:

- **saves the 400x400 picture** to `public/faces/x/<handle>.jpg`. The API's `profile_image_url` is the 48 px `_normal` version; `_400x400` is sharp;
- **uses `verified_type`** (`blue`, `business`, `government`, `none`), **not `verified`**. The API said `verified: false` for two of the partner's team, who both show blue checks; `verified_type` said `blue`. Draw a check only where `verified_type` has one;
- **records** each account in `public/faces/x/accounts.json` with the fetch date. Pictures change, and the film should match the account on posting day: refetch before the final;
- **prints `Person` entries** to paste into `PEOPLE`, with a short `display` name. Long names truncate on cards ("Konstantina Alexandr...") and a truncation ellipsis on screen reads as broken;
- **never prints the token.** It reads `X_BEARER_TOKEN` from the environment or `~/.config/x/credentials.env`. Keep it that way: load secrets with `set -a; . file; set +a`, never echo them.

## 3. Generated faces for fictional people

What was done on Auni (v6 intro lane):

1. Fetch about 14 faces from a face generator, one second apart.
2. Tile them into a contact sheet, and pick a diverse set (glasses, sunglasses, silver hair and so on).
3. Crop loosely around the face, resize to 256 px JPEG, preview as circles, save to `public/faces/made/<handle>.jpg`.
4. Record each one: `kind: "fictional"`, and `source` naming the generator and its terms.

Cautions:

- **Check the generator's licence.** Auni used thispersondoesnotexist.com, a StyleGAN demo; the model's licence is non-commercial, and whether its output may appear in a paid ad is unclear. For a commercial film, use an image model whose terms grant commercial use of outputs, and record the source per face. `npm run clearance` lists fictional faces without a `source`.
- **Look at each face.** A generated face can look like a real person by chance.
- **No face twice** in one shot, and no identical faces across a crowd.
- **Cartoon or NFT-style avatars are someone's IP.** A penguin avatar looks like a specific NFT collection. Use only avatars the product owns (Auni's came from its own app's `public/brand/faces`) or ones you generated.
- **Match the audience's real timeline.** Mixing photo faces with a few cartoon avatars looked authentic for crypto Twitter.

## 4. Details that sell "real"

- **Counts start at 0 and roll up** when a post goes live, so the timestamp says "now", not "2h". "2h" with counts at 0 contradicted itself.
- **Counts are formatted the way the platform writes them:** "12.4K", "1K", never "1.0K". The kit's `Count` has a formatting helper for this.
- **A check mark only where the account really has one.**
- **Platform UI matches the platform exactly**: icons, layout, number formats.
- **Every face distinct and real-looking.** No letter avatars in a crowd.

## 5. The legal and ethical rules

1. **Real people need permission.** Get a yes from everyone shown by name or face before posting, including people shown only copying, liking or replying. The founder's own account is fine. Record it as `consent: "yes"` only once you have it.
2. **No invented quotes on real accounts.** Fictional takes go on fictional, generated people.
3. **A working track isn't a release track.** Auni was cut to major-label songs for timing. A major-label song needs sync and master licences (five figures, may be refused); library tracks on an ads tier are cleared; never commission a sound-alike. See `launch-film:sound` [../sound/sourcing.md](../sound/sourcing.md).
4. **Third-party logos** can read as partnership. Official assets, not recoloured or distorted, never beside claims the partner hasn't agreed to. See [logos.md](logos.md).
5. **SFX packs and fonts:** ship only what you have a licence for. Auni's SFX pack and SF Pro are not redistributable; the film used Inter, which is open.
6. **Tool licences:** Remotion is free for companies of up to 3 people; larger companies need a company licence.
7. **Disclaimers are the product owner's call.** On Auni the user decided they live in the post and the terms: "disclaimers in the post/terms so you don't need to be concerned about that in the video". Ask once and record it.
8. **Secrets** (X bearer token, SSH and Tailscale keys) are loaded without printing and never written to logs, renders or reports.

## 6. Lanes over-reach: give them the exact list

The v6 brief allowed "a few more real Monad-team or Monad-ecosystem accounts". The social lane added
several well-known investors and founders: real and verified, but mostly not what the user asked for,
and shown copying a trade, which reads as endorsement. The orchestrator caught it and put it in the
"before you post" list, but didn't stop it.

- Give each lane **the exact handles allowed**, by name. Everything else uses generated faces of people who don't exist (as Auni's intro fixer chose for the hot-take posters).
- Real people without recorded consent may appear in drafts. `npm run final -- <out> --release` blocks on them.
- Every real person on screen goes into the "before you post" list in the final reply, with what they are shown doing.
