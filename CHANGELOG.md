# Changelog

This changelog records portfolio milestones for the application. Version 0.1.0 is
an initial, test-backed release candidate, not a claim of production or
professional astrological certification.

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
- English, Hindi, and Marathi interfaces, Sanskrit-derived Rasi and Graha names,
  and light and dark themes.
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
