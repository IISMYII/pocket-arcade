# Pocket Arcade 2.0

Twelve original touch-first games in an edge-to-edge iPhone web app. No runtime packages, third-party scripts, advertising, trackers, accounts or external game assets.

Website: https://iismyii.github.io/pocket-arcade/
Repository: https://github.com/IISMYII/pocket-arcade

## Play and install

Safari → open the website → Share → Add to Home Screen → Add. Keep the initial launch online until the offline bundle is cached. Standalone uses the available screen and safe areas. Safari retains its own browser controls; no Fullscreen permission request is used.

Select a game to start or restore its previous session. Pause opens instructions, sound, reduced motion, supported haptics, favorites, resume, restart and exit. Exit saves progress; select the game again to return. Restart resets only that game session. City construction is durable and intentionally survives restart. Sound defaults off and is initialized only in a player gesture. Browser vibration is optional and unavailable in iPhone Safari.

## The twelve games

| Game | V2 design and interaction |
| --- | --- |
| 2048 Puzzle | Porcelain-green tiles, animated sliding/spawn/merges, full board snapshots, swipe and accessible direction controls. |
| Neon Snake | Luminous ribbon, smooth cell interpolation, collectible particles, responsive rectangular arena with square cells, rotation-safe state. |
| Highway Racer | Wet neon expressway, detailed reflective vehicles, city scenery, smooth lane changes, balanced traffic and coin sparks. |
| Adventure Platformer | Parallax moonlit landscape, animated ranger, textured terrain, star effects, checkpoints, buffered/coyote jumping and two-finger controls. |
| Tower Defense | Stone causeway, crystal turrets, animated raiders, projectiles/range highlights, live wave persistence. |
| Pool Practice | Lit wood/felt table, shaded numbered balls, aiming/power guide, improved collision substeps and pocket feedback. |
| Sudoku | Ivory puzzle surface, row/column/box/matching highlights, readable keypad, hint/check actions and resumable board. |
| Chess vs Computer | Original SVG ivory/slate pieces, last/legal/capture markers, turn feedback, pause-safe computer response and complete match snapshots. |
| Endless Runner | Sunset city, coherent perspective, animated runner, interpolated lanes, cargo/barriers, spinning coins and fairer waves. |
| City Tycoon | Original miniature building illustrations, skyline, roads, construction effects, level badges, economy inspector and offline earnings. |
| Air Hockey | Luminous arena, shaded paddles, puck trails, impact rings, goal/serve feedback and direct dragging. |
| Parking Challenge | Detailed rooftop lot/car, shaded objects, glowing bays, steering/brake effects and multitouch driving. It remains the original top-down game, not a new WebGL 3D game. |

Pool is solo six-ball practice. Sudoku has one original fixed puzzle. Chess is a modest local opponent with promotion/castling/en passant, but does not adjudicate repetition or fifty-move draws. No claim of exhaustive gameplay or device perfection.

## Architecture

`app.js` owns navigation, bounded/validated storage, audio, fullscreen layout lifecycle, input cleanup, shared HUD and PWA update flow. `engines/*.js` retain the twelve original game identities and rules, with rebuilt renderers and validated V2 snapshots. `art/` contains original SVG covers/pieces/buildings; provenance is in `art/LICENSE.md`. All assets are local and licensed for this project.

`#gameScreen` is a separate fixed `100dvh` scene, outside the library's maximum-width layout. The library/navigation are hidden during play and page scroll, selection, pinch gestures and touch callouts are suppressed on the game scene. HUD and controls honor safe-area padding. Landscape places HUD/actions on a side rail. Canvas backing buffers follow actual scene dimensions with DPR capped at 2 and adaptive resolution reduction under sustained slow frames. Scene renderers retain object proportions; puzzle boards remain square. DOM puzzles use the remaining scene space rather than a homepage card. Pausing/backgrounding stops the animation loop and releases held input; menus overlay gameplay without changing its size.

Original `pa_best_*`, `pa_favorites`, `pa_city` and `pa_chess_wins` remain. Storage migration adds `pa_storage_version=2` only. New `pa_v2_session_*` envelopes include `version:2`, with engine-specific validation. Unknown preference fields survive updates. A memory fallback preserves library navigation when storage rejects writes (it cannot survive closing/reloading the page). Snapshots save on actions where applicable, periodically, on pause, exit, pagehide and update acceptance. Recent games and optional first-record achievements are derived locally; no remote synchronization.

## Preview and verify

```
python tests/serve.py
# http://127.0.0.1:8020/pocket-arcade/
node tests/v2-qa.cjs
node tests/storage-qa.cjs
node tests/performance.cjs
```

Browser checks require locally installed Playwright and Chromium (`/usr/bin/chromium`, overridable by CHROMIUM for the main suite). The main suite's update integration temporarily changes local sw.js and restores it. Do not point it at production to simulate a deployment. See TESTING.md and RELEASE.md for evidence and limitations.

## Offline, releases and security

Run `python tests/build-cache.py` after changing the resource set, and bump CACHE in its template/sw.js for each release. An entire version is precached atomically; a failed resource install leaves the earlier worker available. The app offers **Save & update** for a waiting worker; accepting saves active progress before activation/reload. Updates are checked on launch, reconnect, foregrounding and hourly while open. If no old app windows remain the waiting worker can activate normally. Old caches are retained for old tabs; player data is never cleared by the worker. iOS controls eviction and background execution: reopen online for updates; do not rely on indefinite offline storage.

CSP permits only local scripts/styles/workers/connections and local/data images. No eval, imported runtime code, secret values, analytics or arbitrary external request caching. CSP uses a meta tag because Pages does not supply configurable response headers here (meta cannot enforce frame-ancestors). WebAudio uses local synthesis, not downloaded media. Keep HTTPS enforced in GitHub Pages.

Development uses `release/pocket-arcade-v2` based on the existing repository history. The repository originally has root-based Pages publishing and no checked-in Actions workflow; V2 retains that hosting configuration. Source updates must go through authenticated GitHub operations and ordinary merges, never force-push. Only merge a tested bundle into main. Verify both the public HTML `application-version=2.0.0` and current sw.js after publishing, not just repository contents.
