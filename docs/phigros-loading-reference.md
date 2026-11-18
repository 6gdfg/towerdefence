# Phigros Loading Reference

This is a rendering reference for the future level intro, not an animation implementation.

## Sources

- [Phi-Recorder render entry](https://github.com/AntiLeave/Phi-Recorder/blob/main/src-tauri/src/render.rs)
- [phire LoadingScene](https://github.com/AntiLeave/phire/blob/main/phire/src/scene/loading.rs)

Phi-Recorder uses the Rust `phire` scene renderer and Macroquad. With `render_loading` enabled, it starts in `LoadingScene`, advances a controlled clock by `frame / fps`, and renders each frame before exporting it through FFmpeg. The Vue interface is not where the intro animation is drawn.

## Layout And Motion

- The illustration supplies both the clear, slanted foreground cover and the blurred background.
- A dark parallelogram contains the song title and composer. A slightly oversized white parallelogram contains the rating and difficulty.
- Credits sit below the title. The tip sits at bottom left and Loading sits at bottom right.
- After resources are ready, the scene holds for 1 second, then exits to the right over 1.4 seconds. The exit accelerates using a combination of quadratic and fifth-power easing.
- The Loading wipe starts after 0.3 seconds and repeats every 1.4 seconds: a 0.6-second cubic eased leading edge, a 0.6-second cubic eased trailing edge, and a 0.2-second gap.
- The label is white normally. A moving white rectangle covers it; a clipped second label is black inside the rectangle. This produces text-color inversion, not a percentage-based progress bar.
- The current source exposes a total nominal intro duration of 2.4 seconds. Resource loading can extend the hold in interactive playback.

## Tower Defence Adaptation

Use the level name, difficulty/rating and contributor from the selected difficulty draft. Use our own chapter/level images rather than the renderer's bundled illustrations. Keep resource readiness separate from the visual wipe and do not start combat timers before the intro ends.

Phi-Recorder declares GPL-3.0-or-later licensing. No upstream source code or artwork has been copied into the game; this document only records the rendering approach for an independently implemented web animation. Check the relevant upstream license before reusing any implementation or assets.
