import type { GrahaId, VedicChart } from "./ephemeris";

/**
 * Ashtakavarga, the classical eight-source point system (Brihat Parashara
 * Hora Shastra, Ashtakavarga chapters). For each of the seven classical
 * planets, eight references (the seven planets and the Ascendant) each give
 * one point ("bindu") to certain houses counted from where that reference
 * stands in the birth chart. A planet's own table (Bhinnashtakavarga) gives
 * 0 to 8 points per sign; the sum over the seven planets
 * (Sarvashtakavarga) gives 0 to 56 per sign and always totals 337.
 *
 * In Gochara, a planet transiting a sign with more of its own points is read
 * as better supported; four is the classical middle. This is a counting rule
 * of the tradition, not a measured force, and it is not Shadbala.
 */

export const ASHTAKAVARGA_PLANETS = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
] as const satisfies readonly GrahaId[];

export type AshtakavargaPlanet = (typeof ASHTAKAVARGA_PLANETS)[number];
export type AshtakavargaReference = AshtakavargaPlanet | "lagna";

export const ASHTAKAVARGA_REFERENCES = [
  ...ASHTAKAVARGA_PLANETS,
  "lagna",
] as const satisfies readonly AshtakavargaReference[];

type BeneficPlaces = Readonly<Record<AshtakavargaReference, readonly number[]>>;

/**
 * Houses, counted from each reference, that receive a point. Checked against
 * BPHS ch. 66 (both its "Karanaprada" and "Rekhaprada" lists), C. S. Patel's
 * Ashtakavarga (1957) ch. II and B. V. Raman. Two entries have variant
 * readings in other classics; this app keeps the common reading:
 * - Moon from Jupiter: 1,4,7,8,10,11,12 here (Brihat Jataka, Saravali, Raman);
 *   Parashara also reads 1,2,4,7,8,10,11.
 * - Venus from Mars: 3,4,6,9,11,12 here (Parashara, Saravali, Patel); Brihat
 *   Jataka reads 3,5,6,9,11,12. Raman's published Standard Horoscope follows
 *   that variant, so its Venus Aquarius and Pisces values differ by one.
 * In this app a "bindu" is a benefic point, as in South Indian usage and in
 * Raman; Parashara calls the benefic mark a "rekha".
 */
