# BenchBoss case recordings

The eight phone clips on `/projects/halsen-g15` are real BenchBoss screens
recorded from **demo mode** — invented players, no database. Production runs
a grassroots team of children; their names never go on the portfolio.

    cd ~/dev/Private-projects/bench-boss && npx vite --mode demo --port 5199
    cd web && node tools/case/record.mjs            # all three, or: record.mjs trening
    node tools/case/contact-sheet.mjs               # six frames per clip, to check them
    node tools/case/posters.mjs                     # first frame the loop starts on
    cp tools/case/rec/{hjem,trening,matchmode}{.webm,-poster.jpg} public/assets/halsen/

Auth is seeded through localStorage (`bb_auth_v1` + `bb_active_cohort`), so
no login appears in the footage. The clock is fixed per screen because the
demo data is date-bound: Hjem on 2026-03-12 (season "Vinter 2026"), Trening
on 2026-06-10 (the period runs 2 June – 4 July). Match mode gets **no**
clock override — the match clock needs real ticking time.

`record.mjs` only covers the three screens that changed after the first
round (12 Aug 2026). filter, stats-teams, loan-suggest and cup are still the
originals; add them here when they need redoing.

The `start` value on each clip in `CaseBenchBoss.astro` is where the loop
begins — pick it from the contact sheet, then regenerate the poster at the
same second so the still and the first moving frame agree.
