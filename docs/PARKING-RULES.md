# Parking Challenge V3 — rules and validation

This is top-down parking, not a 3D simulator. The eight layouts use different bay positions/orientations, approach corridors and visible obstacle rectangles. Layouts3,4,8 require real steering (S-curve or quarter-turn);5 is a reverse approach;6/7 are diagonal approaches. Every layout is playable with Compact, Sedan and Van.

## Simulation

The model advances at120Hz using an accumulator, independent of display frame rate. Each substep is less than1.05world units at the highest allowed speed, avoiding tunneling across thin obstacles. Long stalled frames accept at most0.25s; background/pause time is not simulated by the shared lifecycle.

Bicycle steering: `angle += velocity / wheelbase * tan(steer) * dt`. Forward motion is `(sin(angle), -cos(angle)) * velocity * dt`. The three cars differ in width, length, wheelbase, acceleration, maximum speed and steering angle. Opposite throttle applies stronger braking245units/s²; passive rolloff is exponential `v *= exp(-2.2 dt)`. Reverse is capped58units/s. Steering direction naturally reverses with reverse velocity.

Collision uses separating-axis tests between the full oriented rectangular car footprint and each visible axis-aligned obstacle; corners are also checked against the playfield boundaries. A collision rolls back to the preceding legal pose, dissipates momentum and applies a contact penalty with an0.8s cooldown. Art geometry is derived from the same vehicle dimensions and obstacle rectangles used by collision.

Success requires **all four car corners** inside the rotated bay, low velocity, heading alignment and a continuous stationary hold. Difficulty values:

| Difficulty | Heading tolerance | Maximum parking speed | Hold | Score multiplier |
| --- | --- | --- | --- | --- |
| Easy |0.26radians |12 |0.60s |0.8 |
| Medium |0.17radians |7 |0.85s |1.0 |
| Hard |0.10radians |4 |1.10s |1.3 |

Score: `max(50, round((1000 + 150*layout - 4*elapsedSeconds - 90*contacts)*difficultyMultiplier))`. Currency is not involved. A clean completion earns3stars, up to2contacts earns2stars, otherwise1star. Best records use the shared per-configuration V3 score store; existing V2 record keys remain untouched. Next Layout advances the actual layout selection and resets only the new active session.

## Saved data

V3 snapshots validate version, layout, vehicle, difficulty, legal non-overlapping car pose, finite elapsed time, bounded velocity and nonnegative integer contact count. Completion flags are only honored when the restored pose satisfies the full parking criteria. Transient held controls, collision cooldown and partial parking hold are not restored.

The old V2 game used three bays in one layout and incompatible collision geometry. A valid unfinished V2 session is recognized, its old record remains, and V3 starts at the new selected layout's safe checkpoint with an explanatory message. V2 storage is not deleted. A finished V2 session is not offered as an active Continue.

## Automated evidence

- `node tests/parking-rules.cjs`:369assertions, including all72 layout×vehicle×difficulty combinations completed using actual120Hz acceleration/steering/reverse inputs with zero collisions. The controller follows collision-free curvature-bounded reference routes; it does not teleport or directly place the car at the target.
- Routes are independently checked using every vehicle footprint along their full path. Turning routes use90-unit curve radii, larger than every vehicle's minimum steering radius.
- SAT rotated-corner collisions, partial bay rejection, angle/speed/hold thresholds, actual vehicle parameter differences, score bounds, malformed/overlapping snapshots, migration, braking/friction and display-rate invariance30/60/144Hz are tested.
- `node tests/parking-browser.cjs`:real CDP two-finger driving, actual Start/configuration/Continue/pause/restart flow, deterministic driving through the real adapter to layout3 completion, score/stars/Next Layout, portrait/landscape viewport and DPR assertions.

These are deterministic model tests and Chromium mobile touch emulation, not physical iPhone testing. They prove reference approaches exist; they are not an exhaustive test of every possible driving maneuver or contact combination. There is no claim of100% physical realism or exhaustive playability perfection.
