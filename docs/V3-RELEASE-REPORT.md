# Pocket Arcade 3.0 release report

Baseline main:657e25301367a3070dc253b40779005f15089341. Development branch:release/pocket-arcade-v3. This report describes implemented scope; final deployment identifiers/status are in the delivered evidence/release-status.json and PR. Physical iPhone testing was unavailable.

## Critical reproduced bug and physics repair

The preserved V2 upper-left Hockey fixture remains at(21.312,17.007) for ten simulated seconds with no goal while reported speed rises to470. The original wall-clamp then paddle-projection ordering is the cause. `tests/hockey-legacy-regression.cjs --assert-fixed` intentionally fails against the copied old algorithm; its default mode confirms reproduction. `logic/hockey-physics.js` is the repaired model used by the game.

New Hockey: fixed240Hz stepping, circle normals, penetration projection with alternating wall constraints, moving-paddle relative velocity, bounded restitution/speed, small substeps, goal-post circles and full-puck goal crossing. Paddles move toward targets with speed/acceleration limits and legal inset bounds, leaving escape room. AI retreats from corner pinning instead of teleporting. The defensive monitor measures displacement/span as well as speed, tries a legitimate centerward momentum correction first, then logs a neutral re-serve if necessary. Recovery never grants a goal. Invalid legacy positions retain scores and serve safely; malformed sessions cannot enable Continue. Tests cover all corners, simultaneous contacts, high/low velocities, exact goal-line saved states, frame-cadence equality and five simulated minutes of seeded extreme input. These establish tested invariants, not proof of all possible physical inputs.

Hockey difficulty reaction delay/speed/acceleration/error: Easy.24s/130/850/29; Medium.12/185/1250/12; Hard.06/245/1750/3. Same physical constraints apply to both paddles. Match targets3/5/7/10; pace multipliers.8/1/1.25; countdown/serving/match statistics and per-rule records.

## Changes across every game

| Game | Implemented mechanics/content | Meaningful verification |
|---|---|---|
|2048|4×4/5×5, actual Undo,90-move challenge, continued high tiles|All directions/chain rules, full-board death, no-op/spawn, browser Undo/Continue/challenge terminal|
|Snake|Three speeds, leveling, open/pillars/wrap, reachable food, queued turns|Reachability/full-board/collision/reversal tests, rapid-turn touch regression and rotation|
|Racer|Three stages, distinct handling/sizes, Heavy one-hit shield, fair rows, coins/distance/points|27 complete profile/stage combinations with200ms reaction policy, seeded fairness and reward-repeat tests|
|Platformer|Three expeditions, acceleration/gravity, lives, coyote/buffer assistance, checkpoints/stars/moving hazards|Nine complete actual-control runs; jump envelope and all-star reachability; two-finger touch|
|Tower Defense|Six towers/enemies, three maps,12-wave campaigns/bosses, bounded1000-wave Marathon, upgrades/sales, separate points|Nine complete legal-strategy campaigns; formulas, damage/armor/slow, ledger/currency/restore/frame tests; touchtransactions|
|Pool Practice|Practice/12-shot Precision/90s Sprint, power/assist settings, collision/friction/pocket/scratch repair, statistics/points|17 deterministic checks plus actual drag shots/settings/limits/pause/Continue; honest solo-six-ball labeling|
|Sudoku|90 unique puzzles, three algorithmic complexity profiles, UTC daily, notes/hints/mistakes/time|450 solver uniqueness samples, note/state/scoring tests; full hint completion/replay/no duplicate count in browser|
|Chess|Audited offline chess.js1.4.0, all tested special moves/draws, three minimax budgets, localmode,promotion,undo/history|Published perft20/400/8902 and Kiwipete48/2039,17 rule groups, actual mate/promotion/undo; worker stale/pause/offline tests|
|Runner|Three missions/environments, physical jumping, lane motion, shields, objectives, fair timed rows and scoring|Nine mission completions, reaction/safe-lane/jump/cargo/shield/frame/restore tests, actual touch|
|City|Six building roles,5levels, jobs/services/occupancy, two economic modes, goals/achievements, finite currency/rating|14 groups for costs/income/transactions/refunds/offline/time/migration; normal-play simulations reach objectives without grant money|
|Parking|Eight layouts incl turns/reverse/diagonals,3vehicles, bicycle dynamics, SAT, strict full-car parking|369 assertions; all72 configuration combinations driven with controls and zero contacts,30/60/144Hz equality, touchprogression|

Detailed per-game formulas and limitations are in the adjacent ARCADE/PLATFORM/RUNNER/POOL/SUDOKU/CHESS/CITY/PARKING/TOWER/HOCKEY documents. The maintained chess library is vendored locally with its BSD-2-Clause license and no transitive/runtime network dependency.

## Tower score and economy examples

