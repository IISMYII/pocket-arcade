# Legacy upper-left jam: reproduced before the repair

The unmodified V2 `makeHockey` collision ordering was copied into `tests/hockey-legacy-regression.cjs` before implementing the new model. At 240 updates per second:

- Initial puck: x=24, y=22, vx=-100, vy=-145.
- Initial bot: x=38, y=48 (legal under V2 constraints).
- V2 puck after the first update: (21.312,17.007), outside the top/left rails.
- At each second from 1 through 9: the same (21.312,17.007), speed=470, goals=0.

The original escape assertion failed with exit status 1. The paddle projected the puck through the rails; the following wall clamp and repeated paddle impulse put it back in the same place while its speed increased. A velocity-only stall check would miss this completely.

To rerun the original red test:

```
node tests/hockey-legacy-regression.cjs --assert-fixed
```

It is intentionally expected to fail. The default command instead asserts that the preserved legacy fixture reproduces this known failure and exits successfully. The repaired pure model is tested separately; no legacy engine code is used by the app.
