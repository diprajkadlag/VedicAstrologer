import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "../i18n";
import { ASTRO_TERM_IDS } from "./glossary";
import { getLocalizedAstroGlossaryEntry } from "./localizedGlossary";

describe("localized AstroTerm glossary", () => {
  it("covers every clickable term in every app language", () => {
    for (const locale of APP_LOCALES) {
      for (const id of ASTRO_TERM_IDS) {
        const entry = getLocalizedAstroGlossaryEntry(id, locale);
        expect(entry.id).toBe(id);
        expect(entry.title.trim()).not.toBe("");
        expect(entry.short.length).toBeGreaterThan(20);
        expect(entry.detailed.length).toBeGreaterThan(80);
        expect(entry.readingTips.length).toBeGreaterThan(0);
        expect(entry.readingTips.every((tip) => tip.length > 20)).toBe(true);
      }
    }
  });

  it("keeps easily conflated timing and reference concepts distinct", () => {
    for (const locale of APP_LOCALES) {
      const ayanamsa = getLocalizedAstroGlossaryEntry("ayanamsa", locale);
      const lahiri = getLocalizedAstroGlossaryEntry("lahiri", locale);
      const dasha = getLocalizedAstroGlossaryEntry("dasha", locale);
      const vimshottari = getLocalizedAstroGlossaryEntry(
        "vimshottari",
        locale,
      );
      const mahadasha = getLocalizedAstroGlossaryEntry("mahadasha", locale);
      const antardasha = getLocalizedAstroGlossaryEntry("antardasha", locale);

      expect(lahiri.title).not.toBe(ayanamsa.title);
      expect(lahiri.detailed).not.toBe(ayanamsa.detailed);
      expect(vimshottari.title).not.toBe(dasha.title);
      expect(mahadasha.detailed).not.toBe(antardasha.detailed);
    }
  });

  it("explains calculation only where the app derives or looks up a value", () => {
    for (const locale of APP_LOCALES) {
      for (const id of [
        "lagna",
        "rasi",
        "nakshatra",
        "pada",
        "lahiri",
        "retrograde",
        "gochara",
        "vimshottari",
        "antardasha",
        "rahu-ketu",
      ] as const) {
        expect(
          getLocalizedAstroGlossaryEntry(id, locale).calculation,
        ).toBeTruthy();
      }
    }
  });
});

