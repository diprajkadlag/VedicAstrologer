# Vedic Celestial Visualizer

A complete, responsive Next.js application that combines an interactive
geocentric WebGL sky with Lahiri-sidereal Jyotish charts and rule-based Vedic
astrology analysis.

## Included features

- precise birth data entry with server-side OpenStreetMap place search;
- coordinate-to-IANA-timezone lookup and historical civil-time resolution;
- apparent geocentric planetary positions with Lahiri ayanamsa;
- Earth-centered Three.js scene with orbit, pan, zoom, zodiac band, Lagna,
  planetary paths, all 27 Nakshatras, and selectable grahas;
- enlarged responsive celestial framing with a native fullscreen mode;
- persistent English, हिन्दी, and मराठी interfaces;
- persistent dark and light themes (the space canvas intentionally stays dark);
- interactive North Indian diamond and South Indian fixed-sign Rasi charts;
- synchronized planet and house selection across the visualizations;
- a playable time scrubber with day, month, year, and decade windows;
- core placements, detailed planetary positions, all twelve Bhava readings,
  all 27 Nakshatra placements, and balanced Lagna/Chandra synthesis;
- proportional Vimshottari Mahadasha and Antardasha timelines;
- clickable Jyotish definitions, expanded Antardasha combinations, and
  Rasi/lord/occupant analysis for every Bhava;
- an interactive 22-term guide, nine graha profiles, and all 108
  graha-in-Bhava educational combinations;
- a structural chart-consistency audit and a transparent methodology/limits
  page that separates calculation from traditional interpretation;
- daily/monthly Gochara views with inspectable rule contributions;
- a local AI Astrologer prompt workspace with five presets, custom questions,
  privacy disclosure, and a calculated chart/context preview.
- Sanskrit Rasi labels throughout the interface and generated transit/AI data
  (Mesha through Meena); Western sign identifiers remain internal only.

## Transit and AI-assistant workspace

The Daily/Monthly Horoscope and AI Astrologer features are available as
localized analysis tabs. No external LLM call is made: the assistant validates
the question, builds a deterministic context, shows the prepared prompt, and lets
the user copy it for a model of their choice.

- `lib/transits.ts` calculates a selected date's Lahiri transit chart, houses
  from natal Lagna and Janma Rasi, daily Moon focus, monthly Sun/Mercury themes,
  bounded explainable scores, and Saturn/Jupiter notices.
- `lib/aiPromptBuilder.ts` creates a JSON-safe natal/Dasha/transit context and
  deterministic role-separated messages with anti-fabrication,
  anti-confirmation-bias, uncertainty, and selected-language instructions.

Core usage:

```ts
const transits = calculateTransitAnalysis({ natalChart, asOf });
const context = buildAstrologyContext({
  chart: natalChart,
  birthInstant,
  asOf,
  transits,
});
const prompt = buildAiAstrologerPrompt({ context, question });
// Pass prompt.system with the API's system role and prompt.user with its user role.
```

## Requirements

- Node.js 20.9 or newer
- npm 11 or newer
- a modern browser with WebGL for the 3D scene

The charts and analysis remain usable when WebGL is unavailable.

### If the 3D cosmos reports that WebGL is disabled

The app checks graphics support before mounting Three.js and shows a safe
fallback instead of crashing. To restore the 3D scene:

1. Enable **Use hardware acceleration when available** in the browser's system
   settings and fully restart the browser.
2. In Chrome or Edge, inspect `chrome://gpu` or `edge://gpu`; WebGL should not
   be listed as disabled.
3. Update the graphics driver and make sure the browser was not started with
   `--disable-gpu`. Restricted remote-desktop, virtual-machine, or managed
   environments may require an administrator to permit WebGL.
4. Return to the app and press **Retry WebGL**.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. On Windows, if PowerShell blocks `npm.ps1`, run
`npm.cmd run dev` instead. A terminal opened before Node.js was installed may
need to be closed and reopened to receive the updated `PATH`.

Production mode:

```bash
npm run build
npm run start
```

## Using the application

1. Enter the name, gender, birth date, and time including seconds.
2. Enter a city and country, press Search, and select the correct result.
3. Confirm the detected IANA timezone and generate the horoscope.
4. Drag or zoom the celestial sphere and select a planet for its placement.
5. Use the time navigator to recalculate the displayed sky and Rasi chart.
6. Toggle the North/South chart style and explore the nine analysis tabs.
7. Use **Gochara** to select a transit date, **Learn Jyotish** for the
   interactive glossary/explorer, and **Method & limits** to inspect the audit.
8. The **AI Astrologer** tab prepares and previews a prompt locally; it does
   not send birth data to an external service.

The interpretation dashboard remains anchored to the natal chart. The time
navigator changes the displayed astronomical sky and 2D chart, while the Dasha
tab reports the period active at the time the horoscope was generated.

## Place-search configuration

Development works with the defaults. For deployment, copy `.env.example` to
`.env.local` and configure an identifying user agent with real contact details:

```bash
NOMINATIM_USER_AGENT="VedicAstrologer/0.1 (contact: you@example.com)"
```

The form searches only when the user submits a place query. The public
Nominatim service forbids client-side autocomplete and requires strict rate
limiting, so the app uses a server route with throttling and cache headers.
Production deployments with meaningful traffic should use a dedicated provider
or self-host Nominatim.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Architecture

- `lib/astro/ephemeris.ts`: planets, nodes, Lagna, houses, Rasis, Nakshatras;
- `lib/astro/civil-time.ts`: IANA civil-time validation and DST resolution;
- `lib/astro/interpretations.ts`: analysis rules and Vimshottari periods;
- `lib/astro/education.ts`: three-language terms, grahas, Bhavas, and 108
  educational placement combinations;
- `lib/astro/analysisAudit.ts`: deterministic internal chart checks;
- `lib/transits.ts`: Gochara calculations and disclosed score rules;
- `lib/aiPromptBuilder.ts`: validated chart context and safe prompt assembly;
- `components/3d/`: WebGL celestial sphere, planets, and Nakshatras;
- `components/chart/`: North and South Indian SVG charts;
- `components/analysis/`: the tabbed dashboard, guide, and methodology view;
- `components/dashboard/`: Rasi workspace, Gochara, and AI prompt workspace;
- `components/ui/BirthForm.tsx`: birth form and place selection;
- `components/ui/TimeNavigator.tsx`: simulated-time controls.

## Calculation conventions

`calculateVedicChart` uses these explicit conventions:

- apparent, geocentric Sun/Moon/planet coordinates from Astronomy Engine;
- true ecliptic and equinox of date for tropical planetary coordinates;
- Lahiri (Indian Astronomical Ephemeris / IAU 1976) sidereal correction,
  including nutation to match the true-equinox frame;
- mean Rahu and Ketu, always 180 degrees apart;
- an eastern Ascendant and whole-sign Jyotish houses;
- all 12 Rasis and 27 Nakshatras with their lords and Padas 1-4;
- sampled apparent-geocentric trails centered on the displayed instant;
- Vimshottari timing based on calculated Moon progress through the birth Nakshatra,
  using a documented 365.25-day year convention.

The birth form resolves civil time through the selected historical IANA time
zone before calculation. Ambiguous daylight-saving folds require a choice, and
nonexistent gap times are rejected.

The approximately one-arcminute target belongs to the upstream Astronomy
Engine. This app's custom Lahiri-style conversion has not been independently
certified against Swiss Ephemeris. Placements close to a Rasi, Nakshatra, or
Pada boundary should be treated as uncertain; motion close to zero is
separately sensitive around a station. The in-app audit verifies internal
software consistency, not predictive validity. Jyotish interpretations and
Gochara scores are symbolic reflection material, not scientific personality
assessment, probabilities, guaranteed events, or consequential advice.
The small Nakshatra asterisms in the WebGL scene are illustrative mansion
markers rather than an IAU star-catalog rendering.
