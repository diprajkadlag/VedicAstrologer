import {
  GRAHA_IDS,
  NAKSHATRAS,
  RASIS,
  type GrahaId,
  type HouseNumber,
  type VedicChart,
} from "./ephemeris";

export type AuditSeverity = "error" | "warning" | "info";

export interface AnalysisAuditFinding {
  code: string;
  severity: AuditSeverity;
  message: string;
  path?: string;
  expected?: string;
  actual?: string;
}

export type AnalysisLimitationId =
  | "symbolic-not-scientific"
  | "birth-time-sensitivity"
  | "model-dependence"
  | "mean-node-model"
  | "feature-scope"
  | "ephemeris-tolerance"
  | "dasha-convention"
  | "transit-score-method";

export interface AnalysisLimitation {
  id: AnalysisLimitationId;
  statement: string;
}

export interface AnalysisAuditResult {
  isStructurallyConsistent: boolean;
  checksPerformed: number;
  errorCount: number;
  warningCount: number;
  findings: readonly AnalysisAuditFinding[];
  limitations: readonly AnalysisLimitation[];
  referenceInstant: string;
}

const EPSILON_DEG = 1e-6;
const NAKSHATRA_SIZE_DEG = 360 / 27;
const PADA_SIZE_DEG = NAKSHATRA_SIZE_DEG / 4;

export const ANALYSIS_LIMITATIONS: readonly AnalysisLimitation[] = [
  {
    id: "symbolic-not-scientific",
    statement:
      "Jyotish interpretations in this app are traditional and symbolic. Astrology has not been scientifically validated as a reliable method for predicting events, personality, health, or outcomes.",
  },
  {
    id: "birth-time-sensitivity",
    statement:
      "Lagna and house placements can change with birth time and location. An uncertain or rounded birth time can materially change those readings.",
  },
  {
    id: "model-dependence",
    statement:
      "Sidereal placements depend on the chosen ayanamsa and house convention. This app uses its documented Lahiri model and whole-sign houses; another convention can produce different boundary placements.",
  },
  {
    id: "mean-node-model",
    statement:
      "Rahu and Ketu use mean lunar nodes. A true-node calculation can differ, especially near a Rasi or Nakshatra boundary.",
  },
  {
    id: "feature-scope",
    statement:
      "The current engine does not calculate Shadbala, varga charts, combustion, classical Drishti, Yuti orbs, yogas, Ashtakavarga, or predictive event probabilities. Text mentioning these concepts is educational only.",
  },
  {
    id: "ephemeris-tolerance",
    statement:
      "The approximately one-arcminute value is a stated engineering target, not an independent certification against Swiss Ephemeris or JPL for every supported date, place, body, and boundary.",
  },
  {
    id: "dasha-convention",
    statement:
      "Vimshottari dates use a disclosed 365.25-day year. Traditional software and lineages may use other year lengths or boundary rules and can therefore produce different dates.",
  },
  {
    id: "transit-score-method",
    statement:
      "Daily and monthly Gochara scores are app-specific weighted rule summaries. They are not a universally canonical Jyotish measure, probability, scientific forecast, or outcome rating.",
  },
] as const;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(difference, 360 - difference);
}

function isClose(a: number, b: number, tolerance = EPSILON_DEG): boolean {
  return Math.abs(a - b) <= tolerance;
}

