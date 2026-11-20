# Level Intro Demo

Open `http://localhost:5176/demos/level-intro/` with the existing Vite dev server.

This remains an isolated preview entry point. It does not write level drafts, call account APIs, or issue rewards. The preview reads existing level metadata and runs the existing game component with level-10 test cards after the intro and fade have completed. The main game's campaign Start flow now uses the same `src/td/LevelIntro.tsx` component, preceded by a left-to-right cover transition.

The intro uses a fixed 1440x810 (16:9) canvas. A ResizeObserver scales and centers the entire composition inside the available safe area. Extra screen space extends the same background; text, spacing and geometry no longer use separate viewport-dependent scales. The game preview keeps its existing responsive layout.

The slanted illustration area shows up to twelve distinct configured enemy types, in first-appearance order, excluding circle/square/triangle and empty groups. Three fixed rows contain at most four enemies each, with icons above names; each row is offset along the cover's slant. If nothing remains after filtering, the cover stays empty. The map-view reset control uses a return arrow and is disabled at the default view; the separate fullscreen button retains its original purpose.

The two bottom-right controls replay the animation and open preview settings. Settings can change the level, main/subtitle, Chart, tip and hold duration without writing files. Chart uses the draft contributor (empty values display `admin`). Illustration is always `admin`, and its credit is offset left like the reference renderer.

This demo and the main website use the supplied font globally, including gameplay and controls. Both entrypoints load optimized WOFF2 subsets with hashed asset URLs, preloading only the small Latin and UI subsets. Text remains visible with a system fallback while the font downloads. The Tip field offers the suggestions from `src/td/introTips.ts` and also accepts custom text. See `docs/demo-font.md` for coverage, sizes and regeneration.

The independent web animation follows the motion notes in `docs/phigros-loading-reference.md`; no upstream renderer code or artwork is included. Default hold: 3 seconds, exit: 1.4 seconds, game reveal: 0.6 seconds. The wipe loops every 1.4 seconds after a 0.3-second delay.
