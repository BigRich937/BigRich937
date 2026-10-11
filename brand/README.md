# RRoyal brand

## Where the logo stands

The current official logo (`rroyal-logo.*`, `rroyal-icon.*`, `rroyal-wordmark.*`) is the gold
**RRx** wordmark in Montserrat: the "x" is two crossed royal scepters, a ruby location pin floats
above it, and a gold delivery trail sweeps underneath.

We are exploring a **mirrored monogram** to replace it: **Я x R** (the first R flipped so the
curves face outward), the scepter x in the middle, set in a lighter serif. Favorites so far are
**Cinzel Medium** and **Cormorant Garamond**. The final font and spacing are still to be picked.

## Exploration history (newest last)

| Folder | What it shows |
|--------|---------------|
| `concepts/` | First three directions: Royal Seal coin, Crown Jewel, Royal Crest |
| `font-options/` | Wordmark in 8 bold fonts |
| `font-options-light/` | Wordmark in 8 lighter fonts |
| `monogram-options/` | Mirrored-R monogram, Я x R and R x Я, in Cinzel and Cormorant |
| `monogram-tight/` | Я x R with the letters touching the scepters |
| `monogram-closer/` | Я x R with the scepters overlapping the R's |
| `monogram-gem-center/` | Even tighter, with the ruby pin moved to the center of the X ← latest |

Each folder has an `rrx-font-options.png` comparison sheet plus each option as SVG and PNG.

## Next decisions

1. Font: Cinzel or Cormorant Garamond.
2. Gem: in the center of the X (latest), or floating above it.
3. Spacing: keep the latest tightness or adjust.

Then generate the final set: 256px token logo, small wallet/favicon icon, wide website wordmark.

## Regenerating the logos

The scripts in `tools/` build every option from code (fonts are converted to vector paths).
They need Node.js plus two packages: `npm install --no-save opentype.js@1.3.4 playwright@1.56.1`.

```bash
cd brand/tools
# Mirrored monogram: <out dir> <gap> <variants> [pin-middle]
node logoMirror.js out -0.26 1-cinzel-out,3-cormorant-out pin-middle
node sheet2.js out          # comparison sheet + PNGs
```

The fonts in `tools/fonts*` are from Google Fonts and licensed under the SIL Open Font License.
