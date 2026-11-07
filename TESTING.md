# V2 verification

All browser results are Linux Chromium with mobile touch emulation. No physical iPhone Safari, Dynamic Island device, installed iOS PWA or iPhone battery/thermal benchmark has been tested.

- Fullscreen scene, no library/nav/card wrapper, canvas DPR, no horizontal overflow, pause/resume/restart/exit: all 12 games at 320×568, 375×812, 390×844, 430×932 and 844×390.
- Actual CDP touch gestures: swipes, pool shot, hockey drag, held parking acceleration; individual engine integration tests also cover platform two-finger movement+jump, runner lanes, tower placement/waves, 2048 movement/merge, Sudoku input/hint completion, chess legal move+AI, and city construction.
- Existing records/favorites retained, city and V2 session reload/return, score and preference persistence, paused chess AI, terminal replay menus.
- Every engine opens after offline reload. Real service-worker waiting/update notification, explicit acceptance, offline relaunch and preserved player data.
- Malformed scores/favorites/city/snapshots reject safely; no browser JavaScript or CSP errors in the main suite.
- Independent storage regression: denied localStorage writes/removal fall back to memory, targeted restart preserves records, unknown preferences/unrelated storage survive, sound state/ARIA sync, Escape pause and interrupted swipe recovery.
- Before screenshots come from untouched remote commit 400e7aa. After screenshots capture the redesigned actual playable engines. The local delivery evidence gallery links both for home and every game.

Performance measurements are in evidence/performance.json in the delivery ZIP. They time actual render calls and rAF intervals in the shared cloud environment, with 390×844/DPR3 emulation and render DPR capped at2. Static pool/hockey/parking backgrounds are cached; sustained slow frames reduce canvas resolution. These measurements are not a guarantee of60FPS on an iPhone. No exhaustive solution run for every level, all chess edge rules, long-term storage eviction or battery use has been performed.

Final isolated performance run: median display interval16.7ms for all8 canvas engines (about60FPS in this environment); median render work0.1–0.8ms, p95 up to2ms,45 sampled renders each. Pool/Hockey static layers removed a measured repeated-drawing bottleneck. Long sessions and iPhone thermal behavior remain unmeasured.
