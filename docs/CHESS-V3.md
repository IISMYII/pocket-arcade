# Ivory Chess V3 implementation and evidence

## Rules and dependency

The original bespoke move generator is replaced by **chess.js 1.4.0**, vendored from the official npm release (`chess.js` package, `dist/cjs/chess.js`). The CommonJS source is wrapped for both the browser and Node; it makes no network requests and has no runtime dependencies. The complete BSD-2-Clause copyright and license are in `vendor/chess-LICENSE.txt`. There is no `eval`, dynamic code download, CDN, tracker, or new permission. CSP remains unchanged.

Vendored wrapper SHA-256: `6cdcb61e541ca20abb214dc3681adc5a479ac8341f7da0a164060640df562778`.

`logic/chess-rules.js` adapts the rules engine and contains persistence, outcomes, undo, and computer search. `engines/chess.js` owns the touch board, selection, legal move markers, accessible promotion choices, move history, result screens, and root lifecycle integration.

Tested rules include legal king safety; castling on both sides, blocked attack paths, and irreversible castling rights; en passant on either side and its one-turn expiry; all four promotions; checkmate; stalemate; threefold repetition; the fifty-move rule and resets on pawn moves/captures; and the library's insufficient-material detection. Draws are automatically concluded in this casual app rather than requiring a formal tournament claim. No tournament-strength or exhaustive proof of all possible chess positions is claimed.

## Actual difficulty differences

The opponent uses ordered iterative-deepening negamax with alpha-beta pruning. Evaluation scores material, pawn advancement, minor-piece centralization, and king placement. Captures/promotions receive ordering priority. Mate outranks material; drawn positions score zero. All returned moves come from legal move generation.

| Difficulty | Maximum search depth | Node budget | Soft time budget |
| --- | ---: | ---: | ---: |
| Easy | 1 ply | 160 | 60 ms |
| Medium | 2 plies | 1,400 | 140 ms |
| Hard | 3 plies | 5,500 | 260 ms |

A completed shallower iteration is retained if a budget is reached. A legal ordered fallback is available even on a cold or slow device before the first iteration finishes. These are soft elapsed-time limits: one legal-generation/evaluation operation can finish after the deadline. This does not claim strong competitive chess ability.

The pinned library's private fast move API is isolated in the search adapter. Each speculative move updates and reverses repetition counts as well as board state. Regression tests verify that search preserves the complete history, FEN, and repetition map. A future vendor upgrade must rerun these tests or replace the adapter with the new public API.

## Search worker and lifecycle

Normal computer search runs in a **local WebWorker**, `logic/chess-worker.js`, which imports only the bundled vendor file and chess rules. The worker asset and both imports are included in the explicit offline resource allowlist. No blob/data URL, downloaded program, additional permission, or CSP relaxation is used. The synchronous `chooseMove` function remains independently testable.

Each request contains a replayable validated snapshot, difficulty, monotonically increasing job token, and exact FEN. The worker restores the complete history so repetition analysis remains correct. Replies contain only a move and bounded search statistics. The engine rejects mismatched token/FEN replies, validates move coordinates/promotion, and verifies the returned move is legal in the still-current position.

`onmessage` **only queues** a result. The next active simulation `update(dt)` applies it. A search already underway may finish during pause, but no piece moves or simulation time advances until Resume. Undo invalidates the token and terminates the worker; terminal states, restart, and exit also terminate it. Retained or late callbacks cannot mutate the old/new board. An idle worker can be reused for the next turn within the same game.

If workers are unsupported, construction fails, a worker reports an error, deserialization fails, or a job does not answer within three **active** seconds, the engine falls back without an unhandled console error. This fallback uses smaller soft budgets: Easy 1 ply / 80 nodes / 12 ms, Medium 2 / 240 / 20 ms, Hard 2 / 600 / 30 ms. The opponent remains legal, with reduced strength; a brief main-thread interruption is possible only in this degraded path. Normal Hard search no longer runs its 260-ms search on the UI thread. Worker errors are prevented/handled locally without logging player data.

## Saves, records, and undo

V3 snapshots contain a validated initial FEN, complete replayable SAN history, exact resulting FEN, and a persistent `resultRecorded` flag. Restore replays every legal move and rejects a final-position mismatch. Additional FEN validation rejects adjacent/illegally exposed kings, phantom castling rights, impossible promotion material, and inconsistent en-passant metadata.

Valid V2 eight-row boards migrate with surviving castling and en-passant rights; phantom rights/invalid en-passant metadata are removed. V2 did not retain a complete move history, halfmove clock, or repetition history. Those unavailable facts cannot be reconstructed; they begin from the migrated position. The original V2 save remains untouched.

Computer Undo takes back the player's turn and reply, or the pending human move if the computer has not replied. Local two-player Undo removes one move. Once a match has awarded a win, undo/replay or restore cannot award that match again. New V3 win counters and high records are separate per computer difficulty; original `pa_chess_wins` and `pa_best_chess` remain untouched.

## Verification

Commands:

```sh
node tests/chess-rules.cjs
node tests/chess-city-browser.cjs
node tests/chess-worker.cjs
```

The rules suite has **17 test groups**, including published start-position perft **20 / 400 / 8,902**, Kiwipete perft **48 / 2,039**, the special rules above, malformed save rejection, exact history restoration, bounded legal AI, and a 40-ply AI simulation with save/restore each turn.

The browser suite actually taps legal local moves, undoes them, reloads saved history, waits for an actual Hard worker reply while paused and applies it only after Resume, selects an underpromotion across pause/resume, plays Fool's Mate to completion, verifies per-difficulty win counters and duplicate-restore protection, and plays with the actual Hard worker after an offline reload. The dedicated worker suite verifies local-only imports, validated protocol inputs, legal search output, stale token/FEN rejection, queued results, undo/restart/exit cancellation, constructor failure, handled worker error, timeout fallback, and absence of unexpected page errors. Four viewports are checked: 320×568, 390×844, 430×932, and 844×390. SVG pieces load successfully offline; no page errors were observed. Screenshots and machine-readable layout results are generated in `/tmp/pocket-arcade-boards-v3` by default.

A five-run desktop Node sample of the starting position measured Easy 6–74 ms, Medium 15–86 ms, and Hard 125–199 ms; one cold Easy search fell back before completing depth 1. These are development-container timings for the pure search function, **not iPhone benchmarks**; normal browser search now runs off the main thread. Testing used Chromium with mobile viewport and touch emulation. No physical iPhone Safari or iOS standalone installation was available for this task.
