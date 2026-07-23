import type { AppLocale } from "../i18n";
import {
  GRAHA_IDS,
  NAKSHATRAS,
  RASIS,
  type GrahaId,
  type NakshatraName,
  type RasiName,
} from "./ephemeris";
import {
  RASI_DISPLAY_NAMES,
  type SanskritRasiName,
} from "./display";

export const LOCALIZED_RASI_NAMES: Readonly<
  Record<AppLocale, Readonly<Record<RasiName, string>>>
> = {
  en: RASI_DISPLAY_NAMES,
  hi: {
    Aries: "मेष",
    Taurus: "वृषभ",
    Gemini: "मिथुन",
    Cancer: "कर्क",
    Leo: "सिंह",
    Virgo: "कन्या",
    Libra: "तुला",
    Scorpio: "वृश्चिक",
    Sagittarius: "धनु",
    Capricorn: "मकर",
    Aquarius: "कुम्भ",
    Pisces: "मीन",
  },
  mr: {
    Aries: "मेष",
    Taurus: "वृषभ",
    Gemini: "मिथुन",
    Cancer: "कर्क",
    Leo: "सिंह",
    Virgo: "कन्या",
    Libra: "तूळ",
    Scorpio: "वृश्चिक",
    Sagittarius: "धनु",
    Capricorn: "मकर",
    Aquarius: "कुंभ",
    Pisces: "मीन",
  },
};

export const LOCALIZED_GRAHA_NAMES: Readonly<
  Record<AppLocale, Readonly<Record<GrahaId, string>>>
> = {
  en: {
    sun: "Surya",
    moon: "Chandra",
    mercury: "Budha",
    venus: "Shukra",
    mars: "Mangala",
    jupiter: "Guru",
    saturn: "Shani",
    rahu: "Rahu",
    ketu: "Ketu",
  },
  hi: {
    sun: "सूर्य",
    moon: "चन्द्र",
    mercury: "बुध",
    venus: "शुक्र",
    mars: "मंगल",
    jupiter: "गुरु",
    saturn: "शनि",
    rahu: "राहु",
    ketu: "केतु",
  },
  mr: {
    sun: "सूर्य",
    moon: "चंद्र",
    mercury: "बुध",
    venus: "शुक्र",
    mars: "मंगळ",
    jupiter: "गुरु",
    saturn: "शनि",
    rahu: "राहू",
    ketu: "केतू",
  },
};

const DEVANAGARI_NAKSHATRAS = [
  "अश्विनी",
  "भरणी",
  "कृत्तिका",
  "रोहिणी",
  "मृगशीर्ष",
  "आर्द्रा",
  "पुनर्वसु",
  "पुष्य",
  "आश्लेषा",
  "मघा",
  "पूर्व फाल्गुनी",
  "उत्तर फाल्गुनी",
  "हस्त",
  "चित्रा",
  "स्वाती",
  "विशाखा",
  "अनुराधा",
  "ज्येष्ठा",
  "मूल",
  "पूर्वाषाढा",
  "उत्तराषाढा",
  "श्रवण",
  "धनिष्ठा",
  "शतभिषा",
  "पूर्वभाद्रपदा",
  "उत्तरभाद्रपदा",
  "रेवती",
] as const;

function recordFromOrder<Key extends string>(
  keys: readonly Key[],
  values: readonly string[],
): Readonly<Record<Key, string>> {
  if (keys.length !== values.length) {
    throw new Error("Localized astronomical names are not aligned.");
  }
  return Object.fromEntries(
    keys.map((key, index) => [key, values[index]]),
  ) as Record<Key, string>;
}

export const LOCALIZED_NAKSHATRA_NAMES: Readonly<
  Record<AppLocale, Readonly<Record<NakshatraName, string>>>
> = {
  en: recordFromOrder(NAKSHATRAS, NAKSHATRAS),
  hi: recordFromOrder(NAKSHATRAS, DEVANAGARI_NAKSHATRAS),
  mr: recordFromOrder(NAKSHATRAS, DEVANAGARI_NAKSHATRAS),
};

export function getLocalizedRasiName(
  name: RasiName,
  locale: AppLocale,
): string {
  return LOCALIZED_RASI_NAMES[locale][name];
}

export function getLocalizedGrahaName(
  id: GrahaId,
  locale: AppLocale,
): string {
  return LOCALIZED_GRAHA_NAMES[locale][id];
}

export function getLocalizedNakshatraName(
  name: NakshatraName,
  locale: AppLocale,
): string {
  return LOCALIZED_NAKSHATRA_NAMES[locale][name];
}

// Preserve a narrow typed accessor for serialization that explicitly requires
// the Latin Sanskrit transliteration used by API payloads.
export function getTransliteratedRasiName(name: RasiName): SanskritRasiName {
  return RASI_DISPLAY_NAMES[name];
}

if (
  Object.keys(LOCALIZED_RASI_NAMES.en).length !== RASIS.length ||
  Object.keys(LOCALIZED_GRAHA_NAMES.en).length !== GRAHA_IDS.length ||
  Object.keys(LOCALIZED_NAKSHATRA_NAMES.en).length !== NAKSHATRAS.length
) {
  throw new Error("Localized astronomical name tables are incomplete.");
}
