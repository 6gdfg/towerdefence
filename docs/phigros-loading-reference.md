# Phigros Loading Reference

This documents the reference used by the shared level intro at `src/td/LevelIntro.tsx`, the campaign Start transition, and the independent demo at `demos/level-intro/`.

## Sources

- [Phi-Recorder render entry](https://github.com/AntiLeave/Phi-Recorder/blob/main/src-tauri/src/render.rs)
- [phire LoadingScene](https://github.com/AntiLeave/phire/blob/main/phire/src/scene/loading.rs)

Phi-Recorder uses the Rust `phire` scene renderer and Macroquad. With `render_loading` enabled, it starts in `LoadingScene`, advances a controlled clock by `frame / fps`, and renders each frame before exporting it through FFmpeg. The Vue interface is not where the intro animation is drawn.

## Layout And Motion

- The illustration supplies both the clear, slanted foreground cover and the blurred background.
- A dark parallelogram contains the song title and composer. A slightly oversized white parallelogram contains the rating and difficulty.
- Credits sit below the title. The tip sits at bottom left and Loading sits at bottom right.
- The English labels are `Chart` and `Illustration`. Illustration starts 0.031 renderer units (1.55% of viewport width) left of Chart; its value starts a further 0.002 units left. The vertical gap follows the measured Chart value height, not a pair of aligned grid columns.
- After resources are ready, the scene holds for 1 second, then exits to the right over 1.4 seconds. The exit accelerates using a combination of quadratic and fifth-power easing.
- The Loading wipe starts after 0.3 seconds and repeats every 1.4 seconds: a 0.6-second cubic eased leading edge, a 0.6-second cubic eased trailing edge, and a 0.2-second gap.
- The label is white normally. A moving white rectangle covers it; a clipped second label is black inside the rectangle. This produces text-color inversion, not a percentage-based progress bar.
- The current source exposes a total nominal intro duration of 2.4 seconds. Resource loading can extend the hold in interactive playback.

## Tower Defence Adaptation

Use the level name, difficulty/rating and contributor from the selected difficulty draft. Use our own chapter/level images rather than the renderer's bundled illustrations. Keep resource readiness separate from the visual wipe and do not start combat timers before the intro ends.

The demo uses the renderer-inspired title/cover/credit geometry inside a fixed 1440x810 canvas. The whole composition scales uniformly into the safe-area rectangle on every aspect ratio, including portrait, with extra space filled by the background. Chart reads the draft contributor; Illustration is fixed to `admin`. The cover shows a staggered three-by-four preview of the first twelve distinct non-basic enemy types. HTML text rasterization, different background content and the enemy preview mean this should not be described as a pixel-identical export of the original game.

Phi-Recorder declares GPL-3.0-or-later licensing. No upstream source code or artwork has been copied into the game; this document only records the rendering approach for an independently implemented web animation. Check the relevant upstream license before reusing any implementation or assets.

## Campaign Entry

Clicking Start (or replay/next level) snapshots the selected difficulty, contributor, rating, monster preview and challenges. A 0.55-second left-to-right cover hides the previous page before loading the game underneath. The font has a five-second fallback deadline; once ready, the intro holds for 1.6 seconds, exits over 1.4 seconds and reveals gameplay over 0.6 seconds. The previous enemy-confirmation modal is no longer part of this flow; the existing navigation bar still provides access to the bestiary.

The game stays suspended and inert until the fade completes. Rotation into portrait continues to block gameplay after the animation, without advancing combat/sun/conveyor clocks. Timer fallbacks handle missing animation events, and browser-back cancellation unmounts the transition and clears its timers. Tutorial, fun-mode and laboratory entry retain their existing flows. Result animations are unchanged.
