import {
  BHAVA_EDUCATION,
  LOCALIZED_ANALYSIS_LIMITATIONS,
  readLocalized,
} from "../astro/education";
import {
  type GrahaId,
  type HouseNumber,
  type Motion,
  type Pada,
  type VedicChart,
} from "../astro/ephemeris";
import { auditVedicChart } from "../astro/analysisAudit";
import {
  analyzeVedicChart,
  formatDegreeMinute,
} from "../astro/interpretations";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "../astro/localizedNames";
import {
  APP_LOCALES,
  INTL_LOCALES,
  type AppLocale,
} from "../i18n";

export interface KundaliPdfRequest {
  person: {
    fullName: string;
    gender?: string;
  };
  birth: {
    instant: Date;
    localDate?: string;
    localTime?: string;
    timeZone?: string;
    utcOffset?: string;
    precision?: "minute" | "second";
  };
  location: {
    label: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface KundaliSummaryInput {
  chart: VedicChart;
  request: KundaliPdfRequest;
  asOf: Date;
  locale: AppLocale;
}

export interface KundaliPdfCopy {
  title: string;
  subtitle: string;
  identityAndBirth: string;
  name: string;
  addressing: string;
  birthCivilTime: string;
  birthInstant: string;
  place: string;
  coordinates: string;
  timeZone: string;
  coreAnchors: string;
  grahaPositions: string;
  graha: string;
  placement: string;
  nakshatraPada: string;
  bhavaMotion: string;
  bhavaSummary: string;
  occupants: string;
  noOccupants: string;
  constructiveExpression: string;
  caution: string;
  vimshottari: string;
  referenceDate: string;
  mahadasha: string;
  antardasha: string;
  period: string;
  methodology: string;
  limitations: string;
  generatedBy: string;
  page: string;
  of: string;
  pada: string;
  bhava: string;
  nakshatraLord: string;
  notSpecified: string;
  internalAudit: string;
  passedChecks: string;
}

export interface KundaliCoreAnchor {
  id: "lagna" | "sun" | "moon";
  label: string;
  rasi: string;
  degree: string;
  nakshatra: string;
  pada: Pada;
  bhava: HouseNumber | null;
}

export interface KundaliGrahaRow {
  id: GrahaId;
  graha: string;
  rasi: string;
  degree: string;
  nakshatra: string;
  nakshatraLord: string;
  pada: Pada;
  bhava: HouseNumber;
  motion: string;
}

export interface KundaliBhavaRow {
  number: HouseNumber;
  name: string;
  rasi: string;
  domain: string;
  occupants: string;
  constructive: string;
  caution: string;
}

export interface KundaliDashaPeriod {
  lord: string;
  start: string;
  end: string;
}

export interface KundaliSummary {
  locale: AppLocale;
  copy: KundaliPdfCopy;
  person: {
    fullName: string;
    gender: string;
  };
  birth: {
    civilTime: string;
    instant: string;
    place: string;
    coordinates: string;
    timeZone: string;
  };
  core: readonly KundaliCoreAnchor[];
  grahas: readonly KundaliGrahaRow[];
  bhavas: readonly KundaliBhavaRow[];
  dashas: {
    asOf: string;
    mahadasha: KundaliDashaPeriod;
    antardasha: KundaliDashaPeriod;
  };
  method: readonly string[];
  audit: {
    checksPerformed: number;
    warningCount: number;
  };
  limitations: readonly string[];
}

const COPY: Readonly<Record<AppLocale, KundaliPdfCopy>> = {
  en: {
    title: "Kundali summary",
    subtitle: "Lahiri-sidereal natal reference",
    identityAndBirth: "Identity and birth data",
    name: "Name",
    addressing: "Addressing",
    birthCivilTime: "Civil birth time",
    birthInstant: "Absolute instant",
    place: "Birth place",
    coordinates: "Coordinates",
    timeZone: "Time zone",
    coreAnchors: "Core natal anchors",
    grahaPositions: "Nine Graha positions",
    graha: "Graha",
    placement: "Rasi · degree",
    nakshatraPada: "Nakshatra · Pada",
    bhavaMotion: "Bhava · motion",
    bhavaSummary: "Twelve Bhavas",
    occupants: "Resident Grahas",
    noOccupants: "No classical Graha",
    constructiveExpression: "Constructive expression",
    caution: "Watch with balance",
    vimshottari: "Vimshottari timing",
    referenceDate: "Reference date",
    mahadasha: "Mahadasha",
    antardasha: "Antardasha",
    period: "Period",
    methodology: "Calculation method",
    limitations: "Limits and responsible use",
    generatedBy: "Generated locally by Vedic Astrologer",
    page: "Page",
    of: "of",
    pada: "Pada",
    bhava: "Bhava",
    nakshatraLord: "lord",
    notSpecified: "Not specified",
    internalAudit: "Internal consistency audit",
    passedChecks: "structural checks passed",
  },
  hi: {
    title: "कुंडली सारांश",
    subtitle: "लाहिरी-निरयण जन्म-कुंडली संदर्भ",
    identityAndBirth: "पहचान और जन्म-विवरण",
    name: "नाम",
    addressing: "संबोधन",
    birthCivilTime: "स्थानीय जन्म-समय",
    birthInstant: "निरपेक्ष समय",
    place: "जन्म-स्थान",
    coordinates: "निर्देशांक",
    timeZone: "समय-क्षेत्र",
    coreAnchors: "मुख्य जन्म-कुंडली आधार",
    grahaPositions: "नौ ग्रहों की स्थितियाँ",
    graha: "ग्रह",
    placement: "राशि · अंश",
    nakshatraPada: "नक्षत्र · पाद",
    bhavaMotion: "भाव · गति",
    bhavaSummary: "बारह भाव",
    occupants: "स्थित ग्रह",
    noOccupants: "कोई शास्त्रीय ग्रह नहीं",
    constructiveExpression: "रचनात्मक अभिव्यक्ति",
    caution: "संतुलित सावधानी",
    vimshottari: "विम्शोत्तरी काल",
    referenceDate: "संदर्भ तिथि",
    mahadasha: "महादशा",
    antardasha: "अन्तर्दशा",
    period: "अवधि",
    methodology: "गणना-पद्धति",
    limitations: "सीमाएँ और जिम्मेदार उपयोग",
    generatedBy: "Vedic Astrologer द्वारा आपके उपकरण पर बनाया गया",
    page: "पृष्ठ",
    of: "में से",
    pada: "पाद",
    bhava: "भाव",
    nakshatraLord: "स्वामी",
    notSpecified: "नहीं बताया",
    internalAudit: "आंतरिक संगति जाँच",
    passedChecks: "संरचनात्मक जाँच सफल",
  },
  mr: {
    title: "कुंडली सारांश",
    subtitle: "लाहिरी-निरयण जन्मकुंडली संदर्भ",
    identityAndBirth: "ओळख आणि जन्मतपशील",
    name: "नाव",
    addressing: "संबोधन",
    birthCivilTime: "स्थानिक जन्मवेळ",
    birthInstant: "निरपेक्ष वेळ",
    place: "जन्मस्थळ",
    coordinates: "निर्देशांक",
    timeZone: "वेळक्षेत्र",
    coreAnchors: "मुख्य जन्मकुंडली आधार",
    grahaPositions: "नऊ ग्रहस्थिती",
    graha: "ग्रह",
    placement: "राशी · अंश",
    nakshatraPada: "नक्षत्र · पाद",
    bhavaMotion: "भाव · गती",
    bhavaSummary: "बारा भाव",
    occupants: "स्थित ग्रह",
    noOccupants: "शास्त्रीय ग्रह नाही",
    constructiveExpression: "रचनात्मक अभिव्यक्ती",
    caution: "संतुलित सावधगिरी",
    vimshottari: "विंशोत्तरी काल",
    referenceDate: "संदर्भ दिनांक",
    mahadasha: "महादशा",
    antardasha: "अंतर्दशा",
    period: "कालावधी",
    methodology: "गणनापद्धती",
    limitations: "मर्यादा आणि जबाबदार वापर",
    generatedBy: "Vedic Astrologer ने तुमच्या उपकरणावर तयार केले",
    page: "पृष्ठ",
    of: "पैकी",
    pada: "पाद",
    bhava: "भाव",
    nakshatraLord: "स्वामी",
    notSpecified: "नमूद नाही",
    internalAudit: "अंतर्गत सुसंगती तपासणी",
    passedChecks: "रचनात्मक तपासण्या यशस्वी",
  },
  de: {
    title: "Kundali-Zusammenfassung",
    subtitle: "Lahiri-siderische Referenz der Geburtskundali",
    identityAndBirth: "Person und Geburtsdaten",
    name: "Name",
    addressing: "Anrede",
    birthCivilTime: "Lokale Geburtszeit",
    birthInstant: "Absoluter Zeitpunkt",
    place: "Geburtsort",
    coordinates: "Koordinaten",
    timeZone: "Zeitzone",
    coreAnchors: "Zentrale Geburtsfaktoren",
    grahaPositions: "Positionen der neun Grahas",
    graha: "Graha",
    placement: "Rasi · Grad",
    nakshatraPada: "Nakshatra · Pada",
    bhavaMotion: "Bhava · Bewegung",
    bhavaSummary: "Zwölf Bhavas",
    occupants: "Enthaltene Grahas",
    noOccupants: "Kein klassischer Graha",
    constructiveExpression: "Konstruktiver Ausdruck",
    caution: "Ausgewogen beachten",
    vimshottari: "Vimshottari-Zeitstruktur",
    referenceDate: "Bezugsdatum",
    mahadasha: "Mahadasha",
    antardasha: "Antardasha",
    period: "Zeitraum",
    methodology: "Berechnungsmethode",
    limitations: "Grenzen und verantwortliche Nutzung",
    generatedBy: "Lokal durch Vedic Astrologer erstellt",
    page: "Seite",
    of: "von",
    pada: "Pada",
    bhava: "Bhava",
    nakshatraLord: "Herrscher",
    notSpecified: "Nicht angegeben",
    internalAudit: "Interne Konsistenzprüfung",
    passedChecks: "Strukturprüfungen bestanden",
  },
};

const MOTION_LABELS: Readonly<Record<AppLocale, Record<Motion, string>>> = {
  en: {
    direct: "Margi (direct)",
    retrograde: "Vakri (retrograde)",
    stationary: "Sthira (stationary)",
  },
  hi: {
    direct: "मार्गी",
    retrograde: "वक्री",
    stationary: "स्थिर",
  },
  mr: {
    direct: "मार्गी",
    retrograde: "वक्री",
    stationary: "स्थिर",
  },
  de: {
    direct: "Margi (direktläufig)",
    retrograde: "Vakri (rückläufig)",
    stationary: "Sthira (stationär)",
  },
};

const GENDER_LABELS: Readonly<
  Record<AppLocale, Readonly<Record<string, string>>>
> = {
  en: {
    male: "Male",
    female: "Female",
    other: "Other",
    unspecified: "Not specified",
  },
  hi: {
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    unspecified: "नहीं बताया",
  },
  mr: {
    male: "पुरुष",
    female: "स्त्री",
    other: "इतर",
    unspecified: "नमूद नाही",
  },
  de: {
    male: "Männlich",
    female: "Weiblich",
    other: "Divers",
    unspecified: "Nicht angegeben",
  },
};

const CORE_LABELS: Readonly<
  Record<AppLocale, Readonly<Record<KundaliCoreAnchor["id"], string>>>
> = {
  en: { lagna: "Lagna", sun: "Surya", moon: "Chandra" },
  hi: { lagna: "लग्न", sun: "सूर्य", moon: "चन्द्र" },
  mr: { lagna: "लग्न", sun: "सूर्य", moon: "चंद्र" },
  de: { lagna: "Lagna", sun: "Surya", moon: "Chandra" },
};

const LIMITATION_IDS = [
  "symbolic-not-scientific",
  "birth-time-sensitivity",
  "model-dependence",
  "mean-node-model",
  "feature-scope",
  "ephemeris-tolerance",
  "dasha-convention",
] as const;

function formatNumber(
  value: number,
  locale: AppLocale,
  maximumFractionDigits = 4,
): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    maximumFractionDigits,
  }).format(value);
}

