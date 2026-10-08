# 05 — Panchang (daily almanac): engine and day view

**Model:** Opus 5.5 · **Estimate:** $8–12 · **Can start any time.** Read `CLAUDE.md` first.

## What the user gets

A new analysis tab, **Daily almanac** (पंचांग), next to Transits. For any date and place
it shows:
- the weekday;
- the lunar month (new-moon and full-moon reckoning, extra months marked);
- the lunar day (tithi) with its fortnight, and the lunar mansion, Sun–Moon combination
  (yoga) and half lunar days (karana), each with end times;
- sunrise, sunset, moonrise and moonset;
- Rahu Kaal, Yamaganda and Gulika.

The place defaults to the birth place, with a **Use my location** button. Task 06 adds the
month calendar on top of this engine.

## 0. Names file — copy, don't retype

`cp docs/cloud-tasks/assets/panchang-names.ts lib/astro/panchangNames.ts`

It holds the four-language tithi, fortnight, yoga, karana, weekday and month names, plus
`karanaNameIndex()`. Nakshatra names come from `getLocalizedNakshatraName()`.

## 1. Engine — new `lib/astro/panchang.ts` and `lib/astro/panchang.test.ts`

**Longitudes.** Export a small helper from `lib/astro/ephemeris.ts`:
`siderealSunMoon(instant: Date): { sun: number; moon: number }`, reusing the private
`apparentGeocentricPosition`. The values must equal those in `calculateVedicChart`.

**Definitions.** λ is sidereal longitude in degrees; E = (λMoon − λSun) mod 360.
- **Lunar day (tithi)** = ⌊E / 12⌋ + 1, from 1 to 30. Days 1–15 are the waxing half
  (`shukla`), 16–30 the waning half (`krishna`). Tithi doesn't depend on the ayanamsa.
- **Karana** = ⌊E / 6⌋ + 1, from 1 to 60. Get the name with `karanaNameIndex()`.
- **Nakshatra** = ⌊λMoon / (360/27)⌋ + 1. **Yoga** = ⌊((λSun + λMoon) mod 360) / (360/27)⌋ + 1.
- **Sun and day.** Use astronomy-engine `SearchRiseSet(Body.Sun, observer, +1 or −1, start, 1)`,
  where `start` is local midnight of the civil date in the place's time zone. Build it with
  `temporal-polyfill`, as `lib/astro/civil-time.ts` does. This uses the upper limb and standard
  refraction.
  - The almanac day runs from sunrise to the next sunrise.
  - Weekday = the civil weekday of the sunrise in the place's zone.
  - If there is no sunrise (polar day or night), show "—" and skip the time-of-day rows.
- **Moon.** Moonrise and moonset are the first `SearchRiseSet(Body.Moon, …)` events after
  sunrise (search 2 days). Mark "(next day)" when one falls on the next civil date.
- **End times.** Each element is a list of segments `{ index, start, end }` covering
  [sunrise, next sunrise):
  - the segment in force at sunrise, plus every later segment that starts before the next sunrise;
  - a lunar day can be skipped (it starts and ends between two sunrises) or repeated
    (it spans two sunrises), and both must appear correctly;
  - tithi and karana boundaries: `SearchMoonPhase(targetDeg, start, limitDays)` with the
    next multiple of 12° or 6°;
  - nakshatra and yoga boundaries: bisect on `siderealSunMoon`, 40 iterations;
  - a whole day costs well under 0.1 s.
