# Verification

Automated Playwright Chromium with 390×844 mobile viewport, touch enabled and device scale factor 3. These are simulated mobile tests, not real iPhone Safari tests.

Passed: all 12 game interfaces and engines open; all thumbnails load; search/category filters; restart/back for every game; 2048 tile movement; Sudoku number input and full hint completion with saved score; legal chess move with computer reply; city construction and saved building after reload; tower placement and wave launch; touch/button inputs with rendered changes in Snake, Racer, Platformer, Runner, Parking, Hockey and Pool; no horizontal overflow across all game interfaces; persisted favorites and Sudoku score; all 12 engines and homepage available after offline reload; malformed stored favorites, score markup and city structure safely handled; no unexpected JavaScript exceptions.

Real service-worker integration: deploy a changed local worker version, observe Update now, accept it, reload under the new worker, retain favorites and score, then reload offline successfully.

Limitations: tests exercise gameplay interactions, not exhaustive completion or every chess rule/physics edge case. No physical iPhone/Safari, live GitHub Pages, enforced HTTPS, or authenticated Actions deployment has been verified. Deployment is blocked by invalid GitHub CLI credentials.

The full mobile/offline/update suite also passed at /pocket-arcade/. A second browser check verified direct index.html navigation, parsed manifest name/short name/display, decoded 192/512 icon dimensions, and no horizontal overflow in the homepage or any of the 12 game interfaces at widths 320, 375, 390 and 430 pixels.
