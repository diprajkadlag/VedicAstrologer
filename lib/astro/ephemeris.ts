import {
  Body,
  CombineRotation,
  Ecliptic,
  GeoVector,
  MakeTime,
  Observer,
  Rotation_ECT_EQD,
  Rotation_EQD_HOR,
  type AstroTime,
  type FlexibleDateTime,
} from "astronomy-engine";

/**
 * Astronomy Engine works with absolute instants. A civil birth date/time must be
 * resolved through the birthplace's historical IANA time zone before it reaches
 * this module; a present-day numeric UTC offset is not sufficient around DST.
 */

export const RASIS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

export const GRAHA_IDS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "rahu",
  "ketu",
] as const;

export type RasiName = (typeof RASIS)[number];
export type NakshatraName = (typeof NAKSHATRAS)[number];
export type GrahaId = (typeof GRAHA_IDS)[number];
export type Motion = "direct" | "retrograde" | "stationary";
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Pada = 1 | 2 | 3 | 4;

export interface RasiPlacement {
  index: number;
  name: RasiName;
  degreeDeg: number;
}

export interface NakshatraPlacement {
  index: number;
  name: NakshatraName;
  lord: GrahaId;
  pada: Pada;
  degreeDeg: number;
}

export interface ZodiacPlacement {
  siderealLongitudeDeg: number;
  sign: RasiPlacement;
  nakshatra: NakshatraPlacement;
}

export interface ChartAngle extends ZodiacPlacement {
  tropicalLongitudeDeg: number;
}

export interface GrahaPosition extends ZodiacPlacement {
  id: GrahaId;
  name: string;
  tropicalLongitudeDeg: number;
  eclipticLatitudeDeg: number;
  distanceAu: number | null;
  speedDegPerDay: number;
  motion: Motion;
  retrograde: boolean;
  house: HouseNumber;
}

export interface HousePosition {
  number: HouseNumber;
  sign: Pick<RasiPlacement, "index" | "name">;
  siderealStartLongitudeDeg: number;
  planets: GrahaId[];
}

export interface LahiriAyanamsa {
  model: "Lahiri (IAE / IAU 1976)";
  meanDegrees: number;
  nutationLongitudeDegrees: number;
  trueDegrees: number;
}

export interface ChartInput {
  /** A valid absolute instant; JavaScript Date stores UTC internally. */
  instant: Date;
  /** Geodetic latitude in degrees; exact geographic poles are unsupported. */
  latitude: number;
  /** Longitude in degrees east of Greenwich, in the range [-180, 180]. */
  longitude: number;
  elevationMeters?: number;
}

export interface VedicChart {
  instant: string;
  location: {
    latitude: number;
    longitude: number;
    elevationMeters: number;
  };
  coordinateSystem: "sidereal";
  houseSystem: "whole-sign";
  nodeModel: "mean";
  ayanamsa: LahiriAyanamsa;
  ascendant: ChartAngle;
  planets: GrahaPosition[];
  houses: HousePosition[];
  accuracy: {
    engine: "astronomy-engine";
    advertisedArcMinutes: 1;
    planetaryFrame: "apparent geocentric true ecliptic of date";
    note: string;
  };
}

export interface GrahaTrajectoryPoint {
  instant: string;
  siderealLongitudeDeg: number;
  eclipticLatitudeDeg: number;
}

export interface GrahaTrajectory {
  id: GrahaId;
  points: readonly GrahaTrajectoryPoint[];
}

export interface GrahaTrajectoryOptions {
  /** Odd sample counts keep the selected instant at the center point. */
  samples?: number;
}

const NAKSHATRA_SIZE_DEG = 360 / 27;
const PADA_SIZE_DEG = NAKSHATRA_SIZE_DEG / 4;
const MOTION_SAMPLE_HALF_WINDOW_DAYS = 0.5;
const STATIONARY_THRESHOLD_DEG_PER_DAY = 0.01;
const LAHIRI_J2000_MEAN_DEG = 23 + 51 / 60 + 25.5324 / 3600;

/** Per-graha half windows keep fast and slow trails visually legible. */
const TRAJECTORY_HALF_SPAN_DAYS: Readonly<Record<GrahaId, number>> = {
  sun: 45,
  moon: 1,
  mercury: 15,
  venus: 25,
  mars: 45,
  jupiter: 120,
  saturn: 180,
  rahu: 365,
  ketu: 365,
};

