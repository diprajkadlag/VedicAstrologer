const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;
const ABSOLUTE_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})$/iu;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

function assertCalendarParts(
  captures: RegExpMatchArray,
  label: string,
  hasTime: boolean,
): void {
  const year = Number(captures[1]);
  const month = Number(captures[2]);
  const day = Number(captures[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new TypeError(`${label} must be a real calendar date.`);
  }

  if (!hasTime) return;
  const hour = Number(captures[4]);
  const minute = Number(captures[5]);
  const second = captures[6] === undefined ? 0 : Number(captures[6]);
  if (hour > 23 || minute > 59 || second > 59) {
    throw new TypeError(`${label} must contain a real clock time.`);
  }

  const offset = captures[8];
  if (offset && offset.toUpperCase() !== "Z") {
    const offsetDigits = offset.slice(1).replace(":", "");
    const offsetHour = Number(offsetDigits.slice(0, 2));
    const offsetMinute = Number(offsetDigits.slice(2, 4));
    if (offsetHour > 23 || offsetMinute > 59) {
      throw new TypeError(`${label} must contain a valid UTC offset.`);
    }
  }
}

/**
 * Normalizes a deterministic absolute instant. Date-only values mean midnight
 * UTC; date-times must carry Z or a numeric offset and must be real calendar
 * values rather than JavaScript's permissive rollover forms.
 */
export function normalizeAbsoluteInstant(value: Date | string, label: string): string {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new TypeError(`${label} must be a valid Date or ISO-8601 string.`);
  }

  let instant: Date;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new TypeError(`${label} must be a valid Date or ISO-8601 string.`);
    }

    const dateOnly = trimmed.match(DATE_ONLY_PATTERN);
    const dateTime = trimmed.match(ABSOLUTE_DATE_TIME_PATTERN);
    if (!dateOnly && !dateTime) {
      if (/^\d{4}-\d{2}-\d{2}T/iu.test(trimmed)) {
        throw new TypeError(`${label} must include Z or an explicit UTC offset.`);
      }
      throw new TypeError(`${label} must be a valid ISO-8601 date or absolute instant.`);
    }

    assertCalendarParts(dateOnly ?? dateTime!, label, Boolean(dateTime));
    instant = new Date(dateOnly ? `${trimmed}T00:00:00.000Z` : trimmed);
  } else {
    instant = new Date(value.getTime());
  }

  if (!Number.isFinite(instant.getTime())) {
    throw new TypeError(`${label} must be a valid Date or ISO-8601 string.`);
  }
  const year = instant.getUTCFullYear();
  if (year < 0 || year > 4000) {
    throw new RangeError(`${label} must fall within the supported years 0000–4000.`);
  }
  return instant.toISOString();
}
