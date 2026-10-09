import { describe, expect, it } from "vitest";

import {
  calculateLongitudeSpeed,
  calculateSiderealLongitude,
  calculateVedicChart,
  normalizeDegrees,
  type GrahaId,
} from "../astro/ephemeris";
import {
  DAY_MS,
  computeMoonWindow,
  computePlanetTimeline,
  interpolateUnwrapped,
  motionSegments,
  sampleLongitudes,
  segmentAt,
  signIndexOfLongitude,
  type IngressEvent,
  type PlanetTimeline,
  type StationEvent,
} from "./planetTimeline";

const DELHI = { latitude: 28.6139, longitude: 77.209, elevationMeters: 216 };
const MINUTE_MS = 60_000;

function signAt(id: GrahaId, ms: number): number {
  return signIndexOfLongitude(calculateSiderealLongitude(id, new Date(ms)));
}

function ingresses(timeline: PlanetTimeline): IngressEvent[] {
  return timeline.events.filter((event): event is IngressEvent => event.kind === "ingress");
}

function stations(timeline: PlanetTimeline): StationEvent[] {
  return timeline.events.filter((event): event is StationEvent => event.kind === "station");
}

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function dayDistance(ms: number, isoDay: string): number {
  return Math.abs(ms - Date.parse(`${isoDay}T12:00:00Z`)) / DAY_MS;
}

describe("chart-consistent longitude and speed", () => {
  it("matches calculateVedicChart for every graha", () => {
    const instant = new Date("2024-03-10T06:15:00.000Z");
    const chart = calculateVedicChart({ instant, ...DELHI });
    for (const planet of chart.planets) {
      const longitude = calculateSiderealLongitude(planet.id, instant);
      const difference = Math.abs(
        ((longitude - planet.siderealLongitudeDeg + 540) % 360) - 180,
      );
      expect(difference).toBeLessThan(1e-9);
      expect(calculateLongitudeSpeed(planet.id, instant)).toBeCloseTo(
        planet.speedDegPerDay,
        10,
      );
    }
  });

  it("rejects an invalid instant", () => {
    expect(() => calculateSiderealLongitude("sun", new Date(Number.NaN))).toThrow(
      /valid Date/,
    );
  });
});

describe("sampleLongitudes", () => {
  it("unwraps continuously and agrees with the exact longitude at every sample", () => {
    const start = Date.parse("2020-01-01T00:00:00Z");
    const series = sampleLongitudes("sun", start, start + 400 * DAY_MS, 10 * DAY_MS);
    expect(series.unwrapped.length).toBe(41);
    for (let index = 0; index < series.unwrapped.length; index += 1) {
      const exact = calculateSiderealLongitude("sun", new Date(start + index * 10 * DAY_MS));
      expect(normalizeDegrees(series.unwrapped[index])).toBeCloseTo(exact, 9);
      if (index > 0) {
        // The Sun moves about 10 degrees in 10 days; the table never jumps by 360.
        const step = series.unwrapped[index] - series.unwrapped[index - 1];
        expect(step).toBeGreaterThan(9);
        expect(step).toBeLessThan(11);
      }
    }
    expect(interpolateUnwrapped(series, start + 5 * DAY_MS)).toBeCloseTo(
      (series.unwrapped[0] + series.unwrapped[1]) / 2,
      9,
    );
  });

  it("rejects an empty range and a non-positive step", () => {
    expect(() => sampleLongitudes("sun", 10, 10, DAY_MS)).toThrow(RangeError);
    expect(() => sampleLongitudes("sun", 0, DAY_MS, 0)).toThrow(RangeError);
  });
});

