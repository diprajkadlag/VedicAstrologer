import { describe, expect, it } from "vitest";

import { calculateVedicChart } from "../astro/ephemeris";
import {
  VIMSHOTTARI_SEQUENCE,
  calculateVimshottariTimeline,
} from "../astro/interpretations";
import {
  boundaryShiftDays,
  childDashaSpans,
  createDashaClock,
  dashaSpansInRange,
  dashaStackAt,
  minutesToMansionEdge,
  spanLengthDays,
  type DashaSpan,
} from "./dashaLevels";

const BIRTH = new Date("1990-06-15T04:30:00.000Z");
const PUNE = { latitude: 18.5204, longitude: 73.8567 };
const YEAR_MS = 365.25 * 86_400_000;

function natalMoon(instant: Date) {
  return calculateVedicChart({ instant, ...PUNE }).planets.find(
    (planet) => planet.id === "moon",
  )!;
}

const moon = natalMoon(BIRTH);
const clock = createDashaClock(BIRTH, moon.siderealLongitudeDeg);
const LIFE_END = BIRTH.getTime() + 100 * YEAR_MS;

function expectTiles(parent: DashaSpan, children: readonly DashaSpan[]): void {
  expect(children).toHaveLength(9);
  expect(children[0].lord).toBe(parent.lord);
  expect(children[0].startMs).toBe(parent.startMs);
  expect(children.at(-1)!.endMs).toBe(parent.endMs);
  children.forEach((child, index) => {
    expect(child.level).toBe(parent.level + 1);
    expect(child.path).toEqual([...parent.path, child.lord]);
    expect(Number.isInteger(child.startMs)).toBe(true);
    if (index > 0) expect(child.startMs).toBe(children[index - 1].endMs);
    const years = VIMSHOTTARI_SEQUENCE.find((entry) => entry.lord === child.lord)!.years;
    expect(child.nominalYears).toBeCloseTo((parent.nominalYears * years) / 120, 12);
  });
}

describe("four Vimshottari levels", () => {
  it("reproduces the Dashas tab dates exactly for levels 1 and 2", () => {
    const reference = calculateVimshottariTimeline({
      birthInstant: BIRTH,
      moonSiderealLongitudeDeg: moon.siderealLongitudeDeg,
      asOf: BIRTH,
    });
    const majors = dashaSpansInRange(clock, 1, BIRTH.getTime(), LIFE_END);
    const minors = dashaSpansInRange(clock, 2, BIRTH.getTime(), LIFE_END);
    const referenceMajors = reference.mahadashas.filter(
      (major) => Date.parse(major.end) > BIRTH.getTime() && Date.parse(major.start) < LIFE_END,
    );
    expect(majors.map((span) => [span.lord, span.startMs, span.endMs])).toEqual(
      referenceMajors.map((major) => [major.lord, Date.parse(major.start), Date.parse(major.end)]),
    );
    const referenceMinors = referenceMajors
      .flatMap((major) => major.antardashas)
      .filter((minor) => Date.parse(minor.end) > BIRTH.getTime() && Date.parse(minor.start) < LIFE_END);
    expect(minors.map((span) => [span.lord, span.startMs, span.endMs])).toEqual(
      referenceMinors.map((minor) => [minor.lord, Date.parse(minor.start), Date.parse(minor.end)]),
    );
  });

  it("tiles every parent with nine proportional children at each level", () => {
    const [major] = dashaSpansInRange(clock, 1, BIRTH.getTime(), BIRTH.getTime() + 1);
    const antardashas = childDashaSpans(major);
    expectTiles(major, antardashas);
    const pratyantardashas = childDashaSpans(antardashas[4]);
    expectTiles(antardashas[4], pratyantardashas);
    expectTiles(pratyantardashas[7], childDashaSpans(pratyantardashas[7]));
    expect(childDashaSpans(childDashaSpans(pratyantardashas[7])[0])).toEqual([]);
  });

  it("gives the stack of four spans that contain an instant", () => {
    const probes = [0.01, 7.3, 33.3, 61.7, 99.9].map((years) => BIRTH.getTime() + years * YEAR_MS);
    for (const ms of probes) {
      const stack = dashaStackAt(clock, ms);
      expect(stack.map((span) => span.level)).toEqual([1, 2, 3, 4]);
      stack.forEach((span, index) => {
        expect(ms).toBeGreaterThanOrEqual(span.startMs);
        expect(ms).toBeLessThan(span.endMs);
        if (index > 0) expect(span.path.slice(0, index)).toEqual(stack[index - 1].path);
      });
      const reference = calculateVimshottariTimeline({
        birthInstant: BIRTH,
        moonSiderealLongitudeDeg: moon.siderealLongitudeDeg,
        asOf: new Date(ms),
      });
      expect(stack[0].lord).toBe(reference.currentMahadasha.lord);
      expect(stack[1].lord).toBe(reference.currentAntardasha.lord);
      expect(stack[1].startMs).toBe(Date.parse(reference.currentAntardasha.start));
      for (const level of [3, 4] as const) {
        const inRange = dashaSpansInRange(clock, level, ms - 1, ms + 1);
        expect(inRange.some((span) => span.startMs === stack[level - 1].startMs)).toBe(true);
      }
    }
  });

  it("returns only spans that overlap the window, and covers it", () => {
    const from = BIRTH.getTime() + 20 * YEAR_MS;
    const to = from + 0.25 * YEAR_MS;
    const spans = dashaSpansInRange(clock, 3, from, to);
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].startMs).toBeLessThanOrEqual(from);
    expect(spans.at(-1)!.endMs).toBeGreaterThanOrEqual(to);
    spans.forEach((span, index) => {
      expect(span.endMs).toBeGreaterThan(from);
      expect(span.startMs).toBeLessThan(to);
      if (index > 0) expect(span.startMs).toBe(spans[index - 1].endMs);
    });
    expect(dashaSpansInRange(clock, 2, to, from)).toEqual([]);
  });

  it("has the documented shortest Pratyantardasha and Sookshma", () => {
    // Sun-Sun-Sun and Sun-Sun-Sun-Sun inside any Sun Mahadasha.
    const sunMajor = dashaSpansInRange(clock, 1, BIRTH.getTime(), LIFE_END + 20 * YEAR_MS).find(
      (span) => span.lord === "sun",
    )!;
    const sunSun = childDashaSpans(sunMajor)[0];
    const sunSunSun = childDashaSpans(sunSun)[0];
    const sunSunSunSun = childDashaSpans(sunSunSun)[0];
    expect(spanLengthDays(sunSunSun)).toBeCloseTo(5.479, 3);
    expect(spanLengthDays(sunSunSunSun) * 24).toBeCloseTo(6.575, 2);
  });
});

