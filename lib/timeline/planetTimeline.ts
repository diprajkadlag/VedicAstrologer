import {
  calculateLongitudeSpeed,
  calculateSiderealLongitude,
  normalizeDegrees,
  signedAngularDelta,
  type GrahaId,
} from "../astro/ephemeris";

/**
 * Long-range motion of one graha for the life timeline: an unwrapped longitude
 * table for drawing, plus exact stations and sign ingresses for everything
 * that depends on a sign or on retrograde motion.
 *
 * Pure and free of DOM APIs, so the same code runs in the timeline Web Worker,
 * in its main-thread fallback, and in Vitest. Every longitude comes from
 * calculateSiderealLongitude and every motion flag from
 * calculateLongitudeSpeed, which are the chart's own functions.
 */

export const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/**
 * Sample step per graha, in days. Each step is far below the shortest
 * retrograde loop of its graha (Mercury about 20 days, Venus about 40, Mars
 * about 58, Jupiter about 118, Saturn about 136), so one bracket never holds
 * two stations, and every graha moves far less than 180 degrees per step.
 * Linear interpolation between samples stays near 0.1 degree or better.
 */
export const SAMPLE_STEP_DAYS: Readonly<Record<GrahaId, number>> = {
  sun: 10,
  moon: 0.25,
  mercury: 2,
  venus: 3,
  mars: 3,
  jupiter: 6,
  saturn: 8,
  rahu: 10,
  ketu: 10,
};

/**
 * Slow bodies first: the years view needs only these, so it can draw while
 * the faster bodies are still being calculated. The Moon is calculated per
 * visible window instead (see computeMoonWindow).
 */
export const PLANET_COMPUTE_ORDER = [
  "saturn",
  "jupiter",
  "rahu",
  "ketu",
  "sun",
  "mars",
  "venus",
  "mercury",
] as const satisfies readonly GrahaId[];

/** A station is located to within this interval. */
const STATION_TOLERANCE_MS = 15 * MINUTE_MS;
/** A boundary crossing is located to within this interval or 1e-7 degree. */
const CROSSING_TOLERANCE_MS = MINUTE_MS;
const CROSSING_TOLERANCE_DEG = 1e-7;

export const SIGN_SPAN_DEG = 30;

export interface LongitudeSeries {
  readonly startMs: number;
  readonly stepMs: number;
  /** Sidereal longitude in degrees, unwrapped so that it is continuous across 360. */
  readonly unwrapped: Float64Array;
}

export type MotionTurn = "retrograde" | "direct";

export interface StationEvent {
  readonly kind: "station";
  readonly id: GrahaId;
  readonly ms: number;
  /** The motion that begins at the station. */
  readonly turns: MotionTurn;
  readonly longitudeDeg: number;
}

export interface IngressEvent {
  readonly kind: "ingress";
  readonly id: GrahaId;
  readonly ms: number;
  readonly fromSign: number;
  readonly toSign: number;
  /** True when the graha crosses the boundary while moving backwards. */
  readonly retrograde: boolean;
}

export type PlanetEvent = StationEvent | IngressEvent;

export interface PlanetTimeline {
  readonly id: GrahaId;
  readonly startMs: number;
  readonly endMs: number;
  readonly series: LongitudeSeries;
  readonly initialSign: number;
  readonly initialRetrograde: boolean;
  /** Stations and ingresses inside (startMs, endMs), in time order. */
  readonly events: readonly PlanetEvent[];
  /** Wall-clock calculation time, for the performance budget only. */
  readonly computeMs: number;
}

/** One stretch of time with a constant sign and a constant direction. */
export interface MotionSegment {
  readonly startMs: number;
  readonly endMs: number;
  readonly signIndex: number;
  readonly retrograde: boolean;
}

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function longitudeAt(id: GrahaId, ms: number): number {
  return calculateSiderealLongitude(id, new Date(ms));
}

