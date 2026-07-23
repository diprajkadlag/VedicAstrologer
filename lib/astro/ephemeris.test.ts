import { describe, expect, it } from "vitest";
import { Rotation_ECT_EQD, SiderealTime } from "astronomy-engine";

import {
  calculateLahiriAyanamsa,
  calculateGrahaTrajectories,
  calculateVedicChart,
  eclipticToUnitVector,
  getNakshatra,
  getRasi,
  normalizeDegrees,
  signedAngularDelta,
} from "./ephemeris";

const DELHI = { latitude: 28.6139, longitude: 77.209 };
const NEW_YORK = { latitude: 40.7128, longitude: -74.006 };

function angleDistance(a: number, b: number): number {
  return Math.abs(signedAngularDelta(a, b));
}

describe("angle and zodiac helpers", () => {
  it("normalizes and unwraps circular angles", () => {
    expect(normalizeDegrees(-1)).toBe(359);
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(721)).toBe(1);
    expect(signedAngularDelta(359, 1)).toBe(2);
    expect(signedAngularDelta(1, 359)).toBe(-2);
  });

  it("classifies rasi boundaries", () => {
    expect(getRasi(0)).toMatchObject({ index: 0, name: "Aries", degreeDeg: 0 });
    expect(getRasi(29.999).name).toBe("Aries");
    expect(getRasi(30)).toMatchObject({ index: 1, name: "Taurus", degreeDeg: 0 });
    expect(getRasi(359.999).name).toBe("Pisces");
  });

  it("classifies nakshatra and pada boundaries", () => {
    const segment = 360 / 27;
    const pada = segment / 4;

    expect(getNakshatra(0)).toMatchObject({
      index: 0,
      name: "Ashwini",
      lord: "ketu",
      pada: 1,
    });
    expect(getNakshatra(pada)).toMatchObject({ index: 0, pada: 2 });
    expect(getNakshatra(segment)).toMatchObject({
      index: 1,
      name: "Bharani",
      lord: "venus",
      pada: 1,
    });
    expect(getNakshatra(359.999)).toMatchObject({
      index: 26,
      name: "Revati",
      pada: 4,
    });
  });

  it("maps ecliptic angles to a unit vector", () => {
    expect(eclipticToUnitVector(0, 0)).toEqual({ x: 1, y: 0, z: 0 });
    const vector = eclipticToUnitVector(123, -18);
    expect(Math.hypot(vector.x, vector.y, vector.z)).toBeCloseTo(1, 12);
  });
});

describe("Lahiri ayanamsa", () => {
  it("matches published mean IAE reference values", () => {
    const j2000 = calculateLahiriAyanamsa(
      new Date("2000-01-01T12:00:00.000Z"),
    );
    const in2019 = calculateLahiriAyanamsa(
      new Date("2019-01-01T12:00:00.000Z"),
    );
    const in2020 = calculateLahiriAyanamsa(
      new Date("2020-01-01T12:00:00.000Z"),
    );

    expect(j2000.meanDegrees).toBeCloseTo(23 + 51 / 60 + 25.5324 / 3600, 5);
    expect(in2019.meanDegrees).toBeCloseTo(24 + 7 / 60 + 21.1353 / 3600, 5);
    expect(in2020.meanDegrees).toBeCloseTo(24 + 8 / 60 + 11.3962 / 3600, 5);
    expect(in2020.meanDegrees).toBeGreaterThan(in2019.meanDegrees);
  });

  it("reports the nutation correction used with true-equinox positions", () => {
    const ayanamsa = calculateLahiriAyanamsa(
      new Date("2024-04-08T18:00:00.000Z"),
    );

    expect(Math.abs(ayanamsa.nutationLongitudeDegrees)).toBeLessThan(0.006);
    expect(
      angleDistance(
        ayanamsa.trueDegrees,
        ayanamsa.meanDegrees + ayanamsa.nutationLongitudeDegrees,
      ),
    ).toBeLessThan(1e-10);
  });
});

