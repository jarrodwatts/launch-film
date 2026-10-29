# Faces

Profile pictures for people on screen: `public/faces/<file>`, referenced from `PEOPLE` in
`src/content.ts` (`face: "faces/x/<handle>.jpg"`). `npm run people -- <handle>...` fetches real
accounts' pictures into `faces/x/`.

Consent and sources live in `src/content.ts`, not here: a real person needs `consent: "yes"`
before release, and a generated face needs a recorded `source`. `npm run clearance` lists what
is pending. See the `launch-film:assets` skill for the rules.