describe("birth-time sensitivity", () => {
  it("matches the formula for a typical Moon speed", () => {
    // 13.3 degrees per day for 5 minutes with an 18-year birth lord.
    expect(boundaryShiftDays(13.3, 18, 5)).toBeCloseTo(22.77, 1);
    expect(boundaryShiftDays(13.3, 18, -5)).toBeCloseTo(22.77, 1);
    expect(() => boundaryShiftDays(Number.NaN, 18, 5)).toThrow(TypeError);
  });

  it("predicts the real boundary shift of a later birth time", () => {
    const later = new Date(BIRTH.getTime() + 5 * 60_000);
    const laterClock = createDashaClock(later, natalMoon(later).siderealLongitudeDeg);
    expect(laterClock.birthLord).toBe(clock.birthLord);
    const [first] = dashaSpansInRange(clock, 1, BIRTH.getTime(), BIRTH.getTime() + 1);
    const [laterFirst] = dashaSpansInRange(laterClock, 1, later.getTime(), later.getTime() + 1);
    const measured = Math.abs(laterFirst.startMs - first.startMs) / 86_400_000;
    const predicted = boundaryShiftDays(moon.speedDegPerDay, clock.birthLordYears, 5);
    expect(Math.abs(measured - predicted) / predicted).toBeLessThan(0.01);
  });

  it("reports the minutes until the Moon leaves its lunar mansion", () => {
    const edges = minutesToMansionEdge(clock, moon.speedDegPerDay);
    const total = edges.earlier + edges.later;
    // A whole mansion of 13.33 degrees at the natal speed.
    expect(total).toBeCloseTo(((360 / 27) / moon.speedDegPerDay) * 1440, 6);
    expect(edges.earlier).toBeGreaterThan(0);
    expect(edges.later).toBeGreaterThan(0);
    expect(() => minutesToMansionEdge(clock, 0)).toThrow(RangeError);
  });
});

describe("cycle boundary and half-open periods", () => {
  it("restarts the cycle with the birth lord at full length", () => {
    const cycleEnd = Date.parse(
      calculateVimshottariTimeline({
        birthInstant: BIRTH,
        moonSiderealLongitudeDeg: moon.siderealLongitudeDeg,
        asOf: BIRTH,
      }).cycleEnd,
    );
    const majors = dashaSpansInRange(clock, 1, cycleEnd - 10 * YEAR_MS, cycleEnd + 10 * YEAR_MS);
    const next = majors.find((span) => span.startMs === cycleEnd);
    expect(next?.lord).toBe(clock.birthLord);
    expect(next?.nominalYears).toBe(clock.birthLordYears);
    expect(dashaStackAt(clock, cycleEnd)[0].startMs).toBe(cycleEnd);
    expect(dashaStackAt(clock, cycleEnd - 1)[0].endMs).toBe(cycleEnd);
  });

  it("puts an instant on a boundary into the next period at every level", () => {
    const sample = dashaSpansInRange(clock, 4, BIRTH.getTime() + 30 * YEAR_MS, BIRTH.getTime() + 30.2 * YEAR_MS);
    for (const span of sample.slice(1, 6)) {
      const stack = dashaStackAt(clock, span.startMs);
      expect(stack[3].startMs).toBe(span.startMs);
      expect(dashaStackAt(clock, span.startMs - 1)[3].endMs).toBe(span.startMs);
    }
  });

  it("gives levels 3 and 4 the product-rule length within 10 ms", () => {
    for (const span of dashaSpansInRange(clock, 4, BIRTH.getTime() + 40 * YEAR_MS, BIRTH.getTime() + 41 * YEAR_MS)) {
      const nominal = span.path
        .map((lord) => VIMSHOTTARI_SEQUENCE.find((entry) => entry.lord === lord)!.years)
        .reduce((product, years, index) => (index === 0 ? years : (product * years) / 120), 0);
      expect(Math.abs(span.endMs - span.startMs - nominal * YEAR_MS)).toBeLessThan(10);
      expect(span.nominalYears).toBeCloseTo(nominal, 12);
    }
  });
});
