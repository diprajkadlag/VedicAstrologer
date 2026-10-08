# 02 — Aspects on tap (whole-sign drishti)

**Model:** Sonnet 5.5 · **Estimate:** $4–7 · **Start after 01 is merged.** Read `CLAUDE.md` first.

## What the user gets

- Tap a planet: lines with arrowheads go from its house to every house it aspects, and the
  side panel lists them.
- Tap a house: lines come in from every planet that aspects it, and the panel lists those
  planets with the aspect each one casts.
- Works in the North and South Indian charts, in the birth chart (D1) view.

## 1. Calculation — new `lib/astro/aspects.ts` and `lib/astro/aspects.test.ts`

```ts
// Parashari whole-sign aspects, counted inclusively ("7th from" = 6 signs on).
export const NODE_ASPECTS: readonly number[] = [7];
// Traditions differ for the nodes: many modern practitioners give them 5th, 7th and
// 9th aspects like Jupiter. To follow that, set [5, 7, 9] and update the `rules` text below.

export const ASPECT_OFFSETS: Readonly<Record<GrahaId, readonly number[]>> = {
  sun: [7], moon: [7], mercury: [7], venus: [7],
  mars: [4, 7, 8], jupiter: [5, 7, 9], saturn: [3, 7, 10],
  rahu: NODE_ASPECTS, ketu: NODE_ASPECTS,
};
export function nthHouseFrom(house: HouseNumber, n: number): HouseNumber; // ((house - 1 + n - 1) % 12) + 1
export interface AspectLine { planetId: GrahaId; fromHouse: HouseNumber; toHouse: HouseNumber; nth: number }
export function aspectsFrom(chart: VedicChart, planetId: GrahaId): AspectLine[];
export function aspectsOnHouse(chart: VedicChart, house: HouseNumber): AspectLine[]; // in chart.planets order
```

## 2. Known-answer tests

1. Generic cases:
   - Mars in house 1 aspects 4, 7, 8.
   - Jupiter in 1 aspects 5, 7, 9.
   - Saturn in 1 aspects 3, 7, 10.
   - Saturn in 10 aspects 12, 4, 7.
   - Sun in 12 aspects 6.
2. Standard test chart (Test Person, `1990-05-15T05:00:00Z`, Pune). Houses: Sun 11,
   Moon 6, Mercury 10, Venus 9, Mars 8, Jupiter 12, Saturn 7, North Node 7, South Node 1.
   - Mars → 11 (4th), 2 (7th), 3 (8th).
   - Jupiter → 4 (5th), 6 (7th), 8 (9th).
   - Saturn → 9 (3rd), 1 (7th), 4 (10th).
   - Sun → 5; Moon → 12; Mercury → 4; Venus → 3; North Node → 1; South Node → 7.
   - House 4 is aspected by Mercury (7th), Jupiter (5th) and Saturn (10th).
   - House 1 is aspected by Saturn (7th) and the North Node (7th).
   - House 3 is aspected by Venus (7th) and Mars (8th).
   - House 10 is aspected by nobody.

## 3. Drawing — both renderers

- In `components/chart/types.ts`, add optional `aspectLines?: readonly AspectLine[]` and
  `highlightHouses?: readonly HouseNumber[]` to `VedicChartRendererProps`.
- In both renderers, draw one `<g aria-hidden="true" pointerEvents="none" data-testid="aspect-layer">`
  **before the labels and planet marks**, so marks stay tappable:
  - **North:** right after the house polygons.
  - **South:** after the centre panel (the 84%-opaque rectangle at x/y 100–300) and its
    texts, but before the cell labels and marks. Every 7th-house line crosses the centre,
    so drawing the layer earlier would hide it.
- One line per `AspectLine` (`data-testid="aspect-line"`):
  - runs from the centre of `fromHouse` to the centre of `toHouse`;
  - shortened by about 14 units at both ends;
  - planet colour from `PLANET_PRESENTATION`, `strokeWidth` 1.5 with `vectorEffect="non-scaling-stroke"`, opacity 0.75;
  - a small filled triangle arrowhead drawn as a `<path>` at the target end. Don't rely on
    `marker` + `context-stroke`, because support is uneven.
- Houses in `highlightHouses` get a soft tint, e.g. the selected-house fill at lower opacity.
- House centres:
  - **North:** the average of the polygon vertices in `NORTH_INDIAN_HOUSE_SHAPES`. Export
    `northHouseCentre(house)` and unit-test that house 1 → (200, 100) and house 2 → (100, 33.3).
  - **South:** the centre of the sign cell holding that house:
    `(column × 100 + 50, row × 100 + 50)` from `SOUTH_INDIAN_SIGN_CELLS`.
- Lines must stay readable at all three densities, and no line may push anything outside
  the viewBox.

## 4. Card behaviour — `ChartWorkspace.tsx`

- Add a **Show aspects** switch (`aria-pressed`, at least 40 × 40 px, on by default).
  - It appears in the D1 view only; hide it in the D9 view from task 01.
  - Put it after the North/South and D1/D9 groups (CLAUDE.md rule 10).
- **A planet is selected:** pass `aspectsFrom(chart, id)` and highlight its target houses.
  The side panel adds the line "Aspects: houses 11, 2, 3", followed by the ordinals.
- **A house is selected and no planet:** pass `aspectsOnHouse(chart, house)` and highlight
  that house. The side panel lists "Aspected by: Mercury (7th), Jupiter (5th), Saturn (10th)",
  or the empty text.
- Show the `rules` sentence as a small note under the chart while the switch is on.