function formatInstant(
  value: Date | string,
  locale: AppLocale,
  timeZone?: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {}),
  };

  try {
    return new Intl.DateTimeFormat(INTL_LOCALES[locale], options).format(date);
  } catch {
    return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date);
  }
}

function formatCivilTime(
  request: KundaliPdfRequest,
  locale: AppLocale,
): string {
  const { localDate, localTime, utcOffset } = request.birth;
  if (localDate && localTime) {
    return `${localDate} · ${localTime}${utcOffset ? ` (${utcOffset})` : ""}`;
  }
  return formatInstant(
    request.birth.instant,
    locale,
    request.birth.timeZone,
  );
}

function formatCoordinates(
  chart: VedicChart,
  request: KundaliPdfRequest,
  locale: AppLocale,
): string {
  const latitude = request.location.latitude ?? chart.location.latitude;
  const longitude = request.location.longitude ?? chart.location.longitude;
  return `${formatNumber(latitude, locale)}°, ${formatNumber(longitude, locale)}°`;
}

function localizeGender(
  gender: string | undefined,
  locale: AppLocale,
): string {
  if (!gender) return COPY[locale].notSpecified;
  return GENDER_LABELS[locale][gender] ?? gender;
}

function localizedMethod(
  chart: VedicChart,
  locale: AppLocale,
  auditChecks: number,
): readonly string[] {
  const ayanamsa = formatNumber(chart.ayanamsa.trueDegrees, locale, 4);
  const checks = formatNumber(auditChecks, locale, 0);
  return {
    en: [
      `Sidereal zodiac with ${chart.ayanamsa.model}; true Ayanamsa ${ayanamsa}° at the natal instant.`,
      "Whole-sign Bhavas; Lagna determines the first Rasi and each following Rasi forms the next Bhava.",
      "Apparent geocentric true ecliptic positions of date from astronomy-engine; Rahu and Ketu use mean lunar nodes.",
      `Internal consistency audit: ${checks} structural checks passed before export.`,
    ],
    hi: [
      `निरयण राशि-चक्र, ${chart.ayanamsa.model}; जन्म-क्षण पर वास्तविक अयनांश ${ayanamsa}°।`,
      "पूर्ण-राशि भाव; लग्न प्रथम राशि निर्धारित करता है और प्रत्येक अगली राशि अगला भाव बनाती है।",
      "astronomy-engine से तिथि की प्रत्यक्ष भूकेन्द्रीय वास्तविक क्रान्तिवृत्तीय स्थितियाँ; राहु और केतु के लिए मध्यम चन्द्र-नोड।",
      `निर्यात से पहले आंतरिक संगति जाँच में ${checks} संरचनात्मक जाँच सफल रहीं।`,
    ],
    mr: [
      `निरयण राशिचक्र, ${chart.ayanamsa.model}; जन्मक्षणी वास्तविक अयनांश ${ayanamsa}°।`,
      "पूर्ण-राशी भाव; लग्न पहिली राशी ठरवते आणि प्रत्येक पुढील राशी पुढचा भाव बनवते.",
      "astronomy-engine मधून दिनांकाच्या प्रत्यक्ष भूकेन्द्री वास्तविक क्रांतिवृत्तीय स्थिती; राहू व केतूसाठी मध्यम चंद्रनोड.",
      `निर्यातीपूर्वी अंतर्गत सुसंगती तपासणीत ${checks} रचनात्मक तपासण्या यशस्वी झाल्या.`,
    ],
    de: [
      `Siderischer Tierkreis mit ${chart.ayanamsa.model}; wahres Ayanamsa ${ayanamsa}° zum Geburtszeitpunkt.`,
      "Ganzzeichen-Bhavas; Lagna bestimmt den ersten Rasi, jeder folgende Rasi bildet den nächsten Bhava.",
      "Scheinbare geozentrische Positionen auf der wahren Ekliptik des Datums aus astronomy-engine; Rahu und Ketu verwenden mittlere Mondknoten.",
      `Interne Konsistenzprüfung: Vor dem Export wurden ${checks} Strukturprüfungen bestanden.`,
    ],
  }[locale];
}