```
BaseKill = round(10 × tier × (1 +0.12×(wave−1)))
KillPoints = round(BaseKill × difficultyMultiplier)
WaveBonus = round((50 +15×wave +5×remainingHP) × difficultyMultiplier)
Total = accumulated kill points + accumulated wave bonuses
```

Tier factors1/1.2/1.6/2/2.5/5; difficulty.8/1/1.3. Medium Guard wave3:20 points. Hard Boss wave4:88. Medium wave3 with12HP:155 wave bonus. Four such Guard kills plus that bonus:235 points. These are formula examples, not artificial enemy rewards. Gold is separate. Wave bonuses require an unresolved new completion; enemy IDs resolve once. Restored ledgers recompute points/currency/health, rejecting inconsistencies and duplicates.

Tower purchase prices45/65/85/95/60/125. Upgrade=round(baseCost×(.8+.45×currentLevel)); sale=floor(totalInvestment×.6). A45-gold Bolt upgrades for56 then77; repeated purchase/sale loses currency. Armor/piercing, range, fire interval, slow and splash provide different roles. Legal mixed-tower coverage simulations win all campaigns; this demonstrates winnability rather than universal strategy balance.

## Shared website, lifecycle and reliability fixes

Every library selection opens a fullscreen preparation view. Settings are validated against the actual engine options; Start and compatible Continue are distinct. All12 maintain edge-to-edge gameplay, safe areas, portrait/landscape support and touch controls. Pause stops simulation/active timers; overlays do not resize play. Completion supports statistics, personal-best feedback, replay and genuine next-content callbacks. Home now features rebuilt Hockey and Castle defense, with selected-rule summaries, records, recent games and progression.

Root lifecycle fixes beyond V2: interrupted gestures release cleanly; failed constructors hide unusable Resume; failed updates do not overwrite good snapshots; fresh sessions replace old data only after construction succeeds; an outgoing engine saves under its captured configuration even if a next-level callback has changed settings. Hostile V3 record objects cannot crash homepage coercion. Unknown preferences and unrelated keys survive. Denied storage writes retain memory sessions for the current page. Sudoku completion IDs distinguish all90 collection puzzles, replay does not farm solved counts, and replay can improve a mode record. Chess wins are genuinely per difficulty. City scores use a unified rating rather than comparing population to cents/second.

Normal chess search now runs in a local WebWorker. Results carry token/FEN validation, queue while paused, and apply only during active updates. Undo/restart/exit terminate stale workers. Errors/unsupported workers/timeouts use a bounded12–30ms soft-budget fallback, which can briefly affect a frame.

## Save compatibility and PWA

Original pa_best_*,favorites,chesswins,pa_city and V2 session envelopes remain. V3 snapshots are versioned/configuration-keyed. Compatible boards and match data migrate; incompatible Platform/Runner/Parking active geometry resumes safely on expanded routes with retained supported progress. Tower starts the new wave rules while preserving gold/tower replacement value and legacywave metadata. City migrates richer data separately and backs up invalid V3 durable data before recovery. See each engine's migration notes; no claim of bit-for-bit geometric compatibility.

CSP stays restrictive, no eval/inline-script permission, no trackers/secrets/remote assets. The explicit cache includes all engine/logic/vendor/worker/art resources. Atomic installs and Save & update preserve player storage; old clients retain caches. iOS can evict data and controls background execution. Memory-only fallback cannot survive reload; local data is not cloud-synced or cryptographically tamperproof.

## QA and scope limits

The release runs12 pure rule/formula/simulation suites, runtime/CSP/cache integrity, ten engine/whole-app browser suites, storage/error regressions and25 deterministic visual fixtures. Whole-app tests exercise all12 prep(noautostart)/Start/pause/resume/restart/exit flows at five phone viewports, settings, completion, legacy/V3 persistence, corrupted states, offline launch and a real waiting-worker update cycle. Individual suites exercise touch and full mechanics, not merely opening games. Logs and screenshots are supplied in the release evidence directory. CI checks deterministic rules/resources on PRs.

Performance data in evidence/performance.json samples actual engine render work/rAF on shared Linux Chromium,390×844 at deviceDPR3 with backing capped2. It is a short sample, not a physical iPhone/battery/thermal guarantee. No physical iPhone Safari, Home Screen installation, Dynamic Island device or prolonged human-play balance study was performed. WebWorker fallback and cloud CPU contention can affect frame times. No universal never-fails claim, tournament-strength chess claim, true3D parking claim, competitive8-ball claim or infinite content claim is made. No music/network multiplayer/cloud sync was requested as mandatory or added. Any untested physical-device acceptance remains explicit.

Final independent review reproduced and fixed a cross-tab record-partition bug: scores now use the running match’s captured rules, and preparation controls refresh when another tab changes saved choices. The added shared-context browser regression proves Hard records cannot be credited to Easy. Hockey options also strictly normalize inherited/hostile values. Additional independent physics evidence covers270 cases/648,000steps and nine exact Tower mid-wave restorations.