describe("computePlanetTimeline", () => {
  it("finds the published Lahiri Saturn ingresses of 2022 to 2028", () => {
    const timeline = computePlanetTimeline(
      "saturn",
      Date.parse("2021-01-01T00:00:00Z"),
      Date.parse("2029-01-01T00:00:00Z"),
    );
    const found = ingresses(timeline).map((event) => ({
      day: utcDay(event.ms),
      ms: event.ms,
      toSign: event.toSign,
      retrograde: event.retrograde,
    }));
    // Aquarius 10, Capricorn 9, Pisces 11, Aries 0.
    const expected = [
      { day: "2022-04-29", toSign: 10, retrograde: false },
      { day: "2022-07-12", toSign: 9, retrograde: true },
      { day: "2023-01-17", toSign: 10, retrograde: false },
      { day: "2025-03-29", toSign: 11, retrograde: false },
      { day: "2027-06-03", toSign: 0, retrograde: false },
      { day: "2027-10-20", toSign: 11, retrograde: true },
      { day: "2028-02-23", toSign: 0, retrograde: false },
    ];
    expect(found).toHaveLength(expected.length);
    expected.forEach((entry, index) => {
      expect(dayDistance(found[index].ms, entry.day)).toBeLessThan(1);
      expect(found[index].toSign).toBe(entry.toSign);
      expect(found[index].retrograde).toBe(entry.retrograde);
    });
  });

  it("finds the 2025 Mercury stations", () => {
    const timeline = computePlanetTimeline(
      "mercury",
      Date.parse("2025-01-01T00:00:00Z"),
      Date.parse("2026-01-01T00:00:00Z"),
    );
    const found = stations(timeline);
    const expected: [string, StationEvent["turns"]][] = [
      ["2025-03-15", "retrograde"],
      ["2025-04-07", "direct"],
      ["2025-07-18", "retrograde"],
      ["2025-08-11", "direct"],
      ["2025-11-09", "retrograde"],
      ["2025-11-29", "direct"],
    ];
    expect(found).toHaveLength(expected.length);
    expected.forEach(([day, turns], index) => {
      expect(dayDistance(found[index].ms, day)).toBeLessThan(1);
      expect(found[index].turns).toBe(turns);
    });
  });

  it("agrees with a brute-force two-hour scan of Mercury's sign", () => {
    const start = Date.parse("2024-01-01T00:00:00Z");
    const end = Date.parse("2026-01-01T00:00:00Z");
    const timeline = computePlanetTimeline("mercury", start, end);
    const scanned: number[] = [];
    let previous = signAt("mercury", start);
    for (let ms = start + 120 * MINUTE_MS; ms < end; ms += 120 * MINUTE_MS) {
      const current = signAt("mercury", ms);
      if (current !== previous) scanned.push(ms);
      previous = current;
    }
    const found = ingresses(timeline);
    expect(found).toHaveLength(scanned.length);
    found.forEach((event, index) => {
      expect(Math.abs(event.ms - scanned[index])).toBeLessThanOrEqual(120 * MINUTE_MS);
    });
  });

  it("places every ingress and station within its stated tolerance", () => {
    for (const id of ["mars", "venus", "jupiter"] as const) {
      const timeline = computePlanetTimeline(
        id,
        Date.parse("2019-06-01T00:00:00Z"),
        Date.parse("2025-06-01T00:00:00Z"),
      );
      for (const event of ingresses(timeline)) {
        expect(signAt(id, event.ms - 2 * MINUTE_MS)).toBe(event.fromSign);
        expect(signAt(id, event.ms + 2 * MINUTE_MS)).toBe(event.toSign);
        // Neighbouring signs only: one step forward or one step back.
        expect([1, 11]).toContain((event.toSign - event.fromSign + 12) % 12);
      }
      for (const event of stations(timeline)) {
        const before = calculateLongitudeSpeed(id, new Date(event.ms - 30 * MINUTE_MS));
        const after = calculateLongitudeSpeed(id, new Date(event.ms + 30 * MINUTE_MS));
        expect(Math.sign(before)).toBe(event.turns === "retrograde" ? 1 : -1);
        expect(Math.sign(after)).toBe(event.turns === "retrograde" ? -1 : 1);
      }
    }
  });

  it("builds contiguous motion segments that agree with the chart functions", () => {
    const start = Date.parse("2023-01-01T00:00:00Z");
    const end = Date.parse("2027-01-01T00:00:00Z");
    for (const id of ["venus", "saturn", "rahu"] as const) {
      const timeline = computePlanetTimeline(id, start, end);
      const segments = motionSegments(timeline);
      expect(segments[0].startMs).toBe(start);
      expect(segments.at(-1)!.endMs).toBe(end);
      segments.forEach((segment, index) => {
        if (index > 0) expect(segment.startMs).toBe(segments[index - 1].endMs);
        const middle = (segment.startMs + segment.endMs) / 2;
        expect(signAt(id, middle)).toBe(segment.signIndex);
        expect(calculateLongitudeSpeed(id, new Date(middle)) < 0).toBe(segment.retrograde);
        expect(segmentAt(segments, middle)).toBe(segment);
      });
      expect(segmentAt(segments, end)).toBeUndefined();
    }
  });

  it("keeps the mean nodes retrograde and opposite each other", () => {
    const start = Date.parse("2000-01-01T00:00:00Z");
    const end = Date.parse("2040-01-01T00:00:00Z");
    const rahu = computePlanetTimeline("rahu", start, end);
    const ketu = computePlanetTimeline("ketu", start, end);
    expect(stations(rahu)).toHaveLength(0);
    expect(rahu.initialRetrograde).toBe(true);
    expect(ingresses(rahu).every((event) => event.retrograde)).toBe(true);
    expect((ketu.initialSign - rahu.initialSign + 12) % 12).toBe(6);
    // About 18.6 years per circuit: 40 years hold 25 or 26 sign changes.
    expect(ingresses(rahu).length).toBeGreaterThanOrEqual(25);
    expect(ingresses(rahu).length).toBeLessThanOrEqual(26);
  });

  it("never marks the Sun or the Moon retrograde", () => {
    const start = Date.parse("2026-01-01T00:00:00Z");
    const sun = computePlanetTimeline("sun", start, start + 400 * DAY_MS);
    expect(stations(sun)).toHaveLength(0);
    expect(sun.initialRetrograde).toBe(false);
    expect(ingresses(sun)).toHaveLength(13);

    const moon = computeMoonWindow(start, start + 30 * DAY_MS);
    expect(stations(moon)).toHaveLength(0);
    // 12 signs per sidereal month of 27.3 days.
    expect(ingresses(moon).length).toBeGreaterThanOrEqual(13);
    expect(ingresses(moon).length).toBeLessThanOrEqual(14);
  });
});

