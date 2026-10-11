import { describe, expect, it } from "vitest";

import { displayTimeZone, isTimeZoneMode, sameClockTime, utcOffsetMinutes, validTimeZone } from "./timeZones";

const JAN_2026 = Date.UTC(2026, 0, 1);
const JUL_2026 = Date.UTC(2026, 6, 1);

describe("validTimeZone", () => {
  it("keeps a zone that Intl can use and drops the rest", () => {
    expect(validTimeZone("Europe/Berlin")).toBe("Europe/Berlin");
    expect(validTimeZone("Etc/Unknown")).toBeNull();
    expect(validTimeZone("Mars/Olympus_Mons")).toBeNull();
    expect(validTimeZone("")).toBeNull();
    expect(validTimeZone(null)).toBeNull();
  });
});

describe("utcOffsetMinutes", () => {
  it("knows India, and Germany in winter and summer", () => {
    expect(utcOffsetMinutes("Asia/Kolkata", JAN_2026)).toBe(330);
    expect(utcOffsetMinutes("Europe/Berlin", JAN_2026)).toBe(60);
    expect(utcOffsetMinutes("Europe/Berlin", JUL_2026)).toBe(120);
  });
});

describe("sameClockTime", () => {
  it("treats an alias and a zone with the same rules as the same clock", () => {
    expect(sameClockTime("Asia/Kolkata", "Asia/Kolkata", [JAN_2026])).toBe(true);
    expect(sameClockTime("Asia/Kolkata", "Asia/Calcutta", [JAN_2026, JUL_2026])).toBe(true);
    expect(sameClockTime("Europe/Berlin", "Europe/Paris", [JAN_2026, JUL_2026])).toBe(true);
  });

  it("tells different clocks apart, also by summer time alone", () => {
    expect(sameClockTime("Asia/Kolkata", "Europe/Berlin", [JAN_2026, JUL_2026])).toBe(false);
    // Lagos has UTC+1 all year, Berlin only in winter.
    expect(sameClockTime("Africa/Lagos", "Europe/Berlin", [JAN_2026])).toBe(true);
    expect(sameClockTime("Africa/Lagos", "Europe/Berlin", [JAN_2026, JUL_2026])).toBe(false);
  });

  it("counts an unknown zone as different", () => {
    expect(sameClockTime("Asia/Kolkata", "Mars/Olympus_Mons", [JAN_2026])).toBe(false);
  });
});

describe("displayTimeZone", () => {
  it("uses the device zone only when it is chosen and known", () => {
    expect(displayTimeZone("birth", "Asia/Kolkata", "Europe/Berlin")).toBe("Asia/Kolkata");
    expect(displayTimeZone("device", "Asia/Kolkata", "Europe/Berlin")).toBe("Europe/Berlin");
    expect(displayTimeZone("device", "Asia/Kolkata", null)).toBe("Asia/Kolkata");
  });

  it("accepts only the two modes", () => {
    expect(isTimeZoneMode("birth")).toBe(true);
    expect(isTimeZoneMode("device")).toBe(true);
    expect(isTimeZoneMode("local")).toBe(false);
    expect(isTimeZoneMode(null)).toBe(false);
  });
});
