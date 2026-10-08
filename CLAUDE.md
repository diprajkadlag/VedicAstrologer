# CLAUDE.md — working on the Vedic Celestial Visualizer

Read this before changing code. It replaces exploring the repo, which matters most in
cloud sessions where every token is paid from a limited credit.

## What the app is

- Next.js 16 (App Router), React 19, TypeScript 6, Tailwind 4, Three.js through React
  Three Fiber, astronomy-engine, React PDF.
- Everything runs in the browser. GitHub Pages serves a static export
  (`STATIC_EXPORT=1`, see `next.config.ts`). Birth data never leaves the device:
  **do not add network calls.**
- Four interface languages: English `en`, Hindi `hi`, Marathi `mr`, German `de`.

## Commands

| Command | What it does | Time (measured 8 Oct 2026) |
|---|---|---|
| `npm ci` | install | ~15 s |
| `npm run typecheck` | `tsc --noEmit` | ~10 s |
| `npm run lint` | ESLint | ~10 s |
| `npm test` | Vitest: 186 tests in 21 files | ~15 s |
| `npm run build` | production build | ~20 s |
| `npm run e2e` | Playwright phone checks (builds and serves on port 3737) | a few minutes |

- Pipe long output through `tail -n 30`. Run one file with `npx vitest run path/to/file.test.ts`.
- E2E needs `npx playwright install chromium` first. In a cloud session that download
  may be blocked by the network policy. If it is, skip local e2e: CI runs it on every
  pull request ("Mobile browser checks") and uploads screenshots as an artifact.

## Map of the code

- `components/VedicAstrologyApp.tsx`: the page. Owns the state: `natalChart`,
  `displayChart` (chart for the time-navigator instant), `selectedInstant`,
  `selectedPlanetId`, `selectedHouse`.
- `components/ui/TimeNavigator.tsx`: time slider (± day/month/year/decade around birth), play/pause.
- `components/dashboard/ChartWorkspace.tsx`: the chart card. North/South switch plus a side
  panel for the selected house or planet.
- `components/chart/`: `NorthIndianChart.tsx` and `SouthIndianChart.tsx`. Both take
  `VedicChartRendererProps` from `types.ts` and draw into a 400 × 400 SVG viewBox.
  North house polygons are `NORTH_INDIAN_HOUSE_SHAPES`. South cells are 100 × 100,
  laid out by `SOUTH_INDIAN_SIGN_CELLS` in `chart-utils.ts`, which also holds the planet
  colours (`PLANET_PRESENTATION`). Planet pills are `ChartPlanetMark.tsx`.
- `components/analysis/InterpretationPanel.tsx` (large): analysis tabs (`TAB_DEFINITIONS`,
  per-language `COPY`), the positions table (`PositionsTab`), and the twelve-house reading
  (`HousesTab`, `HouseCard`, exported as `TwelveHouseSummary`).
- `components/dashboard/HoroscopeTab.tsx` with `lib/transits.ts`: the Transits tab.
- `lib/astro/ephemeris.ts`: the engine. `calculateVedicChart(input)` returns a `VedicChart`
  (Lahiri sidereal, whole-sign houses, mean nodes) in well under 1 ms (0.25–0.35 ms measured).
  Also exports `getRasi`,
  `getNakshatra`, `normalizeDegrees`, and the `RASIS` / `NAKSHATRAS` arrays.