describe("range edges (review findings F1 and F2)", () => {
  it("finds a station in the first half step after the start", () => {
    // Twelve hours before Mercury turned direct on 1990-01-20.
    const start = Date.parse("1990-01-19T16:35:00Z");
    const timeline = computePlanetTimeline("mercury", start, start + 400 * DAY_MS);
    expect(timeline.initialRetrograde).toBe(true);
    const [first] = stations(timeline);
    expect(first.turns).toBe("direct");
    expect(Math.abs(first.ms - Date.parse("1990-01-20T04:30:00Z"))).toBeLessThan(60 * MINUTE_MS);
    const [opening] = motionSegments(timeline);
    expect(opening.retrograde).toBe(true);
    expect(opening.endMs - opening.startMs).toBeLessThan(DAY_MS);
  });

  it("finds a station in a range shorter than two sample steps", () => {
    const timeline = computePlanetTimeline(
      "mercury",
      Date.parse("2025-03-14T12:00:00Z"),
      Date.parse("2025-03-16T00:00:00Z"),
    );
    const found = stations(timeline);
    expect(found).toHaveLength(1);
    expect(found[0].turns).toBe("retrograde");
    expect(dayDistance(found[0].ms, "2025-03-15")).toBeLessThan(1);
  });

  it("stays consistent when a range starts at an ingress instant", () => {
    const year = computePlanetTimeline(
      "mercury",
      Date.parse("2025-01-01T00:00:00Z"),
      Date.parse("2025-03-01T00:00:00Z"),
    );
    const [ingress] = ingresses(year);
    for (const offset of [-1, 0, 1, 60_000]) {
      const start = ingress.ms + offset;
      const timeline = computePlanetTimeline("mercury", start, start + 40 * DAY_MS);
      const segments = motionSegments(timeline);
      for (const segment of segments) {
        const probe = Math.min(segment.endMs - 1, segment.startMs + 5 * MINUTE_MS);
        expect(signAt("mercury", probe), `offset ${offset}`).toBe(segment.signIndex);
      }
      let sign = timeline.initialSign;
      for (const event of ingresses(timeline)) {
        expect(event.fromSign).toBe(sign);
        sign = event.toSign;
      }
    }
  });

  it("matches the cross-checked Jupiter and mean-node fixtures", () => {
    const jupiter = ingresses(
      computePlanetTimeline("jupiter", Date.parse("2025-01-01T00:00:00Z"), Date.parse("2026-12-31T00:00:00Z")),
    );
    const rahu = ingresses(
      computePlanetTimeline("rahu", Date.parse("2025-01-01T00:00:00Z"), Date.parse("2025-12-31T00:00:00Z")),
    );
    const expectedJupiter = [
      ["2025-05-14T17:09:00Z", 2],
      ["2025-10-18T14:34:00Z", 3],
      ["2025-12-05T11:37:00Z", 2],
      ["2026-06-01T20:24:00Z", 3],
    ] as const;
    expectedJupiter.forEach(([instant, toSign], index) => {
      expect(Math.abs(jupiter[index].ms - Date.parse(instant))).toBeLessThan(10 * MINUTE_MS);
      expect(jupiter[index].toSign).toBe(toSign);
    });
    expect(Math.abs(rahu[0].ms - Date.parse("2025-05-18T14:04:00Z"))).toBeLessThan(10 * MINUTE_MS);
    expect(rahu[0].toSign).toBe(10);
  });
});
