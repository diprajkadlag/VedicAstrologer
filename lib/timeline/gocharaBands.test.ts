import { describe, expect, it } from "vitest";

import {
  TRANSIT_BAND_DEFINITIONS,
  TRANSIT_BAND_IDS,
  bandVisibleAt,
  bandsAt,
  houseFrom,
  transitBands,
} from "./gocharaBands";
import { DAY_MS, computePlanetTimeline, motionSegments, type MotionSegment } from "./planetTimeline";

function segments(entries: [number, boolean?][], start = 0, length = 10 * DAY_MS): MotionSegment[] {
  return entries.map(([signIndex, retrograde = false], index) => ({
    startMs: start + index * length,
    endMs: start + (index + 1) * length,
    signIndex,
    retrograde,
  }));
}

describe("houseFrom", () => {
  it("counts whole signs with the reference sign as house 1", () => {
    expect(houseFrom(11, 11)).toBe(1);
    expect(houseFrom(0, 11)).toBe(2);
    expect(houseFrom(10, 11)).toBe(12);
  });
});

describe("transitBands", () => {
  it("names the three Sade Sati phases and merges segments split by stations", () => {
    // Birth Moon in Pisces (11). Saturn: Aquarius, Pisces, Pisces (retrograde), Aries.
    const bands = transitBands({
      moonSign: 11,
      lagnaSign: 0,
      segments: { saturn: segments([[10], [11], [11, true], [0]]) },
    });
    const sadeSati = bands.filter((band) => band.id.startsWith("sade-sati"));
    expect(sadeSati.map((band) => [band.id, band.house])).toEqual([
      ["sade-sati-rising", 12],
      ["sade-sati-peak", 1],
      ["sade-sati-setting", 2],
    ]);
    expect(sadeSati[1].endMs - sadeSati[1].startMs).toBe(20 * DAY_MS);
  });

  it("marks Ashtama and Kantaka Shani, Jupiter's good houses and node friction", () => {
    const bands = transitBands({
      moonSign: 0,
      lagnaSign: 3,
      segments: {
        saturn: segments([[7], [3], [9]]),
        jupiter: segments([[1], [4], [5]]),
        rahu: segments([[0], [7], [3]]),
        ketu: segments([[6], [1], [9]]),
      },
    });
    const ids = (id: string) => bands.filter((band) => band.id === id).map((band) => band.house);
    expect(ids("ashtama-shani")).toEqual([8]);
    expect(ids("kantaka-shani")).toEqual([4, 10]);
    expect(ids("jupiter-favourable")).toEqual([2, 5]);
    expect(ids("rahu-friction")).toEqual([1, 8]);
    expect(ids("ketu-over-moon")).toEqual([]);
    expect(ids("rahu-over-lagna")).toEqual([1]);
    expect(ids("ketu-over-lagna")).toEqual([]);
  });

  it("turns retrograde segments into retrograde bands", () => {
    const bands = transitBands({
      moonSign: 0,
      lagnaSign: 0,
      segments: { mars: segments([[1], [1, true], [0, true], [0]]) },
    });
    const retrograde = bands.filter((band) => band.id === "mars-retrograde");
    expect(retrograde).toHaveLength(1);
    expect(retrograde[0].endMs - retrograde[0].startMs).toBe(20 * DAY_MS);
    expect(retrograde[0].basis).toBe("modern");
  });

  it("follows the real 2023-2028 Sade Sati for a Pisces Moon", () => {
    const saturn = computePlanetTimeline(
      "saturn",
      Date.parse("2022-06-01T00:00:00Z"),
      Date.parse("2029-01-01T00:00:00Z"),
    );
    const bands = transitBands({ moonSign: 11, lagnaSign: 0, segments: { saturn: motionSegments(saturn) } })
      .filter((band) => band.id.startsWith("sade-sati"));
    const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    expect(bands.map((band) => [band.id, day(band.startMs)])).toEqual([
      ["sade-sati-rising", "2022-06-01"],
      ["sade-sati-rising", "2023-01-17"],
      ["sade-sati-peak", "2025-03-29"],
      ["sade-sati-setting", "2027-06-03"],
      ["sade-sati-peak", "2027-10-20"],
      ["sade-sati-setting", "2028-02-23"],
    ]);
    expect(bandsAt(bands, Date.parse("2026-01-01T00:00:00Z")).map((band) => band.id)).toEqual([
      "sade-sati-peak",
    ]);
  });

  it("has a definition, a basis and a zoom level for every band", () => {
    for (const id of TRANSIT_BAND_IDS) {
      const definition = TRANSIT_BAND_DEFINITIONS[id];
      expect(definition.id).toBe(id);
      expect(["classical", "modern", "app"]).toContain(definition.basis);
    }
    expect(bandVisibleAt(TRANSIT_BAND_DEFINITIONS["mercury-retrograde"], "meso")).toBe(false);
    expect(bandVisibleAt(TRANSIT_BAND_DEFINITIONS["mercury-retrograde"], "micro")).toBe(true);
    expect(bandVisibleAt(TRANSIT_BAND_DEFINITIONS["sade-sati-peak"], "macro")).toBe(true);
  });
});
