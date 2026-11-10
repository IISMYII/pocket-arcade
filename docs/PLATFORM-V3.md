# Adventure Platformer V3

Three distinct authored routes: Moonlit Foothills (8 islands), Aurora Ridge (9), and Ember Archipelago (10). Heights, widths, gaps, route lengths, backgrounds, star positions and moving overhead hazards differ. Finish the route to unlock its progression record and advance using Next challenge. Route geometry is available for replay from preparation; progression stars reward completion rather than falsely locking an unreachable UI.

Simulation runs at 120 Hz through a bounded accumulator, independent of display frames. Horizontal target speed is155 units/s; ground/air acceleration1350/980 units/s². Gravity760 units/s², jump impulse350 units/s upward, maximum fall speed650. Platforms intentionally have one-way top surfaces. Landing compares previous/current feet crossing, horizontal overlap, and downward velocity. No tolerance permits standing above a platform or tunnelling through its top.

Difficulty is actual assistance/resources: Easy5 lives,0.15s coyote time,0.18s jump buffer; Medium3/0.10/0.14; Hard2/0.065/0.09. Checkpoints occur every two islands and preserve collected stars. Falling or hitting a hazard consumes one life, returns to the checkpoint with1s invulnerability, or ends the expedition at zero lives. Collectibles award once via a saved boolean ledger.

Points = round((100×collected stars + completion×(1000 +100×lives remaining + max(0,600−4×active seconds))) × difficulty multiplier). Multipliers0.8/1/1.3; only an actual completed run earns completion points. Scores remain integers; old records are untouched. Progression awards1–3 stars based on completion, no falls and full collection. Pause does not advance elapsed time.

Version3 snapshots validate positions, velocities, lives, checkpoint index and collectible ledger. Safe legacyV2 snapshots import collected stars; route position/checkpoint resets because V3 route geometry differs. The original V2 envelope is not erased by the root migration. Malformed state falls back to a new playable expedition.

Validation: `node tests/platform.cjs` runs all nine level/difficulty combinations through actual continuous movement/jumping to completion without teleporting or skipping. Every adjacent jump is independently checked using flight time t=(J+sqrt(J²−2g×rise))/g and horizontal envelope speed×t. The suite also collects every star through actual vertical jumps from its island at a safe hazard phase, then checks fixed-frame invariance, death/life behavior and saved-state rejection. `tests/platform-runner-browser.cjs` verifies actual two-finger movement+jump, selected level/difficulty, pause freeze, Continue and restart in390×844 and844×390 Chromium.

Limits: These are compact authored one-way-platform expeditions, not a procedural campaign. Browser automation is not physical iPhone Safari testing. The controller proves each route completable but does not exhaust every player input sequence, all-star route or timing combination.
