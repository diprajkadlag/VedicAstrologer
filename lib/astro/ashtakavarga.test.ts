import { describe, expect, it } from "vitest";

import {
  ASHTAKAVARGA_PLANETS,
  BHINNASHTAKAVARGA_TOTALS,
  SARVASHTAKAVARGA_TOTAL,
  calculateAshtakavarga,
} from "./ashtakavarga";
import { calculateVedicChart, type GrahaId, type VedicChart } from "./ephemeris";

/** A chart reduced to what Ashtakavarga reads: the sign of each reference. */
function chartFromSigns(lagna: number, signs: Partial<Record<GrahaId, number>>): VedicChart {
  return {
    ascendant: { sign: { index: lagna } },
    planets: Object.entries(signs).map(([id, index]) => ({ id, sign: { index } })),
  } as unknown as VedicChart;
}

/**
 * B. V. Raman's Standard Horoscope (Ashtakavarga System of Prediction,
 * ch. II): 16 October 1918, 2:00 PM LMT, Bangalore. Signs: Sun and Venus
 * Virgo, Moon Aquarius, Mars Scorpio, Mercury Libra, Jupiter Gemini, Saturn
 * Leo, Lagna Capricorn.
 */
const STANDARD_SIGNS = {
  sun: 5,
  moon: 10,
  mars: 7,
  mercury: 6,
  jupiter: 2,
  venus: 5,
  saturn: 4,
} as const;
const STANDARD_LAGNA = 9;

/**
 * The published tables, Aries to Pisces. Venus differs from the publication
 * in Aquarius (5, published 4) and Pisces (5, published 6): Raman follows the
 * Brihat Jataka reading of Venus-from-Mars, this app the Parashara reading
 * (see BENEFIC_PLACES). Sarvashtakavarga changes by the same two points.
 */
const EXPECTED = {
  sun: [5, 3, 5, 4, 4, 4, 3, 5, 5, 0, 5, 5],
  moon: [5, 3, 5, 5, 3, 2, 3, 4, 6, 5, 3, 5],
  mars: [4, 3, 4, 3, 4, 1, 1, 5, 3, 2, 5, 4],
  mercury: [4, 6, 4, 5, 5, 5, 3, 6, 4, 4, 5, 3],
  jupiter: [3, 4, 7, 6, 4, 4, 6, 4, 5, 5, 4, 4],
  venus: [7, 4, 4, 3, 3, 4, 5, 3, 4, 5, 5, 5],
  saturn: [5, 2, 4, 4, 3, 3, 5, 2, 3, 3, 1, 4],
} as const;
const EXPECTED_SARVA = [33, 25, 33, 30, 26, 23, 26, 29, 30, 24, 28, 30];

describe("calculateAshtakavarga", () => {
  it("reproduces Raman's Standard Horoscope", () => {
    const result = calculateAshtakavarga(chartFromSigns(STANDARD_LAGNA, STANDARD_SIGNS));
    for (const planet of ASHTAKAVARGA_PLANETS) {
      expect(result.bhinna[planet]).toEqual(EXPECTED[planet]);
    }
    expect(result.sarva).toEqual(EXPECTED_SARVA);
  });

  it("finds the same signs from the app's own ephemeris", () => {
    const chart = calculateVedicChart({
      instant: new Date("1918-10-16T08:50:00.000Z"),
      latitude: 12.97,
      longitude: 77.59,
    });
    expect(chart.ascendant.sign.index).toBe(STANDARD_LAGNA);
    for (const [id, index] of Object.entries(STANDARD_SIGNS)) {
      expect(chart.planets.find((planet) => planet.id === id)!.sign.index).toBe(index);
    }
    expect(calculateAshtakavarga(chart).sarva).toEqual(EXPECTED_SARVA);
  });

  it("keeps the published totals for any chart", () => {
    const charts = [
      chartFromSigns(0, { sun: 0, moon: 0, mars: 0, mercury: 0, jupiter: 0, venus: 0, saturn: 0 }),
      chartFromSigns(7, { sun: 3, moon: 11, mars: 5, mercury: 2, jupiter: 9, venus: 1, saturn: 6 }),
    ];
    for (const chart of charts) {
      const result = calculateAshtakavarga(chart);
      for (const planet of ASHTAKAVARGA_PLANETS) {
        const total = result.bhinna[planet].reduce((sum, value) => sum + value, 0);
        expect(total).toBe(BHINNASHTAKAVARGA_TOTALS[planet]);
        expect(Math.max(...result.bhinna[planet])).toBeLessThanOrEqual(8);
        result.sources[planet].forEach((givers, sign) => {
          expect(givers).toHaveLength(result.bhinna[planet][sign]);
        });
      }
      expect(result.sarva.reduce((sum, value) => sum + value, 0)).toBe(SARVASHTAKAVARGA_TOTAL);
    }
  });

  it("rejects a chart without one of the seven planets", () => {
    expect(() => calculateAshtakavarga(chartFromSigns(0, { sun: 0 }))).toThrow(/missing moon/);
  });
});
