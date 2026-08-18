import {
  BHAVA_EDUCATION,
  GRAHA_EDUCATION,
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
import { RASI_PROFILES } from "../astro/glossary";
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
  reportBrand: string;
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
  bhavaConclusions: string;
  bhavaConclusionsIntro: string;
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
  lord: string;
  lordBhava: HouseNumber;
  domain: string;
  occupants: string;
  /** The house's traditional scope, stated without chart-specific inference. */
  significance: string;
  /** Only the calculated sign, ruler pathway and resident bodies in this chart. */
  chartReading: string;
  /** A balanced invitation to reflect, never a fixed trait or prediction. */
  reflection: string;
  conclusion: string;
  /** Concise phrase retained for the three-sentence summary. */
  constructive: string;
  /** Longer educational guidance used by detailed report views. */
  constructiveDetail: string;
  /** Concise phrase retained for the three-sentence summary. */
  caution: string;
  /** Longer educational guidance used by detailed report views. */
  cautionDetail: string;
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
    reportBrand: "Vedic astrology",
    title: "Birth chart summary",
    subtitle: "Lahiri-sidereal birth-chart reference",
    identityAndBirth: "Identity and birth data",
    name: "Name",
    addressing: "Addressing",
    birthCivilTime: "Civil birth time",
    birthInstant: "Absolute instant",
    place: "Birth place",
    coordinates: "Coordinates",
    timeZone: "Time zone",
    coreAnchors: "Core natal anchors",
    grahaPositions: "Nine planetary positions",
    graha: "Planet",
    placement: "Zodiac sign · degree",
    nakshatraPada: "Lunar mansion · quarter",
    bhavaMotion: "House · motion",
    bhavaConclusions: "Conclusions for the twelve houses",
    bhavaConclusionsIntro:
      "These chart-specific bullets combine each house's calculated zodiac sign, its ruler's position and resident planets with the app's disclosed educational rules. They are traditional-symbolic themes—not measured facts or guaranteed events. An empty house is not inactive.",
    bhavaSummary: "Twelve houses",
    occupants: "Resident planets",
    noOccupants: "No resident planet",
    constructiveExpression: "Constructive expression",
    caution: "Watch with balance",
    vimshottari: "Vimshottari periods",
    referenceDate: "Reference date",
    mahadasha: "Major period",
    antardasha: "Subperiod",
    period: "Period",
    methodology: "Calculation method",
    limitations: "Limits and responsible use",
    generatedBy: "Generated locally by the Vedic Astrology Observatory",
    page: "Page",
    of: "of",
    pada: "Quarter",
    bhava: "House",
    nakshatraLord: "Lunar-mansion ruler",
    notSpecified: "Not specified",
    internalAudit: "Internal consistency audit",
    passedChecks: "structural checks passed",
  },
  hi: {
    reportBrand: "वैदिक ज्योतिष",
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
    bhavaConclusions: "बारह घरों (भावों) के निष्कर्ष",
    bhavaConclusionsIntro:
      "ये कुंडली-विशिष्ट बिंदु प्रत्येक घर की गणितीय राशि, भावेश की स्थिति और स्थित ग्रहों को ऐप के घोषित शैक्षिक नियमों से जोड़ते हैं। ये पारंपरिक-प्रतीकात्मक विषय हैं—मापे हुए तथ्य या निश्चित घटनाएँ नहीं। खाली घर निष्क्रिय नहीं होता।",
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
    generatedBy: "वैदिक ज्योतिष वेधशाला द्वारा आपके उपकरण पर बनाया गया",
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
    reportBrand: "वैदिक ज्योतिष",
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
    bhavaConclusions: "बारा घरांचे (भावांचे) निष्कर्ष",
    bhavaConclusionsIntro:
      "हे कुंडली-विशिष्ट मुद्दे प्रत्येक घराची गणिती राशी, भावेशाचे स्थान आणि स्थित ग्रह यांना अ‍ॅपच्या घोषित शैक्षणिक नियमांशी जोडतात. हे पारंपरिक-प्रतीकात्मक विषय आहेत—मोजलेली तथ्ये किंवा निश्चित घटना नव्हेत. रिकामे घर निष्क्रिय नसते.",
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
    generatedBy: "वैदिक ज्योतिष वेधशाळेने तुमच्या उपकरणावर तयार केले",
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
    reportBrand: "Vedische Astrologie",
    title: "Geburtshoroskop-Zusammenfassung",
    subtitle: "Lahiri-siderische Referenz des Geburtshoroskops",
    identityAndBirth: "Person und Geburtsdaten",
    name: "Name",
    addressing: "Anrede",
    birthCivilTime: "Lokale Geburtszeit",
    birthInstant: "Absoluter Zeitpunkt",
    place: "Geburtsort",
    coordinates: "Koordinaten",
    timeZone: "Zeitzone",
    coreAnchors: "Zentrale Geburtsfaktoren",
    grahaPositions: "Positionen der neun Planeten",
    graha: "Planet",
    placement: "Tierkreiszeichen · Grad",
    nakshatraPada: "Mondstation · Viertel",
    bhavaMotion: "Haus · Bewegung",
    bhavaConclusions: "Schlussfolgerungen zu den zwölf Häusern",
    bhavaConclusionsIntro:
      "Diese geburtshoroskop-spezifischen Punkte verbinden das berechnete Tierkreiszeichen jedes Hauses, die Stellung seines Herrschers und die enthaltenen Planeten mit den offengelegten Bildungsregeln der App. Es sind traditionell-symbolische Themen—keine gemessenen Tatsachen oder garantierten Ereignisse. Ein leeres Haus ist nicht inaktiv.",
    bhavaSummary: "Zwölf Häuser",
    occupants: "Enthaltene Planeten",
    noOccupants: "Kein enthaltener Planet",
    constructiveExpression: "Konstruktiver Ausdruck",
    caution: "Ausgewogen beachten",
    vimshottari: "Vimshottari-Zeitperioden",
    referenceDate: "Bezugsdatum",
    mahadasha: "Hauptperiode",
    antardasha: "Unterperiode",
    period: "Zeitraum",
    methodology: "Berechnungsmethode",
    limitations: "Grenzen und verantwortliche Nutzung",
    generatedBy: "Lokal vom Observatorium für vedische Astrologie erstellt",
    page: "Seite",
    of: "von",
    pada: "Viertel",
    bhava: "Haus",
    nakshatraLord: "Herrscher der Mondstation",
    notSpecified: "Nicht angegeben",
    internalAudit: "Interne Konsistenzprüfung",
    passedChecks: "Strukturprüfungen bestanden",
  },
};

