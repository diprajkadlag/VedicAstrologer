# 03 — Transits over the birth chart, with a Now button

**Model:** Opus 5.5 · **Estimate:** $8–12 · **Start after 02 is merged.** Read `CLAUDE.md` first.

## What the user gets

- One tap on **Now** shows today's planets placed in the birth houses, next to the birth
  positions.
- Moving the time slider, or pressing the existing **Play**, makes the transiting planets
  walk through the houses.
- Tapping a planet compares where it was at birth with where it is at the selected time.

## Why the time navigator needs a change first

`components/ui/TimeNavigator.tsx` can only move ± its window around **birth**, and the
largest window is a decade (`maxOffsetMinutes`). Anyone older than about 10 can't reach
today. So, first:

## 1. TimeNavigator: anchor + Now

- Add local state `anchor: Date`, initially the birth instant. Change it **only in click
  handlers**, never in an effect (CLAUDE.md rule 9).
- In `VedicAstrologyApp.tsx`, give `<TimeNavigator>` a `key` built from the birth instant,
  so a newly generated chart starts with a fresh anchor.
- The window buttons and the slider work in offsets from the anchor. The play timer steps
  forward from the selected instant and stops at the window's end, as now.
- **Now** button:
  - placed in the window-pill row (next to ± Day … ± Decade). The transport row has no room
    left at 320 px;
  - at least 40 × 40 px; it has an `aria-label`, so the touch-target spec checks both
    dimensions;
  - `data-testid="time-now"`;
  - its handler sets `anchor = new Date()` and calls `onChange(anchor)`.
- The existing return-to-birth button sets `anchor = birthInstant` and calls `onChange(birthInstant)`.
- The rail's centre label reads **Birth** or **Now**, depending on the anchor.
- The offset caption stays relative to birth (e.g. "36.4 years after birth"); that already
  works for any distance.
- Keep every existing e2e spec green: the return control on phones, touch targets and no overflow.

## 2. Calculation — new `lib/astro/transitOverlay.ts` and test

```ts
export interface TransitPlacement {
  id: GrahaId; signIndex: number; siderealLongitudeDeg: number; retrograde: boolean;
  houseFromAscendant: HouseNumber; // ((sign − natal ascendant sign + 12) % 12) + 1
  houseFromMoon: HouseNumber;      // ((sign − natal Moon sign + 12) % 12) + 1
}
export function placeTransits(natal: VedicChart, transit: VedicChart): TransitPlacement[];
```

**Known-answer tests**
- Synthetic natal chart with a Cancer ascendant (sign 3) and the Moon in Sagittarius (8):
  - Saturn in Pisces (11) → house 9 from the ascendant, house 4 from the Moon.
  - Aries (0) → houses 10 and 5.
  - Cancer (3) → houses 1 and 8.
- Engine check against the standard Test Person chart (ascendant Cancer, Moon Sagittarius),
  with transit charts from `calculateVedicChart` at Pune. These dates were cross-checked
  with Swiss Ephemeris 2.10.03.
  - `2025-04-15T00:00:00Z`: Saturn in Pisces (11) → houses 9 / 4.
  - `2025-03-28T00:00:00Z`: Saturn in Aquarius (10) → houses 8 / 3. Saturn entered sidereal
    Pisces on 29 Mar 2025 at about 16:14 UTC (Swiss Ephemeris) or 16:37 UTC (this engine),
    so don't test closer than a day to it.
  - `2025-05-20T00:00:00Z`: Jupiter in Gemini (2) → houses 12 / 7.
  - `2025-05-10T00:00:00Z`: Jupiter in Taurus (1) → houses 11 / 6. Jupiter entered Gemini
    on 14 May 2025 at about 17:06–17:09 UTC.

## 3. Renderers: overlay marks

- In `VedicChartRendererProps`, add optional `overlayPlanets?: readonly GrahaPosition[]` and
  `onSelectOverlayPlanet?: (id: GrahaId) => void`. Overlay bodies are drawn in the house of
  *this* chart whose sign they occupy, so with the natal chart as `chart` they land in the
  birth houses. Place them with `getHouseForSign(chart, planet.sign.index)`. Never use
  `planet.house`: that field is counted from the transit moment's own ascendant.
- Add `variant?: "natal" | "overlay"` to `ChartPlanetMark`. The overlay variant has a
  transparent fill and a dashed stroke in the planet colour, the same text, and
  `data-testid="transit-mark"`. Its accessible label is `transitMarkAria`.
- Overlay marks come after the natal marks in the same house's slot sequence, so both renderers'
  existing slot layout and density wrapping handle crowding. Check a crowded house at the
  `tight` density on a 320 px phone. If a house can't fit everything, shrink overlay marks
  (scale 0.85) before overlapping.

## 4. Card behaviour

**`VedicAstrologyApp.tsx`** (two small changes)
- Pass `natalChart` to `ChartWorkspace` as a new prop.
- `handlePlanetSelection` (around lines 494–502) sets `selectedHouse` from `displayChart`,
  whose houses count from the transit moment's own ascendant. In overlay mode that
  highlights the wrong birth house. Give it an optional second argument,
  `handlePlanetSelection(planetId, house?)`, and use `house` when it's given.
  `ChartWorkspace` passes it in overlay mode:
  - a birth mark → that planet's house in `natalChart`;
  - a transit mark → `getHouseForSign(natalChart, planet.sign.index).number`.

