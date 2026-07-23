import { describe, expect, it } from "vitest";

import { calculateVedicChart, type VedicChart } from "./astro/ephemeris";
import { RASI_DISPLAY_NAMES_ORDERED } from "./astro/display";
import {
  TRANSIT_SCORE_BASELINE,
  TRANSIT_SCORE_MAX,
  TRANSIT_SCORE_MIN,
  calculateTransitAnalysis,
  relativeWholeSignHouse,
  transitScoreBand,
  type TransitRuleReason,
} from "./transits";

const NATAL_INSTANT = new Date("1990-01-15T04:30:00.000Z");
const AS_OF = new Date("2026-07-22T12:00:00.000Z");
const DELHI = { latitude: 28.6139, longitude: 77.209, elevationMeters: 216 };

function natalChart(): VedicChart {
  return calculateVedicChart({ instant: NATAL_INSTANT, ...DELHI });
}

function expectedScore(reasons: readonly TransitRuleReason[]): number {
  const raw = TRANSIT_SCORE_BASELINE + reasons.reduce(
    (total, reason) => total + reason.contribution,
    0,
  );
  return Math.max(TRANSIT_SCORE_MIN, Math.min(TRANSIT_SCORE_MAX, Math.round(raw)));
}

describe("relativeWholeSignHouse", () => {
  it("counts the reference sign as house one", () => {
    expect(relativeWholeSignHouse(0, 0)).toBe(1);
    expect(relativeWholeSignHouse(7, 7)).toBe(1);
    expect(relativeWholeSignHouse(11, 11)).toBe(1);
  });

  it("wraps forward across Pisces and backward to house twelve", () => {
    expect(relativeWholeSignHouse(0, 11)).toBe(2);
    expect(relativeWholeSignHouse(1, 11)).toBe(3);
    expect(relativeWholeSignHouse(11, 0)).toBe(12);
    expect(relativeWholeSignHouse(10, 1)).toBe(10);
  });

  it("rejects non-integer and out-of-range sign indexes", () => {
    expect(() => relativeWholeSignHouse(-1, 0)).toThrow(RangeError);
    expect(() => relativeWholeSignHouse(12, 0)).toThrow(RangeError);
    expect(() => relativeWholeSignHouse(1.5, 0)).toThrow(RangeError);
    expect(() => relativeWholeSignHouse(0, Number.NaN)).toThrow(RangeError);
  });
});

