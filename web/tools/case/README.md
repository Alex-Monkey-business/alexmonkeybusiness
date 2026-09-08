# Portfolio recordings

Updated 8 September 2026 from the current BenchBoss source. All recordings use
invented demo players with no Supabase configuration. Never record the production
roster. The auth fixture includes the current club, birth year and match format.

Start an isolated source copy without environment files on port 5199. Include
`src`, `design-system`, `public`, `index.html`, `package.json` and Vite config.
Then, from `web`:

```sh
node tools/case/record.mjs
node tools/case/posters.mjs
```

`record.mjs` supports individual clip names. It refreshes home, match mode,
team filter, team statistics, training week, exercise guidance and cup. The
loan suggestion clip remains the previous recording. Outputs are in ignored
`tools/case/rec`; copy reviewed `.webm` and `-poster.jpg` pairs to
`public/assets/halsen`.

The March clock matches the demo league fixtures. Training now repeats weekly;
it no longer uses the previous date-bound period. Match mode uses a real clock.
Poster times in `posters.mjs` match loop starts in `CaseBenchBoss.astro`.

The exercise recording shows a single drill from the small built-in demo library.
The full app has over 100 Tiim/NFF drills, as confirmed by the project owner.

Larvik Beach screenshots use `tools/larvik/capture.mjs`, adapted from that app's
isolated UI QA fixtures. Run its current source locally on port 5198 with
VITE_SUPABASE_URL=https://portfolio-demo.supabase.co and a dummy anon key.
All requests to that backend are intercepted. Run from `web`:

```sh
node tools/larvik/capture.mjs
```

These are fictional people and amounts (stored in øre), never production data.
