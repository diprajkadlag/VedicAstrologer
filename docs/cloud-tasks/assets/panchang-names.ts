/**
 * Locale-native names for the daily almanac (panchang).
 *
 * Task 05 copies this file unchanged to `lib/astro/panchangNames.ts`
 * (`cp docs/cloud-tasks/assets/panchang-names.ts lib/astro/panchangNames.ts`).
 *
 * Conventions, following the app's localization rules:
 * - Proper names stay names in English and German, as nakshatra names already do.
 * - Hindi and Marathi use Devanagari. Marathi follows Maharashtrian usage:
 *   शुद्ध / वद्य for the two fortnights, पौर्णिमा, अमावास्या, मंगळवार, आषाढ.
 * - Spellings match Drik Panchang's naming. For Pune on 8 Oct 2026 it shows:
 *   Trayodashi, Purva Phalguni, Shukla, Garaja then Vanija, Guruwara (Thursday).
 *
 * Nakshatra names are not repeated here: use getLocalizedNakshatraName().
 */
import type { AppLocale } from "@/lib/i18n";

type LocalizedList = Readonly<Record<AppLocale, readonly string[]>>;

const TITHI_LATIN = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
] as const;

const TITHI_DEVANAGARI = [
  "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी",
  "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी",
] as const;

/** 30 names; index 0 = lunar day 1. Day 15 is the full moon, day 30 the new moon. */
export const TITHI_NAMES: LocalizedList = {
  en: [...TITHI_LATIN, "Purnima", ...TITHI_LATIN, "Amavasya"],
  de: [...TITHI_LATIN, "Purnima", ...TITHI_LATIN, "Amavasya"],
  hi: [...TITHI_DEVANAGARI, "पूर्णिमा", ...TITHI_DEVANAGARI, "अमावस्या"],
  mr: [...TITHI_DEVANAGARI, "पौर्णिमा", ...TITHI_DEVANAGARI, "अमावास्या"],
};

export type Paksha = "shukla" | "krishna";

/** Lunar days 1–15 are the waxing half (shukla), 16–30 the waning half (krishna). */
export const PAKSHA_NAMES: Readonly<Record<AppLocale, Readonly<Record<Paksha, string>>>> = {
  en: { shukla: "waxing fortnight", krishna: "waning fortnight" },
  de: { shukla: "zunehmende Monatshälfte", krishna: "abnehmende Monatshälfte" },
  hi: { shukla: "शुक्ल पक्ष", krishna: "कृष्ण पक्ष" },
  mr: { shukla: "शुद्ध पक्ष", krishna: "वद्य पक्ष" },
};

const YOGA_LATIN = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
  "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
  "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
  "Shukla", "Brahma", "Indra", "Vaidhriti",
] as const;

const YOGA_DEVANAGARI = [
  "विष्कम्भ", "प्रीति", "आयुष्मान", "सौभाग्य", "शोभन", "अतिगण्ड", "सुकर्मा",
  "धृति", "शूल", "गण्ड", "वृद्धि", "ध्रुव", "व्याघात", "हर्षण", "वज्र",
  "सिद्धि", "व्यतीपात", "वरीयान", "परिघ", "शिव", "सिद्ध", "साध्य", "शुभ",
  "शुक्ल", "ब्रह्म", "इन्द्र", "वैधृति",
] as const;

/** Marathi spelling: anusvara for nasals and a long final ī, as in the app's Marathi (दृष्टी). */
const YOGA_MARATHI = [
  "विष्कंभ", "प्रीती", "आयुष्मान", "सौभाग्य", "शोभन", "अतिगंड", "सुकर्मा",
  "धृती", "शूल", "गंड", "वृद्धी", "ध्रुव", "व्याघात", "हर्षण", "वज्र",
  "सिद्धी", "व्यतीपात", "वरीयान", "परिघ", "शिव", "सिद्ध", "साध्य", "शुभ",
  "शुक्ल", "ब्रह्म", "इंद्र", "वैधृती",
] as const;

/** 27 names; index 0 = yoga 1 (Vishkambha). */
export const YOGA_NAMES: LocalizedList = {
  en: YOGA_LATIN,
  de: YOGA_LATIN,
  hi: YOGA_DEVANAGARI,
  mr: YOGA_MARATHI,
};

const KARANA_LATIN = [
  "Kimstughna", "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti",
  "Shakuni", "Chatushpada", "Naga",
] as const;

const KARANA_DEVANAGARI = [
  "किंस्तुघ्न", "बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज", "विष्टि",
  "शकुनि", "चतुष्पद", "नाग",
] as const;

const KARANA_MARATHI = [
  "किंस्तुघ्न", "बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज", "विष्टी",
  "शकुनी", "चतुष्पद", "नाग",
] as const;

/** The 11 distinct names; map a karana number 1–60 with karanaNameIndex(). */
export const KARANA_NAMES: LocalizedList = {
  en: KARANA_LATIN,
  de: KARANA_LATIN,
  hi: KARANA_DEVANAGARI,
  mr: KARANA_MARATHI,
};

/**
 * Karana number 1–60, counted in half lunar days from the new moon, → index into
 * KARANA_NAMES:
 * - 1 = Kimstughna;
 * - 2–57 repeat Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti (eight times);
 * - 58 = Shakuni, 59 = Chatushpada, 60 = Naga.
 */
export function karanaNameIndex(karana: number): number {
  if (!Number.isInteger(karana) || karana < 1 || karana > 60) {
    throw new RangeError("karana must be an integer from 1 to 60.");
  }
  if (karana === 1) return 0;
  if (karana <= 57) return 1 + ((karana - 2) % 7);
  return karana - 50;
}

/** Index 0 = Sunday, matching Date.prototype.getDay(). */
export const WEEKDAY_NAMES: LocalizedList = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
  mr: ["रविवार", "सोमवार", "मंगळवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
};

const MONTH_LATIN = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
] as const;

/**
 * Lunar months; index 0 = Chaitra. Under new-moon (amanta) reckoning the month is
 * named after the Sun's sidereal sign at the new moon that starts it:
 * monthIndex = (sunSignIndex + 1) % 12 (Sun in Pisces → Chaitra, in Leo → Bhadrapada).
 */
export const LUNAR_MONTH_NAMES: LocalizedList = {
  en: MONTH_LATIN,
  de: MONTH_LATIN,
  hi: ["चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन"],
  mr: ["चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ", "श्रावण", "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन"],
};

/** Name of an extra (adhika) month; {month} is the month name. Use with formatMessage(). */
export const ADHIKA_MONTH_TEMPLATE: Readonly<Record<AppLocale, string>> = {
  en: "{month} (extra month)",
  de: "{month} (Schaltmonat)",
  hi: "अधिक {month}",
  mr: "अधिक {month}",
};

const EXPECTED_LENGTHS: ReadonlyArray<readonly [string, LocalizedList, number]> = [
  ["TITHI_NAMES", TITHI_NAMES, 30],
  ["YOGA_NAMES", YOGA_NAMES, 27],
  ["KARANA_NAMES", KARANA_NAMES, 11],
  ["WEEKDAY_NAMES", WEEKDAY_NAMES, 7],
  ["LUNAR_MONTH_NAMES", LUNAR_MONTH_NAMES, 12],
];

for (const [label, table, length] of EXPECTED_LENGTHS) {
  for (const [locale, names] of Object.entries(table)) {
    if (names.length !== length) {
      throw new Error(`${label}.${locale} has ${names.length} names, expected ${length}.`);
    }
  }
}