describe("calculateTransitAnalysis", () => {
  it("is deterministic for an identical chart, instant, and observer", () => {
    const natal = natalChart();
    const first = calculateTransitAnalysis({ natalChart: natal, asOf: AS_OF });
    const second = calculateTransitAnalysis({ natalChart: natal, asOf: new Date(AS_OF) });

    expect(second).toEqual(first);
    expect(first.asOf).toBe(AS_OF.toISOString());
    expect(first.natalInstant).toBe(NATAL_INSTANT.toISOString());
    expect(first.observerLocation).toEqual(DELHI);
    expect(first.metadata.ruleSet).toBe("gochara-v1");
  });

  it("maps every transit graha from natal Lagna and Janma Rasi", () => {
    const natal = natalChart();
    const result = calculateTransitAnalysis({ natalChart: natal, asOf: AS_OF });
    const natalMoon = natal.planets.find((planet) => planet.id === "moon")!;

    expect(result.positions).toHaveLength(9);
    expect(result.positions.map((planet) => planet.id)).toEqual([
      "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu",
    ]);

    for (const position of result.positions) {
      expect(RASI_DISPLAY_NAMES_ORDERED).toContain(position.sign);
      expect(position.houseFromLagna).toBe(
        relativeWholeSignHouse(position.signIndex, natal.ascendant.sign.index),
      );
      expect(position.houseFromMoon).toBe(
        relativeWholeSignHouse(position.signIndex, natalMoon.sign.index),
      );
      expect(position.houseFromLagna).toBeGreaterThanOrEqual(1);
      expect(position.houseFromLagna).toBeLessThanOrEqual(12);
      expect(position.houseFromMoon).toBeGreaterThanOrEqual(1);
      expect(position.houseFromMoon).toBeLessThanOrEqual(12);
    }
    expect(JSON.stringify(result)).not.toMatch(/"(?:Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)"/u);
  });

  it("returns bounded daily and monthly scores derived exactly from named reasons", () => {
    const result = calculateTransitAnalysis({ natalChart: natalChart(), asOf: AS_OF });

    for (const insight of [result.daily, result.monthly]) {
      expect(insight.baseline).toBe(TRANSIT_SCORE_BASELINE);
      expect(insight.score).toBe(expectedScore(insight.reasons));
      expect(insight.score).toBeGreaterThanOrEqual(TRANSIT_SCORE_MIN);
      expect(insight.score).toBeLessThanOrEqual(TRANSIT_SCORE_MAX);
      expect(insight.reasons.length).toBeGreaterThanOrEqual(3);
      expect(new Set(insight.reasons.map((reason) => reason.ruleId)).size).toBe(
        insight.reasons.length,
      );
      expect(insight.reasons.every((reason) => reason.explanation.length > 20)).toBe(true);
      expect(insight.focus.length).toBeGreaterThan(1);
    }

    const transitMoon = result.positions.find((planet) => planet.id === "moon")!;
    expect(result.daily.moonHouseFromJanmaRasi).toBe(transitMoon.houseFromMoon);
    expect(result.daily.moonNakshatra).toBe(transitMoon.nakshatra);
    expect(result.monthly.reasons.some((reason) => reason.ruleId.startsWith("monthly.sun"))).toBe(true);
    expect(result.monthly.reasons.some((reason) => reason.ruleId.startsWith("monthly.mercury"))).toBe(true);
  });

  it("returns explicit Saturn and Jupiter natal-house activation notices", () => {
    const result = calculateTransitAnalysis({ natalChart: natalChart(), asOf: AS_OF });

    for (const id of ["jupiter", "saturn"] as const) {
      const position = result.positions.find((planet) => planet.id === id)!;
      const notice = result.majorTransits[id];
      expect(notice.planet).toBe(id);
      expect(notice.sign).toBe(position.sign);
      expect(notice.houseFromLagna).toBe(position.houseFromLagna);
      expect(notice.houseFromJanmaRasi).toBe(position.houseFromMoon);
      expect(notice.score).toBe(expectedScore(notice.reasons));
      expect(notice.score).toBeGreaterThanOrEqual(0);
      expect(notice.score).toBeLessThanOrEqual(100);
      expect(notice.reasons.some((reason) => reason.ruleId.includes("moon-house"))).toBe(true);
      expect(notice.reasons.some((reason) => reason.ruleId.includes("lagna-house"))).toBe(true);
      expect(["background", "notable", "major"]).toContain(notice.intensity);
      expect(notice.activatedLagnaTheme.length).toBeGreaterThan(3);
      expect(notice.activatedMoonTheme.length).toBeGreaterThan(3);
    }
  });

  it("supports deterministic selected past and future dates and an observer override", () => {
    const natal = natalChart();
    const past = calculateTransitAnalysis({
      natalChart: natal,
      asOf: "1980-02-29",
      location: { latitude: 51.5074, longitude: -0.1278 },
    });
    const future = calculateTransitAnalysis({ natalChart: natal, asOf: "2099-12-31T23:59:59+05:30" });

    expect(past.asOf).toBe("1980-02-29T00:00:00.000Z");
    expect(past.observerLocation).toEqual({ latitude: 51.5074, longitude: -0.1278, elevationMeters: 0 });
    expect(future.asOf).toBe("2099-12-31T18:29:59.000Z");
    expect(past.positions).toHaveLength(9);
    expect(future.positions).toHaveLength(9);
  });

  it("rejects invalid or host-timezone-dependent asOf values", () => {
    const natal = natalChart();
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: new Date(Number.NaN) })).toThrow(TypeError);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: "not-a-date" })).toThrow(TypeError);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: "2026-02-30" })).toThrow(/real calendar date/);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: "2026-02-30T00:00:00Z" })).toThrow(/real calendar date/);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: "2026-07-22T24:00:00Z" })).toThrow(/real clock time/);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: "2026-07-22T12:00:00" })).toThrow(/explicit UTC offset/);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: new Date("4001-01-01T00:00:00Z") })).toThrow(RangeError);
  });

  it("validates the natal chart epoch, coordinate contract, planets, and location", () => {
    const natal = natalChart();
    const invalidEpoch = { ...natal, instant: "2020-01-01T12:00:00" } as VedicChart;
    const tropical = { ...natal, coordinateSystem: "tropical" } as unknown as VedicChart;
    const missingMoon = {
      ...natal,
      planets: natal.planets.filter((planet) => planet.id !== "moon"),
    };

    expect(() => calculateTransitAnalysis({ natalChart: invalidEpoch, asOf: AS_OF })).toThrow(/explicit UTC offset/);
    expect(() => calculateTransitAnalysis({ natalChart: tropical, asOf: AS_OF })).toThrow(/sidereal/);
    expect(() => calculateTransitAnalysis({ natalChart: missingMoon, asOf: AS_OF })).toThrow(/missing the moon/);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: AS_OF, location: { latitude: 90, longitude: 0 } })).toThrow(RangeError);
    expect(() => calculateTransitAnalysis({ natalChart: natal, asOf: AS_OF, location: { latitude: 0, longitude: 181 } })).toThrow(RangeError);
  });
});

describe("transitScoreBand", () => {
  it("uses stable inclusive thresholds", () => {
    expect(transitScoreBand(0)).toBe("intensive");
    expect(transitScoreBand(34)).toBe("intensive");
    expect(transitScoreBand(35)).toBe("reflective");
    expect(transitScoreBand(50)).toBe("steady");
    expect(transitScoreBand(65)).toBe("supportive");
    expect(transitScoreBand(80)).toBe("highly-supportive");
    expect(transitScoreBand(100)).toBe("highly-supportive");
    expect(() => transitScoreBand(-1)).toThrow(RangeError);
    expect(() => transitScoreBand(101)).toThrow(RangeError);
  });
});
