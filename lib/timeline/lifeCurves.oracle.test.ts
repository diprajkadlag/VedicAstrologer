import { describe, expect, it } from "vitest";

import { calculateAshtakavarga } from "../astro/ashtakavarga";
import { RASIS, calculateVedicChart, type GrahaId } from "../astro/ephemeris";
import { RASI_PROFILES } from "../astro/glossary";
import { createDashaClock, dashaStackAt } from "./dashaLevels";
import type { ZoomLevel } from "./geometry";
import { houseFrom } from "./gocharaBands";
import {
  LIFE_CURVE_IDS,
  ZOOM_PLANETS,
  createNatalCurveContext,
  lifeCurveSteps,
  lifeCurvesAt,
  type SkySegments,
} from "./lifeCurves";
import { DAY_MS, computeMoonWindow, computePlanetTimeline, motionSegments, type MotionSegment } from "./planetTimeline";

/**
 * An oracle for lifeCurves.ts: a second, independent implementation of the
 * cross-checked rule specification (Phaladeepika ch. 26, BPHS, Raman/Patel
 * thresholds, and the app's documented weights), written by a separate
 * review agent from the specification text alone. Random skies must give the
 * same value in both.
 */

const YEAR_MS = 365.25 * DAY_MS;
const PUNE = { latitude: 18.5204, longitude: 73.8567 };

/* ---------------- independent evaluator written from rules-spec.md ---------------- */

const VEDHA: Record<string, Record<number, number>> = {
  sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  moon: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  mars: { 3: 12, 6: 9, 11: 5 },
  mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  saturn: { 3: 12, 6: 9, 11: 5 },
  rahu: { 3: 9, 6: 12, 10: 4, 11: 5 },
  ketu: { 3: 9, 6: 12, 10: 4, 11: 5 },
};
const CAUSERS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
const BENEFIC = new Set(["jupiter", "venus", "moon", "mercury"]);
const WEIGHT = [1, 0.6, 0.4, 0.2];
const DEEPEST: Record<ZoomLevel, number> = { macro: 2, meso: 3, micro: 4 };

interface Sky {
  sign: Partial<Record<GrahaId, number>>;
  retro: Partial<Record<GrahaId, boolean>>;
}

interface Natal {
  moonSign: number;
  lagnaSign: number;
  natalSign: Record<string, number>;
  natalHouse: Record<string, number>;
  owned: Record<string, number[]>;
  lagnaLord: string;
  bav: Record<string, number[]>;
  sav: number[];
}

function exempt(a: string, b: string): boolean {
  const s = new Set([a, b]);
  return (s.has("sun") && s.has("saturn")) || (s.has("moon") && s.has("mercury"));
}

function blocked(sky: Sky, planet: string, house: number, moonSign: number): boolean {
  const v = VEDHA[planet][house];
  if (v === undefined) return false;
  for (const o of CAUSERS) {
    if (o === planet || exempt(o, planet)) continue;
    const s = sky.sign[o as GrahaId];
    if (s !== undefined && houseFrom(s, moonSign) === v) return true;
  }
  return false;
}

function scaled(v: number, level: number): number {
  if (v === 0) return 0;
  return Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * WEIGHT[level]));
}

