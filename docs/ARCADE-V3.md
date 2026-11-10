# V3 Arcade rules: 2048, Neon Snake and Highway Racer

These three engines retain their V2 artwork and game identities. Their rules live in dependency-free `logic/arcade-models.js` and are exercised by Node simulations plus the real browser adapters.

## 2048

- Classic 4×4 and 5×5 boards use the same single-pass merge rule: compact toward the input edge, merge adjacent equal pairs once, then pad. A new tile can never merge twice in the same move. Points equal the value of every newly merged tile.
- A no-op input does not consume a move or spawn a tile. A successful move spawns exactly one2 (90%) or4 (10%) into a free cell.
- The90-move challenge requires reaching2048 within90 successful moves. Reaching it on move90 succeeds; play can continue past both2048 and the move limit after success. Classic has no move limit.
- Undo restores the complete pre-move board, score, move count and objective status, including removal of the random tile. It is a single-step undo, not an unlimited history. The saved best record never decreases after undo.
- Full-board game-over checks test both horizontal and vertical neighbors. Resume recomputes completion/dead-board status rather than blindly trusting stored `won` flags. Continue only appears for a compatible board size/mode.
- V2 boards remain compatible under4×4 Classic; original best keys are not rewritten. V3 points use the shared per-rule record system. Numeric validation permits powers of2 beyond2048 while bounding pathological storage values.

## Neon Snake

Difficulty intervals (seconds per cell):

| Difficulty | Initial | Minimum | Reduction per five foods |
| --- | --- | --- | --- |
| Easy | .210 | .095 | .012 |
| Medium | .155 | .072 | .011 |
| Hard | .112 | .052 | .009 |

`level = 1 + floor(score / 50)` and `interval = max(minimum, initial - floor(score/50) × reduction)`. Every food adds10 points and one segment. Direction input cannot reverse against the currently moving head. One turn is queued per simulation cell; a rapid opposite input cannot cancel the already queued safe turn. Moving into the departing tail is legal on a non-eating step.

Three real arena rules: bounded open grid, four3-cell pillars, and edge wrapping. Food is selected from reachable unoccupied cells using a flood fill from the head; the vacating tail may be traversed during reachability but is never a food spawn. A sealed route with no reachable free cell is a loss, not a false full-board victory. Full-board victory requires occupying all available non-pillar cells.

The arena is rectangular on tall/wide screens. Rotation transposes body, direction and collectible. Wrap grid dimensions are retained when the same-orientation viewport changes, so a seam-crossing body cannot become disconnected by Safari toolbar resizing. Restores reject duplicate/nonadjacent segments, occupied food, impossible scoring and malformed coordinates. Cosmetic effects respect reduced-motion preferences.

## Highway Racer

Three stage environments and route patterns:

| Stage | Environment | Distance objective | Base traffic speed | Base row interval |
| --- | --- | --- | --- | --- |
|1 | Neon District |240m |155 |1.65s |
|2 | Coastal Merge |340m |190 |1.48s |
|3 | Summit Tunnel |450m |220 |1.30s |

Easy/Medium/Hard multiply traffic speed by`.86 / 1 / 1.15` and base spacing by`1.18 / 1 / .9`. Endless changes environment every400 distance units and has no stage finish.

Vehicles have real physical differences:

| Vehicle | Main collision body | Lateral speed | Traffic-speed factor | Additional rule |
| --- | --- | --- | --- | --- |
| Balanced |44×76 |340 |1 |Standard handling |
| Agile |35×64 |480 |1.04 |Small body and fast lane changes |
| Heavy |54×90 |245 |.93 |One-impact shield;0.45s finite separation grace |

Collision uses overlapping main-body rectangles. Heavy's shield consumes once, removes the contacted traffic and awards no score for the impact; a later impact ends the run. Every gate reserves a safe lane. Adjacent safe gates differ by at most one lane. Row spacing has a lower bound `(vehicleHeight + trafficHeight)/trafficSpeed + laneWidth/lateralSpeed + .25`, giving room to clear the earlier row, change lanes and react. This is combined with per-stage patterns; random choice only selects which non-safe lane is occupied in stage1.

`distance += trafficSpeed × dt × .085`.

`score = floor(distance) + 25×coins + 5×trafficPassed + stageReward`.

Stage reward is`100×stage`, awarded only when the terminal completion transition occurs. Further updates of a completed snapshot are inert. Each stage saves a local completion/star reward and offers the next route. Snapshot validation bounds score-bearing values and rejects duplicate pickups, duplicate car/lane IDs and fabricated completion rewards. Old V2 distance/coin sessions can migrate without changing original record keys.

## Evidence and practical limits

- `node tests/arcade-rules.cjs`:48 rule/simulation cases. Covers both board sizes/all directions/chain merging/dead-board opportunities, Snake reversal/collisions/reachable food/maps/scoring, Racer formula/collision/shield and all27 difficulty×vehicle×stage runs with constrained lane movement and a200ms reaction policy. Fifteen additional seeded Hard/Heavy final-stage simulations and terminal save/reload score checks pass.
- `node tests/arcade-browser.cjs`:actual Chromium touch preparation/settings,2048 undo and final-move challenge success/failure, Continue, Snake pause/wrapped rotation, Racer touch steering/pause/save/finish/next stage. No page exceptions.
- Browser tests are simulated mobile Chromium, not a physical iPhone. The route controller proves the scripted gate sequences are completable; it does not prove every player input can avoid a crash or that difficulty is universally enjoyable. Snake's sealed-route loss is intentional. 2048 provides one-step undo. These are compact arcade games, not claims of unlimited content or perfect play balancing.