**`ChartWorkspace.tsx`.** When the selected instant is **not** the birth moment, show a view
switch. It's a `role="group"` placed after the North/South group, with buttons at least
40 × 40 px.
- **Transits over birth chart** (default): the renderer gets `natalChart` as `chart` and
  `displayChart.planets` as `overlayPlanets`. Use the overlay heading, a two-item legend
  (solid = birth, dashed = selected time), and the `overlayNote`.
- **Sky at this moment**: today's behaviour, showing `displayChart` alone.

How the switches from tasks 01 and 02 behave:
- Overlay mode always draws the **D1** birth chart with **no aspect lines**, and hides the
  D9 and aspects switches.
- Their earlier choices are kept in state and come back when the user leaves overlay mode
  or returns to the birth moment.

Side panel in overlay mode:
- **Selected planet** (birth or transit mark):
  - "At birth: Capricorn · house 7";
  - "At the selected time: Pisces · house 9 from the birth Ascendant · house 4 from the birth Moon";
  - plus the retrograde badge where it applies.
- **Selected house** (birth numbering): two short lists, the birth residents and the planets
  in that house's sign at the selected time.

**Performance.** Memoise `placeTransits(natalChart, displayChart)` so Play only recomputes
on instant changes. The engine takes well under 1 ms per chart, so no extra animation code
is needed.

## 5. Text — use as given

| key | en | hi | mr | de |
|---|---|---|---|---|
| now | Now | अभी | आता | Jetzt |
| nowAria | Jump to the current moment | वर्तमान क्षण पर जाएँ | सध्याच्या क्षणावर जा | Zum aktuellen Zeitpunkt springen |
| railNow | Now | अभी | आता | Jetzt |
| viewAria | Chart view | कुंडली दृश्य | कुंडली दृश्य | Ansicht |
| overlay | Transits over birth chart | जन्म कुंडली पर गोचर | जन्मकुंडलीवर गोचर | Transite im Geburtshoroskop |
| sky | Sky at this moment | इस क्षण का आकाश | या क्षणीचे आकाश | Himmel zu diesem Zeitpunkt |
| overlayTitle | Transits over your birth chart | आपकी जन्म कुंडली पर गोचर | तुमच्या जन्मकुंडलीवर गोचर | Transite in deinem Geburtshoroskop |
| legendBirth | Birth positions | जन्म के समय की स्थिति | जन्मवेळेची स्थिती | Positionen bei der Geburt |
| legendTransit | Positions at the selected time | चुने गए समय की स्थिति | निवडलेल्या वेळेची स्थिती | Positionen zum gewählten Zeitpunkt |
| atBirth | At birth | जन्म के समय | जन्मवेळी | Bei der Geburt |
| atSelected | At the selected time | चुने गए समय पर | निवडलेल्या वेळी | Zum gewählten Zeitpunkt |
| fromAsc | house {house} from the birth Ascendant | जन्म लग्न से भाव {house} | जन्म लग्नापासून भाव {house} | Haus {house} vom Geburtsaszendenten |
| fromMoon | house {house} from the birth Moon | जन्म चन्द्र से भाव {house} | जन्म चंद्रापासून भाव {house} | Haus {house} vom Geburtsmond |
| transitMarkAria | {planet} at the selected time: {sign}, house {house} from the birth Ascendant | {planet} चुने गए समय पर: {sign}, जन्म लग्न से भाव {house} | {planet} निवडलेल्या वेळी: {sign}, जन्म लग्नापासून भाव {house} | {planet} zum gewählten Zeitpunkt: {sign}, Haus {house} vom Geburtsaszendenten |

**overlayNote**
- en: Planets at the selected time, placed in your birth houses (whole-sign, counted from the birth Ascendant). For reflection, not prediction.
- hi: चुने गए समय के ग्रह, आपके जन्म भावों में (पूर्ण-राशि, जन्म लग्न से गिने गए)। चिंतन के लिए, भविष्यवाणी नहीं।
- mr: निवडलेल्या वेळेचे ग्रह, तुमच्या जन्मभावांत (पूर्ण-राशी, जन्म लग्नापासून मोजलेले). चिंतनासाठी, भविष्यवाणी नाही.
- de: Himmelskörper zum gewählten Zeitpunkt, eingeordnet in deine Geburtshäuser (Ganzzeichen, gezählt vom Geburtsaszendenten). Zum Nachdenken, keine Vorhersage.

## 6. Browser check

Add `e2e/transits-overlay.spec.ts`:
1. `generateChart(page)`.
2. Click `time-now`. The view switch is visible and the overlay is active; expect 9
   `transit-mark` elements in the chart.
3. Switch to **Sky at this moment** and expect 0 transit marks.
4. Switch back, then press Play for about 2 s and expect the **date-time line** to change.
   The offset caption shows years to two decimals, so a few hourly steps don't change it.
5. Run `expectNoHorizontalOverflow(page)` at 320 px.
6. Save screenshots `chart-transits-north.png` and `chart-transits-south.png`.

Existing e2e specs must stay green.

## Done when

- [ ] `transitOverlay.test.ts` passes, including the 2025 Saturn and Jupiter dates.
- [ ] Now / Birth anchors work; Play animates the overlay; both chart styles; all densities; four languages.
- [ ] D9 and aspect switches hidden in overlay mode; the 3D view is unchanged.
- [ ] typecheck, lint, test and build pass; e2e passes locally or in CI.
- [ ] Pull request opened.

## Out of scope

Transit aspects, scores or alerts on the chart; transits in D9; a date-picker input
(the slider plus Now covers it).
