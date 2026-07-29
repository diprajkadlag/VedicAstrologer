import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "../i18n";
import { GRAHA_IDS, NAKSHATRAS, RASIS } from "./ephemeris";
import {
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

  it("uses Sanskrit transliterations rather than Western zodiac names in German", () => {
    expect(getLocalizedRasiName("Aries", "de")).toBe("Mesha");
    expect(getLocalizedRasiName("Gemini", "de")).toBe("Mithuna");
    expect(getLocalizedRasiName("Leo", "de")).toBe("Simha");
    expect(getLocalizedGrahaName("jupiter", "de")).toBe("Guru");
    expect(getLocalizedNakshatraName("Shatabhisha", "de")).toBe(
      "Shatabhisha",
    );
  });
});
