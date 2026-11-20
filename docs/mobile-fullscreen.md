# Mobile Fullscreen

Android and supporting Safari versions use the standard Fullscreen API. Older WebKit implementations use `webkitRequestFullscreen` / `webkitExitFullscreen`; success is only reported after the document actually enters fullscreen. Rejected or silent requests show feedback instead of being swallowed.

Many iPhone Safari versions do not offer arbitrary-element fullscreen to webpages. The game cannot programmatically trigger Safari's own browser-chrome controls or silently install itself. On these devices the button explains the manual alternative: Share -> Add to Home Screen -> open the home-screen icon. Enable "Open as Web App" when offered.

The main entry includes an Apple standalone opt-in and a `display: standalone` web manifest. This removes Safari's address/navigation bars when launched as a home-screen web app; it is not the Fullscreen API and system status/safe areas can remain. An installed standalone window hides the redundant fullscreen toggle.

No service worker or offline cache is installed, so this does not introduce a separate cached game version, API route, or database state. A standalone window may require signing in again. The intro preview remains a separate demo URL; its shared component now also runs on campaign Start, retry, and next level. Gameplay stays suspended until the intro finishes, and portrait orientation continues to block phone gameplay afterward.

Automated checks cover native/prefixed APIs, rejection, silent no-ops, standalone detection, and pause/resume when the help dialog overlaps rotation. iPhone Safari installation and actual system fullscreen still need real-device verification.
