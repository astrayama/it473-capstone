# Brand marks

`public/brand/{crest,mark,wordmark,lockup}*.svg`, `src/app/icon.svg` and
`src/components/brand/brand-svg.ts` are generated from the brand fonts, so the marks render
without fonts and the SVG files and React components always match.

```bash
npm run build                                          # downloads the fonts via next/font
npm i --no-save opentype.js@1.3.4 wawoff2@2.0.1
node scripts/brand/extract-fonts.mjs .next/static/media # -> scripts/brand/fonts/*.ttf (gitignored)
node scripts/brand/make-brand.mjs .                     # rewrites the files above
```

Edit geometry (rings, wheat, sun, lettering) in `make-brand.mjs`, then re-run it.