- **Lunar month (new-moon reckoning, *amanta*).**
  - Previous new moon `p = SearchMoonPhase(0, sunrise, −35)` (negative limits search
    backwards in astronomy-engine 2.1.19); next new moon `q = SearchMoonPhase(0, sunrise, +35)`.
  - Month index = (Sun's sidereal sign at `p` + 1) % 12, where 0 = Chaitra.
  - If the Sun's sign is the same at `p` and `q`, the month is **adhika** (extra).
  - **Full-moon reckoning (*purnimanta*)**:
    - waxing half: same as amanta, including the adhika flag;
    - waning half of a normal month: the **next** month, not adhika;
    - an **adhika month keeps its own name and flag in both halves**. Drik Panchang labels
      11 Jun 2026 "Jyeshtha Adhika, Krishna" in this reckoning.
- **Day periods.** Divide sunrise→sunset into 8 equal parts and pick the part (1–8) by
  weekday, Sunday to Saturday:
  - **Rahu Kaal** [8, 2, 7, 5, 6, 4, 3];
  - **Yamaganda** [5, 4, 3, 2, 1, 7, 6];
  - **Gulika** [7, 6, 5, 4, 3, 2, 1].

**API**
```ts
export interface PanchangPlace { latitude: number; longitude: number; timeZone: string; label: string }
export interface Segment { index: number; start: Date; end: Date }
export interface PanchangDay {
  civilDate: string; place: PanchangPlace;
  sunrise: Date | null; sunset: Date | null; nextSunrise: Date | null;
  moonrise: Date | null; moonset: Date | null;
  weekday: number; paksha: "shukla" | "krishna";
  tithi: Segment[]; nakshatra: Segment[]; yoga: Segment[]; karana: Segment[];
  lunarMonth: { amanta: { index: number; adhika: boolean }; purnimanta: { index: number; adhika: boolean } };
  rahuKaal: { start: Date; end: Date } | null; yamaganda: { start: Date; end: Date } | null; gulika: { start: Date; end: Date } | null;
}
export function calculatePanchangDay(civilDate: string, place: PanchangPlace): PanchangDay;
export function panchangAtSunrise(civilDate: string, place: PanchangPlace): { sunrise: Date | null; tithi: number; nakshatra: number; yoga: number; karana: number; weekday: number }; // cheap, for task 06
```

## 2. Known-answer tests

All tests use Pune: 18.5204, 73.8567, `Asia/Kolkata`.

**A. 8 Oct 2026**, checked against Drik Panchang (published) and Swiss Ephemeris 2.10.03.

| value | expected | tolerance |
|---|---|---|
| sunrise | 06:26:33 IST (00:56:33Z); Drik 06:26 | ±60 s |
| sunset | 18:17:33 IST (12:47:33Z); Drik 18:18 | ±60 s |
| weekday | Thursday (4) | exact |
| tithi | 28, waning Trayodashi, until 22:16 IST (SE 16:46:28Z; Drik 22:15), then 29 | ±2 min |
| nakshatra | 11, Purva Phalguni, until 21:20 IST (SE 15:50:23Z) | ±2 min |
| yoga | 24, Shukla, until 00:58 IST on 9 Oct (SE 19:28:28Z) | ±2 min |
| karana | segments [55, 56, 57]: 55 Garaja until 10:44 IST (SE 05:14:25Z; Drik 10:43), 56 Vanija until the tithi ends at 22:16, then 57 Vishti | ±2 min |
| lunar month | amanta Bhadrapada (5), purnimanta Ashwina (6), not adhika | exact |
| Rahu Kaal | 13:51–15:20 IST (Drik) | ±1 min |
| Yamaganda | 06:26–07:55 IST (Drik) | ±1 min |
| Gulika | 09:24–10:53 IST (Drik) | ±1 min |
| moonset | 16:44 IST (SE 11:14:02Z) | ±1 min |
| moonrise | 05:03 IST on 9 Oct, marked next day | ±2 min |

Drik prints moonset 16:41 and moonrise 05:07 because it uses a different Moon
convention, so test the moon against the Swiss Ephemeris values.

**B. Values at sunrise.** Swiss Ephemeris agrees on every index.

| date | sunrise (UTC, ±60 s) | tithi | nakshatra | yoga | karana | weekday |
|---|---|---|---|---|---|---|
| 2026-11-09 | 01:07:54 | 30 | 15 | 4 | 60 | Monday |
| 2027-01-14 | 01:39:42 | 6 | 26 | 19 | 12 | Thursday |
| 2027-03-22 | 01:07:30 | 15 | 12 | 10 | 30 | Monday |
| 2027-06-30 | 00:31:17 | 26 | 2 | 7 | 51 | Wednesday |

End times on **2027-01-14** (Swiss Ephemeris, ±2 min):
- tithi 6 until 08:29:04Z;
- nakshatra 26 until 17:49:02Z;
- yoga 19 until 11:52:26Z;
- karana 12 until 08:29:04Z.

**C. Lunar months**

New-moon reckoning (amanta):
- 2026-05-20 and 2026-06-01 → **adhika Jyeshtha** (index 2, adhika). At the 15 Jun 2026 new
  moon the Sun is still 0.18° short of sidereal Gemini, about 4.5 h of margin.
- 2026-06-20 → Jyeshtha (not adhika).
- 2027-01-14 → Pausha (9).
- 2027-03-22 → Phalguna (11); that day is a full-moon day (tithi 15).

Full-moon reckoning (purnimanta), all checked with this engine:
- 2026-05-10 (waning half of amanta Vaishakha) → Jyeshtha, not adhika;
- 2026-06-01 (waning half of the adhika month) → Jyeshtha, adhika;
- 2026-07-01 (waning half of Jyeshtha) → Ashadha, not adhika.

**D. Skipped and repeated lunar days in Pune, October 2026**
- 2026-10-03: the day's tithi segments are [22, 23, 24]. Tithi 23 starts and ends
  between the two sunrises.
- 2026-10-17 and 2026-10-18 both start in tithi 7 (it repeats).
- Every October 2026 day is at least 29 min from a lunar-day boundary at sunrise; the
  closest is 27 Oct. That's background, not an assertion.

**E. Invariants**
- One minute after `SearchMoonPhase(180, …)` the tithi is 16, and one minute before it is 15.
- Around `SearchMoonPhase(0, …)` the tithi goes from 30 to 1.
- `karanaNameIndex`: 1→0, 2→1, 8→7, 9→1, 55→5, 56→6, 57→7, 58→8, 59→9, 60→10.

## 3. Interface — new `components/analysis/PanchangTab.tsx` (+ SSR test)

**Registration in `InterpretationPanel.tsx`.** Add an `almanac` tab after `horoscope`:
- add it to the `AnalysisTab` union and to `TAB_DEFINITIONS`, using a lucide icon such as `CalendarDays`;
- add one `almanac` label per language to `COPY` (allowed here);
- render `<PanchangTab chart={chart} request={request} asOf={asOf} />` when active;
- `components/analysis/TwelveHouseSummary.test.tsx` pins the tab count with
  `expect(tabs).toHaveLength(8)`. Change it to 9 on purpose.

**Controls**
- A date input at 16 px on phones, plus **Today** and ← / → day buttons.
- Treat the panel's `asOf` prop as "today", for the initial date and the Today button.
  Don't call `new Date()` during render (CLAUDE.md rule 9).
- Place:
  - The panel's `request` is `InterpretationRequestMetadata`, where latitude, longitude and
    the time zone are **optional**.
  - Default to the birth place: latitude and longitude from `request.location`, falling back
    to `chart.location`; the zone from `request.birth.timeZone`, falling back to
    `findTimeZonesInBrowser(lat, lon)[0]`; label `request.location.label`.
  - **Use my location** calls `navigator.geolocation.getCurrentPosition` on click only, with
    the zone from `findTimeZonesInBrowser(lat, lon)[0]`. Nothing is stored. On error, keep
    the old place and show `locationError`.

**Day card**
- Heading: "{weekday} · {month} ({new-moon reckoning}) · {month} ({full-moon reckoning})".
- Rows in this order:
  1. lunar day with fortnight;
  2. lunar mansion;
  3. Sun–Moon combination;
  4. half lunar days;
  5. sunrise / sunset;
  6. moonrise / moonset;
  7. Rahu Kaal, Yamaganda, Gulika.
- Each element reads like "Trayodashi, waning fortnight — until 22:16, then Chaturdashi". List
  every segment, mark "(next day)" where it applies, and use `Intl.DateTimeFormat(INTL_LOCALES[locale], { timeStyle: "short", timeZone })`.
- Show the disclaimer under the card.
- Compute in `useMemo`, keyed by date and place. Add `data-testid="panchang-day"`.

## 4. Text — use as given

| key | en | hi | mr | de |
|---|---|---|---|---|
| almanac (tab, in COPY) | Daily almanac | पंचांग | पंचांग | Tagesalmanach |
| intro | Traditional calendar details for any day and place, calculated in this browser. | किसी भी दिन और स्थान के लिए पारंपरिक पंचांग विवरण, इसी ब्राउज़र में गणना किए गए। | कोणत्याही दिवसासाठी आणि ठिकाणासाठी पारंपरिक पंचांग तपशील, याच ब्राउझरमध्ये मोजलेले. | Traditionelle Kalenderangaben für jeden Tag und Ort, berechnet in diesem Browser. |
| date | Date | दिनांक | दिनांक | Datum |
| today | Today | आज | आज | Heute |
| prevDay | Previous day | पिछला दिन | आदला दिवस | Vorheriger Tag |
| nextDay | Next day | अगला दिन | पुढचा दिवस | Nächster Tag |
| place | Place | स्थान | ठिकाण | Ort |
| useMyLocation | Use my location | मेरा स्थान लें | माझे ठिकाण वापरा | Meinen Standort verwenden |
| myLocation | My location | मेरा स्थान | माझे ठिकाण | Mein Standort |
| locationError | Location unavailable; still showing the previous place. | स्थान नहीं मिला; पिछला स्थान ही दिखाया जा रहा है। | ठिकाण मिळाले नाही; आधीचेच ठिकाण दाखवत आहोत. | Standort nicht verfügbar; der bisherige Ort wird weiter angezeigt. |
| weekday | Weekday | वार | वार | Wochentag |
| lunarMonth | Lunar month | मास | महिना | Mondmonat |
| amanta | new-moon reckoning | अमांत | अमांत | Neumond-Zählung |
| purnimanta | full-moon reckoning | पूर्णिमांत | पौर्णिमांत | Vollmond-Zählung |
| tithi | Lunar day | तिथि | तिथी | Mondtag |
| nakshatra | Lunar mansion | नक्षत्र | नक्षत्र | Mondstation |
| yoga | Sun–Moon combination | योग | योग | Sonne-Mond-Kombination |
| karana | Half lunar day | करण | करण | Halber Mondtag |
| sunrise | Sunrise | सूर्योदय | सूर्योदय | Sonnenaufgang |
| sunset | Sunset | सूर्यास्त | सूर्यास्त | Sonnenuntergang |
| moonrise | Moonrise | चंद्रोदय | चंद्रोदय | Mondaufgang |
| moonset | Moonset | चंद्रास्त | चंद्रास्त | Monduntergang |
| rahuKaal | Rahu Kaal | राहुकाल | राहुकाळ | Rahu Kaal |
| yamaganda | Yamaganda | यमगण्ड | यमगंड | Yamaganda |
| gulika | Gulika | गुलिक काल | गुलिक काळ | Gulika |
| until | until {time} | {time} तक | {time} पर्यंत | bis {time} |
| then | then {name} | फिर {name} | नंतर {name} | danach {name} |
| nextDayMark | (next day) | (अगले दिन) | (दुसऱ्या दिवशी) | (am nächsten Tag) |
| noSunrise | No sunrise at this place on this date. | इस दिन इस स्थान पर सूर्योदय नहीं होता। | या दिवशी या ठिकाणी सूर्योदय होत नाही. | An diesem Ort geht die Sonne an diesem Tag nicht auf. |

**disclaimer**
- en: Calculated in this browser with the app's own sidereal (Lahiri) method. Sunrise is when the Sun's upper edge meets the horizon with normal refraction; printed almanacs can differ by a few minutes. Traditional calendar information, not advice.
- hi: यह गणना इसी ब्राउज़र में ऐप की अपनी निरयन (लाहिड़ी) पद्धति से की गई है। सूर्योदय तब माना गया है जब सूर्य का ऊपरी किनारा सामान्य अपवर्तन के साथ क्षितिज को छूता है; छपे पंचांगों में कुछ मिनट का अंतर हो सकता है। यह पारंपरिक पंचांग जानकारी है, सलाह नहीं।
- mr: ही गणना याच ब्राउझरमध्ये अ‍ॅपच्या स्वतःच्या निरयन (लाहिरी) पद्धतीने केली आहे. सूर्याची वरची कड सामान्य अपवर्तनासह क्षितिजाला लागते तो सूर्योदय धरला आहे; छापील पंचांगांशी काही मिनिटांचा फरक असू शकतो. ही पारंपरिक पंचांग माहिती आहे, सल्ला नाही.
- de: Berechnet in diesem Browser mit der eigenen siderischen Lahiri-Methode der App. Als Sonnenaufgang gilt der Moment, in dem der obere Sonnenrand bei normaler Refraktion den Horizont erreicht; gedruckte Almanache können um einige Minuten abweichen. Traditionelle Kalenderangaben, keine Beratung.

## 5. Browser check

Add `e2e/panchang.spec.ts`:
1. `generateChart(page)`; the test chart's place is Pune.
2. Open the **Daily almanac** tab and set the date to 2026-10-08.
3. Expect "Trayodashi", "Purva Phalguni", "Rahu Kaal" and "Bhadrapada" in `panchang-day`.
4. Run `expectNoHorizontalOverflow(page)` and save `panchang-day.png`.

## Done when

- [ ] `panchang.test.ts` passes, covering cases A to E.
- [ ] The tab works in four languages, for the birth place and for "my location"; nothing is
      sent over the network.
- [ ] typecheck, lint, test and build pass; e2e passes locally or in CI. Pull request opened.

## Out of scope (task 06 or later)

The month grid, festivals, Abhijit and other muhurtas, Samvat year names, choosing other
cities by search, and the PDF.
