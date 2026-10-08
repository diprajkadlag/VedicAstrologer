import { describe, expect, it } from "vitest";

import {
  calculateNavamsaChart,
  isVargottama,
  navamsaDegree,
  navamsaSignIndex,
} from "./divisional";
import {
  RASIS,
  calculateVedicChart,
  getNakshatra,
  type GrahaId,
  type VedicChart,
} from "./ephemeris";

const PART_DEG = 10 / 3;

/** Textbook counting, written out so it does not share code with the module. */
function classicalNavamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30);
  const part = Math.floor((longitude - sign * 30) / PART_DEG);
  // Movable signs start from themselves, fixed from the 9th, dual from the 5th.
  const start = [sign, (sign + 8) % 12, (sign + 4) % 12][sign % 3];
  return (start + part) % 12;
}

/** The ninth-division sign implied by a nakshatra and its quarter. */
function signFromNakshatraPada(longitude: number): number {
  const { index, pada } = getNakshatra(longitude);
  return (index * 4 + pada - 1) % 12;
}

describe("navamsaSignIndex", () => {
  it("agrees with the nakshatra quarter at part midpoints and just beside every boundary", () => {
    const longitudes: number[] = [];
    for (let i = 0; i < 1000; i += 1) longitudes.push((i + 0.5) * 0.36);
    for (let part = 0; part <= 108; part += 1) {
      longitudes.push(part * PART_DEG - 1e-9, part * PART_DEG + 1e-9);
    }

    const mismatches = longitudes
      .filter(
        (longitude) =>
          navamsaSignIndex(longitude) !== signFromNakshatraPada(longitude),
      )
      .map((longitude) => longitude.toFixed(9));

    expect(longitudes).toHaveLength(1000 + 2 * 109);
    expect(mismatches).toEqual([]);
  });

  it("follows the classical counting rule in all 108 parts", () => {
    for (let part = 0; part < 108; part += 1) {
      const middle = (part + 0.5) * PART_DEG;
      expect(navamsaSignIndex(middle), `part ${part + 1}`).toBe(
        classicalNavamsaSign(middle),
      );
    }
  });

  it("starts each sign from itself, the 9th sign or the 5th", () => {
    // Aries (movable), Taurus (fixed), Gemini (dual), then the pattern repeats.
    const firstPartOfEachSign = Array.from({ length: 12 }, (_, sign) =>
      navamsaSignIndex(sign * 30 + 0.01),
    );
    expect(firstPartOfEachSign).toEqual([0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3]);
  });

  it("wraps angles into 0…360 and never returns 12", () => {
    expect(navamsaSignIndex(0)).toBe(0);
    expect(navamsaSignIndex(360)).toBe(0);
    expect(navamsaSignIndex(720.5)).toBe(navamsaSignIndex(0.5));
    expect(navamsaSignIndex(-1)).toBe(navamsaSignIndex(359));
    // normalizeDegrees turns this into exactly 360, and 360 / (10 / 3) is
    // exactly 108: without the clamp this would fall into Aries, not Pisces.
    expect(navamsaSignIndex(-1e-15)).toBe(11);
    for (const longitude of [359.99999999999994, 1e-300, 119.99999999999999]) {
      const index = navamsaSignIndex(longitude);
      expect(Number.isInteger(index) && index >= 0 && index <= 11).toBe(true);
    }
  });

  it("rejects angles that are not finite", () => {
    expect(() => navamsaSignIndex(Number.NaN)).toThrow();
    expect(() => navamsaSignIndex(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("navamsaDegree", () => {
  it("scales the 3°20′ part to 0–30°", () => {
    expect(navamsaDegree(0)).toBe(0);
    expect(navamsaDegree(1)).toBeCloseTo(9, 12);
    expect(navamsaDegree(5)).toBeCloseTo(15, 12);
    expect(navamsaDegree(30 + PART_DEG * 4 + 0.5)).toBeCloseTo(4.5, 9);
  });

  it("stays below 30 everywhere, including the 360° edge", () => {
    for (let i = 0; i < 3600; i += 1) {
      const degree = navamsaDegree(i * 0.1 + 0.05);
      expect(degree).toBeGreaterThanOrEqual(0);
      expect(degree).toBeLessThan(30);
    }
    expect(navamsaDegree(-1e-15)).toBeLessThan(30);
    expect(navamsaDegree(359.99999999999994)).toBeLessThan(30);
  });
});

describe("isVargottama", () => {
  it("is true in the first part of an Aries, the fifth of a Taurus, the ninth of a Gemini", () => {
    expect(isVargottama(1)).toBe(true); // Aries, part 1
    expect(isVargottama(45)).toBe(true); // Taurus 15°, part 5
    expect(isVargottama(89)).toBe(true); // Gemini 29°, part 9
  });

  it("is false in other parts", () => {
    expect(isVargottama(4)).toBe(false); // Aries, part 2
    expect(isVargottama(35)).toBe(false); // Taurus, part 2
    expect(isVargottama(62)).toBe(false); // Gemini, part 1
  });

  it("holds for exactly one part in every sign, by modality", () => {
    const vargottamaPart = [1, 5, 9]; // movable, fixed, dual
    for (let sign = 0; sign < 12; sign += 1) {
      const parts = Array.from({ length: 9 }, (_, part) =>
        isVargottama(sign * 30 + (part + 0.5) * PART_DEG),
      );
      const where = parts.flatMap((value, part) => (value ? [part + 1] : []));
      expect(where, RASIS[sign]).toEqual([vargottamaPart[sign % 3]]);
    }
  });
});

describe("calculateNavamsaChart", () => {
  const birth = calculateVedicChart({
    instant: new Date("1990-05-15T05:00:00Z"),
    latitude: 18.5204,
    longitude: 73.8567,
  });

  // Cross-checked against Swiss Ephemeris 2.10.03 (Lahiri); the Moon, nearest
  // to a D9 boundary, is about 9.5′ from it.
  const EXPECTED: readonly (readonly [GrahaId, number, number, number])[] = [
    // body, D1 sign, D9 sign, D9 house (sign index 0 = Aries)
    ["sun", 1, 9, 7],
    ["moon", 8, 8, 6],
    ["mercury", 0, 4, 2],
    ["venus", 11, 8, 6],
    ["mars", 10, 1, 11],
    ["jupiter", 2, 10, 8],
    ["saturn", 9, 9, 7],
    ["rahu", 9, 2, 12],
    ["ketu", 3, 8, 6],
  ];

  const d9 = calculateNavamsaChart(birth);

  it("places the ascendant in the same sign in D1 and D9, as house 1", () => {
    expect(birth.ascendant.sign.index).toBe(3);
    expect(d9.ascendant.sign.index).toBe(3);
    expect(d9.ascendant.sign.name).toBe("Cancer");
    expect(d9.houses[0]).toMatchObject({ number: 1, sign: { index: 3 } });
    expect(isVargottama(birth.ascendant.siderealLongitudeDeg)).toBe(true);
  });

  it.each(EXPECTED)(
    "puts %s in D1 sign %i, D9 sign %i and D9 house %i",
    (id, d1Sign, d9Sign, d9House) => {
      const before = birth.planets.find((planet) => planet.id === id);
      const after = d9.planets.find((planet) => planet.id === id);
      expect(before?.sign.index).toBe(d1Sign);
      expect(after?.sign.index).toBe(d9Sign);
      expect(after?.sign.name).toBe(RASIS[d9Sign]);
      expect(after?.house).toBe(d9House);
    },
  );

  it("finds the ascendant, Moon and Saturn vargottama, and nothing else", () => {
    const vargottama = [
      ...(isVargottama(birth.ascendant.siderealLongitudeDeg)
        ? ["ascendant"]
        : []),
      ...birth.planets
        .filter((planet) => isVargottama(planet.siderealLongitudeDeg))
        .map((planet) => planet.id),
    ];
    expect(vargottama).toEqual(["ascendant", "moon", "saturn"]);
  });

  it("returns a new chart and leaves the birth chart alone", () => {
    const snapshot = structuredClone(birth);
    const result = calculateNavamsaChart(birth);

    expect(result).not.toBe(birth);
    expect(result.planets).not.toBe(birth.planets);
    expect(result.houses).not.toBe(birth.houses);
    expect(result.ascendant).not.toBe(birth.ascendant);
    expect(birth).toEqual(snapshot);
    expect(result).toEqual(d9);
  });

  it("keeps what describes the body rather than its D9 placement", () => {
    expect(d9.ascendant.nakshatra).toEqual(birth.ascendant.nakshatra);
    expect(d9.ascendant.siderealLongitudeDeg).toBe(
      birth.ascendant.siderealLongitudeDeg,
    );
    d9.planets.forEach((planet, index) => {
      const original = birth.planets[index];
      expect(planet.id).toBe(original.id);
      expect(planet.nakshatra).toEqual(original.nakshatra);
      expect(planet.siderealLongitudeDeg).toBe(original.siderealLongitudeDeg);
      expect(planet.speedDegPerDay).toBe(original.speedDegPerDay);
      expect(planet.motion).toBe(original.motion);
      expect(planet.retrograde).toBe(original.retrograde);
    });
    expect(d9.instant).toBe(birth.instant);
    expect(d9.location).toEqual(birth.location);
    expect(d9.ayanamsa).toEqual(birth.ayanamsa);
    expect(d9.accuracy).toEqual(birth.accuracy);
    expect([d9.coordinateSystem, d9.houseSystem, d9.nodeModel]).toEqual([
      "sidereal",
      "whole-sign",
      "mean",
    ]);
  });

  it("gives every body a 0–30° degree inside its D9 sign", () => {
    d9.planets.forEach((planet) => {
      expect(planet.sign.degreeDeg).toBeGreaterThanOrEqual(0);
      expect(planet.sign.degreeDeg).toBeLessThan(30);
      expect(planet.sign.degreeDeg).toBe(
        navamsaDegree(planet.siderealLongitudeDeg),
      );
    });
  });

  it("rebuilds twelve whole-sign houses from the D9 ascendant", () => {
    expect(d9.houses.map((house) => house.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    d9.houses.forEach((house, index) => {
      const signIndex = (d9.ascendant.sign.index + index) % 12;
      expect(house.sign).toEqual({ index: signIndex, name: RASIS[signIndex] });
      expect(house.siderealStartLongitudeDeg).toBe(signIndex * 30);
      expect(house.planets).toEqual(
        d9.planets
          .filter((planet) => planet.house === house.number)
          .map((planet) => planet.id),
      );
    });
    expect(d9.houses.flatMap((house) => house.planets).sort()).toEqual(
      birth.planets.map((planet) => planet.id).sort(),
    );
  });

  it("holds for charts across many dates and places", () => {
    const places = [
      { latitude: 18.5204, longitude: 73.8567 },
      { latitude: 52.52, longitude: 13.405 },
      { latitude: -33.8688, longitude: 151.2093 },
    ];
    for (const place of places) {
      for (let day = 0; day < 365 * 6; day += 29) {
        const chart = calculateVedicChart({
          instant: new Date(Date.UTC(2020, 0, 1 + day, 3, 17)),
          ...place,
        });
        const result = calculateNavamsaChart(chart);
        const ascendantSign = classicalNavamsaSign(
          chart.ascendant.siderealLongitudeDeg,
        );

        expect(result.ascendant.sign.index).toBe(ascendantSign);
        result.planets.forEach((planet, index) => {
          const longitude = chart.planets[index].siderealLongitudeDeg;
          const expectedSign = classicalNavamsaSign(longitude);
          const label = `${planet.id} at ${longitude} on ${chart.instant}`;
          expect(planet.sign.index, label).toBe(expectedSign);
          expect(planet.house, label).toBe(
            ((expectedSign - ascendantSign + 12) % 12) + 1,
          );
          expect(isVargottama(longitude), label).toBe(
            chart.planets[index].sign.index === expectedSign,
          );
        });
      }
    }
  });
});