- `lib/astro/localizedNames.ts`: locale-native planet, sign and nakshatra names.
- `lib/i18n.ts`: `defineMessages`, `formatMessage`, `INTL_LOCALES`.
- `lib/geocoding/browser.ts`: `findTimeZonesInBrowser(lat, lon)`.
- Texts that say what the app does *not* calculate: `components/analysis/MethodologyTab.tsx`,
  `lib/astro/education.ts` (including each entry's `calculationStatus`, which drives the
  Guide tab's badge), `lib/astro/glossary.ts`, `lib/astro/analysisAudit.ts`,
  `lib/export/kundaliSummary.ts` (PDF), and section 13 of `docs/ARCHITECTURE.md`.
- Tests sit next to the code (`*.test.ts(x)`). Playwright specs live in `e2e/`.
  `generateChart(page)` in `e2e/helpers.ts` makes the standard chart: Test Person,
  15 May 1990 10:30 IST (05:00 UTC), Pune 18.5204 N 73.8567 E, `Asia/Kolkata`.
  `expectNoHorizontalOverflow(page)` is the overflow check.

## Rules

1. **Four languages, always.** Every visible string exists in en, hi, mr and de through
   `defineMessages`, and TypeScript rejects a missing language. Put new strings in a
   `defineMessages` block in the feature's own file. Don't add keys to the big shared `COPY`
   objects unless the task says so, because parallel sessions conflict there. When a task
   gives the wording, use it as given.
2. **Locale-native wording.** English and German use plain words for generic terms: "house",
   "lunar mansion", "North Node". Proper names stay names: nakshatra and tithi names,
   "Sade Sati", "Rahu Kaal". Sanskrit generic terms appear only in Hindi and Marathi. Use
   `localizedNames.ts` for planets, signs and nakshatras. Marathi differs from Hindi
   (मंगळ, राहू, केतू, शुद्ध/वद्य), so copy from existing tables rather than transliterating.
3. **Calculation stays separate from display.** Calculations are pure functions in `lib/`
   with unit tests, including the known-answer tests the task gives. The task values were
   cross-checked against Swiss Ephemeris 2.10.03 (Lahiri) and, for the almanac, a published
   panchang. Use the tolerances stated.
4. **Keep the honesty texts true.** When a task adds a calculation that those texts say is
   missing, update them in all four languages. Tests may pin those texts; update the tests
   on purpose, and never by loosening them.
5. **Both chart styles.** A chart feature must work in the North and the South Indian
   renderer at all three densities (`comfortable`, `compact`, `tight`).
6. **Phone first.** The e2e checks require no horizontal overflow at 320 px, 16 px form
   fields, controls of at least 24 px, and primary controls of at least 40 px. New
   controls must pass them.
7. **Themes.** Light is the default and dark is available. Reuse the classes and CSS
   variables of the surrounding component (`var(--foreground)`, `--muted`, `--surface`,
   `--border`, `--accent`).
8. **Component tests** run in Node with `renderToStaticMarkup` (see
   `components/analysis/TwelveHouseSummary.test.tsx`). The preferences provider renders
   English there, so give new components a `locale` prop where practical so all four
   languages can be tested.
9. **Hook lint rules.** ESLint (Next config with the React hooks v7 rules) rejects two
   things: `setState` inside `useEffect` (`react-hooks/set-state-in-effect`), and impure
   calls during render such as `Date.now()`, `new Date()` or `Math.random()`
   (`react-hooks/purity`). Use these patterns instead:
   - "Running in the browser yet?": `useSyncExternalStore(subscribeToNothing, () => true, () => false)`,
     as in `components/ui/AstroTerm.tsx`.
   - Change state in event handlers.
   - Derive values with `useMemo`.
   - Reset local state by giving the component a `key` that changes.
   - Effects may still call non-state side effects, such as `speechSynthesis.cancel()` in a cleanup.
10. **Selectors the e2e suite relies on.** The North/South control must stay the first
    `role="group"` in the chart card: `chart-legibility.spec.ts` and `screenshots.spec.ts`
    pick South with `chart.getByRole("group").getByRole("button").nth(1)`. Put new button
    groups after it. Buttons inside a chart-card `[role="group"]`, and labelled buttons in the
    time navigator, must be at least 40 × 40 px (`e2e/touch-targets.spec.ts`).

## Working in a cloud session

- Start with `npm ci`. Read the task file, then only the files it names. In large files
  (InterpretationPanel 1.9k lines, CelestialSphere 1.7k, education.ts 1.7k, BirthForm 1.2k)
  use `rg -n` and read just the ranges you need.
- Do what the task says. No refactors, reformatting, dependency upgrades or extra features.
  If something is unclear, take the smallest reasonable choice and say so in the pull request.
- Don't edit `CHANGELOG.md`: parallel sessions would conflict there. Describe the change in
  the pull request instead.
- To finish: typecheck, lint, test and build must all pass. Commit, push the branch, and open
  a pull request with `gh pr create`. Use the task title as the PR title. In the body, say
  what changed, how it was checked, and anything left open. Don't merge.
