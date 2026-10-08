import {
  RASIS,
  buildHouses,
  getRasi,
  houseForSign,
  normalizeDegrees,
  type GrahaPosition,
  type RasiPlacement,
  type VedicChart,
} from "./ephemeris";

/**
 * The ninth-division (navamsha) chart, D9.
 *
 * Every 30° sign is split into nine parts of 3°20′, so the zodiac holds 108
 * parts. Counting the parts from 0° Aries and wrapping around the twelve signs
 * gives the D9 sign of each part. That single rule already contains the
 * classical counting: a movable sign starts from itself, a fixed sign from the
 * 9th sign, and a dual sign from the 5th.
 */

/** One ninth of a sign: 30° / 9 = 3°20′. */
const NAVAMSA_SIZE_DEG = 10 / 3;
const NAVAMSA_PART_COUNT = 108;
const SIGN_COUNT = 12;
const PARTS_PER_SIGN = 9;

/** The 3°20′ part (0…107, counted from 0° Aries) a sidereal longitude is in. */
function navamsaPartIndex(siderealLongitudeDeg: number): number {
  const longitude = normalizeDegrees(siderealLongitudeDeg);
  // normalizeDegrees can return exactly 360 for a tiny negative input, and
  // 360 / (10 / 3) can round up to 108.
  return Math.min(
    Math.floor(longitude / NAVAMSA_SIZE_DEG),
    NAVAMSA_PART_COUNT - 1,
  );
}

/** Sign index (0 = Aries) that the longitude falls in within the D9 chart. */
export function navamsaSignIndex(siderealLongitudeDeg: number): number {
  return navamsaPartIndex(siderealLongitudeDeg) % SIGN_COUNT;
}

/** Degree (0 up to, not including, 30) inside the D9 sign. */
export function navamsaDegree(siderealLongitudeDeg: number): number {
  const longitude = normalizeDegrees(siderealLongitudeDeg);
  return (longitude % NAVAMSA_SIZE_DEG) * PARTS_PER_SIGN;
}

/** Vargottama: the longitude sits in the same sign in D1 and in D9. */
export function isVargottama(siderealLongitudeDeg: number): boolean {
  return (
    getRasi(siderealLongitudeDeg).index === navamsaSignIndex(siderealLongitudeDeg)
  );
}

function navamsaPlacement(siderealLongitudeDeg: number): RasiPlacement {
  const index = navamsaSignIndex(siderealLongitudeDeg);
  return {
    index,
    name: RASIS[index],
    degreeDeg: navamsaDegree(siderealLongitudeDeg),
  };
}

/**
 * Builds the D9 chart from a birth chart. The input is not changed.
 *
 * The ascendant and every body move to their D9 sign (with the degree scaled
 * to 0–30° inside it), houses are counted whole-sign from the D9 ascendant,
 * and `houses` is rebuilt the way the engine builds it. Longitudes, nakshatra,
 * speed, motion and the retrograde flag stay the birth-chart values: they
 * describe the body, not its D9 placement.
 */
export function calculateNavamsaChart(chart: VedicChart): VedicChart {
  const ascendantSign = navamsaPlacement(chart.ascendant.siderealLongitudeDeg);
  const planets = chart.planets.map((planet): GrahaPosition => {
    const sign = navamsaPlacement(planet.siderealLongitudeDeg);
    return {
      ...planet,
      sign,
      house: houseForSign(sign.index, ascendantSign.index),
    };
  });

  return {
    ...chart,
    ascendant: { ...chart.ascendant, sign: ascendantSign },
    planets,
    houses: buildHouses(ascendantSign.index, planets),
  };
}