/**
 * Creates a localized, presentation-independent Kundali report. It refuses to
 * export a chart whose own derived fields fail the app's structural audit.
 */
export function buildKundaliSummary({
  chart,
  request,
  asOf,
  locale,
}: KundaliSummaryInput): KundaliSummary {
  if (!APP_LOCALES.includes(locale)) {
    throw new RangeError(`Unsupported Kundali PDF locale: ${locale}`);
  }
  if (!(request.birth.instant instanceof Date)) {
    throw new TypeError("request.birth.instant must be a Date.");
  }
  if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) {
    throw new TypeError("asOf must be a valid Date.");
  }

  const audit = auditVedicChart(chart);
  if (!audit.isStructurallyConsistent) {
    throw new RangeError(
      `Kundali PDF export blocked: ${audit.errorCount} structural chart error(s).`,
    );
  }

  const analysis = analyzeVedicChart(chart, request.birth.instant, asOf);
  const copy = COPY[locale];
  const timeZone = request.birth.timeZone;
  const sun = analysis.core.sun;
  const moon = analysis.core.moon;
  const lagna = analysis.core.ascendant;

  const core: readonly KundaliCoreAnchor[] = [
    {
      id: "lagna",
      label: CORE_LABELS[locale].lagna,
      rasi: getLocalizedRasiName(lagna.sign, locale),
      degree: lagna.formattedDegree,
      nakshatra: getLocalizedNakshatraName(lagna.nakshatra, locale),
      pada: lagna.pada,
      bhava: lagna.house,
    },
    {
      id: "sun",
      label: CORE_LABELS[locale].sun,
      rasi: getLocalizedRasiName(sun.sign, locale),
      degree: sun.formattedDegree,
      nakshatra: getLocalizedNakshatraName(sun.nakshatra, locale),
      pada: sun.pada,
      bhava: sun.house,
    },
    {
      id: "moon",
      label: CORE_LABELS[locale].moon,
      rasi: getLocalizedRasiName(moon.sign, locale),
      degree: moon.formattedDegree,
      nakshatra: getLocalizedNakshatraName(moon.nakshatra, locale),
      pada: moon.pada,
      bhava: moon.house,
    },
  ];

  const grahas: readonly KundaliGrahaRow[] = chart.planets.map((planet) => ({
    id: planet.id,
    graha: getLocalizedGrahaName(planet.id, locale),
    rasi: getLocalizedRasiName(planet.sign.name, locale),
    degree: formatDegreeMinute(planet.sign.degreeDeg),
    nakshatra: getLocalizedNakshatraName(planet.nakshatra.name, locale),
    nakshatraLord: getLocalizedGrahaName(planet.nakshatra.lord, locale),
    pada: planet.nakshatra.pada,
    bhava: planet.house,
    motion: MOTION_LABELS[locale][planet.motion],
  }));

  const bhavas: readonly KundaliBhavaRow[] = chart.houses.map((house) => {
    const education = BHAVA_EDUCATION[house.number];
    return {
      number: house.number,
      name: readLocalized(education.name, locale),
      rasi: getLocalizedRasiName(house.sign.name, locale),
      domain: readLocalized(education.domain, locale),
      occupants:
        house.planets.length > 0
          ? house.planets
              .map((id) => getLocalizedGrahaName(id, locale))
              .join(", ")
          : copy.noOccupants,
      constructive: readLocalized(education.constructive, locale),
      caution: readLocalized(education.caution, locale),
    };
  });

  const currentMajor = analysis.dashas.currentMahadasha;
  const currentMinor = analysis.dashas.currentAntardasha;

  return {
    locale,
    copy,
    person: {
      fullName: request.person.fullName.normalize("NFKC").trim(),
      gender: localizeGender(request.person.gender, locale),
    },
    birth: {
      civilTime: formatCivilTime(request, locale),
      instant: request.birth.instant.toISOString(),
      place: request.location.label,
      coordinates: formatCoordinates(chart, request, locale),
      timeZone: timeZone ?? copy.notSpecified,
    },
    core,
    grahas,
    bhavas,
    dashas: {
      asOf: formatInstant(asOf, locale, timeZone),
      mahadasha: {
        lord: getLocalizedGrahaName(currentMajor.lord, locale),
        start: formatInstant(currentMajor.start, locale, timeZone),
        end: formatInstant(currentMajor.end, locale, timeZone),
      },
      antardasha: {
        lord: getLocalizedGrahaName(currentMinor.lord, locale),
        start: formatInstant(currentMinor.start, locale, timeZone),
        end: formatInstant(currentMinor.end, locale, timeZone),
      },
    },
    method: localizedMethod(chart, locale, audit.checksPerformed),
    audit: {
      checksPerformed: audit.checksPerformed,
      warningCount: audit.warningCount,
    },
    limitations: LIMITATION_IDS.map((id) =>
      readLocalized(LOCALIZED_ANALYSIS_LIMITATIONS[id], locale),
    ),
  };
}

/**
 * Produces a cross-platform download name without leaking any data beyond the
 * name/date already chosen for the user's local document.
 */
export function buildKundaliPdfFilename(
  fullName: string,
  localDate: string | undefined,
  locale: AppLocale,
): string {
  const safeName = fullName
    .normalize("NFKC")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[. -]+$/g, "")
    .slice(0, 64);
  const safeDate = localDate?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? localDate
    : "natal";
  return `${safeName || "kundali"}-kundali-${safeDate}-${locale}.pdf`;
}
