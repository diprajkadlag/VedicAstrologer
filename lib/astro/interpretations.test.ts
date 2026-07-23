import { describe, expect, it } from "vitest";

import {
  GRAHA_ARCHETYPES,
  HOUSE_MEANINGS,
  NAKSHATRA_PROFILES,
  PLANET_IN_HOUSE_EFFECTS,
  VIMSHOTTARI_SEQUENCE,
  VIMSHOTTARI_TOTAL_YEARS,
  VIMSHOTTARI_YEAR_MS,
  analyzeVedicChart,
  buildHouseAnalyses,
  calculateVimshottariTimeline,
  formatDegreeMinute,
  getCoreSummary,
  getNakshatraProfile,
  getPlanetPositionRows,
  interpretPlanetInHouse,
  interpretDashaCombination,
  synthesizePersonality,
} from "./interpretations";
import {
  GRAHA_IDS,
  NAKSHATRAS,
  calculateVedicChart,
  getNakshatra,
  type HouseNumber,
} from "./ephemeris";
import { getRasiDisplayName } from "./display";

const BIRTH = new Date("2000-01-01T00:00:00.000Z");
const NAKSHATRA_DEGREES = 360 / 27;

function afterDashaYears(years: number): Date {
  return new Date(BIRTH.getTime() + years * VIMSHOTTARI_YEAR_MS);
}