function speedSignAt(id: GrahaId, ms: number): number {
  return Math.sign(calculateLongitudeSpeed(id, new Date(ms)));
}

function modulo12(value: number): number {
  return ((value % 12) + 12) % 12;
}

export function signIndexOfLongitude(longitudeDeg: number): number {
  return Math.min(11, Math.floor(normalizeDegrees(longitudeDeg) / SIGN_SPAN_DEG));
}

function assertRange(startMs: number, endMs: number): void {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new RangeError("A timeline range needs finite start and end instants, with end after start.");
  }
}

export function sampleLongitudes(
  id: GrahaId,
  startMs: number,
  endMs: number,
  stepMs: number,
): LongitudeSeries {
  assertRange(startMs, endMs);
  if (!Number.isFinite(stepMs) || stepMs <= 0) {
    throw new RangeError("stepMs must be a positive, finite number of milliseconds.");
  }

  // One extra sample so the table always reaches past endMs.
  const count = Math.ceil((endMs - startMs) / stepMs) + 1;
  const unwrapped = new Float64Array(count);
  let previous = longitudeAt(id, startMs);
  unwrapped[0] = previous;
  for (let index = 1; index < count; index += 1) {
    const current = longitudeAt(id, startMs + index * stepMs);
    unwrapped[index] = unwrapped[index - 1] + signedAngularDelta(previous, current);
    previous = current;
  }

  return { startMs, stepMs, unwrapped };
}

/** Linearly interpolated unwrapped longitude, clamped to the table's ends. */
export function interpolateUnwrapped(series: LongitudeSeries, ms: number): number {
  const { startMs, stepMs, unwrapped } = series;
  const position = Math.min(
    unwrapped.length - 1,
    Math.max(0, (ms - startMs) / stepMs),
  );
  const index = Math.min(unwrapped.length - 2, Math.floor(position));
  const fraction = position - index;
  return unwrapped[index] + (unwrapped[index + 1] - unwrapped[index]) * fraction;
}

/** The exact longitude, placed on the same unwrapped turn as the table. */
function exactUnwrapped(id: GrahaId, series: LongitudeSeries, ms: number): number {
  const approximate = interpolateUnwrapped(series, ms);
  return approximate + signedAngularDelta(normalizeDegrees(approximate), longitudeAt(id, ms));
}

function bisectStation(
  id: GrahaId,
  lowMs: number,
  highMs: number,
  lowSign: number,
): number {
  let low = lowMs;
  let high = highMs;
  while (high - low > STATION_TOLERANCE_MS) {
    const middle = (low + high) / 2;
    if (speedSignAt(id, middle) === lowSign) low = middle;
    else high = middle;
  }
  return Math.round((low + high) / 2);
}

/**
 * A station shows in the table as a sample whose two neighbouring steps point
 * in opposite directions. The true turning point then lies between the two
 * neighbours. The chart's speed sign is bisected inside that bracket, widened
 * by one step on each side when the one-day speed window lands just outside.
 */
function findStations(id: GrahaId, series: LongitudeSeries): StationEvent[] {
  const { startMs, stepMs, unwrapped } = series;
  const lastIndex = unwrapped.length - 1;
  const stations: StationEvent[] = [];

  for (let index = 1; index < lastIndex; index += 1) {
    const before = unwrapped[index] - unwrapped[index - 1];
    const after = unwrapped[index + 1] - unwrapped[index];
    if (!(before * after < 0)) continue;

    let lowIndex = index - 1;
    let highIndex = index + 1;
    let lowSign = speedSignAt(id, startMs + lowIndex * stepMs);
    let highSign = speedSignAt(id, startMs + highIndex * stepMs);
    if (lowSign === highSign) {
      lowIndex = Math.max(0, index - 2);
      highIndex = Math.min(lastIndex, index + 2);
      lowSign = speedSignAt(id, startMs + lowIndex * stepMs);
      highSign = speedSignAt(id, startMs + highIndex * stepMs);
    }
    if (lowSign === highSign || lowSign === 0 || highSign === 0) continue;

    const ms = bisectStation(
      id,
      startMs + lowIndex * stepMs,
      startMs + highIndex * stepMs,
      lowSign,
    );
    const previous = stations.at(-1);
    // A widened bracket can meet the same station twice; keep the first.
    if (previous && Math.abs(previous.ms - ms) <= 2 * STATION_TOLERANCE_MS) continue;
    stations.push({
      kind: "station",
      id,
      ms,
      turns: lowSign > 0 ? "retrograde" : "direct",
      longitudeDeg: longitudeAt(id, ms),
    });
  }

  return stations;
}

