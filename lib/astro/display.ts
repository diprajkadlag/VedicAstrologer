import type { RasiName } from "./ephemeris";

/**
 * Stable Sanskrit transliterations used only by internal legacy calculations
 * and serialization. Locale-aware UI must use localizedNames.ts instead.
 */
export const RASI_DISPLAY_NAMES_ORDERED = [
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
] as const;

export type SanskritRasiName = (typeof RASI_DISPLAY_NAMES_ORDERED)[number];

/**
 * Internal transliteration mapping. Ephemeris values deliberately retain
 * stable computational names; this mapping must not drive user-facing copy.
 */
export const RASI_DISPLAY_NAMES = {
  Aries: "Mesha",
  Taurus: "Vrishabha",
  Gemini: "Mithuna",
  Cancer: "Karka",
  Leo: "Simha",
  Virgo: "Kanya",
  Libra: "Tula",
  Scorpio: "Vrishchika",
  Sagittarius: "Dhanu",
  Capricorn: "Makara",
  Aquarius: "Kumbha",
  Pisces: "Meena",
} as const satisfies Record<RasiName, SanskritRasiName>;

/** Legacy compact transliterations; not for locale-aware UI labels. */
export const RASI_DISPLAY_ABBREVIATIONS = [
  "Mesha",
  "Vrish",
  "Mithu",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrisc",
  "Dhanu",
  "Makar",
  "Kumbh",
  "Meena",
] as const;

export function getRasiDisplayName(name: RasiName): SanskritRasiName {
  return RASI_DISPLAY_NAMES[name];
}