function setEquals<T>(left: readonly T[], right: readonly T[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

/**
 * Checks internal consistency only. A passing audit means that the chart's
 * derived fields agree with one another; it does not validate astrology as a
 * predictive practice or certify the supplied birth data.
 */
export function auditVedicChart(chart: VedicChart): AnalysisAuditResult {
  const findings: AnalysisAuditFinding[] = [];
  let checksPerformed = 0;

  const check = (
    condition: boolean,
    finding: Omit<AnalysisAuditFinding, "severity"> & {
      severity?: AuditSeverity;
    },
  ) => {
    checksPerformed += 1;
    if (!condition) {
      findings.push({
        severity: finding.severity ?? "error",
        ...finding,
      });
    }
  };

  check(Number.isFinite(Date.parse(chart.instant)), {
    code: "invalid-instant",
    message: "The chart instant is not a valid absolute ISO date.",
    path: "instant",
    actual: chart.instant,
  });
  check(chart.coordinateSystem === "sidereal", {
    code: "coordinate-system",
    message: "The chart does not identify itself as sidereal.",
    path: "coordinateSystem",
    expected: "sidereal",
    actual: chart.coordinateSystem,
  });
  check(chart.houseSystem === "whole-sign", {
    code: "house-system",
    message: "The chart does not identify the documented whole-sign system.",
    path: "houseSystem",
    expected: "whole-sign",
    actual: chart.houseSystem,
  });
  check(chart.nodeModel === "mean", {
    code: "node-model",
    message: "The node model differs from the documented mean-node model.",
    path: "nodeModel",
    expected: "mean",
    actual: chart.nodeModel,
  });
  check(
    Number.isFinite(chart.location.latitude) &&
      chart.location.latitude > -90 &&
      chart.location.latitude < 90 &&
      Number.isFinite(chart.location.longitude) &&
      chart.location.longitude >= -180 &&
      chart.location.longitude <= 180 &&
      Number.isFinite(chart.location.elevationMeters),
    {
      code: "location-range",
      message: "The stored chart location is outside the supported range.",
      path: "location",
      expected:
        "-90 < latitude < 90; -180 <= longitude <= 180; finite elevation",
      actual: `${chart.location.latitude}, ${chart.location.longitude}, ${chart.location.elevationMeters}m`,
    },
  );
  check(
    chart.accuracy.engine === "astronomy-engine" &&
      chart.accuracy.planetaryFrame ===
        "apparent geocentric true ecliptic of date" &&
      chart.accuracy.advertisedArcMinutes === 1,
    {
      code: "accuracy-metadata",
      message:
        "The chart's accuracy metadata differs from the calculation contract.",
      path: "accuracy",
      expected:
        "astronomy-engine; apparent geocentric true ecliptic of date; 1 arcminute target",
      actual: `${chart.accuracy.engine}; ${chart.accuracy.planetaryFrame}; ${chart.accuracy.advertisedArcMinutes}`,
    },
  );
  check(chart.ayanamsa.model === "Lahiri (IAE / IAU 1976)", {
    code: "ayanamsa-model",
    message: "The Ayanamsha label differs from the implemented model.",
    path: "ayanamsa.model",
    expected: "Lahiri (IAE / IAU 1976)",
    actual: chart.ayanamsa.model,
  });
  check(
    angularDistance(
      chart.ayanamsa.trueDegrees,
      chart.ayanamsa.meanDegrees +
        chart.ayanamsa.nutationLongitudeDegrees,
    ) <= EPSILON_DEG,
    {
      code: "ayanamsa-components",
      message:
        "The true Ayanamsha disagrees with its mean and nutation components.",
      path: "ayanamsa.trueDegrees",
      expected: "normalize(meanDegrees + nutationLongitudeDegrees)",
      actual: String(chart.ayanamsa.trueDegrees),
    },
  );

  const allLongitudes = [
    {
      path: "ascendant.siderealLongitudeDeg",
      value: chart.ascendant.siderealLongitudeDeg,
    },
    ...chart.planets.map((planet) => ({
      path: `planets.${planet.id}.siderealLongitudeDeg`,
      value: planet.siderealLongitudeDeg,
    })),
  ];
  for (const longitude of allLongitudes) {
    check(
      Number.isFinite(longitude.value) &&
        longitude.value >= 0 &&
        longitude.value < 360,
      {
        code: "longitude-range",
        message: "A sidereal longitude is outside the normalized 0–360° range.",
        path: longitude.path,
        expected: "0 <= longitude < 360",
        actual: String(longitude.value),
      },
    );
  }

  check(
    chart.planets.length === GRAHA_IDS.length &&
      setEquals(
        chart.planets.map((planet) => planet.id),
        GRAHA_IDS,
      ),
    {
      code: "graha-set",
      message: "The chart does not contain exactly one of each supported graha.",
      path: "planets",
      expected: GRAHA_IDS.join(", "),
      actual: chart.planets.map((planet) => planet.id).join(", "),
    },
  );

  const duplicateGrahas = chart.planets.filter(
    (planet, index) =>
      chart.planets.findIndex((candidate) => candidate.id === planet.id) !==
      index,
  );
  check(duplicateGrahas.length === 0, {
    code: "duplicate-graha",
    message: "A graha occurs more than once.",
    path: "planets",
    actual: duplicateGrahas.map((planet) => planet.id).join(", "),
  });

  check(
    chart.houses.length === 12 &&
      setEquals(
        chart.houses.map((house) => house.number),
        Array.from({ length: 12 }, (_, index) => (index + 1) as HouseNumber),
      ),
    {
      code: "house-set",
      message: "The chart does not contain exactly Houses 1–12.",
      path: "houses",
      expected: "1 through 12",
      actual: chart.houses.map((house) => house.number).join(", "),
    },
  );

  const placements = [
    { path: "ascendant", placement: chart.ascendant },
    ...chart.planets.map((planet) => ({
      path: `planets.${planet.id}`,
      placement: planet,
    })),
  ];
  for (const { path, placement } of placements) {
    const longitude = normalizeDegrees(placement.siderealLongitudeDeg);
    const expectedSignIndex = Math.floor(longitude / 30);
    const expectedDegree = longitude - expectedSignIndex * 30;
    const expectedNakshatraIndex = Math.floor(longitude / NAKSHATRA_SIZE_DEG);
    const degreeWithinNakshatra =
      longitude - expectedNakshatraIndex * NAKSHATRA_SIZE_DEG;
    const expectedPada = (Math.floor(degreeWithinNakshatra / PADA_SIZE_DEG) +
      1) as 1 | 2 | 3 | 4;

    check(
      placement.sign.index === expectedSignIndex &&
        placement.sign.name === RASIS[expectedSignIndex] &&
        isClose(placement.sign.degreeDeg, expectedDegree),
      {
        code: "rasi-derivation",
        message: "A Rasi placement disagrees with its sidereal longitude.",
        path: `${path}.sign`,
        expected: `${RASIS[expectedSignIndex]} ${expectedDegree.toFixed(6)}°`,
        actual: `${placement.sign.name} ${placement.sign.degreeDeg.toFixed(6)}°`,
      },
    );
    check(
      placement.nakshatra.index === expectedNakshatraIndex &&
        placement.nakshatra.name === NAKSHATRAS[expectedNakshatraIndex] &&
        placement.nakshatra.pada === expectedPada &&
        isClose(placement.nakshatra.degreeDeg, degreeWithinNakshatra),
      {
        code: "nakshatra-derivation",
        message:
          "A Nakshatra or Pada placement disagrees with its sidereal longitude.",
        path: `${path}.nakshatra`,
        expected: `${NAKSHATRAS[expectedNakshatraIndex]}, Pada ${expectedPada}`,
        actual: `${placement.nakshatra.name}, Pada ${placement.nakshatra.pada}`,
      },
    );
    check(
      Number.isFinite(placement.tropicalLongitudeDeg) &&
        placement.tropicalLongitudeDeg >= 0 &&
        placement.tropicalLongitudeDeg < 360 &&
        angularDistance(
          placement.siderealLongitudeDeg,
          placement.tropicalLongitudeDeg - chart.ayanamsa.trueDegrees,
        ) <= EPSILON_DEG,
      {
        code: "sidereal-conversion",
        message:
          "A sidereal longitude disagrees with tropical longitude minus the stated Ayanamsha.",
        path,
        expected: "normalize(tropicalLongitudeDeg - ayanamsa.trueDegrees)",
        actual: String(placement.siderealLongitudeDeg),
      },
    );
  }

  const ascendantSign = chart.ascendant.sign.index;
  for (const planet of chart.planets) {
    const expectedHouse = (((planet.sign.index - ascendantSign + 12) % 12) +
      1) as HouseNumber;
    check(planet.house === expectedHouse, {
      code: "planet-house",
      message: "A graha's house disagrees with whole-sign counting from Lagna.",
      path: `planets.${planet.id}.house`,
      expected: String(expectedHouse),
      actual: String(planet.house),
    });
    check(planet.retrograde === (planet.speedDegPerDay < 0), {
      code: "motion-flag",
      message:
        "A graha's retrograde flag disagrees with the sign of its longitudinal speed.",
      path: `planets.${planet.id}.retrograde`,
      expected: String(planet.speedDegPerDay < 0),
      actual: String(planet.retrograde),
    });
    const expectedMotion =
      planet.speedDegPerDay < -0.01
        ? "retrograde"
        : planet.speedDegPerDay > 0.01
          ? "direct"
          : "stationary";
    check(planet.motion === expectedMotion, {
      code: "motion-classification",
      message:
        "A graha's motion label disagrees with the documented 0.01°/day stationary threshold.",
      path: `planets.${planet.id}.motion`,
      expected: expectedMotion,
      actual: planet.motion,
    });
    check(
      Number.isFinite(planet.eclipticLatitudeDeg) &&
        Math.abs(planet.eclipticLatitudeDeg) <= 90 &&
        Number.isFinite(planet.speedDegPerDay) &&
        ((planet.id === "rahu" || planet.id === "ketu")
          ? planet.distanceAu === null
          : typeof planet.distanceAu === "number" &&
            Number.isFinite(planet.distanceAu) &&
            planet.distanceAu > 0),
      {
        code: "graha-coordinate-data",
        message:
          "A graha has an invalid latitude, speed, or distance representation.",
        path: `planets.${planet.id}`,
        expected:
          "finite latitude/speed; positive physical distance or null node distance",
        actual: `${planet.eclipticLatitudeDeg}, ${planet.speedDegPerDay}, ${planet.distanceAu}`,
      },
    );
  }

  for (const house of chart.houses) {
    const expectedSignIndex = (ascendantSign + house.number - 1) % 12;
    const expectedPlanets = chart.planets
      .filter((planet) => planet.house === house.number)
      .map((planet) => planet.id);
    check(
      house.sign.index === expectedSignIndex &&
        house.sign.name === RASIS[expectedSignIndex] &&
        isClose(
          house.siderealStartLongitudeDeg,
          normalizeDegrees(expectedSignIndex * 30),
        ),
      {
        code: "house-rasi",
        message: "A house's Rasi disagrees with whole-sign sequencing.",
        path: `houses.${house.number}.sign`,
        expected: RASIS[expectedSignIndex],
        actual: house.sign.name,
      },
    );
    check(setEquals(house.planets, expectedPlanets), {
      code: "house-planets",
      message:
        "A house's graha list disagrees with the planets' own house fields.",
      path: `houses.${house.number}.planets`,
      expected: expectedPlanets.join(", "),
      actual: house.planets.join(", "),
    });
  }

  const rahu = chart.planets.find((planet) => planet.id === "rahu");
  const ketu = chart.planets.find((planet) => planet.id === "ketu");
  check(Boolean(rahu && ketu), {
    code: "node-pair",
    message: "Both Rahu and Ketu are required for the documented node model.",
    path: "planets",
  });
  if (rahu && ketu) {
    check(
      isClose(
        angularDistance(rahu.siderealLongitudeDeg, ketu.siderealLongitudeDeg),
        180,
      ),
      {
        code: "node-opposition",
        message: "Rahu and Ketu are not exactly opposite one another.",
        path: "planets.rahu/ketu",
        expected: "180° separation",
        actual: `${angularDistance(
          rahu.siderealLongitudeDeg,
          ketu.siderealLongitudeDeg,
        ).toFixed(6)}° separation`,
      },
    );
  }

  check(
    Number.isFinite(chart.ayanamsa.trueDegrees) &&
      chart.ayanamsa.trueDegrees > 0 &&
      chart.ayanamsa.trueDegrees < 40,
    {
      code: "ayanamsa-range",
      message: "The ayanamsa is outside a broad plausible modern range.",
      path: "ayanamsa.trueDegrees",
      severity: "warning",
      expected: "0° < ayanamsa < 40°",
      actual: String(chart.ayanamsa.trueDegrees),
    },
  );

  const errorCount = findings.filter(
    (finding) => finding.severity === "error",
  ).length;
  const warningCount = findings.filter(
    (finding) => finding.severity === "warning",
  ).length;

  return {
    isStructurallyConsistent: errorCount === 0,
    checksPerformed,
    errorCount,
    warningCount,
    findings,
    limitations: ANALYSIS_LIMITATIONS,
    referenceInstant: chart.instant,
  };
}

export function isSupportedGrahaId(value: string): value is GrahaId {
  return (GRAHA_IDS as readonly string[]).includes(value);
}