/**
 * Solves unwrapped(ms) = target inside a bracket where the longitude is
 * monotonic, with the Illinois variant of regula falsi.
 */
function solveCrossing(
  id: GrahaId,
  series: LongitudeSeries,
  fromMs: number,
  toMs: number,
  fromValue: number,
  toValue: number,
  target: number,
): number {
  let x0 = fromMs;
  let x1 = toMs;
  let f0 = fromValue - target;
  let f1 = toValue - target;
  let lastSide = 0;

  for (let iteration = 0; iteration < 64; iteration += 1) {
    if (Math.abs(x1 - x0) <= CROSSING_TOLERANCE_MS) break;
    const x = x1 - (f1 * (x1 - x0)) / (f1 - f0);
    const fx = exactUnwrapped(id, series, x) - target;
    if (Math.abs(fx) <= CROSSING_TOLERANCE_DEG) return Math.round(x);
    if (Math.sign(fx) === Math.sign(f1)) {
      x1 = x;
      f1 = fx;
      if (lastSide === -1) f0 /= 2;
      lastSide = -1;
    } else {
      x0 = x;
      f0 = fx;
      if (lastSide === 1) f1 /= 2;
      lastSide = 1;
    }
  }

  return Math.round((x0 + x1) / 2);
}

/**
 * Between two stations the longitude is monotonic, so every boundary between
 * the two end values is crossed exactly once there. This finds even a crossing
 * that is undone by a retrograde turn within a single sample step.
 */
export function findBoundaryCrossings(
  id: GrahaId,
  series: LongitudeSeries,
  stations: readonly StationEvent[],
  startMs: number,
  endMs: number,
  spanDeg: number,
): { ms: number; boundaryIndex: number; forward: boolean }[] {
  const cuts = [startMs, ...stations.map((station) => station.ms), endMs];
  const crossings: { ms: number; boundaryIndex: number; forward: boolean }[] = [];

  for (let cut = 0; cut < cuts.length - 1; cut += 1) {
    const fromMs = cuts[cut];
    const toMs = cuts[cut + 1];
    if (toMs <= fromMs) continue;
    const fromValue = exactUnwrapped(id, series, fromMs);
    const toValue = exactUnwrapped(id, series, toMs);
    if (toValue === fromValue) continue;

    const forward = toValue > fromValue;
    const step = forward ? 1 : -1;
    for (
      let boundary = forward
        ? Math.floor(fromValue / spanDeg) + 1
        : Math.ceil(fromValue / spanDeg) - 1;
      forward ? boundary * spanDeg <= toValue : boundary * spanDeg >= toValue;
      boundary += step
    ) {
      crossings.push({
        ms: solveCrossing(id, series, fromMs, toMs, fromValue, toValue, boundary * spanDeg),
        boundaryIndex: boundary,
        forward,
      });
    }
  }

  return crossings;
}

function mergeByTime(
  stations: readonly StationEvent[],
  ingresses: readonly IngressEvent[],
): PlanetEvent[] {
  const merged: PlanetEvent[] = [];
  let s = 0;
  let i = 0;
  while (s < stations.length || i < ingresses.length) {
    if (i >= ingresses.length || (s < stations.length && stations[s].ms <= ingresses[i].ms)) {
      merged.push(stations[s]);
      s += 1;
    } else {
      merged.push(ingresses[i]);
      i += 1;
    }
  }
  return merged;
}

