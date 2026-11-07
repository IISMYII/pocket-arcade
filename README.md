# Pocket Arcade

The original 12 self-contained mini-games, preserved from the supplied iPhone Website ZIP: 2048, Neon Snake, Highway Racer, Adventure Platformer, Tower Defense, 8-Ball Pool Practice, Sudoku, Chess vs Computer, Endless Runner, City Tycoon, Air Hockey, Parking Challenge.

Dark mobile library with inline SVG game thumbnails, search, categories, favorites and local records. No runtime dependencies, external scripts, analytics, ads or accounts. Pool is solo practice, chess has a basic AI (no repetition/fifty-move draw adjudication), Sudoku uses one puzzle, and parking is top-down.

## Preview and test

Run `python tests/serve.py` and open http://127.0.0.1:8001/pocket-arcade/ . Automated verification requires Node, Playwright and Chromium; run `ARCADE_URL=http://127.0.0.1:8001/pocket-arcade/ node tests/mobile.cjs`. The test expects Chromium at `/usr/bin/chromium`. It temporarily changes the service-worker version and restores it in a finally block; use only with a local preview, not a deployed URL.

## Deployment

Deployment has not been completed: the environment's GH_TOKEN is invalid. The GitHub connector identifies IISMYII but cannot create repositories or configure Pages. No live URL is claimed.

Authenticate GitHub CLI securely in the execution environment using `gh auth login --web --git-protocol https`. If an invalid GH_TOKEN environment variable takes precedence, remove that stale binding in environment settings and authenticate again. Never put credentials in this source tree or chat.

Once authenticated, check whether `IISMYII/pocket-arcade` exists. If it exists, inspect it before pushing; do not replace an unrelated project. For a new repository, from this dedicated project directory:

```
gh repo create IISMYII/pocket-arcade --public --source=. --remote=origin
git push -u origin main
gh api --method POST repos/IISMYII/pocket-arcade/pages -f build_type=workflow
gh api --method PUT repos/IISMYII/pocket-arcade/pages -F https_enforced=true
gh workflow run pages.yml
```

If Pages is already configured use its existing settings or update build_type to workflow. The workflow uses GitHub's Pages artifact and OIDC deployment actions, with read-only source permission and job-scoped Pages write permission. Only application resources are uploaded. Verify the Actions run succeeds and https://iismyii.github.io/pocket-arcade/ returns the actual app before calling deployment complete. The workflow can also be selected in Settings → Pages → GitHub Actions.

## Offline and updates

The manifest names the app Pocket Arcade / Arcade, with standalone portrait display and 192/512 PNG icons plus a separate 180px Apple touch icon. Load online once and allow all resources to cache before relying on offline access. All game resources are bundled. The service worker only handles an explicit same-origin resource allowlist, never arbitrary requests or external code.

Bump CACHE in sw.js on EVERY release that changes bundled resources. Installation precaches the entire bundle and fails if a required resource fails. The waiting worker offers an Update now notification; accepting saves the city and reloads. Without acceptance the worker activates after old windows close. Updates are checked on launch, returning to the foreground, reconnecting, and hourly while open. Version caches keep a coherent bundle even on network failure. Old caches are retained for open clients; browsers may reclaim them. Scores, favorites and city use the original pa_* localStorage keys; updating never clears them. Only records and city persist, not in-progress boards or matches. Invalid stored values are rejected before use; scores are rendered as text.

## iPhone installation and limits

Safari → open the published website → Share → Add to Home Screen → Add. Open Pocket Arcade from its new icon. Keep the first launch online until the offline files are ready.

iOS controls storage retention and can evict offline files under storage pressure or inactivity. Clearing website data or removing the app can remove local progress. Safari and a Home Screen app may have separate storage; progress does not sync between devices or installations. iOS does not guarantee background updates: reopen the app while online and accept Update now if shown. No real iPhone Safari device test has been performed.

## Security

CSP restricts scripts/styles/workers/connections to this origin, permits data images for bundled SVG thumbnails, and blocks objects, forms and base URL changes. Script and CSS were extracted into local files so inline script permission is unnecessary. No eval, downloaded-code updater, secrets, trackers or third-party runtime resources. GitHub Pages does not support custom response headers here, so CSP is supplied by HTML meta (which cannot enforce frame-ancestors). Keep GitHub HTTPS enforcement enabled.
