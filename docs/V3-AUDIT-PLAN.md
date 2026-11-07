# V3 technical audit and implementation plan

Baseline: main 657e25301367a3070dc253b40779005f15089341 (V2). Branch release/pocket-arcade-v3. Original history and existing storage are retained. This is the initial source audit, not a claim of completed features.

## Architecture findings

V2 has twelve playable engines in four large classic-script files, shared rendering/input/menu helpers, restrictive CSP and an explicit atomic offline cache. It launches immediately from the library, lacks per-game configuration and uses V2 session envelopes. Engines advance variable dt, with ad-hoc substeps only in sports. Rules, rendering and persistence are coupled, making deterministic edge-case tests difficult. V2 QA covers touch/layout/pause/storage but not enough mechanics or long simulation cases. Several records overload wave/goal/level count rather than true performance points.

## Critical source findings

- Hockey: wall correction happens before paddle correction. A paddle can project the puck through a wall, creating repeated wall/paddle resolution. Paddle-hit response uses puck velocity rather than relative paddle velocity, player drag teleports the paddle, and zero-distance overlaps are ignored. Damping has no minimum-momentum policy or jam detector. Restores accept overlapping positions. Three goals/settings choices do not exist; target fixed5, single AI, no match stats.
- Tower: one turret/enemy type, rewards wired directly to hp removal, wave count stored as best score, no points ledger, upgrades, selling, difficulty or bounded campaign. Saved state has no explicit kill/wave reward idempotency.
- 2048: only4×4, no undo/challenges. Merge/state rules need independent directional/chain/full-board tests.
- Snake: one arena/speed curve; orientation-aware grid but no difficulty/maps; food and reversal require deterministic tests.
- Racer: one traffic mode and vehicle, spawn picks random lanes without global escape-route validation, distance and coin objectives insufficient.
- Platform: one6-island level, limited progression; variable integration and landing tolerance need complete-level reachability checks.
- Pool: variable substeps, no explicit challenge rules/shot goals; collision/pocket/scratch edge cases need tests. It is six-ball practice, not competitive8-ball.
- Sudoku: one hardcoded puzzle, no notes/timer/difficulty collection/unique-solution proof.
- Chess: custom rules and capture-biased random AI; no repetition/fifty-move/insufficient-material draws, no history/undo, limited rule regression coverage.
- Runner: one environment and jump model; spawning needs explicit reaction-time/escape guarantees, meaningful objectives and score breakdown.
- City: only3 buildings, linear economy, unbounded upgrades and weak future-clock handling; durable legacy city data must migrate without wiping.
- Parking: three bays in one empty lot, only edge bounds rather than oriented vehicle/obstacle collision; no vehicle choice or real level progression.

## Implementation stages and ownership

1. Extract per-game engine files, retaining shared visual helpers. Add pure/testable rules modules only where appropriate. No generic shared physics forced on boards/economies.
2. Hockey first: reproduce the legacy upper-left jam with a test; implement fixed-step moving-paddle relative-velocity collision solver, penetration constraints, legal paddle bounds, goal throats, velocity limits and logged no-score recovery; three constrained AI profiles and configurable matches.
3. Shared entry lifecycle: library→fullscreen preparation→Start/validated Continue→play→pause→resume/restart/exit. Implement validated game options, explanatory difficulty summaries, per-mode records, progression and version3 envelopes with V2 reads. Settings must be consumed by engines.
4. Tower: deterministic state machine, integer score ledger, exactly-once enemy/wave rewards, multiple towers/enemies/bosses, validated upgrades/sales/campaign, end summary. Preserve legacy wave records separately.
5. All ten other games: meaningful mechanics/content additions listed above; chess may vendor audited maintained rules code with license and no runtime network dependency. Sudoku puzzles must pass independent uniqueness checks. Difficulty/level options correspond to real parameters.
6. Deterministic simulation/formula/save-load tests plus browser touch/layout/state-flow/offline/update/visual regression. Seeded tests reproduce edge cases; tests must exercise actions, scoring and transitions, not just open engines.
7. Performance measure only after correctness; cache static art, keep single active loop and pause accumulation. No physical iPhone available; distinguish Chromium/WebKit automation if available.
8. Coherent commits, PR, merge only after tested scope is documented and acceptance failures are addressed. Publish via existing root-based Pages; verify public V3 marker, resources, gameplay and offline PWA. Package exact source plus QA/screenshots/formulas/limitations.

## Release gates

Hockey regression first; every engine consumes its real options and starts only on Start/Continue; all12 game mechanics tests; Tower formulas/idempotency; valid puzzle collection; chess rule cases; migration preserves legacy keys; touch/fullscreen/pause/background/update/offline checks; no unexpected JS/CSP errors; physical-device limitations and any unfinished requests explicit. No claim of exhaustive/perfect testing or mathematically impossible bugs.
