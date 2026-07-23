import { describe, expect, it } from "vitest";

import { RASIS } from "./ephemeris";
import {
  getRasiDisplayName,
  RASI_DISPLAY_ABBREVIATIONS,
  RASI_DISPLAY_NAMES_ORDERED,
} from "./display";

describe("Sanskrit Rasi presentation", () => {
  it("maps every computational Rasi to the expected display name", () => {
    expect(RASIS.map(getRasiDisplayName)).toEqual(RASI_DISPLAY_NAMES_ORDERED);
    expect(RASI_DISPLAY_NAMES_ORDERED).toEqual([
      "Mesha",
      "Vrishabha",
      "Mithuna",
      "Karka",
      "Simha",
      "Kanya",
      "Tula",
      "Vrishchika",
      "Dhanu",
      "Makara",
      "Kumbha",
      "Meena",
    ]);
  });

  it("provides one compact Sanskrit label per Rasi", () => {
    expect(RASI_DISPLAY_ABBREVIATIONS).toHaveLength(RASIS.length);
    expect(new Set(RASI_DISPLAY_ABBREVIATIONS).size).toBe(RASIS.length);
  });
});
