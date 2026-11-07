# Pocket Arcade 2.0 release

Based on repository commit 400e7aa2ba7aee04bc4ff1c794d11c6a2cd4e652, developed on release/pocket-arcade-v2.

This release replaces the constrained homepage game panel with a dedicated viewport scene; redesigns every game renderer; adds original game cover/piece/building art; implements a shared pause/settings/replay flow; saves resumable sessions; and retains existing player keys and secure offline updates. It introduces no runtime dependency.

Original repository icon files were uploaded at its root while the manifest referenced icons/. V2 supplies the expected icons/ paths without deleting the old root icons, preserving existing incoming links. No unrelated repository is modified.

Known limits: Safari browser UI remains under iOS control; no native Fullscreen API prompt. Browser haptics are capability-based. No real iPhone testing. Parking remains illustrated top-down gameplay, Pool is practice, Sudoku has one puzzle, Chess has a basic opponent and no repetition/fifty-move adjudication. Local data does not sync, storage may be evicted, and background update delivery is controlled by iOS.

The deployment-ready ZIP contains the exact source structure plus a local evidence folder with paired before/after screenshots, performance data and QA results. Evidence is excluded from Git to keep production source lightweight. Git history remains in the source repository; no history was rewritten.
