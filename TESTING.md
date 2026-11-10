# Pocket Arcade 3.0 verification

Run a localhost preview with `python tests/serve.py` at http://127.0.0.1:8030/pocket-arcade/ .

- `node tests/run-logic.cjs`:12 deterministic suites across all12 games, including preserved failing-V2 Hockey fixture, repaired physics, exact Tower accounting, full-level controllers, unique Sudoku solutions, published chess perft/rules and economy/migration checks.
- `node tests/resources.cjs`: runtime script syntax, CSP, local dependencies and explicit offline list.
- `node tests/run-browser.cjs`:10 suites exercising actual touch gameplay, preparation/settings, pause/Continue/restart, terminal/progression flows, records, corrupted/denied storage, error recovery, all-game offline launch and accepted service-worker update.
- `node tests/visual.cjs --update-baseline`: explicit fixture capture. `node tests/visual.cjs`: compare25 deterministic fixtures supplied in release evidence. An intentional visual change requires explicit baseline renewal, not silent acceptance.
- `node tests/performance.cjs`: short actual-render/rAF timing sample. Shared cloud Chromium is not iPhone hardware.

The full app matrix uses320×568,375×812,390×844,430×932 and844×390 touch viewports. Rule tests include actual complete-level/match simulations and save/reload ledger assertions; browser tests include tactile controls and mechanics. Evidence logs/screenshots are included in the release ZIP; Git excludes generated evidence. Per-game test coverage, formulas, migration compromises and limitations are in docs/V3-RELEASE-REPORT.md and its linked engine documents.

No actual physical iPhone Safari or installed iOS PWA, device thermal/battery test, unbounded fuzz proof or exhaustive human-play balance test has been performed. Local progress/clock data cannot be made server-authoritative without a server. Existing HTTPS Pages publication and the deployed V3 marker/offline resources must be verified separately after merge.
