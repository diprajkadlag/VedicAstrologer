import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "../i18n";
import { RASI_DISPLAY_NAMES_ORDERED } from "./display";
import { GRAHA_IDS, NAKSHATRAS, RASIS } from "./ephemeris";
import {
  getLocalizedGrahaAbbreviation,
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "./localizedNames";

describe("localized astronomical names", () => {
  it("provides every Rasi, graha, and Nakshatra in every app language", () => {
    for (const locale of APP_LOCALES) {
      for (const rasi of RASIS) {
        expect(getLocalizedRasiName(rasi, locale).trim()).not.toBe("");
      }
      for (const graha of GRAHA_IDS) {
        expect(getLocalizedGrahaName(graha, locale).trim()).not.toBe("");
      }
      for (const nakshatra of NAKSHATRAS) {
        expect(getLocalizedNakshatraName(nakshatra, locale).trim()).not.toBe("");
      }
    }
  });

  it("uses Devanagari labels in Hindi and Marathi", () => {
    expect(getLocalizedRasiName("Leo", "hi")).toBe("सिंह");
    expect(getLocalizedRasiName("Aquarius", "mr")).toBe("कुंभ");
    expect(getLocalizedRasiName("Libra", "mr")).toBe("तूळ");
    expect(getLocalizedGrahaName("mars", "mr")).toBe("मंगळ");
    expect(getLocalizedNakshatraName("Shatabhisha", "hi")).toBe("शतभिषा");
  });

  it("uses familiar English and German astronomical names", () => {
    expect(RASIS.map((name) => getLocalizedRasiName(name, "en"))).toEqual(
      [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
      ],
    );
    expect(RASIS.map((name) => getLocalizedRasiName(name, "de"))).toEqual(
      [
        "Widder",
        "Stier",
        "Zwillinge",
        "Krebs",
        "Löwe",
        "Jungfrau",
        "Waage",
        "Skorpion",
        "Schütze",
        "Steinbock",
        "Wassermann",
        "Fische",
      ],
    );
    expect(
      GRAHA_IDS.map((id) => getLocalizedGrahaName(id, "en")),
    ).toEqual([
      "Sun",
      "Moon",
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "North Node",
      "South Node",
    ]);
    expect(
      GRAHA_IDS.map((id) => getLocalizedGrahaName(id, "de")),
    ).toEqual([
      "Sonne",
      "Mond",
      "Merkur",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "Nordknoten",
      "Südknoten",
    ]);
    expect(getLocalizedNakshatraName("Shatabhisha", "de")).toBe(
      "Shatabhisha",
    );
    expect(
      GRAHA_IDS.map((id) => getLocalizedGrahaAbbreviation(id, "en")),
    ).toEqual(["Su", "Mo", "Me", "Ve", "Ma", "Ju", "Sa", "NN", "SN"]);
    expect(
      GRAHA_IDS.map((id) => getLocalizedGrahaAbbreviation(id, "de")),
    ).toEqual(["So", "Mo", "Me", "Ve", "Ma", "Ju", "Sa", "NK", "SK"]);
  });

  it("uses native-script compact chart labels for Hindi and Marathi", () => {
    for (const locale of ["hi", "mr"] as const) {
      for (const id of GRAHA_IDS) {
        expect(getLocalizedGrahaAbbreviation(id, locale)).toMatch(
          /\p{Script=Devanagari}/u,
        );
      }
    }
  });

  it("never exposes Sanskrit Rasi transliterations as English or German labels", () => {
    for (const [index, rasi] of RASIS.entries()) {
      expect(getLocalizedRasiName(rasi, "en")).not.toBe(
        RASI_DISPLAY_NAMES_ORDERED[index],
      );
      expect(getLocalizedRasiName(rasi, "de")).not.toBe(
        RASI_DISPLAY_NAMES_ORDERED[index],
      );
    }
  });
});