export function computePlanetTimeline(
  id: GrahaId,
  startMs: number,
  endMs: number,
  stepDays: number = SAMPLE_STEP_DAYS[id],
): PlanetTimeline {
  assertRange(startMs, endMs);
  const began = now();
  const stepMs = stepDays * DAY_MS;
  // One step of margin on each side: a station in the first or last half
  // step of the range still has samples on both sides of it.
  const series = sampleLongitudes(id, startMs - stepMs, endMs + stepMs, stepMs);
  const initialSign = signIndexOfLongitude(longitudeAt(id, startMs));
  const initialRetrograde = speedSignAt(id, startMs) < 0;

  // Events are located to a tolerance, so one that happens just after the
  // start can be placed just before it. Keep such an event only when the
  // state at the start says it has not happened yet, and move it onto the
  // start; every kept event then changes the state it claims to change.
  let retrograde = initialRetrograde;
  const stations: StationEvent[] = [];
  for (const station of findStations(id, series)) {
    if (station.ms < startMs - 2 * STATION_TOLERANCE_MS || station.ms >= endMs) continue;
    const turnsRetrograde = station.turns === "retrograde";
    if (turnsRetrograde === retrograde) continue;
    stations.push(station.ms < startMs ? { ...station, ms: startMs } : station);
    retrograde = turnsRetrograde;
  }

  let sign = initialSign;
  const ingresses: IngressEvent[] = [];
  for (const crossing of findBoundaryCrossings(id, series, stations, startMs, endMs, SIGN_SPAN_DEG)) {
    if (crossing.ms < startMs - CROSSING_TOLERANCE_MS || crossing.ms >= endMs) continue;
    const fromSign = modulo12(crossing.forward ? crossing.boundaryIndex - 1 : crossing.boundaryIndex);
    const toSign = modulo12(crossing.forward ? crossing.boundaryIndex : crossing.boundaryIndex - 1);
    if (fromSign !== sign) continue;
    ingresses.push({
      kind: "ingress",
      id,
      ms: Math.max(startMs, crossing.ms),
      fromSign,
      toSign,
      retrograde: !crossing.forward,
    });
    sign = toSign;
  }

  return {
    id,
    startMs,
    endMs,
    series,
    initialSign,
    initialRetrograde,
    events: mergeByTime(stations, ingresses),
    computeMs: now() - began,
  };
}

/** The Moon for one window only; a lifetime of lunar samples is not needed. */
export function computeMoonWindow(startMs: number, endMs: number): PlanetTimeline {
  return computePlanetTimeline("moon", startMs, endMs);
}

/** Constant-sign, constant-direction stretches, from the timeline's events. */
export function motionSegments(timeline: PlanetTimeline): MotionSegment[] {
  const segments: MotionSegment[] = [];
  let signIndex = timeline.initialSign;
  let retrograde = timeline.initialRetrograde;
  let cursor = timeline.startMs;

  for (const event of timeline.events) {
    if (event.ms > cursor) {
      segments.push({ startMs: cursor, endMs: event.ms, signIndex, retrograde });
      cursor = event.ms;
    }
    if (event.kind === "ingress") signIndex = event.toSign;
    else retrograde = event.turns === "retrograde";
  }
  if (timeline.endMs > cursor) {
    segments.push({ startMs: cursor, endMs: timeline.endMs, signIndex, retrograde });
  }

  return segments;
}

/** Binary search for the segment containing ms (half-open intervals). */
export function segmentAt(
  segments: readonly MotionSegment[],
  ms: number,
): MotionSegment | undefined {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const segment = segments[middle];
    if (ms < segment.startMs) high = middle - 1;
    else if (ms >= segment.endMs) low = middle + 1;
    else return segment;
  }
  return undefined;
}