const NAKSHATRA_LORDS = [
  "ketu",
  "venus",
  "sun",
  "moon",
  "mars",
  "rahu",
  "jupiter",
  "saturn",
  "mercury",
] as const satisfies readonly GrahaId[];

const PHYSICAL_GRAHAS = [
  { id: "sun", name: "Sun", body: Body.Sun },
  { id: "moon", name: "Moon", body: Body.Moon },
  { id: "mercury", name: "Mercury", body: Body.Mercury },
  { id: "venus", name: "Venus", body: Body.Venus },
  { id: "mars", name: "Mars", body: Body.Mars },
  { id: "jupiter", name: "Jupiter", body: Body.Jupiter },
  { id: "saturn", name: "Saturn", body: Body.Saturn },
] as const;

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
}

function assertValidInstant(instant: Date): void {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new TypeError("instant must be a valid Date representing an absolute time.");
  }
}

function validateInput(input: ChartInput): Required<ChartInput> {
  assertValidInstant(input.instant);
  assertFinite(input.latitude, "latitude");
  assertFinite(input.longitude, "longitude");

  if (input.latitude <= -90 || input.latitude >= 90) {
    throw new RangeError("latitude must be strictly between -90 and 90 degrees.");
  }

  if (input.longitude < -180 || input.longitude > 180) {
    throw new RangeError("longitude must be between -180 and 180 degrees.");
  }

  const elevationMeters = input.elevationMeters ?? 0;
  assertFinite(elevationMeters, "elevationMeters");
  if (elevationMeters < -500 || elevationMeters > 100_000) {
    throw new RangeError("elevationMeters must be between -500 and 100000 metres.");
  }

  return { ...input, elevationMeters };
}

export function normalizeDegrees(value: number): number {
  assertFinite(value, "angle");
  const remainder = value % 360;
  if (Object.is(remainder, -0)) return 0;
  return remainder < 0 ? remainder + 360 : remainder;
}