**Honesty texts.** The app currently says classical aspects are not calculated. These are
the same places task 01 changed, so build on its wording:
- `components/analysis/MethodologyTab.tsx`: the "not calculated" sentence in each language.
- `lib/astro/education.ts`:
  - the `"feature-scope"` entry (four strings; the Hindi and Marathi PDF read it too);
  - the `drishti` entries (English, Hindi and Marathi in the first table, German in the second).
- `lib/export/kundaliSummary.ts`: `REPORT_LIMITATION_OVERRIDES` → `"feature-scope"` (English and German PDF).
- `lib/astro/analysisAudit.ts`: `id: "feature-scope"`, which mentions "classical Drishti".
- `lib/astro/education.ts`: set the `drishti` entry's `calculationStatus` to
  `"partly-calculated"`, so the Guide tab's badge matches.
- `docs/ARCHITECTURE.md`, section 13.

A search for `दृष्टि` also hits unrelated words such as दृष्टिकोण (viewpoint) and अंतर्दृष्टि
(insight); leave those alone.

Reword each one, in its own language, to mean:
- whole-sign aspects are **drawn on the chart for study only**;
- aspect strength and orbs are not calculated;
- aspects are not used in the readings, scores, AI context or PDF report.

Update any test that pins these sentences.

## 5. Text — use as given

| key | en | hi | mr | de |
|---|---|---|---|---|
| showAspects | Show aspects | दृष्टि दिखाएँ | दृष्टी दाखवा | Aspekte zeigen |
| aspectsOf | Aspects: houses {houses} | दृष्टि: भाव {houses} | दृष्टी: भाव {houses} | Aspekte: Häuser {houses} |
| aspectedBy | Aspected by | इन ग्रहों की दृष्टि | या ग्रहांची दृष्टी | Aspektiert von |
| noAspects | No planet aspects this house. | इस भाव पर किसी ग्रह की दृष्टि नहीं है। | या भावावर कोणत्याही ग्रहाची दृष्टी नाही. | Kein Himmelskörper aspektiert dieses Haus. |

**Ordinals.** Format a list item as "Mercury (7th)", "बुध (सातवीं)", "बुध (सातवी)", "Merkur (7.)".

| n | en | hi | mr | de |
|---|---|---|---|---|
| 3 | 3rd | तीसरी | तिसरी | 3. |
| 4 | 4th | चौथी | चौथी | 4. |
| 5 | 5th | पाँचवीं | पाचवी | 5. |
| 7 | 7th | सातवीं | सातवी | 7. |
| 8 | 8th | आठवीं | आठवी | 8. |
| 9 | 9th | नौवीं | नववी | 9. |
| 10 | 10th | दसवीं | दहावी | 10. |

**rules**
- en: Whole-sign aspects: every body aspects the 7th house from itself; Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th. North and South Node: 7th only in this version (traditions differ). Strength and orbs are not calculated, and aspects are not used in the readings or scores.
- hi: पूर्ण-राशि दृष्टि: हर ग्रह अपने से सातवें भाव को देखता है; मंगल चौथे और आठवें, गुरु पाँचवें और नौवें, शनि तीसरे और दसवें भाव को भी। राहु-केतु: इस संस्करण में केवल सातवीं दृष्टि (परंपराएँ अलग हैं)। दृष्टि-बल और अंश-अंतर नहीं गिने जाते, और व्याख्या या अंकों में दृष्टि का उपयोग नहीं होता।
- mr: पूर्ण-राशी दृष्टी: प्रत्येक ग्रह स्वतःपासून सातव्या भावाकडे पाहतो; मंगळ चौथ्या व आठव्या, गुरु पाचव्या व नवव्या, शनि तिसऱ्या व दहाव्या भावाकडेही पाहतो. राहू-केतू: या आवृत्तीत फक्त सातवी दृष्टी (परंपरांमध्ये मतभेद आहेत). दृष्टीचे बल आणि अंशांतर मोजले जात नाहीत, आणि विवेचन किंवा गुणांत दृष्टी वापरली जात नाही.
- de: Ganzzeichen-Aspekte: Jeder Himmelskörper aspektiert das 7. Haus von sich aus; Mars zusätzlich das 4. und 8., Jupiter das 5. und 9., Saturn das 3. und 10. Nord- und Südknoten: in dieser Version nur das 7. (Traditionen unterscheiden sich). Stärke und Orben werden nicht berechnet, und Aspekte fließen nicht in Deutungen oder Punktwerte ein.

## 6. Browser check

Add `e2e/aspects.spec.ts`:
1. `generateChart(page)`.
2. In the chart, click Saturn's mark (`svg [aria-label^="Saturn,"]`) and expect 3
   `aspect-line` elements and the text "Aspects: houses".
3. Select house 4 and expect Mercury, Jupiter and Saturn in the side panel.
4. Switch to South Indian and expect the same counts.
5. Run `expectNoHorizontalOverflow(page)`.
6. Save screenshots `chart-aspects-north.png` and `chart-aspects-south.png`.

## Done when

- [ ] `aspects.test.ts` passes, including the test-chart cases and the house-centre helper.
- [ ] Lines and panel lists work in both chart styles, at all densities, in all four languages.
- [ ] The switch is hidden in the D9 view; honesty texts updated in four languages.
- [ ] typecheck, lint, test and build pass; e2e passes locally or in CI.
- [ ] Pull request opened.

## Out of scope

Sign (Jaimini) aspects, aspect strength or orbs, aspects in D9, aspects from transits,
and using aspects in readings or scores.
