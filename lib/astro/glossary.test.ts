import { describe, expect, it } from "vitest";

import { GRAHA_IDS, RASIS } from "./ephemeris";
import {
  ASTRO_GLOSSARY,
  ASTRO_TERM_IDS,
  RASI_PROFILES,
  getAstroGlossaryEntry,
} from "./glossary";

describe("Jyotish glossary", () => {
  it("provides detailed, readable definitions for every registered term", () => {
    expect(new Set(ASTRO_TERM_IDS).size).toBe(ASTRO_TERM_IDS.length);
    expect(Object.keys(ASTRO_GLOSSARY).sort()).toEqual([...ASTRO_TERM_IDS].sort());

    for (const id of ASTRO_TERM_IDS) {
      const entry = getAstroGlossaryEntry(id);
      expect(entry.id).toBe(id);
      expect(entry.short.length).toBeGreaterThan(45);
      expect(entry.detailed.length).toBeGreaterThan(140);
      expect(entry.readingTips.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("defines element, modality, and a classical ruler for all twelve Rasis", () => {
    expect(Object.keys(RASI_PROFILES)).toEqual([...RASIS]);
    for (const rasi of RASIS) {
      const profile = RASI_PROFILES[rasi];
      expect(profile.name).toBe(rasi);
      expect(GRAHA_IDS).toContain(profile.ruler);
      expect(profile.style.length).toBeGreaterThan(25);
      expect(profile.growthEdge.length).toBeGreaterThan(25);
    }
  });
});
