import {
  VIMSHOTTARI_SEQUENCE,
  VIMSHOTTARI_YEAR_DAYS,
  calculateVimshottariTimeline,
  subdivideVimshottariPeriod,
  type DashaLord,
} from "../astro/interpretations";

/**
 * Four Vimshottari levels for the life timeline. Levels 1 and 2 come straight
 * from calculateVimshottariTimeline, so the timeline and the Dashas tab show
 * identical dates. Levels 3 and 4 use the same subdivision function, which
 * rounds each boundary to a whole millisecond and ends the last share exactly
 * at its parent's end.
 */

export const DASHA_LEVELS = [1, 2, 3, 4] as const;
export type DashaLevel = (typeof DASHA_LEVELS)[number];

export const DASHA_LEVEL_IDS = {
  1: "mahadasha",
  2: "antardasha",
  3: "pratyantardasha",
  4: "sookshma",
} as const satisfies Readonly<Record<DashaLevel, string>>;

export interface DashaSpan {
  readonly level: DashaLevel;
  readonly lord: DashaLord;
  /** Lords from the Mahadasha down to this level. */
  readonly path: readonly DashaLord[];
  readonly startMs: number;
  readonly endMs: number;
  /** Nominal length in Vimshottari years, before millisecond rounding. */
  readonly nominalYears: number;
}

export interface DashaClock {
  readonly birthMs: number;
  readonly moonSiderealLongitudeDeg: number;
  readonly birthLord: DashaLord;
  readonly birthLordYears: number;
  /** Progress of the natal Moon through its lunar mansion, 0 to 1. */
  readonly moonNakshatraProgress: number;
}

const NAKSHATRA_SPAN_DEG = 360 / 27;
const DAY_MS = 86_400_000;
const MINUTES_PER_DAY = 1440;

function lordYears(lord: DashaLord): number {
  return VIMSHOTTARI_SEQUENCE.find((period) => period.lord === lord)!.years;
}

export function createDashaClock(
  birthInstant: Date,
  moonSiderealLongitudeDeg: number,
): DashaClock {
  const timeline = calculateVimshottariTimeline({
    birthInstant,
    moonSiderealLongitudeDeg,
    asOf: birthInstant,
  });
  return {
    birthMs: birthInstant.getTime(),
    moonSiderealLongitudeDeg,
    birthLord: timeline.birthMahadashaLord,
    birthLordYears: lordYears(timeline.birthMahadashaLord),
    moonNakshatraProgress: timeline.moonNakshatraProgress,
  };
}

function overlaps(span: { startMs: number; endMs: number }, fromMs: number, toMs: number): boolean {
  return span.endMs > fromMs && span.startMs < toMs;
}

/** Mahadashas of every 120-year cycle that touches [fromMs, toMs). */
function mahadashaSpans(clock: DashaClock, fromMs: number, toMs: number): DashaSpan[] {
  const spans: DashaSpan[] = [];
  let probeMs = fromMs;
  // A lifetime range touches at most two cycles; the guard stops bad input.
  for (let cycle = 0; cycle < 4 && probeMs < toMs; cycle += 1) {
    const timeline = calculateVimshottariTimeline({
      birthInstant: new Date(clock.birthMs),
      moonSiderealLongitudeDeg: clock.moonSiderealLongitudeDeg,
      asOf: new Date(probeMs),
    });
    for (const major of timeline.mahadashas) {
      const span: DashaSpan = {
        level: 1,
        lord: major.lord,
        path: [major.lord],
        startMs: Date.parse(major.start),
        endMs: Date.parse(major.end),
        nominalYears: major.durationYears,
      };
      if (overlaps(span, fromMs, toMs)) spans.push(span);
    }
    probeMs = Date.parse(timeline.cycleEnd);
  }
  return spans;
}

/** The nine children of one span, one level deeper. */
export function childDashaSpans(parent: DashaSpan): DashaSpan[] {
  if (parent.level === 4) return [];
  const level = (parent.level + 1) as DashaLevel;
  return subdivideVimshottariPeriod(
    parent.lord,
    parent.startMs,
    parent.endMs,
    parent.nominalYears,
  ).map((child) => ({
    level,
    lord: child.lord,
    path: [...parent.path, child.lord],
    startMs: child.startMs,
    endMs: child.endMs,
    nominalYears: child.durationYears,
  }));
}

/**
 * Spans of one level that overlap [fromMs, toMs). Only the parents that
 * overlap the range are subdivided, so a short window stays cheap at level 4.
 */
export function dashaSpansInRange(
  clock: DashaClock,
  level: DashaLevel,
  fromMs: number,
  toMs: number,
): DashaSpan[] {
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) return [];
  let spans = mahadashaSpans(clock, fromMs, toMs);
  for (let depth = 1; depth < level; depth += 1) {
    spans = spans.flatMap((span) =>
      childDashaSpans(span).filter((child) => overlaps(child, fromMs, toMs)),
    );
  }
  return spans;
}

/** The four spans that contain ms, Mahadasha first. Periods are half-open. */
export function dashaStackAt(clock: DashaClock, ms: number): DashaSpan[] {
  const stack: DashaSpan[] = [];
  let candidates = mahadashaSpans(clock, ms, ms + 1);
  for (let depth = 0; depth < DASHA_LEVELS.length; depth += 1) {
    const current = candidates.find((span) => ms >= span.startMs && ms < span.endMs);
    if (!current) break;
    stack.push(current);
    candidates = childDashaSpans(current);
  }
  return stack;
}

/**
 * How far every period boundary moves, in days, when the birth time is off by
 * the given minutes. All boundaries are the cycle start plus fixed lengths, so
 * they all move together: the Moon's extra travel as a share of one lunar
 * mansion, times the birth lord's years.
 */
export function boundaryShiftDays(
  moonSpeedDegPerDay: number,
  birthLordYears: number,
  minutes: number,
): number {
  if (![moonSpeedDegPerDay, birthLordYears, minutes].every(Number.isFinite)) {
    throw new TypeError("boundaryShiftDays needs finite numbers.");
  }
  const moonTravelDeg = (Math.abs(moonSpeedDegPerDay) * Math.abs(minutes)) / MINUTES_PER_DAY;
  return (moonTravelDeg / NAKSHATRA_SPAN_DEG) * birthLordYears * VIMSHOTTARI_YEAR_DAYS;
}

/**
 * Minutes until the natal Moon reaches either edge of its lunar mansion. If
 * the birth time is off by more than this, the starting Mahadasha changes and
 * every date moves by years, not days.
 */
export function minutesToMansionEdge(
  clock: DashaClock,
  moonSpeedDegPerDay: number,
): { earlier: number; later: number } {
  const speed = Math.abs(moonSpeedDegPerDay);
  if (!Number.isFinite(speed) || speed === 0) {
    throw new RangeError("moonSpeedDegPerDay must be a finite, non-zero number.");
  }
  const degreesToStart = clock.moonNakshatraProgress * NAKSHATRA_SPAN_DEG;
  const degreesToEnd = (1 - clock.moonNakshatraProgress) * NAKSHATRA_SPAN_DEG;
  return {
    earlier: (degreesToStart / speed) * MINUTES_PER_DAY,
    later: (degreesToEnd / speed) * MINUTES_PER_DAY,
  };
}

export function spanLengthDays(span: Pick<DashaSpan, "startMs" | "endMs">): number {
  return (span.endMs - span.startMs) / DAY_MS;
}
