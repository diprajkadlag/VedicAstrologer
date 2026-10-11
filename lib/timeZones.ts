import { Temporal } from "temporal-polyfill";

/** Where the page shows computed dates: in the birth place's zone or in this device's zone. */
export type TimeZoneMode = "birth" | "device";

export function isTimeZoneMode(value: unknown): value is TimeZoneMode {
  return value === "birth" || value === "device";
}

/**
 * The zone when Intl can format dates in it, else null. A browser can report
 * a zone it cannot use, such as "Etc/Unknown"; choosing it would throw.
 */
export function validTimeZone(timeZone: string | null | undefined): string | null {
  if (!timeZone) return null;
  try {
    return Intl.DateTimeFormat("en", { timeZone }).resolvedOptions().timeZone ? timeZone : null;
  } catch {
    return null;
  }
}

/** UTC offset of an IANA time zone at an instant, in minutes. */
export function utcOffsetMinutes(timeZone: string, ms: number): number {
  return (
    Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(timeZone).offsetNanoseconds /
    60_000_000_000
  );
}

/**
 * True when two zones show the same clock time at every given instant. An
 * alias such as Asia/Calcutta for Asia/Kolkata, or a zone with the same
 * rules, then needs no choice. An unknown zone counts as different.
 */
export function sameClockTime(a: string, b: string, instants: readonly number[]): boolean {
  if (a === b) return true;
  try {
    return instants.every((ms) => utcOffsetMinutes(a, ms) === utcOffsetMinutes(b, ms));
  } catch {
    return false;
  }
}

/** The zone for computed dates; the birth zone unless the device zone is chosen and known. */
export function displayTimeZone(
  mode: TimeZoneMode,
  birthTimeZone: string,
  deviceTimeZone: string | null,
): string {
  return mode === "device" && deviceTimeZone ? deviceTimeZone : birthTimeZone;
}
