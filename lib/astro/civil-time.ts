import { Temporal } from "temporal-polyfill";

export interface CivilTimeInput {
  /** Strict ISO calendar date in YYYY-MM-DD form. */
  date: string;
  /** Strict 24-hour wall-clock time in HH:mm:ss form. */
  time: string;
  /** IANA time-zone identifier, for example Europe/Berlin. */
  timeZone: string;
}

export type CivilTimeDisambiguation = "earlier" | "later";

export interface CivilTimeCandidate {
  /** Absolute instant, ready for ephemeris ChartInput. */
  instant: Date;
  /** Stable UTC representation of the absolute instant. */
  instantIso: string;
  /** Historical UTC offset at this instant, for example +05:30. */
  offset: string;
  /** Zoned ISO representation suitable for display and persistence. */
  zonedDateTime: string;
}

export type CivilTimeAnalysis =
  | {
      status: "unique";
      candidate: CivilTimeCandidate;
    }
  | {
      status: "ambiguous";
      earlier: CivilTimeCandidate;
      later: CivilTimeCandidate;
    }
  | {
      status: "nonexistent";
      message: string;
    };

export type CivilTimeResolution = CivilTimeAnalysis;

export class CivilTimeResolutionError extends RangeError {
  readonly status: "ambiguous" | "nonexistent";

  constructor(status: "ambiguous" | "nonexistent", message: string) {
    super(message);
    this.name = "CivilTimeResolutionError";
    this.status = status;
  }
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const OFFSET_TIME_ZONE_PATTERN = /^[+-]/;

function parseDate(value: string): Temporal.PlainDate {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    throw new RangeError("date must use the strict YYYY-MM-DD format.");
  }

  try {
    return Temporal.PlainDate.from(
      {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      },
      { overflow: "reject" },
    );
  } catch {
    throw new RangeError(`${value} is not a valid ISO calendar date.`);
  }
}

function parseTime(value: string): Temporal.PlainTime {
  const match = TIME_PATTERN.exec(value);
  if (!match) {
    throw new RangeError("time must use the strict HH:mm:ss 24-hour format.");
  }

  return Temporal.PlainTime.from(
    {
      hour: Number(match[1]),
      minute: Number(match[2]),
      second: Number(match[3]),
    },
    { overflow: "reject" },
  );
}

function validateTimeZone(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    OFFSET_TIME_ZONE_PATTERN.test(value)
  ) {
    throw new RangeError("timeZone must be a valid IANA time-zone identifier.");
  }

  try {
    // Intl and Temporal use the host's IANA time-zone database. Constructing a
    // formatter rejects unknown identifiers without depending on the host zone.
    new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions();
  } catch {
    throw new RangeError(`${value} is not a valid IANA time-zone identifier.`);
  }

  return value;
}

function makeCandidate(
  zonedDateTime: Temporal.ZonedDateTime,
): CivilTimeCandidate {
  const instant = new Date(zonedDateTime.epochMilliseconds);

  return {
    instant,
    instantIso: instant.toISOString(),
    offset: zonedDateTime.offset,
    zonedDateTime: zonedDateTime.toString({ smallestUnit: "second" }),
  };
}

/**
 * Classifies an ISO civil date/time in an IANA zone.
 *
 * A backward clock transition can map the same wall time to two instants
 * (`ambiguous`). A forward transition can skip it entirely (`nonexistent`).
 * Invalid date, time, and time-zone input is rejected before classification.
 */
export function analyzeCivilTime(input: CivilTimeInput): CivilTimeAnalysis {
  const date = parseDate(input.date);
  const time = parseTime(input.time);
  const timeZone = validateTimeZone(input.timeZone);
  const plainDateTime = date.toPlainDateTime(time);
  const earlier = plainDateTime.toZonedDateTime(timeZone, {
    disambiguation: "earlier",
  });
  const later = plainDateTime.toZonedDateTime(timeZone, {
    disambiguation: "later",
  });
  const earlierMatches = earlier.toPlainDateTime().equals(plainDateTime);
  const laterMatches = later.toPlainDateTime().equals(plainDateTime);

  if (
    earlierMatches &&
    laterMatches &&
    earlier.epochNanoseconds === later.epochNanoseconds
  ) {
    return { status: "unique", candidate: makeCandidate(earlier) };
  }

  if (earlierMatches && laterMatches) {
    return {
      status: "ambiguous",
      earlier: makeCandidate(earlier),
      later: makeCandidate(later),
    };
  }

  return {
    status: "nonexistent",
    message:
      `The local time ${input.date} ${input.time} does not exist in ` +
      `${timeZone} because the clock moved forward.`,
  };
}

/**
 * Resolves a valid civil time to one absolute instant. Ambiguous times require
 * an explicit earlier/later choice; nonexistent times always throw.
 */
export function resolveCivilTime(
  input: CivilTimeInput,
  disambiguation?: CivilTimeDisambiguation,
): CivilTimeCandidate {
  if (
    disambiguation !== undefined &&
    disambiguation !== "earlier" &&
    disambiguation !== "later"
  ) {
    throw new TypeError('disambiguation must be either "earlier" or "later".');
  }

  const analysis = analyzeCivilTime(input);

  if (analysis.status === "unique") {
    return analysis.candidate;
  }

  if (analysis.status === "nonexistent") {
    throw new CivilTimeResolutionError("nonexistent", analysis.message);
  }

  if (disambiguation === undefined) {
    throw new CivilTimeResolutionError(
      "ambiguous",
      `The local time ${input.date} ${input.time} occurs twice in ` +
        `${input.timeZone}; choose the earlier or later occurrence.`,
    );
  }

  return analysis[disambiguation];
}
