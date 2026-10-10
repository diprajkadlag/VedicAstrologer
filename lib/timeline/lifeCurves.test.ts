import { describe, expect, it } from "vitest";

import { calculateAshtakavarga } from "../astro/ashtakavarga";
import { calculateVedicChart, type GrahaId } from "../astro/ephemeris";
import { createDashaClock, dashaStackAt } from "./dashaLevels";
import { YEAR_MS } from "./geometry";
import {
  DASHA_LEVEL_WEIGHT,
  GOCHARA_VEDHA,
  LIFE_CURVE_BASELINE,
  LIFE_CURVE_IDS,
  ZOOM_PLANETS,
  createNatalCurveContext,
  curveBand,
  lifeCurveSteps,
  lifeCurvesAt,
  reasonDifference,
  type CurveReason,
  type SkySegments,
} from "./lifeCurves";
import { computePlanetTimeline, motionSegments, type MotionSegment } from "./planetTimeline";

const BIRTH = new Date("1990-06-15T04:30:00.000Z");
const PUNE = { latitude: 18.5204, longitude: 73.8567 };
const chart = calculateVedicChart({ instant: BIRTH, ...PUNE });
const moon = chart.planets.find((planet) => planet.id === "moon")!;
const natal = createNatalCurveContext(
  chart,
  calculateAshtakavarga(chart),
  createDashaClock(BIRTH, moon.siderealLongitudeDeg),
);
const MOON_SIGN = natal.moonSign;

/** One segment that covers every instant used below, with the sign given as a house from the Moon. */
function fixedSky(housesFromMoon: Partial<Record<GrahaId, number>>, retrograde: GrahaId[] = []): SkySegments {
  const sky: Partial<Record<GrahaId, MotionSegment[]>> = {};
  for (const [id, house] of Object.entries(housesFromMoon) as [GrahaId, number][]) {
    sky[id] = [
      {
        startMs: BIRTH.getTime(),
        endMs: BIRTH.getTime() + 100 * YEAR_MS,
        signIndex: (MOON_SIGN + house - 1) % 12,
        retrograde: retrograde.includes(id),
      },
    ];
  }
  return sky;
}

const PROBE = BIRTH.getTime() + 30.3 * YEAR_MS;

function total(reasons: readonly CurveReason[]): number {
  return reasons.reduce((sum, entry) => sum + entry.contribution, 0);
}

