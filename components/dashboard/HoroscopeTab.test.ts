import { describe, expect, it } from "vitest";

import {
  getTransitScoreArithmetic,
  transitInstantForDateInput,
} from "./horoscope-utils";

describe("HoroscopeTab date and score transparency", () => {
  it("maps a date-only choice to the documented noon UTC instant", () => {
    expect(transitInstantForDateInput("2026-07-23").toISOString()).toBe(
      "2026-07-23T12:00:00.000Z",
    );
    expect(() => transitInstantForDateInput("2026-02-30")).toThrow(RangeError);
    expect(() => transitInstantForDateInput("23-07-2026")).toThrow(TypeError);
  });

  it("exposes the exact unbounded and bounded score arithmetic", () => {
    expect(
      getTransitScoreArithmetic({
        baseline: 50,
        score: 62,
        reasons: [
          { ruleId: "a", contribution: 17, explanation: "a" },
          { ruleId: "b", contribution: -5, explanation: "b" },
        ],
      }),
    ).toEqual({ baseline: 50, unbounded: 62, bounded: 62 });

    expect(
      getTransitScoreArithmetic({
        baseline: 50,
        score: 100,
        reasons: [
          { ruleId: "a", contribution: 70, explanation: "a" },
        ],
      }),
    ).toEqual({ baseline: 50, unbounded: 120, bounded: 100 });
  });
});
