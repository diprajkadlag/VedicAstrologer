import type { RasiName } from "./ephemeris";

/** Sanskrit Rasi names shown in the interface, in sidereal zodiac order. */
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
 * Presentation-only mapping. Ephemeris values deliberately retain their
 * stable computational names, while all user-facing text uses Sanskrit.
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

/** Compact Sanskrit labels for dense SVG chart cells. */
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