/** Returns the shortest signed angular motion from `fromDeg` to `toDeg`. */
export function signedAngularDelta(fromDeg: number, toDeg: number): number {
  return ((normalizeDegrees(toDeg - fromDeg) + 180) % 360) - 180;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getRasi(siderealLongitudeDeg: number): RasiPlacement {
  const longitude = normalizeDegrees(siderealLongitudeDeg);
  const index = Math.min(Math.floor(longitude / 30), RASIS.length - 1);

  return {
    index,
    name: RASIS[index],
    degreeDeg: longitude - index * 30,
  };
}

export function getNakshatra(siderealLongitudeDeg: number): NakshatraPlacement {
  const longitude = normalizeDegrees(siderealLongitudeDeg);
  const index = Math.min(
    Math.floor(longitude / NAKSHATRA_SIZE_DEG),
    NAKSHATRAS.length - 1,
  );
  const degreeDeg = longitude - index * NAKSHATRA_SIZE_DEG;
  const pada = Math.min(4, Math.floor(degreeDeg / PADA_SIZE_DEG) + 1) as Pada;

  return {
    index,
    name: NAKSHATRAS[index],
    lord: NAKSHATRA_LORDS[index % NAKSHATRA_LORDS.length],
    pada,
    degreeDeg,
  };
}

function zodiacPlacement(siderealLongitudeDeg: number): ZodiacPlacement {
  const longitude = normalizeDegrees(siderealLongitudeDeg);
  return {
    siderealLongitudeDeg: longitude,
    sign: getRasi(longitude),
    nakshatra: getNakshatra(longitude),
  };
}

/**
 * Standard Lahiri/Chitrapaksha ayanamsa used by the Indian Astronomical
 * Ephemeris. The mean value follows the published IAU-1976 polynomial. The
 * short nutation series converts it to the true equinox used by Ecliptic().
 *
 * References:
 * - https://www.astro.com/swisseph/swisseph.pdf
 * - https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md
 */
function lahiriAyanamsaAt(instant: FlexibleDateTime): LahiriAyanamsa {
  const centuries = MakeTime(instant).tt / 36_525;
  const centuries2 = centuries * centuries;
  const centuries3 = centuries2 * centuries;
  const precessionArcSeconds =
    5029.0966 * centuries +
    1.11161 * centuries2 -
    0.000113 * centuries3;
  const meanDegrees = normalizeDegrees(
    LAHIRI_J2000_MEAN_DEG + precessionArcSeconds / 3600,
  );

  // Truncated IAU-1980 nutation in longitude; accurate to about 0.5 arcsec.
  const solarMeanLongitude = normalizeDegrees(280.4665 + 36_000.7698 * centuries);
  const lunarMeanLongitude = normalizeDegrees(218.3165 + 481_267.8813 * centuries);
  const lunarAscendingNode = normalizeDegrees(125.04452 - 1934.136261 * centuries);
  const nutationArcSeconds =
    -17.2 * Math.sin(degreesToRadians(lunarAscendingNode)) -
    1.32 * Math.sin(degreesToRadians(2 * solarMeanLongitude)) -
    0.23 * Math.sin(degreesToRadians(2 * lunarMeanLongitude)) +
    0.21 * Math.sin(degreesToRadians(2 * lunarAscendingNode));
  const nutationLongitudeDegrees = nutationArcSeconds / 3600;

  return {
    model: "Lahiri (IAE / IAU 1976)",
    meanDegrees,
    nutationLongitudeDegrees,
    trueDegrees: normalizeDegrees(meanDegrees + nutationLongitudeDegrees),
  };
}

export function calculateLahiriAyanamsa(instant: Date): LahiriAyanamsa {
  assertValidInstant(instant);
  return lahiriAyanamsaAt(instant);
}

function apparentGeocentricPosition(body: Body, instant: FlexibleDateTime) {
  // EclipticLongitude() is deliberately not used: it is heliocentric.
  const vector = GeoVector(body, instant, true);
  const ecliptic = Ecliptic(vector);
  const ayanamsa = lahiriAyanamsaAt(instant);

  return {
    tropicalLongitudeDeg: ecliptic.elon,
    siderealLongitudeDeg: normalizeDegrees(ecliptic.elon - ayanamsa.trueDegrees),
    eclipticLatitudeDeg: ecliptic.elat,
    distanceAu: vector.Length(),
  };
}

function longitudeSpeed(
  longitudeAt: (instant: AstroTime) => number,
  instant: FlexibleDateTime,
): number {
  const time = MakeTime(instant);
  const past = longitudeAt(time.AddDays(-MOTION_SAMPLE_HALF_WINDOW_DAYS));
  const future = longitudeAt(time.AddDays(MOTION_SAMPLE_HALF_WINDOW_DAYS));
  return (
    signedAngularDelta(past, future) /
    (2 * MOTION_SAMPLE_HALF_WINDOW_DAYS)
  );
}

function classifyMotion(id: GrahaId, speedDegPerDay: number): Motion {
  if (id === "sun" || id === "moon") return "direct";
  if (speedDegPerDay < -STATIONARY_THRESHOLD_DEG_PER_DAY) return "retrograde";
  if (speedDegPerDay > STATIONARY_THRESHOLD_DEG_PER_DAY) return "direct";
  return "stationary";
}

/** Mean ascending lunar node, referred to the mean equinox of date. */
function meanNodeTropicalLongitude(instant: FlexibleDateTime): number {
  const centuries = MakeTime(instant).tt / 36_525;
  const centuries2 = centuries * centuries;
  const centuries3 = centuries2 * centuries;
  const centuries4 = centuries3 * centuries;

  // IERS Conventions (2003), Technical Note 32, chapter 5.
  const arcSeconds =
    450_160.398036 -
    6_962_890.5431 * centuries +
    7.4722 * centuries2 +
    0.007702 * centuries3 -
    0.00005939 * centuries4;

  return normalizeDegrees(arcSeconds / 3600);
}

function meanNodeSiderealLongitude(instant: FlexibleDateTime): number {
  const meanTropicalLongitude = meanNodeTropicalLongitude(instant);
  const ayanamsa = lahiriAyanamsaAt(instant);
  return normalizeDegrees(meanTropicalLongitude - ayanamsa.meanDegrees);
}

function calculatePhysicalGraha(
  graha: (typeof PHYSICAL_GRAHAS)[number],
  instant: Date,
  ascendantSignIndex: number,
): GrahaPosition {
  const coordinates = apparentGeocentricPosition(graha.body, instant);
  const placement = zodiacPlacement(coordinates.siderealLongitudeDeg);
  const speedDegPerDay = longitudeSpeed(
    (sampleTime) =>
      apparentGeocentricPosition(graha.body, sampleTime).siderealLongitudeDeg,
    instant,
  );
  const motion = classifyMotion(graha.id, speedDegPerDay);

  return {
    id: graha.id,
    name: graha.name,
    ...coordinates,
    ...placement,
    speedDegPerDay,
    motion,
    // Keep the R flag tied to the actual direction of travel. `motion` may be
    // classified as stationary inside the display threshold on either side of
    // an exact station, but a small negative speed is still retrograde.
    retrograde: speedDegPerDay < 0,
    house: houseForSign(placement.sign.index, ascendantSignIndex),
  };
}

function calculateNodeGraha(
  id: "rahu" | "ketu",
  instant: Date,
  ascendantSignIndex: number,
): GrahaPosition {
  const ayanamsa = lahiriAyanamsaAt(instant);
  const offset = id === "ketu" ? 180 : 0;
  const meanTropicalLongitude = normalizeDegrees(
    meanNodeTropicalLongitude(instant) + offset,
  );
  const siderealLongitudeDeg = normalizeDegrees(
    meanTropicalLongitude - ayanamsa.meanDegrees,
  );
  const tropicalLongitudeDeg = normalizeDegrees(
    meanTropicalLongitude + ayanamsa.nutationLongitudeDegrees,
  );
  const placement = zodiacPlacement(siderealLongitudeDeg);
  const speedDegPerDay = longitudeSpeed(
    (sampleTime) =>
      normalizeDegrees(meanNodeSiderealLongitude(sampleTime) + offset),
    instant,
  );
  const motion = classifyMotion(id, speedDegPerDay);

  return {
    id,
    name: id === "rahu" ? "Rahu" : "Ketu",
    tropicalLongitudeDeg,
    ...placement,
    eclipticLatitudeDeg: 0,
    distanceAu: null,
    speedDegPerDay,
    motion,
    retrograde: speedDegPerDay < 0,
    house: houseForSign(placement.sign.index, ascendantSignIndex),
  };
}

/**
 * Finds the rising intersection of the true ecliptic and local horizon. The
 * Astronomy Engine horizontal frame uses +y for west, so the opposite root
 * (negative horizontal y) is the eastern/rising point.
 */
function tropicalAscendant(input: Required<ChartInput>): number {
  const time = MakeTime(input.instant);
  const observer = new Observer(
    input.latitude,
    input.longitude,
    input.elevationMeters,
  );
  const eclipticToHorizon = CombineRotation(
    Rotation_ECT_EQD(time),
    Rotation_EQD_HOR(time, observer),
  ).rot;

  const altitudeX = eclipticToHorizon[0][2];
  const altitudeY = eclipticToHorizon[1][2];
  const intersectionLength = Math.hypot(altitudeX, altitudeY);
  if (intersectionLength < 1e-12) {
    throw new RangeError("The ecliptic and local horizon are numerically degenerate.");
  }

  let x = altitudeY / intersectionLength;
  let y = -altitudeX / intersectionLength;
  const west = eclipticToHorizon[0][1] * x + eclipticToHorizon[1][1] * y;

  if (Math.abs(west) < 1e-12) {
    throw new RangeError("The ascendant is undefined at this polar horizon tangent.");
  }

  if (west > 0) {
    x = -x;
    y = -y;
  }

  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

export function calculateAscendant(input: ChartInput): ChartAngle {
  const validated = validateInput(input);
  const tropicalLongitudeDeg = tropicalAscendant(validated);
  const ayanamsa = lahiriAyanamsaAt(validated.instant);
  const placement = zodiacPlacement(
    tropicalLongitudeDeg - ayanamsa.trueDegrees,
  );

  return { tropicalLongitudeDeg, ...placement };
}

function houseForSign(signIndex: number, ascendantSignIndex: number): HouseNumber {
  return (((signIndex - ascendantSignIndex + 12) % 12) + 1) as HouseNumber;
}

function buildHouses(
  ascendantSignIndex: number,
  planets: GrahaPosition[],
): HousePosition[] {
  return Array.from({ length: 12 }, (_, index) => {
    const number = (index + 1) as HouseNumber;
    const signIndex = (ascendantSignIndex + index) % 12;

    return {
      number,
      sign: { index: signIndex, name: RASIS[signIndex] },
      siderealStartLongitudeDeg: signIndex * 30,
      planets: planets
        .filter((planet) => planet.house === number)
        .map((planet) => planet.id),
    };
  });
}

export function calculateVedicChart(input: ChartInput): VedicChart {
  const validated = validateInput(input);
  const ascendant = calculateAscendant(validated);
  const ascendantSignIndex = ascendant.sign.index;
  const physicalPlanets = PHYSICAL_GRAHAS.map((graha) =>
    calculatePhysicalGraha(graha, validated.instant, ascendantSignIndex),
  );
  const nodes = (["rahu", "ketu"] as const).map((id) =>
    calculateNodeGraha(id, validated.instant, ascendantSignIndex),
  );
  const planets = [...physicalPlanets, ...nodes];

  return {
    instant: validated.instant.toISOString(),
    location: {
      latitude: validated.latitude,
      longitude: validated.longitude,
      elevationMeters: validated.elevationMeters,
    },
    coordinateSystem: "sidereal",
    houseSystem: "whole-sign",
    nodeModel: "mean",
    ayanamsa: calculateLahiriAyanamsa(validated.instant),
    ascendant,
    planets,
    houses: buildHouses(ascendantSignIndex, planets),
    accuracy: {
      engine: "astronomy-engine",
      advertisedArcMinutes: 1,
      planetaryFrame: "apparent geocentric true ecliptic of date",
      note:
        "Treat placements within one arcminute of a sign, nakshatra, or pada boundary as uncertain. Motion labels close to zero speed are separately sensitive around a station.",
    },
  };
}

/**
 * Samples real apparent geocentric positions around an instant for WebGL
 * trails. Different time windows are used per graha so the Moon does not wrap
 * repeatedly while slow Saturn and the nodes still produce a visible arc.
 */
export function calculateGrahaTrajectories(
  input: ChartInput,
  options: GrahaTrajectoryOptions = {},
): GrahaTrajectory[] {
  const validated = validateInput(input);
  const samples = options.samples ?? 25;
  if (!Number.isInteger(samples) || samples < 3 || samples > 97 || samples % 2 === 0) {
    throw new RangeError("trajectory samples must be an odd integer between 3 and 97.");
  }

  return GRAHA_IDS.map((id) => {
    const halfSpanDays = TRAJECTORY_HALF_SPAN_DAYS[id];
    const physical = PHYSICAL_GRAHAS.find((candidate) => candidate.id === id);
    const points = Array.from({ length: samples }, (_, index) => {
      const fraction = index / (samples - 1);
      const dayOffset = -halfSpanDays + fraction * halfSpanDays * 2;
      const instant = new Date(
        validated.instant.getTime() + dayOffset * 24 * 60 * 60 * 1000,
      );

      if (physical) {
        const position = apparentGeocentricPosition(physical.body, instant);
        return {
          instant: instant.toISOString(),
          siderealLongitudeDeg: position.siderealLongitudeDeg,
          eclipticLatitudeDeg: position.eclipticLatitudeDeg,
        };
      }

      const offset = id === "ketu" ? 180 : 0;
      return {
        instant: instant.toISOString(),
        siderealLongitudeDeg: normalizeDegrees(
          meanNodeSiderealLongitude(instant) + offset,
        ),
        eclipticLatitudeDeg: 0,
      };
    });

    return { id, points };
  });
}

/** Standard astronomical ecliptic Cartesian axes; useful for later 3D mapping. */
export function eclipticToUnitVector(
  longitudeDeg: number,
  latitudeDeg: number,
): { x: number; y: number; z: number } {
  assertFinite(latitudeDeg, "latitudeDeg");
  if (latitudeDeg < -90 || latitudeDeg > 90) {
    throw new RangeError("latitudeDeg must be between -90 and 90 degrees.");
  }

  const longitude = degreesToRadians(normalizeDegrees(longitudeDeg));
  const latitude = degreesToRadians(latitudeDeg);
  const cosLatitude = Math.cos(latitude);

  return {
    x: cosLatitude * Math.cos(longitude),
    y: cosLatitude * Math.sin(longitude),
    z: Math.sin(latitude),
  };
}
