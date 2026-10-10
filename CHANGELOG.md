# Changelog

This changelog records portfolio milestones for the application. Version 0.1.0 is
an initial, test-backed release candidate, not a claim of production or
professional astrological certification.

## [Unreleased] - 2026-10-09

### Life timeline

- A new section after the time navigator puts the natal Vimshottari periods
  and 100 years of transits on one time axis, from birth onwards. It opens at
  today and zooms by years, months, or days with pinch, ctrl+wheel, buttons,
  or keyboard; a sideways drag moves it and a vertical swipe still scrolls the
  page.
- Period rows show up to four Vimshottari levels: two in the years view,
  three in the months view and four in the days view. The two finer levels
  use the same
  subdivision function as the Dashas tab, so all dates agree. A haze at every
  boundary shows how far a few minutes of birth-time error move it (about
  7 days per 5 minutes for the e2e test chart); a note gives the figure for
  each chart and warns when the birth time is close to a change of the first
  major period.
- Every body's sidereal longitude is drawn against time in twelve house
  bands, counted from the Ascendant or the birth Moon, dashed while
  retrograde, with exact stations. The years view shows Saturn, Jupiter and
  the nodes, the months view adds the Sun, Mars, Venus and Mercury, and the
  days view adds the Moon.
- Friction and expansion bands mark the three Sade Sati phases, Saturn in the
  8th, 4th or 10th from the birth Moon, node friction, retrograde periods,
  and Jupiter in favourable houses. Each band states whether its rule is
  classical, modern, or this app's choice.
