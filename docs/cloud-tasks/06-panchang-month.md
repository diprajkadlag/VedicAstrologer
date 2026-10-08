# 06 — Panchang month calendar

**Model:** Sonnet 5.5 · **Estimate:** $4–6 · **Start after 05 is merged.** Read `CLAUDE.md` first.

## What the user gets

Under the day card in the **Daily almanac** tab: a month grid in the style of a wall
calendar (Kalnirnay). Each date shows the Moon's phase as a small drawn moon and the
lunar-day number at sunrise. Full moon, new moon and Ekadashi are marked. Tapping a date
updates the day card above, and ‹ / › change the month.

## 1. Data

- Use `panchangAtSunrise(date, place)` from task 05 for every date of the month. Don't
  calculate end times for the grid; about 31 sunrise searches take well under 50 ms.
  Memoise by month and place.
- The month is the Gregorian month of the selected date, in the place's time zone.

## 2. Grid — new `components/analysis/PanchangMonth.tsx` (+ SSR test)

- 7 columns, starting on Monday for `de` and on Sunday for `en`, `hi` and `mr`.
  - Weekday headers come from `Intl.DateTimeFormat(INTL_LOCALES[locale], { weekday: "short" })`.
  - The month title comes from `{ month: "long", year: "numeric" }`.
- Each date is a `<button>` at least 40 px tall containing:
  - the date number;
  - a tiny SVG moon: the lit part drawn from the lunar day, waxing on the right and waning
    on the left, with day 15 full and day 30 dark;
  - the lunar-day number 1–15 inside its fortnight (16–30 shows as 1–15 in the waning half),
    with a colour or marker for the half.
- Markers:
  - full moon (tithi 15) — bright ring;
  - new moon (30) — dark dot;
  - Ekadashi (11 or 26) — small accent dot.

  Add a legend row explaining them.
- Today gets an outline; the selected date gets the accent fill; Sundays get a subtle colour.
- Accessibility: wrap the grid in `role="grid"` with rows. Each button has
  `aria-label` = `cellAria`, e.g. "8 October 2026: Trayodashi, waning fortnight, Purva Phalguni",
  and `aria-pressed` when selected. Arrow keys move the focus.
- At 320 px the 7 columns must fit (about 40 px each) with no horizontal overflow; shrink
  the moon icon before anything overflows.
- Add `data-testid="panchang-month"` on the grid and `data-date="YYYY-MM-DD"` on each button.

**Wire-up in `PanchangTab.tsx`.** The selected date is shared: the grid sets it, and the
day card and grid follow. ‹ / › change the month and keep the day where possible.
- Change state only in click and key handlers.
- "Today" means the panel's `asOf` date, as in task 05; no `new Date()` during render
  (CLAUDE.md rule 9).

## 3. Known-answer tests (Pune, October 2026, lunar day at sunrise)

| date | tithi | note |
|---|---|---|
| Oct 1 | 20 | Thursday; the grid starts on Thursday's column |
| Oct 3 → Oct 4 | 22 → 24 | 23 is skipped |
| Oct 6 | 26 | Ekadashi (waning) marker |
| Oct 10 | 30 | new moon marker |
| Oct 11 | 1 | waxing half starts |
| Oct 17, 18 | 7, 7 | repeated day |
| Oct 22 | 11 | Ekadashi (waxing) marker |
| Oct 26 | 15 | full moon marker |
| Oct 28 | 18 | 17 is skipped |

Every October 2026 date is at least 29 min from a lunar-day boundary at sunrise (the closest
is 27 Oct), so these values are robust.

## 4. Text — use as given

| key | en | hi | mr | de |
|---|---|---|---|---|
| prevMonth | Previous month | पिछला महीना | मागील महिना | Vorheriger Monat |
| nextMonth | Next month | अगला महीना | पुढील महिना | Nächster Monat |
| monthGridAria | Lunar days in {month} | {month} की तिथियाँ | {month} मधील तिथी | Mondtage im {month} |
| legend | Lunar day at sunrise | सूर्योदय के समय की तिथि | सूर्योदयाची तिथी | Mondtag bei Sonnenaufgang |
| fullMoon | Full moon | पूर्णिमा | पौर्णिमा | Vollmond |
| newMoon | New moon | अमावस्या | अमावास्या | Neumond |
| ekadashi | Ekadashi | एकादशी | एकादशी | Ekadashi |
| cellAria | {date}: {tithi}, {paksha}, {nakshatra} | {date}: {tithi}, {paksha}, {nakshatra} | {date}: {tithi}, {paksha}, {nakshatra} | {date}: {tithi}, {paksha}, {nakshatra} |

## 5. Browser check

Extend `e2e/panchang.spec.ts`:
1. Open the tab and go to October 2026.
2. Click `[data-date="2026-10-26"]` and expect the day card to show Purnima (full moon).
3. Press ›, expect November 2026, then press ‹.
4. Run `expectNoHorizontalOverflow(page)` at 320 px and save `panchang-month.png`.

## Done when

- [ ] Month tests pass (the table above, the weekday start, and skipped or repeated days).
- [ ] The grid is readable and tappable on a 320 px phone in all four languages; arrow keys work.
- [ ] typecheck, lint, test and build pass; e2e passes locally or in CI. Pull request opened.

## Out of scope

Festival names, export to a calendar app, and a year view.