describe("interpretation reference data", () => {
  it("defines all twelve houses in canonical order", () => {
    expect(HOUSE_MEANINGS).toHaveLength(12);
    expect(HOUSE_MEANINGS.map((house) => house.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const house of HOUSE_MEANINGS) {
      expect(house.summary.length).toBeGreaterThan(80);
      expect(house.significations.length).toBeGreaterThanOrEqual(5);
      expect(house.growthQuestion.endsWith("?")).toBe(true);
    }
  });

  it("provides a meaningful house effect for every graha-house pair", () => {
    for (const graha of GRAHA_IDS) {
      expect(PLANET_IN_HOUSE_EFFECTS[graha]).toHaveLength(12);
      expect(GRAHA_ARCHETYPES[graha].domain.length).toBeGreaterThan(12);
      for (let number = 1; number <= 12; number += 1) {
        const interpretation = interpretPlanetInHouse(graha, number as HouseNumber);
        expect(interpretation.effect.length).toBeGreaterThan(70);
        expect(interpretation.planet.id).toBe(graha);
        expect(interpretation.house.number).toBe(number);
        expect(interpretation.synthesis).toContain(interpretation.planet.name);
      }
    }
  });

  it("defines all 27 nakshatras aligned with the ephemeris order", () => {
    expect(NAKSHATRA_PROFILES).toHaveLength(27);
    expect(NAKSHATRA_PROFILES.map((profile) => profile.name)).toEqual([...NAKSHATRAS]);
    expect(new Set(NAKSHATRA_PROFILES.map((profile) => profile.name))).toHaveLength(27);
    for (const profile of NAKSHATRA_PROFILES) {
      expect(getNakshatraProfile(profile.index)).toEqual(profile);
      expect(getNakshatraProfile(profile.name)).toEqual(profile);
      expect(
        getNakshatra((profile.index + 0.5) * NAKSHATRA_DEGREES).lord,
      ).toBe(profile.lord);
      expect(profile.gifts).toHaveLength(3);
      expect(profile.shadows).toHaveLength(2);
    }
  });

  it("rejects unknown nakshatra lookups", () => {
    expect(() => getNakshatraProfile(27)).toThrow(RangeError);
    expect(() => getNakshatraProfile(-1)).toThrow(RangeError);
  });
});

describe("chart analysis", () => {
  const chart = calculateVedicChart({
    instant: new Date("1990-07-12T09:30:00.000Z"),
    latitude: 28.6139,
    longitude: 77.209,
  });

  it("builds core placements and an Ascendant-Moon synthesis", () => {
    const core = getCoreSummary(chart);
    const moon = chart.planets.find((planet) => planet.id === "moon")!;
    expect(core.ascendant.sign).toBe(chart.ascendant.sign.name);
    expect(core.sun.label).toBe("Sun");
    expect(core.moon.nakshatra).toBe(moon.nakshatra.name);
    expect(core.birthNakshatra.name).toBe(moon.nakshatra.name);
    expect(core.personality.headline).toContain(
      getRasiDisplayName(chart.ascendant.sign.name),
    );
    expect(core.personality.headline).toContain(moon.nakshatra.name);
    expect(core.personality.strengths.length).toBeGreaterThanOrEqual(4);
  });

  it("creates one detailed row per canonical graha", () => {
    const rows = getPlanetPositionRows(chart);
    expect(rows).toHaveLength(9);
    expect(rows.map((row) => row.id)).toEqual([...GRAHA_IDS]);
    for (const row of rows) {
      expect(row.degreeMinute).toMatch(/^\d{1,2}° \d{2}′$/);
      expect(row.house).toBeGreaterThanOrEqual(1);
      expect(row.house).toBeLessThanOrEqual(12);
      expect(row.nakshatraLord).toBe(getNakshatraProfile(row.nakshatra).lord);
    }
  });

  it("creates all house analyses and resident-planet effects", () => {
    const houses = buildHouseAnalyses(chart);
    expect(houses).toHaveLength(12);
    expect(houses.flatMap((house) => house.planets)).toHaveLength(9);
    for (const house of houses) {
      expect(house.planetEffects).toHaveLength(house.planets.length);
      expect(house.summary.length).toBeGreaterThan(30);
      for (const effect of house.planetEffects) expect(effect.house.number).toBe(house.number);
    }
  });

  it("assembles deterministic complete analysis for an explicit asOf instant", () => {
    const asOf = new Date("2026-07-22T00:00:00.000Z");
    const first = analyzeVedicChart(chart, new Date(chart.instant), asOf);
    const second = analyzeVedicChart(chart, chart.instant, asOf.toISOString());
    expect(second).toEqual(first);
    expect(first.positions).toHaveLength(9);
    expect(first.houses).toHaveLength(12);
    expect(first.dashas.currentMahadasha.isCurrent).toBe(true);
    expect(first.dashas.currentAntardasha.isCurrent).toBe(true);
  });

  it("rejects a simulated chart paired with a different natal instant", () => {
    expect(() =>
      analyzeVedicChart(
        chart,
        new Date(Date.parse(chart.instant) + 60_000),
        new Date("2026-07-22T00:00:00.000Z"),
      ),
    ).toThrow(/match the chart instant/i);
  });

  it("formats sign-relative degrees without rounding into the next sign", () => {
    expect(formatDegreeMinute(0)).toBe("0° 00′");
    expect(formatDegreeMinute(12.5)).toBe("12° 30′");
    expect(formatDegreeMinute(29.999999)).toBe("29° 59′");
    expect(formatDegreeMinute(42.5)).toBe("12° 30′");
    expect(() => formatDegreeMinute(Number.NaN)).toThrow(TypeError);
  });

  it("synthesizes every Ascendant with every Moon nakshatra", () => {
    const signs = chart.houses.map((house) => house.sign.name);
    for (const sign of signs) {
      for (const nakshatra of NAKSHATRAS) {
        const personality = synthesizePersonality(sign, nakshatra);
        expect(personality.summary.length).toBeGreaterThan(100);
        expect(personality.ascendantSign).toBe(sign);
        expect(personality.moonNakshatra).toBe(nakshatra);
      }
    }
  });
});

describe("Vimshottari Dasha calculation", () => {
  it("builds a meaningful explanation for every major/minor combination", () => {
    for (const major of VIMSHOTTARI_SEQUENCE) {
      for (const minor of VIMSHOTTARI_SEQUENCE) {
        const meaning = interpretDashaCombination(major.lord, minor.lord);
        expect(meaning.majorLord).toBe(major.lord);
        expect(meaning.minorLord).toBe(minor.lord);
        expect(meaning.headline).toContain("Mahadasha");
        expect(meaning.headline).toContain("Antardasha");
        expect(meaning.summary.length).toBeGreaterThan(150);
        expect(meaning.constructivePotential.length).toBeGreaterThan(100);
        expect(meaning.reflection.endsWith("?")).toBe(true);
      }
    }
  });

  it("uses the standard nine-lord sequence totaling 120 years", () => {
    expect(VIMSHOTTARI_SEQUENCE.map((period) => period.lord)).toEqual([
      "ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury",
    ]);
    expect(VIMSHOTTARI_SEQUENCE.reduce((sum, period) => sum + period.years, 0)).toBe(VIMSHOTTARI_TOTAL_YEARS);
  });

  it("starts a full Ketu Mahadasha at the beginning of Ashwini", () => {
    const timeline = calculateVimshottariTimeline({
      birthInstant: BIRTH,
      moonSiderealLongitudeDeg: 0,
      asOf: BIRTH,
    });
    expect(timeline.moonNakshatra).toBe("Ashwini");
    expect(timeline.birthMahadashaLord).toBe("ketu");
    expect(timeline.moonNakshatraProgress).toBe(0);
    expect(timeline.birthMahadashaElapsedYears).toBe(0);
    expect(timeline.birthMahadashaBalanceYears).toBe(7);
    expect(timeline.currentMahadasha.lord).toBe("ketu");
    expect(timeline.currentMahadasha.start).toBe(BIRTH.toISOString());
    expect(timeline.currentMahadasha.end).toBe(afterDashaYears(7).toISOString());
    expect(timeline.currentAntardasha.lord).toBe("ketu");
  });

  it("calculates proportional Mahadasha balance from exact nakshatra progress", () => {
    const timeline = calculateVimshottariTimeline({
      birthInstant: BIRTH,
      moonSiderealLongitudeDeg: NAKSHATRA_DEGREES / 2,
      asOf: BIRTH,
    });
    expect(timeline.moonNakshatraProgress).toBeCloseTo(0.5, 12);
    expect(timeline.birthMahadashaElapsedYears).toBeCloseTo(3.5, 12);
    expect(timeline.birthMahadashaBalanceYears).toBeCloseTo(3.5, 12);
    expect(timeline.currentAntardasha.lord).toBe("rahu");
    expect(Date.parse(timeline.currentMahadasha.start)).toBe(BIRTH.getTime() - 3.5 * VIMSHOTTARI_YEAR_MS);
    expect(Date.parse(timeline.currentMahadasha.end)).toBe(BIRTH.getTime() + 3.5 * VIMSHOTTARI_YEAR_MS);
    expect(timeline.currentMahadasha.containsBirth).toBe(true);
  });

  it("selects the correct lord and balance in a later nakshatra", () => {
    // Jyeshtha is Mercury-ruled and begins at index 17.
    const longitude = 17 * NAKSHATRA_DEGREES + NAKSHATRA_DEGREES / 4;
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: longitude, asOf: BIRTH });
    expect(timeline.moonNakshatra).toBe("Jyeshtha");
    expect(timeline.birthMahadashaLord).toBe("mercury");
    expect(timeline.birthMahadashaElapsedYears).toBeCloseTo(4.25, 10);
    expect(timeline.birthMahadashaBalanceYears).toBeCloseTo(12.75, 10);
  });

  it("treats an exact Mahadasha end as the next period's start", () => {
    const initial = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf: BIRTH });
    const boundary = new Date(initial.currentMahadasha.end);
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf: boundary });
    expect(timeline.currentMahadasha.lord).toBe("venus");
    expect(timeline.currentMahadasha.start).toBe(boundary.toISOString());
  });

  it("treats an exact Antardasha end as the next minor period's start", () => {
    const initial = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf: BIRTH });
    const firstMinor = initial.currentMahadasha.antardashas[0];
    const boundary = new Date(firstMinor.end);
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf: boundary });
    expect(timeline.currentMahadasha.lord).toBe("ketu");
    expect(timeline.currentAntardasha.lord).toBe("venus");
    expect(timeline.currentAntardasha.start).toBe(boundary.toISOString());
  });

  it("rotates Antardashas from the Mahadasha lord with exact proportional durations", () => {
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf: afterDashaYears(8) });
    const venus = timeline.currentMahadasha;
    expect(venus.lord).toBe("venus");
    expect(venus.antardashas.map((period) => period.lord)).toEqual([
      "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury", "ketu",
    ]);
    expect(venus.antardashas[0].durationYears).toBeCloseTo((20 * 20) / 120, 12);
    expect(venus.antardashas[1].durationYears).toBeCloseTo((20 * 6) / 120, 12);
    expect(venus.antardashas[0].start).toBe(venus.start);
    expect(venus.antardashas.at(-1)!.end).toBe(venus.end);
    expect(venus.antardashas.reduce((sum, period) => sum + period.durationYears, 0)).toBeCloseTo(20, 12);
  });

  it("returns a complete contiguous 120-year cycle", () => {
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf: afterDashaYears(50) });
    expect(timeline.mahadashas).toHaveLength(9);
    expect(timeline.mahadashas[0].start).toBe(timeline.cycleStart);
    expect(timeline.mahadashas.at(-1)!.end).toBe(timeline.cycleEnd);
    for (let index = 1; index < timeline.mahadashas.length; index += 1) {
      expect(timeline.mahadashas[index - 1].end).toBe(timeline.mahadashas[index].start);
    }
    expect(Date.parse(timeline.cycleEnd) - Date.parse(timeline.cycleStart)).toBe(VIMSHOTTARI_TOTAL_YEARS * VIMSHOTTARI_YEAR_MS);
  });

  it("repeats the sequence in the next cycle without boundary gaps", () => {
    const asOf = afterDashaYears(120);
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: 0, asOf });
    expect(timeline.cycleStart).toBe(asOf.toISOString());
    expect(timeline.currentMahadasha.lord).toBe("ketu");
    expect(timeline.currentAntardasha.lord).toBe("ketu");
  });

  it("normalizes lunar longitude and rejects invalid input", () => {
    const timeline = calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: -0.001, asOf: BIRTH });
    expect(timeline.moonNakshatra).toBe("Revati");
    expect(timeline.birthMahadashaLord).toBe("mercury");
    expect(() => calculateVimshottariTimeline({ birthInstant: "not-a-date", moonSiderealLongitudeDeg: 0, asOf: BIRTH })).toThrow(TypeError);
    expect(() => calculateVimshottariTimeline({ birthInstant: BIRTH, moonSiderealLongitudeDeg: Number.NaN, asOf: BIRTH })).toThrow(TypeError);
  });
});