describe("Vedic chart calculation", () => {
  const instant = new Date("2024-04-08T18:00:00.000Z");

  it("returns complete, finite sidereal placements and whole-sign houses", () => {
    const chart = calculateVedicChart({ instant, ...DELHI });

    expect(chart.planets).toHaveLength(9);
    expect(chart.houses).toHaveLength(12);
    expect(chart.houseSystem).toBe("whole-sign");
    expect(chart.nodeModel).toBe("mean");

    for (const planet of chart.planets) {
      expect(planet.siderealLongitudeDeg).toBeGreaterThanOrEqual(0);
      expect(planet.siderealLongitudeDeg).toBeLessThan(360);
      expect(planet.sign.index).toBeGreaterThanOrEqual(0);
      expect(planet.sign.index).toBeLessThan(12);
      expect(planet.nakshatra.index).toBeGreaterThanOrEqual(0);
      expect(planet.nakshatra.index).toBeLessThan(27);
      expect(planet.nakshatra.pada).toBeGreaterThanOrEqual(1);
      expect(planet.nakshatra.pada).toBeLessThanOrEqual(4);
      expect(planet.house).toBeGreaterThanOrEqual(1);
      expect(planet.house).toBeLessThanOrEqual(12);
      expect(Number.isFinite(planet.speedDegPerDay)).toBe(true);

      const expectedHouse =
        ((planet.sign.index - chart.ascendant.sign.index + 12) % 12) + 1;
      expect(planet.house).toBe(expectedHouse);
    }
  });

  it("keeps mean Rahu and Ketu opposite and retrograde", () => {
    const chart = calculateVedicChart({ instant, ...DELHI });
    const rahu = chart.planets.find((planet) => planet.id === "rahu")!;
    const ketu = chart.planets.find((planet) => planet.id === "ketu")!;

    expect(angleDistance(rahu.siderealLongitudeDeg, ketu.siderealLongitudeDeg)).toBeCloseTo(
      180,
      10,
    );
    expect(rahu.speedDegPerDay).toBeLessThan(0);
    expect(ketu.speedDegPerDay).toBeLessThan(0);
    expect(rahu.retrograde).toBe(true);
    expect(ketu.retrograde).toBe(true);
  });

  it("uses location for the ascendant but not geocentric graha longitudes", () => {
    const delhi = calculateVedicChart({ instant, ...DELHI });
    const newYork = calculateVedicChart({ instant, ...NEW_YORK });

    for (const planet of delhi.planets) {
      const other = newYork.planets.find((candidate) => candidate.id === planet.id)!;
      expect(angleDistance(planet.siderealLongitudeDeg, other.siderealLongitudeDeg)).toBeLessThan(
        1e-10,
      );
    }

    expect(
      angleDistance(
        delhi.ascendant.siderealLongitudeDeg,
        newYork.ascendant.siderealLongitudeDeg,
      ),
    ).toBeGreaterThan(1);
  });

  it("selects the eastern horizon root for the ascendant", () => {
    const chart = calculateVedicChart({ instant, ...DELHI });
    const radians = Math.PI / 180;
    const localSiderealAngle =
      normalizeDegrees(SiderealTime(instant) * 15 + DELHI.longitude) * radians;
    const obliquityRotation = Rotation_ECT_EQD(instant).rot;
    const trueObliquity = Math.atan2(
      obliquityRotation[1][2],
      obliquityRotation[1][1],
    );
    const latitude = DELHI.latitude * radians;
    const closedFormAscendant = normalizeDegrees(
      Math.atan2(
        Math.cos(localSiderealAngle),
        -(
          Math.sin(localSiderealAngle) * Math.cos(trueObliquity) +
          Math.tan(latitude) * Math.sin(trueObliquity)
        ),
      ) / radians,
    );

    expect(
      angleDistance(chart.ascendant.tropicalLongitudeDeg, closedFormAscendant),
    ).toBeLessThan(1e-10);
  });

  it("detects a known Mercury retrograde interval without wraparound spikes", () => {
    const chart = calculateVedicChart({ instant, ...DELHI });
    const mercury = chart.planets.find((planet) => planet.id === "mercury")!;
    const moon = chart.planets.find((planet) => planet.id === "moon")!;

    expect(mercury.motion).toBe("retrograde");
    expect(mercury.speedDegPerDay).toBeGreaterThan(-5);
    expect(moon.motion).toBe("direct");
    expect(moon.speedDegPerDay).toBeGreaterThan(10);
    expect(moon.speedDegPerDay).toBeLessThan(16);
    expect(
      angleDistance(
        chart.planets.find((planet) => planet.id === "sun")!
          .siderealLongitudeDeg,
        moon.siderealLongitudeDeg,
      ),
    ).toBeLessThan(0.25);
  });

  it("samples real geocentric trails centered on the chart instant", () => {
    const chart = calculateVedicChart({ instant, ...DELHI });
    const trajectories = calculateGrahaTrajectories(
      { instant, ...DELHI },
      { samples: 5 },
    );

    expect(trajectories).toHaveLength(9);
    for (const trajectory of trajectories) {
      expect(trajectory.points).toHaveLength(5);
      const center = trajectory.points[2];
      const planet = chart.planets.find((candidate) => candidate.id === trajectory.id)!;
      expect(center.instant).toBe(instant.toISOString());
      expect(angleDistance(center.siderealLongitudeDeg, planet.siderealLongitudeDeg)).toBeLessThan(1e-10);
      expect(center.eclipticLatitudeDeg).toBeCloseTo(planet.eclipticLatitudeDeg, 10);
    }

    expect(() =>
      calculateGrahaTrajectories({ instant, ...DELHI }, { samples: 4 }),
    ).toThrow(/odd integer/);
  });

  it("rejects invalid time and observer coordinates", () => {
    expect(() =>
      calculateVedicChart({ instant: new Date(Number.NaN), ...DELHI }),
    ).toThrow(/valid Date/);
    expect(() =>
      calculateVedicChart({ instant, latitude: 90, longitude: 0 }),
    ).toThrow(/strictly between/);
    expect(() =>
      calculateVedicChart({ instant, latitude: 0, longitude: 181 }),
    ).toThrow(/between -180 and 180/);
  });
});
