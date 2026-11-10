# Verdant City V3 economy, progression, and migration

## Playable scope

City remains an honest top-down/isometric-style, local idle city builder on 25 lots. It now has six different economic roles, explicit upgrade/sell controls, five upgrade levels, unlock requirements, employment and services, two real economic modes, eight finite objective rewards, and six persistent achievements. It is a sandbox: completing the goals lets the player keep building rather than artificially ending the city. There is no advertised campaign, multiplayer, or simulated 3D camera.

| Building | Base price | Base income / second | Base residents | Jobs | Services | Unlock residents |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| House | $60 | $0.60 | 8 | 0 | 0 | 0 |
| Market | $100 | $2.20 | 2 | 6 | 0 | 0 |
| Garden | $80 | $0.15 | 0 | 0 | 12 | 0 |
| Apartments | $260 | $1.60 | 24 | 0 | 0 | 40 |
| Workshop | $360 | $5.40 | 4 | 14 | 0 | 70 |
| Civic hall | $520 | $2.50 | 6 | 4 | 25 | 110 |

Original bundled miniature SVG art is retained, with distinct scale/color treatment for the three additional building roles. Construction targets have accessible names. Upgrade and sell are explicit 44-pixel controls, so inspecting a building no longer accidentally buys another upgrade. Locked choices explain their real population requirements. The report button shows occupancy, jobs, services, achievements, lifetime income, and construction counts.

## Intentional formulas

All spendable balances, costs, income rates, rewards, and refunds use integer **cents**, bounded to `1e12` cents. The saved fractional accumulator carries sub-cent elapsed-time earnings across frames. No operation can deduct resources before checking affordability.

For a building type with `n` existing buildings:

- New purchase cost = `round(basePriceCents × 1.12^n)`.
- Upgrade from level `L` to `L+1` = `round(basePriceCents × 0.8 × 1.65^(L−1))`, with a hard cap at level 5.
- Base income contribution = `baseIncomeCents × L^1.18`.
- Resident capacity, jobs, and services scale linearly with `L`.
- Sell refund = `floor(actualCentsInvested × 0.5)`.

Let `C` be total resident capacity, `J` jobs, and `A` services. For a nonempty city:

```text
employment = min(1, J / (0.35 × C))
services   = min(1, A / (0.40 × C))
occupancy  = 0.80 + 0.12 × services + 0.08 × employment
residents  = floor(C × occupancy × populationModeMultiplier)
income     = round(sum(buildingIncome) × (0.70 + 0.20 × employment + 0.10 × services)
                   × incomeModeMultiplier)
```

When `C` is zero, employment/services factors are zero. Balanced mode uses multipliers 1/1. Growth mode grants **20% more residents** in exchange for **15% less income**. This changes actual unlock speed, income, and progress; it is not a label change. Gardens support occupancy and revenue; workshops create jobs; apartments provide density. No one purchase is needed just for decoration.

Population goals are **20 / 60 / 120 / 240**. Income goals are **$3 / $10 / $25 / $50 per second**. Each track pays **$75 / $150 / $300 / $600** once. A persisted unique reward ID prevents duplicate payouts after reload, changing modes/objectives, selling buildings, or crossing the same threshold again. Both objective tracks can be completed on the same continuing city. Achievements mark the first building, all 25 occupied lots, all six specialties, a level-5 building, 120 residents, and $25/s income.

A deterministic normal-play simulation starts with the actual **$240** balance, waits for income, buys a mixed district, and reaches both final goals without injected funds. Balanced took **498 simulated active seconds** (288 residents, $58.71/s); Growth took **622 seconds** (376 residents, $81.61/s). This is an intentional play plan, not a universal completion-time or human-playtest claim. Additional tests verify all six unlocks, all eight rewards, and all six achievements are reachable on the real 25-lot map.

High-score records use the same **city rating points** for every objective, so a population record is never compared with raw cents/second. Rating = `floor(10 × residents + 25 × incomeInDollarsPerSecond + 100 × achievementCount)`, bounded to `1e12`. The selected objective changes the rewards pursued, not the units of the record. Funds, revenue, and residents remain separate on the HUD.

## Durable storage and corruption recovery

`pa_city_v3` contains a version-3 validated city: 25 typed/capped lots, integer invested costs and money, a bounded fractional accumulator, monotonic clock metadata, statistics, achievement IDs, and unique reward IDs. Session snapshots use the same schema. Enter city, Continue, restart, and changing economy/objective all preserve the existing durable city. There is no implicit city deletion action.

A valid `pa_city` V2 city is migrated only when a valid V3 city/session is unavailable. Its source key and legacy high-score keys are never overwritten. Legacy dollars convert to cents; houses, shops, and parks retain their lots and supported levels. V2 allowed unbounded levels. A legacy level above 5 is retained at V3 level 5 and the excess original upgrade spend is refunded at 50%, matching normal selling economics, within the money cap. Original data remains recoverable from `pa_city`.

Invalid V3 data is rejected. Before replacing an invalid durable city with recovered legacy data/a fresh city, the first invalid object is preserved in `pa_city_v3_recovery`. Unknown building types, invalid/nonfinite/negative balances, duplicate reward IDs, invalid levels, and inconsistent clocks cannot enter the economy. Unsupported extra fields have no gameplay effects.

## Time, pause, and offline behavior

Active play uses simulation `dt`, with a maximum accepted increment of one second per tick; the root engine pauses updates when paused/backgrounded. The economy cannot receive a giant active jump from a stalled animation frame. The constructor accrues offline income once, then stamps the city on every save. A credited timestamp watermark **never moves backwards**. Reopening at the same time or rolling a clock backwards cannot repay an interval. Active play continues to earn even when a wall-clock mismatch disables offline credit.

Offline income is capped at **8 hours**. A gap beyond **31 days** is conservatively treated as an extreme clock jump and gets no offline credit; this also affects a legitimate absence longer than 31 days. This tradeoff is documented rather than claiming perfect clock validation. Without a trusted remote clock, a local-only game cannot distinguish every deliberate clock edit from real elapsed time, or prevent a player editing localStorage. No remote time service or tracker was added. The app warns about clock changes. iOS may evict local website storage; adding to the Home Screen does not make storage permanent.

## Verification and limitations

```sh
node tests/city-rules.cjs
node tests/chess-city-browser.cjs
```

**14 deterministic rule groups** cover exact prices/refunds, affordability and atomic rejection, level caps, income/population settings, progression reachability, finite rewards across reload, 200 buy/sell cycles without money creation, frame-independent accrual, currency bounds, offline cap and duplicate-credit prevention, backwards/future clocks, legacy compensation and source preservation, invalid data, and the unfunded completion simulation. A desktop Node microbenchmark processed 100,000 economy ticks in approximately **95 ms**; this excludes DOM rendering and is not a phone FPS claim. The UI updates HUD at approximately 3 Hz and persists approximately every 3 active seconds rather than rebuilding the DOM at 60 Hz.

Real browser touch tests buy, upgrade, sell, pause/resume, migrate a V2 city, verify unchanged V2 keys, reload durable buildings, switch economic mode, and build after an offline reload with cached SVG artwork. Layouts are checked at 320×568, 390×844, 430×932, and 844×390. Screenshots and results are generated under `/tmp/pocket-arcade-boards-v3` by default. These are Chromium mobile simulations, **not physical iPhone Safari/standalone tests**.