- Ashtakavarga is now calculated (tables checked against BPHS, C. S. Patel and
  B. V. Raman; a test reproduces Raman's Standard Horoscope). A strength strip
  shows the points of the sign a highlighted body transits. Sixfold strength
  (Shadbala) and divisional charts other than the ninth-division chart are
  still not calculated.
- Four symbolic theme curves (emotional resilience, career momentum,
  relationship harmony, physical vitality) start at 50 and add named
  contributions from classical transit, obstruction (Vedha), Ashtakavarga and
  period-ruler rules. Every point is listed under "Why", a tap on a step
  shows what changed, and fixed notes say they do not measure health, mood
  or outcomes.
- The timeline's playhead and the time navigator share one instant, so
  scrubbing moves the 3D cosmos and the charts. The time navigator gained a
  100-year window and widens itself for distant dates.
- An "on this date" card shows the period stack, body positions with houses
  from the Ascendant and the birth Moon, curve values, active patterns and a
  short summary in the interface language. An inspector explains any tapped
  period, band, line, station, curve value or change. It opens as a bottom
  sheet on phones and tablets and docks above the card from 1024 px, where it
  covers no control.
- Personal milestones and plans can be added, searched and jumped to. They
  stay in memory unless the reader turns on "Keep on this device"; turning it
  off deletes the saved copy.
- A table view lists the window's changes as text, including the curve
  changes the plot marks. The plot has a summary for screen readers, and
  every new string exists in English, Hindi, Marathi and German.

### Engineering

- 100 years of stations and sign ingresses are calculated in a Web Worker
  (main-thread fallback) with the chart's own longitude and speed functions;
  tests compare them with published Lahiri dates and a brute-force scan.
- CI and the Pages workflow fail if the worker chunk is missing from the
  build. `tsconfig.json` excludes `out/`, where Turbopack also copies the
  worker's source file.
- Playwright covers the timeline on all three phone profiles; the existing
  suites check its touch targets and overflow too.
- Methodology disclosures gained two limitations: the theme-curve method and
  the precision of the finer periods. The scope note no longer lists
  Ashtakavarga as uncalculated.
- Fable 5.1 reviewed the concept, the rules, the engine, the interface and
  the translations. Its findings were fixed before release. A station in the
  first half sample step of the range was missed (about 6 % of random births
  in the review's probe). Curve steps now also change where a transit ends.
  The sky and the timeline tag each change of the shared instant with its
  source and the number of its request, so neither a fast scrub nor the
  navigator's play loop can pull the cursor away from the instant that the
  sky shows. The scrub zones wait for a horizontal movement, so a vertical
  swipe scrolls the page from anywhere on the plot, and a second finger
  during a scrub is ignored. Escape that closes a dialog no longer also
  closes the docked inspector. A life event can be placed on the first and
  the last calendar date of the range. A time change made just before
  "Generate" can no longer bring back the previous chart.
- An independent evaluator, written from the rule specification only, checks
  the theme curves of the app on 1,200 random skies.

## [Unreleased] - 2026-09-07

### Reading experience

- The house-by-house reading now closes the page instead of opening it. The
  completion header, chart tools, timing and analysis come first, so the long
  reading is something a visitor scrolls to rather than scrolls past.
- The report ends the same way: calculated placements and the method notes
  come first, then the twelve houses.
- Each house card is now a short, scannable summary in plain language: what
  the house covers, one constructive line, one caution line, and a line per
  resident body naming what it stands for. The reading-sequence chips, the
  three sub-panels, the long-form guidance and the per-house repetition of
  the "not a prediction" note are gone; that caveat is now stated once above
  the twelve cards. The downloadable report still carries the long-form
  guidance.

### Mobile usability

- The birth-entry card no longer overflows the screen. As a grid item it kept
  the browser's intrinsic width for the place-search field as a floor, holding
  the card at 418 px, so on any phone narrower than that the form, its labels,
  and the Generate button were cut off at the right edge with no way to scroll
  to them. Grid children may now shrink.
- The page shell no longer clips horizontal overflow at all, so a layout fault
  is visible and reachable instead of silently cropped.

- The North and South Indian charts pick one of three densities from the
  measured panel width: labels and planet marks scale up below 360 px and
  again below 300 px, each mark gains an invisible tap margin, crowded houses
  wrap into fewer columns, and the chart card goes edge to edge under 400 px
  so the diagram keeps the page gutters. House geometry is unchanged. The
  smallest label on a 320 px phone went from about 4.7 px to 8.4 px.
- On touch devices the 3D cosmos starts locked behind a "Touch to explore"
  overlay so a swipe scrolls the page; a Lock control hands scrolling back.
  The panel is shorter than a phone screen, the selected-planet readout sits
  above the toolbar, and the toolbar clears the iOS home indicator.
- Text fields, selects, and text areas render at 16 px on coarse pointers,
  which stops iOS Safari from zooming into a focused field; the viewport
  still allows pinch zoom.
- The time navigator keeps its return-to-birth control on phones, its slider
  has a 44 px touch band, and the past/birth/future rail follows the slider.
- Wide tables fade at the trailing edge and pin their first column; analysis
  and showcase tab strips centre the active tab and fade at the edge.
- The page shell no longer clips horizontal overflow and uses dynamic
  viewport height; a web app manifest and Apple touch icon allow
  add-to-home-screen.
- The transit view no longer recomputes the ephemeris on every render when the
  reference instant has not changed.
- The web app manifest declares 192 px and 512 px icons with an explicit
  "any" purpose, which Chrome on Android requires before offering to install.
- Playwright checks at 320 px, iPhone SE, and Pixel 7 widths run in CI. The
  overflow check measures every painted element rather than the document's
  scroll width, which cannot see content that an ancestor clips: no
  horizontal overflow, 16 px form fields, a 24 px control floor, 40 px primary
  controls, the cosmos touch round-trip, chart label legibility and label
  collisions, and per-section screenshots.

## [Unreleased] - 2026-08-18

### Added

- German as a fourth application language alongside English, Hindi, and
  Marathi, including the chart workspace, analysis, transits, AI prompt
  preparation, educational guide, and recovery states.
- A compact single-page birth-data form with all required fields visible,
  inline validation, optional seconds-level precision, place/timezone
  resolution, and one final Generate action.
- A keyboard-operable feature showcase covering the 3D cosmos, traditional
  charts, analysis, time navigation, and birth-chart export, led by optimized
  promotional WebP artwork for the cosmos, charts, and report.
- Client-side birth-chart PDF generation in an independently selected language,
  with bundled Noto Sans/Devanagari fonts, calculated natal placements,
  Vimshottari periods, methodology, limitations, and three opening pages of
  balanced conclusions for all twelve houses. Each house receives exactly
  three color-coded, personalized sentences: significance, chart-specific
  context, and balanced reflection.

### Changed

- Light is now the first-visit default theme; the dark theme remains available
  and an explicit user choice is persisted.
- User-facing terminology is locale-native: English uses familiar English
  planetary, zodiac, house, lunar-mansion, period, and transit terms; German
  uses German terms and zodiac names such as *Löwe*, *Sonne*, and *Mond*;
  Hindi and Marathi use native Devanagari.
- Stable internal identifiers and transliterations remain unchanged for
  calculation and serialization, then pass through centralized localization
  before appearing in the interface or PDF. The AI projection emits
  astronomical presentation references without parallel internal name IDs.
- Localization lookups now retain a safe English fallback during partial
  development updates instead of crashing on a newly selected locale.
- English is explicitly encoded and regression-tested as the first-visit
  language while valid returning-user language choices remain persisted.
- The Geocentric Cosmos now uses a complete light-theme palette across its
  WebGL scene, controls, fullscreen view, and no-WebGL recovery state.
- Entering or leaving fullscreen now preserves the active WebGL renderer,
  settles canvas sizing over the viewport transition, and automatically
  recovers transient context loss with bounded retries before showing the
  manual fallback.
- Birth entry no longer uses a wizard or intermediate Continue actions. The
  complete form is submitted once, while civil-time and DST correctness gates
  remain in place.
- Generated results now begin with a prominent completion heading and the full
  twelve-house reading. Every house is visible without opening a disclosure;
  the time navigator, 3D cosmos, chart workspace, and remaining analysis tabs
  follow it.
- Constructive and cautionary house guidance now includes two practical,
  conditional sentences per house in all four languages. The PDF carries the
  same depth on four dedicated detail pages while preserving its concise
  three-sentence summary pages.
- A second, labeled global language selector remains visible with the generated
  chart and updates every application surface after submission. The separate
  PDF-language selector changes only the downloaded report.
- AI-facing presentation references emit only locale-native astronomical
  names. Stable internal name IDs remain in the calculation contract but are
  not included as parallel labels in the localized AI payload or preview.
- Portfolio documentation now distinguishes browser-local chart/PDF work,
  deployment-specific geocoding transport, deterministic calculations,
  traditional interpretation, and scientific evidence more explicitly.
- Localization and PDF tests now cover familiar English names, native German
  names, Devanagari labels, and stable multilingual PDF pagination.

### Responsibility boundary

- The PDF and interface summarize the application's declared calculations and
  symbolic Jyotish rules; they are not independently certified ephemeris
  reports, scientific predictions, diagnoses, or professional advice.
- German translation coverage does not change the underlying calculation
  conventions or remove boundary uncertainty.

## [0.1.0] - 2026-07-23

### Added

- A responsive Next.js, React, TypeScript, and Three.js application for exploring
  a geocentric sidereal birth chart and time-shifted planetary positions.
- Birth-data entry with place search, latitude and longitude resolution, IANA
  timezone handling, and historical daylight-saving-aware civil-time conversion.
- Lahiri-style sidereal longitude calculations for the Navagraha, Rasi,
  Nakshatra, Pada, whole-sign Bhava, Lagna, and a basic Vimshottari Dasha
  timeline.
- An interactive WebGL celestial sphere with orbit controls, responsive camera
  framing, fullscreen mode, Graha selection, ecliptic markers, trajectories, and
  illustrative Nakshatra asterisms.
- Interactive North Indian and South Indian Rasi chart renderers.
- Jyotish analysis views for core placements, Graha positions, Bhavas,
  Nakshatras, Dashas, methodology, and an in-app learning guide.
- Daily and monthly Gochara summaries relative to Janma Rasi and Lagna,
  including editorial focus scores and notices for Guru and Shani transits.
- An AI Astrologer workspace that builds a structured chart, Dasha, and transit
  context plus an expert prompt for user questions and preset analyses.
- English, Hindi, and Marathi interfaces, the initial Sanskrit-derived naming
  layer later superseded by locale-native presentation, and light/dark themes.
- Interactive explanations for commonly used Jyotish terms, Graha
  significations, Bhava meanings, and the way Graha themes are traditionally
  interpreted across Bhavas.

### Validation and quality

- TypeScript, ESLint, Vitest, and production-build gates are available as
  project scripts and now run automatically for pushes and pull requests.
- At the milestone cut, the local validation run passed 142 tests across 17 test
  files, along with TypeScript, ESLint, and the optimized Next.js build.
- Automated coverage includes ephemeris boundaries, civil-time conversion,
  localization, charts, geocoding normalization, transits, prompt building,
  camera framing, WebGL capability checks, and analysis-methodology auditing.
- The analysis UI distinguishes calculated observations, traditional
  interpretations, editorial synthesis, and omitted factors so that confidence
  is not overstated.

### Known limitations

- Jyotish interpretations are cultural and symbolic. They are not
  scientifically validated predictions and should not replace medical, legal,
  financial, mental-health, or safety advice.
- The Lahiri-style calculations are application-level approximations and have
  not yet been independently certified against Swiss Ephemeris or another
  authoritative reference dataset across a broad historical range.
- The current model uses whole-sign Bhavas, mean lunar nodes, and a simplified
  Vimshottari year convention. Results can differ from software using other
  ayanamsas, node models, house systems, or calendar conventions.
- Transit scores and generated themes are transparent editorial heuristics, not
  probabilities, guarantees, or measures of event likelihood.
- Shadbala, divisional charts such as Navamsha, classical Drishti, combustion,
  conjunction-orb rules, comprehensive Yoga detection, Ashtakavarga, and
  birth-time rectification are not included in the core synthesis.
- The AI Astrologer prepares local context and prompts; it does not currently
  send data to or stream responses from an external language model.
- Public Nominatim availability and usage policies can affect place search. The
  displayed Nakshatra star patterns are illustrative rather than an
  authoritative astronomical constellation catalogue.

## Next milestone

- Cross-check planetary, Lagna, Nakshatra-boundary, and Dasha fixtures against an
  independent Swiss Ephemeris or JPL-derived reference, documenting tolerances
  and boundary uncertainty.
- Add browser-level accessibility, responsive-layout, visual-regression, and
  WebGL performance tests.
- Add optional, privacy-explicit LLM streaming while keeping chart data local
  unless the user knowingly enables a provider.
- Introduce additional classical techniques only with documented source
  conventions, test fixtures, and clear separation between calculations and
  interpretive rules.
