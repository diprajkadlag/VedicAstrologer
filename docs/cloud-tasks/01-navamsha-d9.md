# 01 — Ninth-division chart (D9) with a D1/D9 switch

**Model:** Sonnet 5.5 · **Estimate:** $3–6 · **Read `CLAUDE.md` first.**

## What the user gets

The chart card gets a second switch: **Birth chart (D1) | Ninth-division chart (D9)**.
D9 draws the same North or South Indian chart from ninth-division (navamsha) signs.
Bodies that sit in the same sign in both charts get a badge, and the positions table
gets a D9 column.

## 1. Calculation — new `lib/astro/divisional.ts` and `lib/astro/divisional.test.ts`

- Every sign splits into nine parts of 3°20′ (360/108°). For sidereal longitude λ in [0, 360):
  `navamsaSignIndex(λ) = Math.floor(λ / (10 / 3)) % 12` (0 = Aries).
  This single formula already contains the classical counting rule: movable signs start
  from themselves, fixed signs from the 9th, dual signs from the 5th. Normalise with
  `normalizeDegrees`, and clamp the part index to 0…107 so floating error at 360° can't
  produce 108.
- Degree inside the D9 sign: `(λ mod (10/3)) × 9`, which gives 0–30°.
- `isVargottama(λ)`: D1 sign index equals D9 sign index.
- `calculateNavamsaChart(chart: VedicChart): VedicChart` returns a **new** chart:
  - ascendant sign = D9 sign of the ascendant;
  - each body's `sign` = its D9 sign (with the scaled degree);
  - `house` = whole-sign house counted from the D9 ascendant: `((sign − ascSign + 12) % 12) + 1`;
  - `houses` rebuilt like `buildHouses` in `ephemeris.ts` (12 entries with `planets`);
  - keep each body's `nakshatra`, speed, motion and retrograde flag from the birth chart.

  Don't change the `VedicChart` type.

## 2. Known-answer tests (all must pass)

1. **Pada link.** For every λ, `navamsaSignIndex(λ) === (nakshatra.index × 4 + nakshatra.pada − 1) % 12`,
   using the nakshatra from `getNakshatra(λ)`. In `ephemeris.ts` the nakshatra `index` is
   0-based and `pada` is 1-based.
   - Test the 1,000 midpoints λ = (i + 0.5) × 0.36, plus every 3°20′ boundary ± 1e-9.
   - Don't test exact boundaries. Floating-point error makes `getNakshatra` put, for example,
     180° in the previous quarter, which is not a bug in either function.
2. **Vargottama parts.** λ = 1° (Aries, part 1), 45° (Taurus 15°, part 5) and 89°
   (Gemini 29°, part 9) are vargottama. 4° (Aries, part 2) is not.
3. **Standard test chart** (Test Person, `1990-05-15T05:00:00Z`, Pune 18.5204 / 73.8567).
   Sign index 0 = Aries.

   | body | D1 sign | D9 sign | D9 house |
   |---|---|---|---|
   | Ascendant | 3 | 3 | 1 |
   | Sun | 1 | 9 | 7 |
   | Moon | 8 | 8 | 6 |
   | Mercury | 0 | 4 | 2 |
   | Venus | 11 | 8 | 6 |
   | Mars | 10 | 1 | 11 |
   | Jupiter | 2 | 10 | 8 |
   | Saturn | 9 | 9 | 7 |
   | North Node | 9 | 2 | 12 |
   | South Node | 3 | 8 | 6 |

   Vargottama: Ascendant, Moon and Saturn. These were cross-checked against Swiss
   Ephemeris 2.10.03 (Lahiri): every position agrees within 1.2″, and the nearest D9
   boundary is the Moon's, about 9.5′ away.

## 3. Interface

**`components/dashboard/ChartWorkspace.tsx`**
- Add a segmented control **D1 / D9**, styled like the North/South control (`role="group"`,
  `aria-pressed`, buttons at least 40 × 40 px).
  - It must come **after** the North/South group in the DOM; e2e specs click
    `getByRole("group").getByRole("button").nth(1)` to reach "South Indian".
  - On phones the two groups may wrap onto two lines, but nothing may overflow at 320 px.
- In D9:
  - pass `useMemo(() => calculateNavamsaChart(chart), [chart])` to the renderer;
  - use the `d9` text as the card heading and as the renderer's `ariaLabel`;
  - add the help line (text below) under the chart.
- Add an optional `division?: 1 | 9` prop to `VedicChartRendererProps` and pass it through.
  The South chart's centre caption (`lahiri: "D1 · LĀHIRI"` in all four languages in
  `SouthIndianChart.tsx`) must read **D9** when `division` is 9. Add a second key rather
  than string-replacing.
- Side panel in D9:
  - selected body: show its D9 sign, plus the badge if it is vargottama;
  - selected house: show the D9 house's sign and the bodies in it.