function specTotal(curve: string, sky: Sky, natal: Natal, lords: string[]): number {
  const h = (p: string): number | null => (sky.sign[p as GrahaId] === undefined ? null : houseFrom(sky.sign[p as GrahaId]!, natal.moonSign));
  const hl = (p: string): number | null => (sky.sign[p as GrahaId] === undefined ? null : houseFrom(sky.sign[p as GrahaId]!, natal.lagnaSign));
  const good = (p: string, house: number, pts: number) => (blocked(sky, p, house, natal.moonSign) ? 0 : pts);
  const bav = (p: string, hi: number, lo: number) => {
    const b = natal.bav[p][sky.sign[p as GrahaId]!];
    return b >= 5 ? hi : b <= 3 ? lo : 0;
  };
  const retro = (p: string) => sky.retro[p as GrahaId] === true;
  let t = 0;
  const sa = h("saturn");
  const ju = h("jupiter");
  const ra = h("rahu");
  const ke = h("ketu");
  const mo = h("moon");
  const su = h("sun");
  const me = h("mercury");
  const ma = h("mars");
  const ve = h("venus");
  if (curve === "emotional") {
    if (sa === 12) t += -8;
    if (sa === 1) t += -10;
    if (sa === 2) t += -6;
    if (sa === 8) t += -8;
    if (sa === 4) t += -6;
    if (ju !== null && [2, 5, 7, 9, 11].includes(ju)) t += good("jupiter", ju, 8);
    if (ju === 1) t += -2;
    if (ra === 1) t += -8;
    if (ra === 8 || ra === 12) t += -5;
    if (ke === 1) t += -5;
    if (mo !== null) {
      if ([1, 3, 6, 7, 10, 11].includes(mo)) t += good("moon", mo, 5);
      else if (mo === 8) t += -8;
      else if (mo === 2 || mo === 12) t += -4;
      else t += -3;
      t += bav("moon", 3, -3);
      t += natal.sav[sky.sign.moon!] >= 28 ? 2 : -2;
    }
    lords.forEach((L, i) => {
      const hh = houseFrom(natal.natalSign[L], natal.moonSign);
      if ([1, 4, 5, 9, 10, 11].includes(hh)) t += scaled(4, i);
      else if ([6, 8, 12].includes(hh)) t += scaled(-5, i);
      t += scaled(BENEFIC.has(L) ? 3 : -3, i);
    });
  } else if (curve === "career") {
    if (sa !== null) {
      if ([3, 6, 11].includes(sa)) t += good("saturn", sa, 8);
      else if (sa === 10) t += -6;
      else if ([12, 1, 2].includes(sa)) t += -5;
      t += bav("saturn", 3, -3);
    }
    if (ju !== null && [2, 5, 7, 9, 11].includes(ju)) t += good("jupiter", ju, 8);
    if (ju === 10) t += -4;
    for (const p of ["jupiter", "saturn"]) {
      if (hl(p) === 10) {
        const s = natal.sav[(natal.lagnaSign + 9) % 12];
        if (s >= 28) t += 5;
        else if (s < 25) t += -4;
      }
    }
    if (su !== null) {
      t += [3, 6, 10, 11].includes(su) ? good("sun", su, 5) : -3;
      if (hl("sun") === 10) t += 3;
      t += bav("sun", 3, -3);
    }
    if (me !== null) {
      t += [2, 4, 6, 8, 10, 11].includes(me) ? good("mercury", me, 4) : -2;
      if (retro("mercury")) t += -2;
    }
    lords.forEach((L, i) => {
      const ownsOrOcc = (house: number) => natal.owned[L].includes(house) || natal.natalHouse[L] === house;
      if ([10, 11, 2, 6].some(ownsOrOcc)) t += scaled(5, i);
      if ([8, 12].some(ownsOrOcc)) t += scaled(-5, i);
    });
    if (ma !== null) {
      if ([3, 6, 11].includes(ma)) t += good("mars", ma, 3);
      else if ([7, 8, 10].includes(ma)) t += -3;
      if (retro("mars")) t += -2;
    }
  } else if (curve === "relationship") {
    if (ve !== null) {
      t += [1, 2, 3, 4, 5, 8, 9, 11, 12].includes(ve) ? good("venus", ve, 5) : -4;
      t += bav("venus", 3, -3);
      if (retro("venus")) t += -2;
    }
    if (ju !== null) {
      if ([2, 5, 7, 9, 11].includes(ju)) t += good("jupiter", ju, 7);
      else if ([6, 8, 12].includes(ju)) t += -3;
    }
    if (sa !== null) {
      if (sa === 7) t += -6;
      else if ([12, 1, 2].includes(sa)) t += -5;
      else if ([3, 6, 11].includes(sa)) t += good("saturn", sa, 3);
    }
    const rl = hl("rahu");
    const kl = hl("ketu");
    if (rl === 1 || rl === 7 || kl === 1 || kl === 7) t += -6;
    if (ra === 1) t += -4;
    if (ma !== null) {
      if (ma === 1 || ma === 7) t += -4;
      else if (sky.sign.mars === natal.natalSign.venus) t += -4;
      else if ([3, 6, 11].includes(ma)) t += good("mars", ma, 2);
    }
    lords.forEach((L, i) => {
      if (L === "venus" || natal.owned[L].includes(7) || natal.natalHouse[L] === 7) t += scaled(5, i);
      if (natal.natalHouse[L] === 6 || natal.natalHouse[L] === 12) t += scaled(-3, i);
    });
  } else {
    if (su !== null) {
      t += [3, 6, 10, 11].includes(su) ? good("sun", su, 5) : -3;
      t += bav("sun", 3, -3);
      const s = natal.sav[sky.sign.sun!];
      if (s >= 28) t += 2;
      else if (s < 25) t += -2;
    }
    if (ma !== null) {
      if ([3, 6, 11].includes(ma)) t += good("mars", ma, 4);
      else if ([1, 4, 5, 7, 8, 12].includes(ma)) t += -4;
      if (retro("mars")) t += -2;
    }
    if (sa === 12) t += -5;
    if (sa === 1) t += -8;
    if (sa === 2) t += -5;
    if (sa === 8) t += -8;
    if (sa === 4) t += -5;
    if (sa !== null && [3, 6, 11].includes(sa)) t += good("saturn", sa, 4);
    if (ju !== null) {
      if ([2, 5, 7, 9, 11].includes(ju)) t += good("jupiter", ju, 6);
      else if ([6, 8, 12].includes(ju)) t += -3;
    }
    if (mo !== null) {
      if (mo === 8) t += -6;
      else if (mo === 12) t += -3;
      else if ([1, 3, 6, 7, 10, 11].includes(mo)) t += good("moon", mo, 3);
    }
    lords.forEach((L, i) => {
      const o = natal.natalHouse[L];
      if (o === 6 || o === 8 || o === 12) t += scaled(-5, i);
      if (L === natal.lagnaLord || o === 1 || o === 9 || o === 10) t += scaled(4, i);
    });
  }
  return t;
}