export const BENEFIC_PLACES: Readonly<Record<AshtakavargaPlanet, BeneficPlaces>> = {
  sun: {
    sun: [1, 2, 4, 7, 8, 9, 10, 11],
    moon: [3, 6, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [3, 5, 6, 9, 10, 11, 12],
    jupiter: [5, 6, 9, 11],
    venus: [6, 7, 12],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [3, 4, 6, 10, 11, 12],
  },
  moon: {
    sun: [3, 6, 7, 8, 10, 11],
    moon: [1, 3, 6, 7, 10, 11],
    mars: [2, 3, 5, 6, 9, 10, 11],
    mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    jupiter: [1, 4, 7, 8, 10, 11, 12],
    venus: [3, 4, 5, 7, 9, 10, 11],
    saturn: [3, 5, 6, 11],
    lagna: [3, 6, 10, 11],
  },
  mars: {
    sun: [3, 5, 6, 10, 11],
    moon: [3, 6, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [3, 5, 6, 11],
    jupiter: [6, 10, 11, 12],
    venus: [6, 8, 11, 12],
    saturn: [1, 4, 7, 8, 9, 10, 11],
    lagna: [1, 3, 6, 10, 11],
  },
  mercury: {
    sun: [5, 6, 9, 11, 12],
    moon: [2, 4, 6, 8, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    jupiter: [6, 8, 11, 12],
    venus: [1, 2, 3, 4, 5, 8, 9, 11],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  jupiter: {
    sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    moon: [2, 5, 7, 9, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    venus: [2, 5, 6, 9, 10, 11],
    saturn: [3, 5, 6, 12],
    lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  venus: {
    sun: [8, 11, 12],
    moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    mars: [3, 4, 6, 9, 11, 12],
    mercury: [3, 5, 6, 9, 11],
    jupiter: [5, 8, 9, 10, 11],
    venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    saturn: [3, 4, 5, 8, 9, 10, 11],
    lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  saturn: {
    sun: [1, 2, 4, 7, 8, 10, 11],
    moon: [3, 6, 11],
    mars: [3, 5, 6, 10, 11, 12],
    mercury: [6, 8, 9, 10, 11, 12],
    jupiter: [5, 6, 11, 12],
    venus: [6, 11, 12],
    saturn: [3, 5, 6, 11],
    lagna: [1, 3, 4, 6, 10, 11],
  },
};

/** Published row totals; a mistyped table entry changes one of them. */
export const BHINNASHTAKAVARGA_TOTALS: Readonly<Record<AshtakavargaPlanet, number>> = {
  sun: 48,
  moon: 49,
  mars: 39,
  mercury: 54,
  jupiter: 56,
  venus: 52,
  saturn: 39,
};

export const SARVASHTAKAVARGA_TOTAL = 337;

/** The classical middle: four of eight possible points. */
export const ASHTAKAVARGA_AVERAGE_BINDUS = 4;

export interface Ashtakavarga {
  /** Points per sign index (0 = Aries) in each planet's own table, 0 to 8. */
  readonly bhinna: Readonly<Record<AshtakavargaPlanet, readonly number[]>>;
  /** Sum of the seven tables per sign index, 0 to 56. */
  readonly sarva: readonly number[];
  /** The references that gave each point, per planet and sign index. */
  readonly sources: Readonly<
    Record<AshtakavargaPlanet, readonly (readonly AshtakavargaReference[])[]>
  >;
}

export function isAshtakavargaPlanet(id: GrahaId): id is AshtakavargaPlanet {
  return (ASHTAKAVARGA_PLANETS as readonly GrahaId[]).includes(id);
}

function referenceSigns(chart: VedicChart): Record<AshtakavargaReference, number> {
  const signs = { lagna: chart.ascendant.sign.index } as Record<AshtakavargaReference, number>;
  for (const id of ASHTAKAVARGA_PLANETS) {
    const planet = chart.planets.find((candidate) => candidate.id === id);
    if (!planet) throw new TypeError(`The chart is missing ${id}.`);
    signs[id] = planet.sign.index;
  }
  return signs;
}

export function calculateAshtakavarga(chart: VedicChart): Ashtakavarga {
  const signs = referenceSigns(chart);
  const bhinna = {} as Record<AshtakavargaPlanet, number[]>;
  const sources = {} as Record<AshtakavargaPlanet, AshtakavargaReference[][]>;
  const sarva = Array.from({ length: 12 }, () => 0);

  for (const planet of ASHTAKAVARGA_PLANETS) {
    const points = Array.from({ length: 12 }, () => 0);
    const givers = Array.from({ length: 12 }, () => [] as AshtakavargaReference[]);
    for (const reference of ASHTAKAVARGA_REFERENCES) {
      for (const house of BENEFIC_PLACES[planet][reference]) {
        const sign = (signs[reference] + house - 1) % 12;
        points[sign] += 1;
        givers[sign].push(reference);
      }
    }
    bhinna[planet] = points;
    sources[planet] = givers;
    points.forEach((value, sign) => {
      sarva[sign] += value;
    });
  }

  return { bhinna, sarva, sources };
}

// A wrong table entry must fail loudly, not quietly shift every reading.
for (const planet of ASHTAKAVARGA_PLANETS) {
  const total = ASHTAKAVARGA_REFERENCES.reduce(
    (sum, reference) => sum + BENEFIC_PLACES[planet][reference].length,
    0,
  );
  if (total !== BHINNASHTAKAVARGA_TOTALS[planet]) {
    throw new Error(`Ashtakavarga table for ${planet} totals ${total}, expected ${BHINNASHTAKAVARGA_TOTALS[planet]}.`);
  }
}
