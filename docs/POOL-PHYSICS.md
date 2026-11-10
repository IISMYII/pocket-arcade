# Pocket Pool V3

This remains an original six-object-ball solo billiards game. It does not claim regulation eight-ball rules, multiplayer, or an AI opponent. Legacy “most balls pocketed” records remain untouched. New V3 records use separate configuration-keyed performance points.

## Mechanics

The rendering adapter in `engines/pool.js` uses the original cached V2 wood/felt artwork. Deterministic simulation lives in `logic/pool-physics.js`, exported as browser global `PocketPool` and CommonJS for Node tests. Load that file before the engine.

Physics advances at a fixed 240 Hz with an accumulator, independent of display refresh. Frame contributions are capped at 250 ms to avoid a long blocking catch-up after suspension; the app pauses on backgrounding. Ball displacement at maximum speed is under 2.71 logical pixels per physics step, compared with a 22-pixel ball diameter and 18-pixel pocket capture radius. This bounds tunnelling at the supported shot power. Equal-mass normal impulses use restitution 0.965; cushions preserve tangential velocity and reflect only incoming normals with restitution 0.87. Rolling friction decelerates continuously and settles very slow balls without reversing direction. Five positional solver passes separate overlaps, including deterministic normals for exact coincidences. No restitution impulse is applied to separating pairs.

A scratch removes the cue while the remaining balls roll. A stationary cue is returned only after they settle, at the first legal clear spot with more than 24 pixels clearance. It cannot reappear overlapping a moving ball. Object pocketing increments the score; a scratch increments the separate scratch counter. The cue is not a scoring ball.

## Actual mode settings

- **Practice:** unlimited strokes until six objects are pocketed.
- **Precision:** twelve accepted strokes. The twelfth shot finishes rolling before the result; clearing during that shot succeeds. Short pulls that do not reach minimum power do not consume a stroke.
- **Sprint:** ninety seconds of active simulation from the first accepted stroke; pausing does not run the clock. At ninety seconds the current result is final, including balls still moving.
- **Assist:** optional first-contact ray predicts either the first object collision or the first cushion. Turning it off removes that guide while retaining the physical cue and power indicator.
- **Power:** 0.6, 1, or 1.3 changes shot velocity; all use a common 650-unit safety cap.

Results show mode, potted balls, performance points, strokes, scratches and active time. Points are `round(max(0, 100×potted + (cleared ? 300 : 0) − 8×shots − 35×scratches − floor(seconds/2)) × modeMultiplier × guideMultiplier)`. Mode multipliers are1.0 practice,1.2 precision and1.15 sprint; guide-off multiplier is1.1 versus1.0 with assistance. For example, a cleared practice rack in8 shots and60seconds with no scratches yields806points. Each object can be pocketed only once, and the score/object-count validator prevents duplicate saved identities. A completed table records completion for the selected mode and one to three efficiency stars. No incomplete round awards completion. Restart resets the current round through the app; legacy best scores remain intact.

## Storage

`registerSessionValidator('pool', ...)` lets the app determine whether a Continue session is safe. The pure validator checks unique ball identities, cue presence, finite positions/velocities, score-to-object consistency, supported speed, and nonnegative bounded counters. Valid V2 snapshots migrate their balls, score and stroke count, with newly introduced counters defaulting to zero. Malformed sessions fall back to a fresh round without deleting the original localStorage entry. New snapshots include simulation version 3, mode options, timer, statistics and pending scratch return. The app owns the outer versioned storage envelope.

## Verification

Run `node tests/pool-physics.cjs` for seventeen deterministic checks covering momentum/energy, coincident overlap, rolling friction, cushion normals, maximum-speed pocket capture, safe scratch return, 30 Hz versus 120 Hz determinism, the precision limit, sprint timing, real power differences, guide prediction, V2 migration, invalid states and collision-heavy endurance.

`node tests/pool-browser.cjs` uses installed Playwright/Chromium in an isolated adapter harness to verify actual touchscreen shots and snapshots in 390×844 and 844×390 layouts, precision completion, applied settings and error-free rendering. The harness does not test the app’s menus, service worker or deployment. `node tests/hockey-pool-browser.cjs` additionally exercises the actual V3 preparation menus, real settings, touch, pause time, saved Continue and terminal menus in both orientations. Offline and deployment require the whole-app suite. No physical iPhone Safari test has been performed.

Known model limits: no spin, cloth nap, ball-in-hand, regulation eight-ball fouls, rebound prediction, or three-dimensional rail physics. The assist describes the initial path, not a guaranteed pot. This is intentionally a compact deterministic touch-first practice/challenge simulation.
