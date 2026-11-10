# Tower Defense V3: rules, points, economy and verification

The original Castle/Tower Defense identity remains: build on grass beside a fixed enemy route and protect gate health. V3 has three distinct contiguous maps, six tower roles, six enemy classes and a12-wave campaign on each map. Bosses arrive on waves4,8,12. An optional bounded endless mode continues through wave1000. The game is deterministic: wave rosters, timing, targeting and rewards do not use randomness.

## Points are separate from gold

Enemy tier multipliers: Scout1.0, Runner1.2, Guard1.6, Brute2.0, Elite2.5, Siege Boss5.0. Difficulty multipliers: Easy0.8, Medium1.0, Hard1.3.

```
BaseKill = round(10 × tier × (1 + 0.12 × (wave − 1)))
KillPoints = round(BaseKill × difficultyMultiplier)
WaveBonus = round((50 + 15 × wave + 5 × remainingGateHP) × difficultyMultiplier)
TotalScore = accumulated KillPoints + accumulated WaveBonus
```

Rounding is explicitly performed twice for kills, as in the proposed scoring scheme. Scores are nonnegative safe integers. Gold is a separate currency and is never copied into points. Launching a wave awards no points. Escaped enemies award neither kill points nor gold. The wave bonus is awarded once, only after every enemy has resolved and gate health is positive. Defeat never awards a completion bonus.

Examples:

| Event | Easy | Medium | Hard |
| --- | ---: | ---: | ---: |
| Scout defeated in wave1 |8 |10 |13 |
| Guard defeated in wave3 (base round19.84=20) |16 |20 |26 |
| Boss defeated in wave4 (base68) |54 |68 |88 |
| Wave3 cleared with12 gate HP (base155) |124 |155 |202 |

A Medium wave3 with four Guard kills and12 remaining health would add4×20+155=235 points, independent of gold spent. The actual roster determines which enemies exist; these examples do not spawn extra enemies or fabricate rewards.

End screens show total points, enemy points, wave bonuses, enemies defeated, waves secured, gate health, difficulty multiplier, best score and campaign stars. New score records use V3 configuration records; original pa_best_tower wave records are retained as legacy data.

## Exactly-once rewards and saved state

Each wave enemy has a deterministic unique ID, `wave×1000+spawnIndex+1`. Resolution sets the enemy flag and adds the ID to the current resolved ledger atomically before adding a reward. Other turrets exclude resolved/dead enemies. A wave bonus requires `wave > completedWave`, then updates the monotonic completed-wave number and ledger before returning to ready state. Launch requires `wave === completedWave` and no active wave.

Snapshot validation recomputes kill count, kill points, wave bonuses, gold earnings and remaining health from saved rosters/ledgers. It rejects duplicate tower/enemy IDs, duplicate occupied cells, impossible routes, altered enemy max HP, inconsistent currency/points, missing or duplicated completed waves, invalid cooldowns and nonfinite/negative arithmetic. Sold towers are removed immediately; repeated sell/upgrade clicks cannot act on an absent ID. There is no claim that unsigned local saves resist an attacker who rewrites an entire mathematically consistent history, but normal gameplay and save/reload cannot replay rewards.

V2 gold and tower value migrate without granting new points. V2 towers become Bolt towers. Newly blocked lots relocate to nearest free grass; if there is insufficient grass, excess towers become their replacement purchase value in build credit. The old campaign uses incompatible wave/enemy rules, so migration explicitly begins the new campaign at wave1 while retaining legacy wave metadata and the untouched old high-score key. The UI states this migration. Source V2 snapshots are never edited.

## Economy and tower roles

| Tower | Cost | Base damage | Interval seconds | Range cells | Role |
| --- | ---: | ---: | ---: | ---: | --- |
| Bolt |45 |13 |0.72 |2.45 |Low-cost balanced damage |
| Spark |65 |5 |0.18 |2.15 |Fast light-target damage |
| Prism |85 |32 |1.35 |3.8 |Long range;65% armor penetration |
| Ember |95 |22 |1.05 |2.5 |Area damage within1.05 cells |
| Frost |60 |3 |0.6 |2.6 |45% slow, refreshed but not multiplicatively stacked |
| Cannon |125 |70 |1.7 |2.7 |Heavy damage;85% armor penetration |

Towers have three upgrade levels. An upgrade costs `round(baseCost × (0.8 + 0.45 × currentLevel))`; damage scales by `1 + 0.7 × (level−1)`, interval by `0.93^(level−1)`, and range increases0.18 per upgrade. Example Bolt costs45 initially,56 for level2,77 for level3. Selling refunds `floor(totalInvestment × 0.6)`, so buy/upgrade/sell cycles always lose gold.

Damage equals `max(0.5, towerDamage × (1 − armor × (1 − penetration)))`. Turrets target the furthest-advanced eligible enemy, with ID tie-breaking. Energy bolts are resolved when fired; the short bolt animation is feedback rather than a separate physical projectile that can miss a moving target. Splash damage affects only living enemies near that target. Frost slows for a bounded duration; overlapping Frost effects refresh duration rather than creating an immobilization exploit.

Enemy base HP/speed/gold: Scout40/0.8/7, Runner28/1.35/9, Guard115/0.63/13, Brute160/0.72/16, Elite230/1.08/22, Boss1000/0.45/80. Health scales by `(1+0.16×(wave−1)) × difficultyHP × mapHP`. Easy/Medium/Hard HP factors are0.78/1/1.32, speed factors0.9/1/1.08, initial gold230/210/190 and gate HP20/15/12. Map HP factors1/1.1/1.2. Armored/elite/boss resistance and larger leak damage distinguish them. Completing a wave awards `50+7×wave` gold.

## Simulation and verification

`logic/tower.js` is DOM-free and advances a1/120-second fixed simulation with a bounded accumulator. Rendering occurs separately. Pause stops root updates. Paths are explicit and contiguous, so enemies cannot wander or become stuck in pathfinding. Each game state has bounded waves/entities/arithmetic.

Run:

```
node tests/tower-rules.cjs
node tests/tower-balance.cjs
```

The rules suite covers exact scores, health scaling, map validity, actual armor/piercing/rapid-fire/slow behavior, atomic resource deductions, upgrades/refunds, duplicate kill/wave prevention, mid-wave reload,30/60/120Hz equivalence, corrupt state rejection, terminal defeat, V2 migration and all nine campaign/difficulty combinations. The balance simulation uses a legal greedy coverage strategy with mixed towers and upgrades, not unlimited resources or invulnerability; all nine campaigns complete. This establishes winnability, not perfect balance or a proof that every strategy is viable. No physical iPhone test has been performed.