- House clicks in D9 stay inside the card. Keep a local `d9House` state and don't call
  `onSelectHouse`, because app-wide house selection means birth-chart houses. Planet
  selection stays shared (the ids are the same).
  - Clear `d9House` in the D1/D9 click handler, not in an effect (see CLAUDE.md rule 9).
- Add `data-testid="chart-division-d9"` on the D9 button.

**Positions table** (`rg -n "function PositionsTab" components/analysis/InterpretationPanel.tsx`)
- Add a D9 column showing the D9 sign name (`getLocalizedRasiName`) and a small mark for
  vargottama bodies, with its `title` / `aria-label` = the badge text.
- Put the new labels in a small `defineMessages` block next to `PositionsTab`, not in `COPY`.

**Honesty texts.** The app currently says divisional charts are not calculated. Find them
by these anchors, not by line numbers:
- `components/analysis/MethodologyTab.tsx`: the "not calculated" sentence in each of the four
  languages (`rg -n "ninth-division|Teilhoroskop|नवांश" components/analysis/MethodologyTab.tsx`).
- `lib/astro/education.ts`:
  - the `"feature-scope"` entry (four strings; the Hindi and Marathi PDF read it too);
  - the `pada` and `varga` entries (English, Hindi and Marathi in the first table, German in the second).
- `lib/export/kundaliSummary.ts`: `REPORT_LIMITATION_OVERRIDES` → `"feature-scope"` (English and German PDF).
- `lib/astro/analysisAudit.ts`: `id: "feature-scope"`.
- `lib/astro/glossary.ts`: the `pada` entry's `detailed` text.
- `lib/astro/education.ts`: set the `varga` entry's `calculationStatus` to
  `"partly-calculated"`. Otherwise the Guide tab keeps a red "Not calculated" badge
  beside the new wording.
- `docs/ARCHITECTURE.md`, section 13 ("Known model and product limitations").

Reword each one, in its own language, to mean:
- the ninth-division chart is **shown on the chart for study only**;
- it is not used in the readings, scores, AI context or PDF report;
- other divisional charts are still not calculated.

Update any test that pins these sentences.

## 4. Text — use as given

| key | en | hi | mr | de |
|---|---|---|---|---|
| chartTypeAria | Chart type | कुंडली का प्रकार | कुंडलीचा प्रकार | Horoskoptyp |
| d1 | Birth chart (D1) | जन्म कुंडली (D1) | जन्मकुंडली (D1) | Geburtshoroskop (D1) |
| d9 | Ninth-division chart (D9) | नवांश कुंडली (D9) | नवांश कुंडली (D9) | Neuntes Teilhoroskop (D9) |
| d9Sign | Ninth-division sign | नवांश राशि | नवांश राशी | Zeichen im neunten Teilhoroskop |
| vargottama | Same sign in D1 and D9 | वर्गोत्तम (D1 और D9 में एक ही राशि) | वर्गोत्तम (D1 आणि D9 मध्ये एकच राशी) | Gleiches Zeichen in D1 und D9 |
| d9Column | D9 | नवांश | नवांश | D9 |

**d9Help**
- en: Each sign is split into nine parts of 3°20′, and this chart places every body by the part it occupies. Shown for study; the readings and scores still use the birth chart.
- hi: हर राशि 3°20′ के नौ भागों में बँटी है; यह कुंडली हर ग्रह को उसके भाग के अनुसार रखती है। यह अध्ययन के लिए है; व्याख्याएँ और अंक जन्म कुंडली पर ही आधारित हैं।
- mr: प्रत्येक राशी 3°20′ च्या नऊ भागांत विभागली आहे; ही कुंडली प्रत्येक ग्रह ज्या भागात आहे त्यानुसार ठेवते. ही अभ्यासासाठी आहे; विवेचन आणि गुण जन्मकुंडलीवरच आधारित आहेत.
- de: Jedes Zeichen ist in neun Teile zu 3°20′ geteilt; dieses Horoskop ordnet jeden Himmelskörper nach dem Teil ein, in dem er steht. Zum Lernen gezeigt; Deutungen und Punktwerte beruhen weiter auf dem Geburtshoroskop.

## 5. Browser check

Add `e2e/divisional.spec.ts`:
1. `generateChart(page)`.
2. Click the D9 button; expect the D9 heading and the vargottama badge for Saturn after selecting Saturn's mark.
3. Switch North and South while in D9.
4. Run `expectNoHorizontalOverflow(page)`.
5. Save screenshots to `e2e-artifacts/screens/<project>/chart-d9-north.png` and `…-south.png`.

## Done when

- [ ] `divisional.test.ts` passes, including the 10-row table and the pada link.
- [ ] The D1/D9 switch works in both chart styles, at all three densities, in all four languages.
- [ ] Positions table has the D9 column; honesty texts updated in four languages.
- [ ] typecheck, lint, test and build pass; e2e passes locally, or in CI if the browser can't be downloaded.
- [ ] Pull request opened.

## Out of scope

Other divisional charts (D10 etc.), D9 in the PDF or AI context, D9 interpretations,
and D9 in the 3D view.
