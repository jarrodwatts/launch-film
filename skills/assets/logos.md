# Logos: one registry, one fit per logo, one sheet, then check in context

Auni showed about 40 marks: venues, chains, tokens and company logos. Five were broken at once, and
the user only said "some of the logos like aave look off". One labelled sheet found them all.

## 1. The structure

- **Keys, not paths.** Logos are named `kind:name`: `venue:monad`, `token:NVDAx`, `company:nike`. Scenes and data only use keys. In the kit, `LOGOS` in `src/content.ts` is the whole registry: key to `{ file, fit }`.
- **One component draws every logo.** `<Mark name="partner:a" size={96}/>`: a white disc, overflow hidden, the fit applied, an optional ring with a soft shadow. `<Marks>` overlaps several for a stack.
- **This replaced a mess.** Auni had `logoFile(key)` with a `special` table for exceptions, and `logoFit(key)` beside it. One table with the fit next to the file is easier to read and to check.

## 2. The three fits

| Fit | When | Auni examples | Numbers |
|---|---|---|---|
| `"cover"` (default) | Marks already drawn as a full-bleed disc or square | Aave's round token, Polymarket, Base, company logos | Fills the disc |
| `{ inset: n }` | Square or glyph marks that cropping would cut | Monad, xStocks, Hyperliquid, Solana, Unichain | `inset: 0.18` shrinks the art inside the disc, on white |
| `{ scale: n }` | Art with its own border or tilted corners that peek past the circle | xStocks token art (a tilted square with dark corners) | 1.22 still showed slivers on GOOGLx, METAx and AAPLx; 1.42 hid them |

## 3. Where logos come from, in order

1. **The product's own app assets.** Auni's lived under the web app's `public/brand/{chains,protocols,tokens}` and `public/landing`. They already match the product's UI.
2. **The partner's official asset source.** xStocks token images came from their metadata CDN, one PNG per ticker.
3. **The partner's website.** `favicon.svg`, `apple-touch-icon.png`, `/svg/logo.svg`. Find them by grepping the homepage HTML for `logo|favicon|icon`.
4. **CoinGecko "large" round icons** for tokens whose own SVG is a bare glyph (Aave, Jupiter). **A GitHub org avatar** (`avatars.githubusercontent.com/u/<id>?s=400`) for a brand whose other marks read as a plain shape (Base).
5. **Hand-built, last.** Kuru had only a wordmark and a 16 px `.ico`. A round mark was made from the wordmark SVG's four glyph paths, centred on a dark circle in a 32x32 viewBox. Use PIL to turn an `.ico` into a PNG if you need a raster.

Real marks beat generated ones every time. Auni's card header used a procedurally generated "conviction orb". The user rejected it on v2, v4 and v5, the last time: "change the icon from being randomly generated slop to something auni themed or more relevant and premium feeling". The fix was the asset's own logo on an ink coin with a thin metallic rim. The judge's remaining note: keep the rim thin and crisp, or it reads as a generic avatar. A symbol on screen is either the product's own brand or the real thing the user's money or data touches.

## 4. The Assets sheet

`npm run assets` renders the `Assets` composition to `out/assets.png`: every `LOGOS` key through the
same `<Mark>` the film uses, every face, and the first and last frame of every 3D shot, labelled, on
one 1920x1080 frame. Render it after any logo change and read it at full size.

What it caught on Auni in one look:

| Logo | Problem | Fix |
|---|---|---|
| Aave | The ghost glyph was cropped by `cover` | The round token icon |
| Base | Read as a plain blue disc | The GitHub org avatar with the real mark |
| Jupiter | Glyph cropped | The round token icon |
| xStocks tokens | Dark corners of the tilted-square art | `scale: 1.42` |
| Polymarket | Contained looked worse than its natural full-bleed square | Back to `cover` |

## 5. In-context checks the sheet can't do

The v6 judges found these only in the real scenes, at full size:

- **An overlapped row read as a jumble.** Circles collided, and one black glyph had no disc. When a row has to be read, give each mark a white disc and a small positive gap.
- **Rings lined up into spokes.** Three rings built from the same list in the same order put three Netflix logos in a row. Start each ring at a different offset.
- **No mark twice in one glance.** A header icon showed the same NVIDIA logo as the row below it.
- **A flat, thin orbit bunched logos at its ends** and sat them on the mascot's belly "like stickers". Use a rounder orbit, fewer logos, and fade any logo that crosses the face.
- **The showcased brand is never the blurry one.** If depth of field softens a row, the product's own mark stays sharp.

Rule: render the sheet after any logo change, **and** look at every scene that uses logos with `npm run stills` at full size.

## 6. Using other companies' marks

Showing the platforms the product really works with is normal, but it can read as a partnership.
Use official assets, never recolour or distort them, and don't place a partner's mark next to a
claim they haven't agreed to. Check brand guidelines where a partner publishes them.
