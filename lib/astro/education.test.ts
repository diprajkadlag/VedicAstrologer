import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "../i18n";
import { GRAHA_IDS } from "./ephemeris";
import {
  BHAVA_EDUCATION,
  EDUCATION_TERMS,
  GRAHA_EDUCATION,
  LOCALIZED_ANALYSIS_LIMITATIONS,
  buildGrahaInBhavaReading,
  getEducationForAstroTerm,
  getEducationTerm,
} from "./education";
import { ASTRO_TERM_IDS } from "./glossary";

describe("multilingual Jyotish education", () => {
  it("provides all foundational terms in every locale", () => {
    expect(EDUCATION_TERMS.length).toBeGreaterThanOrEqual(20);
    for (const term of EDUCATION_TERMS) {
      expect(getEducationTerm(term.id)).toBe(term);
      for (const locale of APP_LOCALES) {
        expect(term.name[locale].trim()).not.toBe("");
        expect(term.summary[locale].length).toBeGreaterThan(20);
        expect(term.detail[locale].length).toBeGreaterThan(40);
        expect(term.readingSequence[locale].length).toBeGreaterThan(20);
      }
    }
  });

  it("bridges every existing clickable AstroTerm to localized education", () => {
    for (const id of ASTRO_TERM_IDS) {
      const term = getEducationForAstroTerm(id);
      expect(term.id).toBeTruthy();
      expect(term.name.hi).toBeTruthy();
      expect(term.name.mr).toBeTruthy();
    }
  });

  it("covers all nine grahas and twelve Bhavas in every locale", () => {
    expect(Object.keys(GRAHA_EDUCATION)).toHaveLength(9);
    expect(Object.keys(BHAVA_EDUCATION)).toHaveLength(12);

    for (const graha of GRAHA_IDS) {
      for (const locale of APP_LOCALES) {
        expect(GRAHA_EDUCATION[graha].name[locale]).toBeTruthy();
        expect(GRAHA_EDUCATION[graha].signifies[locale]).toBeTruthy();
      }
    }
  });

  it("generates all 108 graha-in-Bhava readings in each language", () => {
    for (const locale of APP_LOCALES) {
      const readings = GRAHA_IDS.flatMap((graha) =>
        Array.from({ length: 12 }, (_, index) =>
          buildGrahaInBhavaReading(
            graha,
            (index + 1) as keyof typeof BHAVA_EDUCATION,
            locale,
          ),
        ),
      );

      expect(readings).toHaveLength(108);
      for (const reading of readings) {
        expect(reading.summary.length).toBeGreaterThan(80);
        expect(reading.methodNote.length).toBeGreaterThan(50);
        expect(reading.constructive).toBeTruthy();
        expect(reading.caution).toBeTruthy();
      }
    }
  });

  it("localizes every disclosed analysis limitation", () => {
    for (const limitation of Object.values(LOCALIZED_ANALYSIS_LIMITATIONS)) {
      for (const locale of APP_LOCALES) {
        expect(limitation[locale].length).toBeGreaterThan(40);
      }
    }
  });
});
