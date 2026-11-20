# Website Font

The main website and intro demo now use the supplied `cmdysj.ttf` globally, under the CSS family `Tower Defence`. Controls, tables, SVG text, code displays and editors inherit the same family. The original font remains unchanged; browsers receive generated WOFF2 subsets, not the original TTF.

## Inspected File

- Family: `cmdysj`; style: Regular. No separate bold weight is supplied.
- Original size: 8,470,944 bytes (8.08 MiB).
- Local gzip level 9: 5,377,377 bytes; Brotli quality 5: 5,022,872 bytes. These are estimates of transport compression, not guaranteed Vercel response sizes or WOFF2 output sizes.
- 30,888 glyphs; 20,945 of the 20,992 code points in the U+4E00-U+9FFF CJK Unified Ideographs block have glyphs. The inspected Chart/Illustration/Loading text and default Chinese tip are covered. Keep a system fallback for missing characters and emoji.
- The name table has no clear redistribution license. OS/2 embedding flags alone do not establish webfont redistribution rights; confirm the font's authorization before public distribution.

## Generated Assets

- `src/styles/game-font.css`: disjoint `unicode-range` declarations with `font-display: swap`.
- `src/assets/fonts/game-latin.woff2`: Latin, numbers and punctuation, 30,444 bytes.
- `src/assets/fonts/game-ui.woff2`: 842 other characters currently used by interface source files, 98,752 bytes.
- Other WOFF2 subsets preserve less common characters and load only when their Unicode ranges occur on a page.
- `src/assets/fonts/manifest.json`: source hash, sizes and complete coverage metadata.

The priority subsets total 129,196 bytes (about 126 KiB), approximately 98.5% less than downloading the original 8,470,944-byte TTF. This is the font payload for the tested login screen, not the entire site's transfer size. All subsets together total 4,642,340 bytes, but are not downloaded together. Generator validation preserves all 30,786 mapped code points from the original font's best Unicode cmap, with no overlapping subset ranges. Missing original characters still use a system fallback.

Both HTML entrypoints preload only Latin and UI subsets. Vite emits content-hashed external font assets; font inlining is disabled to prevent rare characters from inflating render-blocking CSS. Existing browser caching applies without a service worker, API or database changes. Text stays visible while fonts download or when requests fail. Campaign entry requests its actual metadata text and keeps a five-second maximum font wait; it does not wait for every subset.

Only Regular was supplied. Existing bold styles are browser-synthesized, not separate font downloads. Native OS dialogs such as `alert` and `confirm` cannot be restyled by the webpage.

## Regeneration

The generated assets are committed source inputs; normal dev/Vercel builds do not need Python or font tooling. New interface text still renders using on-demand subsets. Regenerate to promote newly added characters into the priority UI subset, or whenever the original font changes:

```powershell
python -m pip install --index-url https://pypi.org/simple --target node_modules/.font-tools fonttools==4.68.0 brotli==1.2.1
$env:PYTHONPATH = Join-Path $PWD 'node_modules/.font-tools'
python scripts/build-game-font.py
```

The generator preserves the original font's copyright and license name records. Optimization does not change its redistribution authorization requirements.
