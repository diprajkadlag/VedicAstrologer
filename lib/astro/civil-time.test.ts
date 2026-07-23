import { describe, expect, it } from "vitest";

import {
  CivilTimeResolutionError,
  analyzeCivilTime,
  resolveCivilTime,
} from "./civil-time";

describe("civil-time parsing and validation", () => {
  it("resolves a unique historical Kolkata wall time", () => {
    const analysis = analyzeCivilTime({
      date: "1990-01-01",
      time: "12:00:00",
      timeZone: "Asia/Kolkata",
    });

    expect(analysis.status).toBe("unique");
    if (analysis.status !== "unique") return;

    expect(analysis.candidate.instantIso).toBe("1990-01-01T06:30:00.000Z");
    expect(analysis.candidate.instant.toISOString()).toBe(
      analysis.candidate.instantIso,
    );
    expect(analysis.candidate.offset).toBe("+05:30");
    expect(analysis.candidate.zonedDateTime).toBe(
      "1990-01-01T12:00:00+05:30[Asia/Kolkata]",
    );
  });

  it("accepts valid leap days and rejects invalid calendar dates", () => {
    expect(
      resolveCivilTime({
        date: "2024-02-29",
        time: "00:00:00",
        timeZone: "UTC",
      }).instantIso,
    ).toBe("2024-02-29T00:00:00.000Z");

    expect(() =>
      analyzeCivilTime({
        date: "2023-02-29",
        time: "00:00:00",
        timeZone: "UTC",
      }),
    ).toThrow(/not a valid ISO calendar date/);
  });

  it.each([
    ["2024-1-01", "12:00:00", /strict YYYY-MM-DD/],
    ["2024-01-01 ", "12:00:00", /strict YYYY-MM-DD/],
    ["2024-01-01", "2:03:04", /strict HH:mm:ss/],
    ["2024-01-01", "24:00:00", /strict HH:mm:ss/],
    ["2024-01-01", "12:60:00", /strict HH:mm:ss/],
    ["2024-01-01", "12:00", /strict HH:mm:ss/],
  ])("rejects malformed input %s %s", (date, time, message) => {
    expect(() => analyzeCivilTime({ date, time, timeZone: "UTC" })).toThrow(
      message,
    );
  });

  it("rejects unknown zones and fixed numeric offsets", () => {
    expect(() =>
      analyzeCivilTime({
        date: "2024-01-01",
        time: "12:00:00",
        timeZone: "Mars/Olympus_Mons",
      }),
    ).toThrow(/not a valid IANA/);

    expect(() =>
      analyzeCivilTime({
        date: "2024-01-01",
        time: "12:00:00",
        timeZone: "+05:30",
      }),
    ).toThrow(/valid IANA/);
  });
});

describe("DST transition handling", () => {
  const berlinGap = {
    date: "2024-03-31",
    time: "02:30:00",
    timeZone: "Europe/Berlin",
  } as const;
  const berlinFold = {
    date: "2024-10-27",
    time: "02:30:00",
    timeZone: "Europe/Berlin",
  } as const;

  it("classifies a forward-transition gap as nonexistent", () => {
    const analysis = analyzeCivilTime(berlinGap);

    expect(analysis).toEqual({
      status: "nonexistent",
      message:
        "The local time 2024-03-31 02:30:00 does not exist in " +
        "Europe/Berlin because the clock moved forward.",
    });
    expect(() => resolveCivilTime(berlinGap)).toThrow(
      CivilTimeResolutionError,
    );

    try {
      resolveCivilTime(berlinGap);
    } catch (error) {
      expect(error).toMatchObject({ status: "nonexistent" });
    }
  });

  it("preserves both candidates in a backward-transition fold", () => {
    const analysis = analyzeCivilTime(berlinFold);

    expect(analysis.status).toBe("ambiguous");
    if (analysis.status !== "ambiguous") return;

    expect(analysis.earlier).toMatchObject({
      instantIso: "2024-10-27T00:30:00.000Z",
      offset: "+02:00",
      zonedDateTime: "2024-10-27T02:30:00+02:00[Europe/Berlin]",
    });
    expect(analysis.later).toMatchObject({
      instantIso: "2024-10-27T01:30:00.000Z",
      offset: "+01:00",
      zonedDateTime: "2024-10-27T02:30:00+01:00[Europe/Berlin]",
    });
    expect(analysis.earlier.instant.getTime()).toBeLessThan(
      analysis.later.instant.getTime(),
    );
  });

  it("requires and honors explicit fold disambiguation", () => {
    expect(() => resolveCivilTime(berlinFold)).toThrow(/choose the earlier or later/);

    expect(resolveCivilTime(berlinFold, "earlier").instantIso).toBe(
      "2024-10-27T00:30:00.000Z",
    );
    expect(resolveCivilTime(berlinFold, "later").instantIso).toBe(
      "2024-10-27T01:30:00.000Z",
    );
  });
});
