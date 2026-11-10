# Pocket Arcade 3.0

Twelve local-first touch games with fullscreen preparation menus, meaningful rules/settings, resumable sessions and offline play.

Live: https://iismyii.github.io/pocket-arcade/
Repository: https://github.com/IISMYII/pocket-arcade

## Play and install

Safari → open the website → Share → Add to Home Screen → Add. Keep the first launch online until the bundle is cached. Safari controls its own browser chrome; the installed app uses the standalone safe-area layout without a native Fullscreen permission prompt.

Select a game to prepare it. Choose the actual difficulty/mode/level, read its guide and records, then **Start new game** or **Continue** a validated session for those rules. Starting replaces only that configuration after successful initialization. Other configurations/games and old records remain. City is durable: **Enter city** and restart retain its buildings/economy. Pause freezes simulation; game settings return to preparation without deleting the saved session. Sound is synthesized locally and unlocks only on a player gesture; haptics appear only where supported.

## V3 gameplay

| Game | Real rules and content |
| --- | --- |
| Air Hockey | 240Hz relative-velocity physics; repaired rail/paddle trap; bounded paddles; three constrained AI profiles; targets3/5/7/10; three puck paces; serves/countdown/stats and logged neutral no-score recovery. |
| Tower Defense | Six towers and six enemy classes; three12-wave campaigns; milestone bosses; bounded1000-wave Marathon; upgrades/selling; integer performance points separate from gold; validated exactly-once reward ledgers. |
| 2048 | 4×4/5×5; single-step Undo; correct one-merge-per-tile reducers;90-move2048 challenge; continuation beyond target. |
| Snake | Three real speed profiles, levels, open/pillars/wrap arenas, reachable food spawning and one queued turn per cell. |
| Racer | Three stages, traffic difficulties, three distinct handling/collision profiles including Heavy's one-hit shield; fair timed escape rows and distance/coin performance points. |
| Platformer | Three different expeditions, movement/gravity/checkpoints/lives/hazards, reachable collectibles, difficulty assistance and next-level progression. |
| Pool Practice | Solo six-ball practice,12-shot Precision and90-second Sprint; fixed-step collision/friction/pockets/scratches, aim guide and power multiplier, statistics/points. Not competitive8-ball. |
| Sudoku |90 solver-verified unique puzzles, three complexity profiles, deterministic UTC daily boards, notes, hints, mistakes, active timer and once-per-puzzle completion accounting. |
| Chess | Audited chess.js1.4.0 offline rules, tested special moves/draws, three bounded minimax levels, local two-player mode, promotion choice, history/undo and replayable validated saves. |
| Runner | Three missions/environments or endless play; physical jump, constrained lanes, reaction-safe rows, shields, objectives and score. |
| City | Six building roles and five upgrade levels, jobs/services/occupancy, two economies, goals/achievements, unified city rating, bounded offline income and clock safeguards. |
| Parking | Eight distinct top-down layouts; three real vehicle profiles; bicycle dynamics, oriented-rectangle obstacle collision, strict full-car parking, contacts/time/stars/points and next-layout flow. |

Detailed formulas, tests and scope limits are in docs/. Begin with docs/V3-AUDIT-PLAN.md and docs/V3-RELEASE-REPORT.md.

## Architecture and storage

`catalog.js` describes validated real options, V3 mode records and progression. `app.js` owns preparation/lifecycle,120Hz active simulation scheduling, one render loop, pause/input cleanup, audio, safe session/error handling and PWA updates. Each engine adapts a separate testable logic model; games do not share inappropriate physics. `engines/*-common.js` retain original graphics helpers. Runtime assets remain local. The sole vendored rules dependency is chess.js1.4.0 with its BSD-2-Clause license, no transitive runtime dependencies or CDN.

Legacy `pa_best_*`, `pa_favorites`, `pa_chess_wins`, `pa_city` and V2 session envelopes remain. V3 uses validated configuration-keyed session envelopes, separate point records, progression and metadata. Legacy incompatible active routes/waves/parking layouts migrate safely as documented rather than claiming impossible coordinate compatibility. City keeps a separate richer durable save and preserves the source V2 city. Failed initialization/update cannot overwrite the previous safe snapshot. Denied writes use memory while the page remains open; memory fallback does not survive reload. No account/cloud sync or server anti-cheat exists.

## Preview and tests

```
python tests/serve.py
# http://127.0.0.1:8030/pocket-arcade/
node tests/run-logic.cjs
node tests/resources.cjs
node tests/v3-browser.cjs
node tests/storage-qa.cjs
node tests/performance.cjs
```

Node's built-in modules suffice for pure rules tests. Browser suites require Playwright and Chromium; the execution environment used Playwright1.62.1 and `/usr/bin/chromium`. Individual `*-browser.cjs` suites exercise each engine. `tests/visual.cjs --update-baseline` explicitly captures25 deterministic visual fixtures in evidence/visual; `node tests/visual.cjs` compares them. Baselines/evidence are included in the release ZIP rather than production Git source. The local update test temporarily changes sw.js and restores it; run it against local preview only. CI verifies deterministic rules and runtime/CSP/offline dependency integrity on PRs.

No physical iPhone Safari, installed iOS PWA, battery or thermal measurement has been performed. Chromium emulation is not a substitute. See TESTING.md for actual evidence and limits.

## Offline and release security

`python tests/build-cache.py` builds an explicit intended-resource list from runtime dependencies and bundled art/icons. Bump the cache release version on every deployed code/resource change. Installation precaches the whole version; failures leave the earlier worker available. **Save & update** saves active progress before controlled worker activation/reload. Checks run at launch, foreground, reconnect and hourly. Old caches are retained for old clients; the worker never clears player storage or caches arbitrary external requests.

CSP restricts scripts/styles/workers/connections to this origin, blocks eval/inline script permission, and permits local/data images. No credentials, trackers, ads, external game assets or downloaded-code update mechanism. CSP is an HTML meta policy (Pages cannot supply our custom response headers; meta cannot enforce frame-ancestors). Keep HTTPS enforced in Pages. iOS may evict offline/storage data and does not guarantee background updates; reopen online for new releases.

Develop on release/pocket-arcade-v3, preserve original history, and publish through the existing root-based Pages configuration after tested PR merge. `.github/workflows/verify.yml` checks rules/resources; it does not replace hosting configuration. Never force-push. Confirm public application-version3.0.0, actual resources/gameplay and offline behavior before claiming publication.
