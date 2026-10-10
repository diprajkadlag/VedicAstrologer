import { describe, expect, it } from "vitest";

import { dateInputValue, eventInstantFromDateInput } from "./timelineText";

const ZONE = "Asia/Kolkata";

describe("eventInstantFromDateInput", () => {
  // 10:30 IST, before noon: the last date's noon lies after the range end.
  const morningBirth = Date.parse("1990-05-15T05:00:00Z");
  const morningEnd = Date.parse("2090-05-15T05:00:00Z");
  // 15:00 IST, after noon: the birth date's noon lies before the birth.
  const afternoonBirth = Date.parse("1990-05-15T09:30:00Z");
  const afternoonEnd = Date.parse("2090-05-15T09:30:00Z");

  it("places an ordinary date at local noon", () => {
    expect(eventInstantFromDateInput("2026-10-09", ZONE, morningBirth, morningEnd)).toBe(
      Date.parse("2026-10-09T06:30:00Z"),
    );
  });

  it("accepts the birth date when the birth is after noon", () => {
    expect(eventInstantFromDateInput("1990-05-15", ZONE, afternoonBirth, afternoonEnd)).toBe(afternoonBirth);
    expect(eventInstantFromDateInput("1990-05-15", ZONE, morningBirth, morningEnd)).toBe(
      Date.parse("1990-05-15T06:30:00Z"),
    );
  });

  it("accepts the last date when the range ends before noon", () => {
    expect(eventInstantFromDateInput("2090-05-15", ZONE, morningBirth, morningEnd)).toBe(morningEnd - 1);
    expect(eventInstantFromDateInput("2090-05-15", ZONE, afternoonBirth, afternoonEnd)).toBe(
      Date.parse("2090-05-15T06:30:00Z"),
    );
  });

  it("handles birth years below 1000", () => {
    const birth = Date.UTC(500, 4, 15, 5, 0);
    const end = Date.UTC(600, 4, 15, 5, 0);
    expect(dateInputValue(birth, ZONE)).toBe("0500-05-15");
    expect(eventInstantFromDateInput("0500-05-20", ZONE, birth, end)).toEqual(expect.any(Number));
    expect(eventInstantFromDateInput("0499-05-20", ZONE, birth, end)).toBe("outside");
  });

  it("rejects dates outside the range and bad values", () => {
    expect(eventInstantFromDateInput("1990-05-14", ZONE, morningBirth, morningEnd)).toBe("outside");
    expect(eventInstantFromDateInput("2090-05-16", ZONE, morningBirth, morningEnd)).toBe("outside");
    expect(eventInstantFromDateInput("2001-02-30", ZONE, morningBirth, morningEnd)).toBeNull();
    expect(eventInstantFromDateInput("", ZONE, morningBirth, morningEnd)).toBeNull();
  });
});