function natalOf(chart: ReturnType<typeof calculateVedicChart>): Natal {
  const av = calculateAshtakavarga(chart);
  const natalSign: Record<string, number> = {};
  const natalHouse: Record<string, number> = {};
  const owned: Record<string, number[]> = {};
  for (const p of chart.planets) {
    natalSign[p.id] = p.sign.index;
    natalHouse[p.id] = p.house;
    owned[p.id] = [];
  }
  const lagna = chart.ascendant.sign.index;
  for (let house = 1; house <= 12; house += 1) owned[RASI_PROFILES[RASIS[(lagna + house - 1) % 12]].ruler].push(house);
  return {
    moonSign: natalSign.moon,
    lagnaSign: lagna,
    natalSign,
    natalHouse,
    owned,
    lagnaLord: RASI_PROFILES[RASIS[lagna]].ruler,
    bav: av.bhinna as unknown as Record<string, number[]>,
    sav: av.sarva as number[],
  };
}

const ALL: GrahaId[] = ["saturn", "jupiter", "rahu", "ketu", "sun", "mars", "venus", "mercury", "moon"];

function lcg(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("theme curves against the independent specification oracle", () => {
  it("agree on random skies, zoom levels, absent bodies and retrograde flags", () => {
    const rand = lcg(4242);
    const mismatches: string[] = [];
    for (const text of ["1990-06-15T04:30:00.000Z", "1964-02-29T23:59:59.000Z", "2001-09-11T12:46:00.000Z"]) {
      const birth = new Date(text);
      const chart = calculateVedicChart({ instant: birth, ...PUNE });
      const moon = chart.planets.find((planet) => planet.id === "moon")!;
      const clock = createDashaClock(birth, moon.siderealLongitudeDeg);
      const context = createNatalCurveContext(chart, calculateAshtakavarga(chart), clock);
      const natal = natalOf(chart);
      for (let index = 0; index < 400; index += 1) {
        const zoom = (["macro", "meso", "micro"] as ZoomLevel[])[index % 3];
        const ms = birth.getTime() + rand() * 100 * YEAR_MS;
        const segments: Partial<Record<GrahaId, MotionSegment[]>> = {};
        const sky: Sky = { sign: {}, retro: {} };
        for (const id of ALL) {
          if (rand() < 0.2) continue;
          const sign = Math.floor(rand() * 12);
          const retro = ["mercury", "venus", "mars", "jupiter", "saturn"].includes(id) && rand() < 0.3;
          segments[id] = [{ startMs: birth.getTime(), endMs: birth.getTime() + 100 * YEAR_MS, signIndex: sign, retrograde: retro }];
          if (ZOOM_PLANETS[zoom].includes(id)) {
            sky.sign[id] = sign;
            sky.retro[id] = retro;
          }
        }
        const lords = dashaStackAt(clock, ms).map((span) => span.lord).slice(0, DEEPEST[zoom]);
        const values = lifeCurvesAt(context, segments as SkySegments, zoom, ms);
        for (const curve of LIFE_CURVE_IDS) {
          const expected = Math.max(0, Math.min(100, Math.round(50 + specTotal(curve, sky, natal, lords))));
          if (values[curve].value !== expected && mismatches.length < 5) {
            mismatches.push(`${text} ${zoom} ${curve}: app ${values[curve].value}, oracle ${expected}, sky ${JSON.stringify(sky)}`);
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  }, 30_000);
});

describe("theme-curve steps with a real Moon window (review finding F3)", () => {
  const birth = new Date("1990-06-15T04:30:00.000Z");
  const chart = calculateVedicChart({ instant: birth, ...PUNE });
  const moon = chart.planets.find((planet) => planet.id === "moon")!;
  const context = createNatalCurveContext(
    chart,
    calculateAshtakavarga(chart),
    createDashaClock(birth, moon.siderealLongitudeDeg),
  );
  const viewStart = Date.parse("2026-03-10T00:00:00Z");
  const span = 21 * DAY_MS;
  const from = viewStart - span;
  const to = viewStart + 2 * span;
  const segments: Partial<Record<GrahaId, MotionSegment[]>> = {};
  for (const id of ["saturn", "jupiter", "rahu", "ketu", "sun", "mars", "venus", "mercury"] as GrahaId[]) {
    segments[id] = motionSegments(computePlanetTimeline(id, from - 400 * DAY_MS, to + 400 * DAY_MS));
  }
  segments.moon = motionSegments(computeMoonWindow(from, to));

  it("gives every step the value of a point evaluation inside it", () => {
    const rand = lcg(99);
    for (const zoom of ["macro", "meso", "micro"] as ZoomLevel[]) {
      const steps = lifeCurveSteps(context, segments as SkySegments, zoom, from, to);
      for (let index = 0; index < 150; index += 1) {
        const ms = from + rand() * (to - from);
        const point = lifeCurvesAt(context, segments as SkySegments, zoom, ms);
        for (const curve of LIFE_CURVE_IDS) {
          const step = steps[curve].find((candidate) => ms >= candidate.startMs && ms < candidate.endMs);
          expect(step?.value, `${zoom} ${curve} ${new Date(ms).toISOString()}`).toBe(point[curve].value);
        }
      }
    }
  });

  it("keeps steps exact on both sides of where a shorter Moon window ends", () => {
    const moonEnd = from + 30 * DAY_MS;
    const shortMoon = { ...segments, moon: motionSegments(computeMoonWindow(from, moonEnd)) };
    const steps = lifeCurveSteps(context, shortMoon as SkySegments, "micro", from, to);
    for (const curve of LIFE_CURVE_IDS) {
      for (const ms of [moonEnd - 1, moonEnd + 1]) {
        const step = steps[curve].find((candidate) => ms >= candidate.startMs && ms < candidate.endMs);
        const point = lifeCurvesAt(context, shortMoon as SkySegments, "micro", ms)[curve].value;
        expect(step?.value, `${curve} at ${ms - moonEnd} ms from the Moon end`).toBe(point);
      }
    }
  });
});