const MOTION_LABELS: Readonly<Record<AppLocale, Record<Motion, string>>> = {
  en: {
    direct: "Direct",
    retrograde: "Retrograde",
    stationary: "Stationary",
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
    direct: "Direktläufig",
    retrograde: "Rückläufig",
    stationary: "Stationär",
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
  en: { lagna: "Ascendant", sun: "Sun", moon: "Moon" },
  hi: { lagna: "लग्न", sun: "सूर्य", moon: "चन्द्र" },
  mr: { lagna: "लग्न", sun: "सूर्य", moon: "चंद्र" },
  de: { lagna: "Aszendent", sun: "Sonne", moon: "Mond" },
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

type PdfLimitationId = (typeof LIMITATION_IDS)[number];

const REPORT_LIMITATION_OVERRIDES: Readonly<
  Record<
    "en" | "de",
    Readonly<Partial<Record<PdfLimitationId, string>>>
  >
> = {
  en: {
    "symbolic-not-scientific":
      "The interpretations here follow traditional Indian astrological symbolism. Astrology has not been scientifically validated as a reliable way to predict events, personality, health or outcomes.",
    "birth-time-sensitivity":
      "The Ascendant and houses are sensitive to birth time and place. Rounded or uncertain input can materially change them.",
    "model-dependence":
      "Results depend on convention. This app uses its documented Lahiri sidereal offset and whole-sign houses; another model may differ near boundaries.",
    "mean-node-model":
      "The north and south lunar nodes use mean-node positions. True-node positions may differ, especially near a boundary.",
    "feature-scope":
      "Sixfold strength, divisional charts, combustion, classical aspects, conjunction strength, planetary combinations and event probabilities are not calculated. Any mention of them is educational only.",
    "dasha-convention":
      "Major- and subperiod dates in the Vimshottari system use a disclosed 365.25-day year. Traditions or software using another year length or boundary rule can produce different dates.",
  },
  de: {
    "symbolic-not-scientific":
      "Die Deutungen hier folgen der Symbolik traditioneller indischer Astrologie. Astrologie ist wissenschaftlich nicht als zuverlässige Methode zur Vorhersage von Ereignissen, Persönlichkeit, Gesundheit oder Ergebnissen validiert.",
    "birth-time-sensitivity":
      "Aszendent und Häuser reagieren empfindlich auf Geburtszeit und -ort. Gerundete oder unsichere Eingaben können sie wesentlich verändern.",
    "model-dependence":
      "Ergebnisse hängen von der Konvention ab. Diese App verwendet ihren dokumentierten siderischen Versatz nach Lahiri und Ganzzeichen-Häuser; andere Modelle können nahe Grenzen abweichen.",
    "mean-node-model":
      "Nördlicher und südlicher Mondknoten verwenden mittlere Knotenpositionen. Wahre Knotenpositionen können insbesondere nahe einer Grenze abweichen.",
    "feature-scope":
      "Sechsfache Stärkebewertung, Teilhoroskope, Verbrennung, klassische Aspekte, Konjunktionsstärke, Planetenkombinationen und Ereigniswahrscheinlichkeiten werden nicht berechnet. Erwähnungen dienen ausschließlich der Bildung.",
    "dasha-convention":
      "Haupt- und Unterperioden im Vimshottari-System beruhen auf der offengelegten Konvention eines Jahres mit 365,25 Tagen. Traditionen oder Programme mit anderer Jahreslänge oder Grenzregel können andere Daten ergeben.",
  },
};

function localizedReportLimitation(
  id: PdfLimitationId,
  locale: AppLocale,
): string {
  if (locale === "en" || locale === "de") {
    const override = REPORT_LIMITATION_OVERRIDES[locale][id];
    if (override) return override;
  }
  return readLocalized(LOCALIZED_ANALYSIS_LIMITATIONS[id], locale);
}

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

interface BhavaConclusionParts {
  number: HouseNumber;
  domain: string;
  rasi: string;
  lord: string;
  lordBhava: HouseNumber;
  lordBhavaName?: string;
  lordBhavaDomain: string;
  residentFunctions: readonly string[];
  constructive: string;
  caution: string;
}

interface LocalizedBhavaNarrative {
  significance: string;
  chartReading: string;
  reflection: string;
  conclusion: string;
}

/**
 * Summarizes only factors that the app actually calculates and discloses:
 * whole-sign zodiac sign, house-ruler placement and resident planetary
 * significations. The constructive/caution pair remains separate on the PDF
 * so it cannot be mistaken for an event prediction.
 */
function buildLocalizedBhavaNarrative(
  parts: BhavaConclusionParts,
  locale: AppLocale,
): LocalizedBhavaNarrative {
  const residents = parts.residentFunctions.join("; ");

  if (locale === "hi") {
    const residentClause = residents
      ? `स्थित ग्रहों की पारंपरिक भूमिकाएँ भी जुड़ती हैं—${residents}`
      : "कोई ग्रह स्थित नहीं है, इसलिए यह भाव निष्क्रिय नहीं बल्कि राशि और भावेश के माध्यम से पढ़ा जाता है";
    const significance = `भाव ${parts.number} परंपरागत रूप से ${parts.domain} दर्शाता है।`;
    const chartReading = `इस कुंडली में ${parts.rasi} इस भाव में है और इसके स्वामी ${parts.lord} भाव ${parts.lordBhava} (${parts.lordBhavaName}) में हैं, इसलिए ${parts.lordBhavaDomain} से प्रतीकात्मक संबंध बनता है; ${residentClause}।`;
    const reflection = `अपने अनुभव में ${parts.constructive} की संभावना और ${parts.caution} की सावधानी—दोनों पर विचार करें; यह व्यक्ति का निश्चित वर्णन या घटना की भविष्यवाणी नहीं है।`;
    return {
      significance,
      chartReading,
      reflection,
      conclusion: `${significance} ${chartReading} ${reflection}`,
    };
  }

  if (locale === "mr") {
    const residentClause = residents
      ? `स्थित ग्रहांच्या पारंपरिक भूमिकाही जोडल्या जातात—${residents}`
      : "येथे ग्रह नाही; म्हणून हा भाव निष्क्रिय नसून राशी आणि भावेशाद्वारे वाचला जातो";
    const significance = `भाव ${parts.number} परंपरेनुसार ${parts.domain} दर्शवतो.`;
    const chartReading = `या कुंडलीत ${parts.rasi} या भावात आहे आणि तिचा स्वामी ${parts.lord} भाव ${parts.lordBhava} (${parts.lordBhavaName}) मध्ये आहे, त्यामुळे ${parts.lordBhavaDomain} यांच्याशी प्रतीकात्मक दुवा तयार होतो; ${residentClause}.`;
    const reflection = `स्वतःच्या अनुभवात ${parts.constructive} यांची शक्यता आणि ${parts.caution} याबाबतची सावधगिरी—दोन्ही तपासा; हे व्यक्तीचे निश्चित वर्णन किंवा घटनेचे भाकीत नाही.`;
    return {
      significance,
      chartReading,
      reflection,
      conclusion: `${significance} ${chartReading} ${reflection}`,
    };
  }

  if (locale === "de") {
    const lordHouseName = parts.lordBhavaName
      ? ` (${parts.lordBhavaName})`
      : "";
    const residentClause = residents
      ? `die traditionellen Rollen der enthaltenen Himmelskörper kommen hinzu: ${residents}`
      : "kein Himmelskörper steht darin, daher wird das Haus nicht als inaktiv behandelt, sondern über Tierkreiszeichen und Hausherrscher gelesen";
    const significance = `Haus ${parts.number} steht traditionell für ${parts.domain}.`;
    const chartReading = `In diesem Geburtshoroskop besetzt ${parts.rasi} das Haus und sein Herrscher ${parts.lord} steht in Haus ${parts.lordBhava}${lordHouseName}, wodurch eine symbolische Verbindung zu ${parts.lordBhavaDomain} entsteht; ${residentClause}.`;
    const reflection = `Als persönliche Reflexion lassen sich sowohl ${parts.constructive} als auch die mögliche Spannung ${parts.caution} prüfen; dies ist weder eine feste Beschreibung der Person noch eine Vorhersage.`;
    return {
      significance,
      chartReading,
      reflection,
      conclusion: `${significance} ${chartReading} ${reflection}`,
    };
  }

  const lordHouseName = parts.lordBhavaName
    ? ` (${parts.lordBhavaName})`
    : "";
  const residentClause = residents
    ? `the traditional roles of its resident bodies also enter the reading: ${residents}`
    : "no body is resident, so the house is not inactive and is read through its zodiac sign and ruler";
  const significance = `House ${parts.number} traditionally signifies ${parts.domain}.`;
  const chartReading = `In this birth chart, ${parts.rasi} occupies the house and its ruler ${parts.lord} is in House ${parts.lordBhava}${lordHouseName}, symbolically linking it with ${parts.lordBhavaDomain}; ${residentClause}.`;
  const reflection = `For personal reflection, consider both the potential for ${parts.constructive} and the caution around ${parts.caution}; this is neither a fixed description of the person nor a prediction.`;
  return {
    significance,
    chartReading,
    reflection,
    conclusion: `${significance} ${chartReading} ${reflection}`,
  };
}

/**
 * Builds the same twelve localized, chart-specific house summaries used by
 * both the interactive analysis and the PDF export.
 */
export function buildLocalizedBhavaRows(
  chart: VedicChart,
  locale: AppLocale,
): readonly KundaliBhavaRow[] {
  const copy = COPY[locale];

  return chart.houses.map((house) => {
    const education = BHAVA_EDUCATION[house.number];
    const lordId = RASI_PROFILES[house.sign.name].ruler;
    const lordPlacement = chart.planets.find(
      (planet) => planet.id === lordId,
    );
    if (!lordPlacement) {
      throw new RangeError(
        `House summary blocked: house ruler ${lordId} is missing.`,
      );
    }

    const lordBhavaEducation = BHAVA_EDUCATION[lordPlacement.house];
    const rasi = getLocalizedRasiName(house.sign.name, locale);
    const lord = getLocalizedGrahaName(lordId, locale);
    const domain = readLocalized(education.domain, locale);
    const constructive = readLocalized(education.constructive, locale);
    const constructiveDetail = readLocalized(
      education.constructiveDetail,
      locale,
    );
    const caution = readLocalized(education.caution, locale);
    const cautionDetail = readLocalized(education.cautionDetail, locale);
    const residentFunctions = house.planets.map((id) => {
      const name = getLocalizedGrahaName(id, locale);
      const functionText = readLocalized(
        GRAHA_EDUCATION[id].signifies,
        locale,
      );
      return `${name}: ${functionText}`;
    });
    const narrative = buildLocalizedBhavaNarrative(
      {
        number: house.number,
        domain,
        rasi,
        lord,
        lordBhava: lordPlacement.house,
        lordBhavaName:
          locale === "en" || locale === "de"
            ? undefined
            : readLocalized(lordBhavaEducation.name, locale),
        lordBhavaDomain: readLocalized(
          lordBhavaEducation.domain,
          locale,
        ),
        residentFunctions,
        constructive,
        caution,
      },
      locale,
    );

    return {
      number: house.number,
      name: readLocalized(education.name, locale),
      rasi,
      lord,
      lordBhava: lordPlacement.house,
      domain,
      occupants:
        house.planets.length > 0
          ? house.planets
              .map((id) => getLocalizedGrahaName(id, locale))
              .join(", ")
          : copy.noOccupants,
      ...narrative,
      constructive,
      constructiveDetail,
      caution,
      cautionDetail,
    };
  });
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
      `Sidereal zodiac using ${chart.ayanamsa.model}; calculated sidereal offset ${ayanamsa}° at the birth instant.`,
      "Whole-sign houses; the Ascendant determines the first zodiac sign, and each following sign forms the next house.",
      "Apparent geocentric positions on the true ecliptic of date from astronomy-engine; the north and south lunar nodes use mean-node positions.",
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
      `Siderischer Tierkreis nach ${chart.ayanamsa.model}; berechneter siderischer Versatz ${ayanamsa}° zum Geburtszeitpunkt.`,
      "Ganzzeichen-Häuser; der Aszendent bestimmt das erste Tierkreiszeichen, jedes folgende Zeichen bildet das nächste Haus.",
      "Scheinbare geozentrische Positionen auf der wahren Ekliptik des Datums aus astronomy-engine; nördlicher und südlicher Mondknoten verwenden mittlere Knotenpositionen.",
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

  const bhavas = buildLocalizedBhavaRows(chart, locale);

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
      localizedReportLimitation(id, locale),
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
  const filenameCopy: Readonly<
    Record<AppLocale, { document: string; unknownDate: string }>
  > = {
    en: { document: "birth-chart", unknownDate: "date-unknown" },
    hi: { document: "जन्म-कुंडली", unknownDate: "तिथि-अज्ञात" },
    mr: { document: "जन्मकुंडली", unknownDate: "दिनांक-अज्ञात" },
    de: { document: "geburtshoroskop", unknownDate: "datum-unbekannt" },
  };
  const labels = filenameCopy[locale];
  const safeName = fullName
    .normalize("NFKC")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[. -]+$/g, "")
    .slice(0, 64);
  const safeDate = localDate?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? localDate
    : labels.unknownDate;
  const stem = safeName
    ? `${safeName}-${labels.document}`
    : labels.document;
  return `${stem}-${safeDate}-${locale}.pdf`;
}