describe("lifeCurvesAt", () => {
  it("adds named contributions to the baseline and clamps to 0..100", () => {
    const values = lifeCurvesAt(natal, fixedSky({ saturn: 1, jupiter: 5, rahu: 1, ketu: 7 }), "macro", PROBE);
    for (const curve of LIFE_CURVE_IDS) {
      const { value, reasons } = values[curve];
      expect(value).toBe(Math.max(0, Math.min(100, Math.round(LIFE_CURVE_BASELINE + total(reasons)))));
      expect(reasons.every((entry) => entry.ruleId.startsWith(`${curve}.`))).toBe(true);
    }
    const emotional = values.emotional.reasons.map((entry) => entry.ruleId);
    expect(emotional).toContain("emotional.saturn.sade-sati-peak");
    expect(emotional).toContain("emotional.rahu.over-moon");
  });

  it("cancels a favourable transit by Vedha and keeps the reason with zero points", () => {
    // Jupiter 5th from the Moon is obstructed by a planet in the 4th.
    const blocked = lifeCurvesAt(natal, fixedSky({ jupiter: 5, saturn: 4 }), "macro", PROBE).emotional.reasons;
    const vedha = blocked.find((entry) => entry.kind === "gochara-vedha");
    expect(vedha).toMatchObject({ planet: "jupiter", house: 5, blocker: "saturn", vedhaHouse: 4, contribution: 0 });

    const free = lifeCurvesAt(natal, fixedSky({ jupiter: 5, saturn: 3 }), "macro", PROBE).emotional.reasons;
    expect(free.find((entry) => entry.ruleId === "emotional.jupiter.good")?.contribution).toBe(8);
    expect(GOCHARA_VEDHA.jupiter[5]).toBe(4);
  });

  it("never lets the Sun obstruct Saturn, nor the nodes obstruct anyone", () => {
    // Saturn 3rd from the Moon has its Vedha in the 12th.
    const withSun = lifeCurvesAt(natal, fixedSky({ saturn: 3, sun: 12 }), "meso", PROBE).career.reasons;
    expect(withSun.find((entry) => entry.ruleId === "career.saturn.good")?.contribution).toBe(8);
    const withRahu = lifeCurvesAt(natal, fixedSky({ saturn: 3, rahu: 12 }), "macro", PROBE).career.reasons;
    expect(withRahu.find((entry) => entry.ruleId === "career.saturn.good")?.contribution).toBe(8);
    const withMars = lifeCurvesAt(natal, fixedSky({ saturn: 3, mars: 12 }), "meso", PROBE).career.reasons;
    expect(withMars.find((entry) => entry.kind === "gochara-vedha")?.blocker).toBe("mars");
  });

  it("uses only the bodies and Dasha levels of the zoom level", () => {
    const sky = fixedSky({ saturn: 3, jupiter: 2, rahu: 3, ketu: 9, sun: 11, mars: 6, venus: 1, mercury: 2, moon: 8 }, [
      "mercury",
    ]);
    const macro = lifeCurvesAt(natal, sky, "macro", PROBE);
    const micro = lifeCurvesAt(natal, sky, "micro", PROBE);
    const planets = (reasons: readonly CurveReason[]) =>
      new Set(reasons.filter((entry) => !entry.kind.startsWith("dasha")).map((entry) => entry.planet));
    for (const curve of LIFE_CURVE_IDS) {
      for (const planet of planets(macro[curve].reasons)) {
        expect(ZOOM_PLANETS.macro).toContain(planet);
      }
      expect(Math.max(0, ...macro[curve].reasons.map((entry) => entry.level ?? 0))).toBeLessThanOrEqual(2);
    }
    expect(micro.emotional.reasons.map((entry) => entry.ruleId)).toContain("emotional.moon.chandrashtama");
    expect(micro.career.reasons.map((entry) => entry.ruleId)).toContain("career.mercury.retrograde");
    expect(micro.career.reasons.find((entry) => entry.ruleId === "career.mercury.retrograde")?.basis).toBe("modern");
    expect(Math.max(...micro.emotional.reasons.map((entry) => entry.level ?? 0))).toBe(4);
  });

  it("weighs Dasha rules by level and keeps at least one point", () => {
    expect(DASHA_LEVEL_WEIGHT).toEqual({ 1: 1, 2: 0.6, 3: 0.4, 4: 0.2 });
    const reasons = lifeCurvesAt(natal, {}, "micro", PROBE).emotional.reasons;
    const nature = reasons.filter((entry) => entry.kind === "dasha-nature");
    expect(nature.map((entry) => Math.abs(entry.contribution))).toEqual([3, 2, 1, 1]);
    const stack = dashaStackAt(natal.clock, PROBE).map((span) => span.lord);
    expect(nature.map((entry) => entry.planet)).toEqual(stack);
  });
});

describe("lifeCurveSteps", () => {
  const start = Date.parse("2020-01-01T00:00:00Z");
  const end = Date.parse("2032-01-01T00:00:00Z");
  const segments: SkySegments = Object.fromEntries(
    (["saturn", "jupiter", "rahu", "ketu"] as const).map((id) => [
      id,
      motionSegments(computePlanetTimeline(id, start - YEAR_MS, end + YEAR_MS)),
    ]),
  );

  it("tiles the window with steps that agree with point evaluation", () => {
    const steps = lifeCurveSteps(natal, segments, "macro", start, end);
    for (const curve of LIFE_CURVE_IDS) {
      const list = steps[curve];
      expect(list[0].startMs).toBe(start);
      expect(list.at(-1)!.endMs).toBe(end);
      list.forEach((step, index) => {
        if (index > 0) expect(step.startMs).toBe(list[index - 1].endMs);
        const middle = (step.startMs + step.endMs) / 2;
        expect(lifeCurvesAt(natal, segments, "macro", middle)[curve].value).toBe(step.value);
      });
    }
    // Twelve years of slow transits and Dasha changes move every curve.
    expect(new Set(steps.emotional.map((step) => step.value)).size).toBeGreaterThan(3);
  });

  it("returns nothing for an empty window", () => {
    expect(lifeCurveSteps(natal, segments, "macro", end, start).career).toEqual([]);
  });
});

describe("helpers", () => {
  it("maps values to the transit view's score words", () => {
    expect([20, 40, 55, 70, 90].map(curveBand)).toEqual([
      "intensive",
      "reflective",
      "steady",
      "supportive",
      "highly-supportive",
    ]);
  });

  it("lists the contributions that changed between two steps", () => {
    const a = { ruleId: "x.a", kind: "bav", contribution: 3, basis: "classical" } as const;
    const b = { ruleId: "x.b", kind: "bav", contribution: -3, basis: "classical" } as const;
    const c = { ruleId: "x.c", kind: "sav", contribution: 2, basis: "classical" } as const;
    expect(reasonDifference([a, b], [a, c])).toEqual({ added: [c], removed: [b] });
  });
});
