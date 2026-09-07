"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Bot,
  CalendarClock,
  ChevronDown,
  CircleAlert,
  Compass,
  GraduationCap,
  ListTree,
  MoonStar,
  Scale,
  Sparkles,
  SunMedium,
  TableProperties,
} from "lucide-react";

import JyotishGuideTab from "@/components/analysis/JyotishGuideTab";
import MethodologyTab from "@/components/analysis/MethodologyTab";
import AiAstrologerTab from "@/components/dashboard/AiAstrologerTab";
import HoroscopeTab from "@/components/dashboard/HoroscopeTab";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import AstroTerm from "@/components/ui/AstroTerm";
import {
  BHAVA_EDUCATION,
  GRAHA_EDUCATION,
  LOCALIZED_ANALYSIS_LIMITATIONS,
  getGenericNakshatraReading,
  readLocalized,
} from "@/lib/astro/education";
import {
  NAKSHATRAS,
  type GrahaId,
  type GrahaPosition,
  type HouseNumber,
  type NakshatraName,
  type VedicChart,
  type ZodiacPlacement,
} from "@/lib/astro/ephemeris";
import { RASI_PROFILES } from "@/lib/astro/glossary";
import {
  VIMSHOTTARI_YEAR_MS,
  analyzeVedicChart,
  type MahadashaPeriod,
} from "@/lib/astro/interpretations";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import {
  buildLocalizedBhavaRows,
  type KundaliBhavaRow,
} from "@/lib/export/kundaliSummary";
import { INTL_LOCALES, type AppLocale } from "@/lib/i18n";
import { calculateTransitAnalysis } from "@/lib/transits";

export interface InterpretationRequestMetadata {
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
  };
  location: {
    label: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface InterpretationPanelProps {
  chart: VedicChart;
  request: InterpretationRequestMetadata;
  /** Explicit reference instant keeps Dasha output reproducible. */
  asOf: Date;
  onSelectPlanet?: (planet: GrahaId) => void;
  onSelectHouse?: (house: HouseNumber) => void;
  initialTab?: AnalysisTab;
}

export type AnalysisTab =
  | "overview"
  | "positions"
  | "nakshatras"
  | "dashas"
  | "horoscope"
  | "assistant"
  | "guide"
  | "method";

interface AnalysisCopy {
  analysis: string;
  sections: string;
  views: string;
  overview: string;
  positions: string;
  houses: string;
  nakshatras: string;
  dashas: string;
  horoscope: string;
  assistant: string;
  guide: string;
  method: string;
  coreSynthesis: string;
  rising: string;
  moon: string;
  lagna: string;
  padaShort: string;
  house: string;
  symbolicReading: string;
  computedPlacement: string;
  learnTerms: string;
  balancedSynthesis: string;
  synthesisIntro: string;
  constructivePossibilities: string;
  cautions: string;
  birthNakshatra: string;
  reflectionNotVerdict: string;
  planetaryPositions: string;
  positionsIntro: string;
  graha: string;
  rasi: string;
  degree: string;
  nakshatra: string;
  lord: string;
  motion: string;
  direct: string;
  retrograde: string;
  stationary: string;
  boundaryNote: string;
  houseByHouse: string;
  housesIntro: string;
  houseSignificance: string;
  yourChart: string;
  readingSequence: string;
  houseTopic: string;
  signContext: string;
  houseLord: string;
  residentGrahas: string;
  bhavaFoundation: string;
  domain: string;
  constructive: string;
  watchFor: string;
  rasiContext: string;
  rasiContextBody: string;
  lordPathway: string;
  lordPathwayBody: string;
  noGrahas: string;
  emptyHouseTitle: string;
  emptyHouseBody: string;
  residentTitle: string;
  reflection: string;
  highlightHouse: string;
  mansionsTitle: string;
  mansionsIntro: string;
  birthMoon: string;
  occupiedBy: string;
  notOccupied: string;
  timelineTitle: string;
  timelineIntro: string;
  majorMeaningTitle: string;
  majorMeaningBody: string;
  minorMeaningTitle: string;
  minorMeaningBody: string;
  currentPeriod: string;
  asOf: string;
  remaining: string;
  major: string;
  minor: string;
  natalAnchors: string;
  largerContext: string;
  activeChannel: string;
  combinationCaution: string;
  birthMahadasha: string;
  moonProgress: string;
  birthBalance: string;
  years: string;
  cycleTitle: string;
  starts: string;
  ends: string;
  status: string;
  current: string;
  atBirth: string;
  antardashaList: string;
  methodNote: string;
  tabPanel: string;
}

const COPY: Readonly<Record<AppLocale, AnalysisCopy>> = {
  en: {
    analysis: "Vedic astrology analysis",
    sections: "Analysis sections",
    views: "Vedic astrology analysis views",
    overview: "Overview",
    positions: "Positions",
    houses: "Houses",
    nakshatras: "Lunar mansions",
    dashas: "Planetary periods",
    horoscope: "Transits",
    assistant: "AI Astrologer",
    guide: "Learn Vedic astrology",
    method: "Method & limits",
    coreSynthesis: "Core synthesis",
    rising: "rising",
    moon: "Moon",
    lagna: "Ascendant",
    padaShort: "Q",
    house: "House",
    symbolicReading: "Traditional symbolic reading",
    computedPlacement: "Calculated placement",
    learnTerms: "Learn the terms",
    balancedSynthesis: "Balanced synthesis",
    synthesisIntro:
      "The Ascendant describes the chart's outward orientation, while the Moon and its lunar mansion add a traditional lens on habit and response. Treat agreements and tensions between them as reflection prompts—not measured personality facts.",
    constructivePossibilities: "Constructive possibilities",
    cautions: "Counter-patterns to examine",
    birthNakshatra: "Birth lunar mansion",
    reflectionNotVerdict:
      "Lunar-mansion imagery is a traditional symbolic layer. It is not a psychological measurement or a verdict about character.",
    planetaryPositions: "Planetary positions",
    positionsIntro:
      "Sidereal Lahiri-style longitudes in whole-sign houses. Values are calculations; interpretive meanings are separate.",
    graha: "Body",
    rasi: "Zodiac sign",
    degree: "Degree",
    nakshatra: "Lunar mansion",
    lord: "Lord",
    motion: "Motion",
    direct: "Direct",
    retrograde: "Retrograde",
    stationary: "Stationary",
    boundaryNote:
      "A placement close to a zodiac-sign, lunar-mansion, or quarter boundary can change under another ayanamsa or a small input/model difference. Near-station motion is also sensitive.",
    houseByHouse: "House-by-house analysis",
    housesIntro:
      "One card per house: what it covers, where it flows well, and what to watch. No single placement is a verdict.",
    houseSignificance: "What this house signifies",
    yourChart: "Your birth chart",
    readingSequence: "Reading sequence",
    houseTopic: "House topic",
    signContext: "Zodiac-sign context",
    houseLord: "House ruler",
    residentGrahas: "Resident bodies",
    bhavaFoundation: "House foundation",
    domain: "Traditional domain",
    constructive: "Constructive expression",
    watchFor: "Watch for",
    rasiContext: "Zodiac-sign context",
    rasiContextBody:
      "This zodiac sign supplies a traditional style or condition for the house. The app does not reduce the whole house—or the person—to this one label.",
    lordPathway: "House-ruler pathway",
    lordPathwayBody:
      "Because this zodiac sign occupies the house, its planetary ruler becomes the house ruler. That ruler's natal house links the two topic areas; this is a symbolic relationship, not an event forecast.",
    noGrahas: "No resident body",
    emptyHouseTitle: "An empty house is not absent",
    emptyHouseBody:
      "With no resident body, interpretation relies more on the zodiac sign, its ruler, and timing. Empty does not automatically mean weak or inactive.",
    residentTitle: "Resident bodies: educational synthesis",
    reflection: "Reflection prompt",
    highlightHouse: "Highlight this house in the chart",
    mansionsTitle: "The 27 lunar mansions",
    mansionsIntro:
      "Each is a 13°20′ sidereal segment with four quarters. Occupancy below is calculated; interpretive imagery remains traditional.",
    birthMoon: "Birth Moon",
    occupiedBy: "Occupied by",
    notOccupied: "No natal body in this segment",
    timelineTitle: "Vimshottari period timeline",
    timelineIntro:
      "Calculated from the Moon's computed progress through its birth lunar mansion. Dates use the disclosed 365.25-day-year convention.",
    majorMeaningTitle: "Major period · larger chapter",
    majorMeaningBody:
      "The major-period ruler supplies a long symbolic context. Its natal zodiac sign and house show where its themes are anchored; they do not guarantee an event.",
    minorMeaningTitle: "Sub-period · active channel",
    minorMeaningBody:
      "The sub-period ruler describes a nearer-term symbolic channel inside the major period. Read both planetary bodies together, including constructive and difficult expressions.",
    currentPeriod: "Current Vimshottari period",
    asOf: "As of",
    remaining: "remaining",
    major: "Major",
    minor: "Minor",
    natalAnchors: "Natal anchors",
    largerContext: "Larger-period context",
    activeChannel: "Sub-period focus",
    combinationCaution: "This synthesis does not establish that a specific event will occur.",
    birthMahadasha: "Major period at birth",
    moonProgress: "Moon's lunar-mansion progress",
    birthBalance: "Balance at birth",
    years: "years",
    cycleTitle: "Major-period cycle containing the reference date",
    starts: "Starts",
    ends: "Ends",
    status: "Status",
    current: "Current",
    atBirth: "At birth",
    antardashaList: "Sub-periods in the current major period",
    methodNote:
      "Vimshottari is a traditional symbolic timing model, not a probability, diagnosis or promise. Other conventions can shift dates.",
    tabPanel: "analysis",
  },
  hi: {
    analysis: "ज्योतिष विश्लेषण",
    sections: "विश्लेषण अनुभाग",
    views: "ज्योतिष विश्लेषण दृश्य",
    overview: "सार",
    positions: "स्थितियाँ",
    houses: "भाव",
    nakshatras: "नक्षत्र",
    dashas: "दशाएँ",
    horoscope: "गोचर",
    assistant: "AI ज्योतिषी",
    guide: "ज्योतिष सीखें",
    method: "विधि और सीमाएँ",
    coreSynthesis: "मूल संश्लेषण",
    rising: "उदय",
    moon: "चन्द्र",
    lagna: "लग्न",
    padaShort: "पाद ",
    house: "भाव",
    symbolicReading: "पारंपरिक प्रतीकात्मक पाठ",
    computedPlacement: "गणना की गई स्थिति",
    learnTerms: "शब्द समझें",
    balancedSynthesis: "संतुलित संश्लेषण",
    synthesisIntro:
      "लग्न कुण्डली की बाहरी दिशा बताता है, जबकि चन्द्र और उसका नक्षत्र आदत व प्रतिक्रिया पर पारंपरिक दृष्टि जोड़ते हैं। उनके मेल और तनाव को चिंतन का संकेत मानें—मापा हुआ व्यक्तित्व-तथ्य नहीं।",
    constructivePossibilities: "रचनात्मक सम्भावनाएँ",
    cautions: "जाँचने योग्य विपरीत प्रवृत्तियाँ",
    birthNakshatra: "जन्म नक्षत्र",
    reflectionNotVerdict:
      "नक्षत्र-चित्र एक पारंपरिक प्रतीकात्मक परत है। यह मनोवैज्ञानिक मापन या चरित्र का अंतिम निर्णय नहीं।",
    planetaryPositions: "ग्रह-स्थितियाँ",
    positionsIntro:
      "पूर्ण-राशि भावों में लाहिरी-शैली निरयन देशांतर। अंक गणना हैं; व्याख्यात्मक अर्थ उनसे अलग हैं।",
    graha: "ग्रह",
    rasi: "राशि",
    degree: "अंश",
    nakshatra: "नक्षत्र",
    lord: "स्वामी",
    motion: "गति",
    direct: "मार्गी",
    retrograde: "वक्री",
    stationary: "स्थिर",
    boundaryNote:
      "राशि, नक्षत्र या पाद की सीमा के पास स्थिति दूसरी अयनांश-पद्धति या छोटे इनपुट/मॉडल अंतर से बदल सकती है। स्थिरता के पास गति भी संवेदनशील है।",
    houseByHouse: "भाव-दर-भाव विश्लेषण",
    housesIntro:
      "हर भाव के लिए एक कार्ड: वह क्या दर्शाता है, कहाँ सहज खिलता है और किस बात का ध्यान रखें। कोई अकेली स्थिति अंतिम निर्णय नहीं है।",
    houseSignificance: "यह भाव क्या दर्शाता है",
    yourChart: "आपकी जन्म-कुंडली",
    readingSequence: "पढ़ने का क्रम",
    houseTopic: "भाव-विषय",
    signContext: "राशि-सन्दर्भ",
    houseLord: "भावेश",
    residentGrahas: "स्थित ग्रह",
    bhavaFoundation: "भाव का आधार",
    domain: "पारंपरिक क्षेत्र",
    constructive: "रचनात्मक रूप",
    watchFor: "सावधानी",
    rasiContext: "राशि-सन्दर्भ",
    rasiContextBody:
      "यह राशि भाव को पारंपरिक शैली या परिस्थिति देती है। ऐप पूरे भाव—या व्यक्ति—को इस एक लेबल तक सीमित नहीं करता।",
    lordPathway: "भावेश का मार्ग",
    lordPathwayBody:
      "इस भाव में यह राशि होने से उसका स्वामी भावेश बनता है। स्वामी का जन्म-भाव दोनों विषयों को प्रतीकात्मक रूप से जोड़ता है; यह घटना की भविष्यवाणी नहीं।",
    noGrahas: "कोई निवासी ग्रह नहीं",
    emptyHouseTitle: "खाली भाव अनुपस्थित नहीं होता",
    emptyHouseBody:
      "निवासी ग्रह न होने पर राशि, भावेश और काल पर अधिक ध्यान दिया जाता है। खाली होने का अर्थ अपने-आप निर्बल या निष्क्रिय नहीं।",
    residentTitle: "स्थित ग्रह: शैक्षिक संश्लेषण",
    reflection: "चिंतन प्रश्न",
    highlightHouse: "कुण्डली में यह भाव दिखाएँ",
    mansionsTitle: "27 नक्षत्र",
    mansionsIntro:
      "प्रत्येक 13°20′ का निरयन खण्ड है और उसमें चार पाद हैं। नीचे ग्रह-स्थिति गणना है; प्रतीकात्मक चित्र पारंपरिक हैं।",
    birthMoon: "जन्म चन्द्र",
    occupiedBy: "स्थित ग्रह",
    notOccupied: "इस खण्ड में कोई जन्म-ग्रह नहीं",
    timelineTitle: "विंशोत्तरी दशा-कालरेखा",
    timelineIntro:
      "जन्म नक्षत्र में चन्द्र की गणना की गई प्रगति से निर्धारण। तिथियाँ घोषित 365.25-दिन-वर्ष परंपरा का उपयोग करती हैं।",
    majorMeaningTitle: "महादशा · बड़ा अध्याय",
    majorMeaningBody:
      "महादशा-स्वामी दीर्घ प्रतीकात्मक सन्दर्भ देता है। उसकी जन्म-राशि और भाव विषय का आधार दिखाते हैं; वे घटना निश्चित नहीं करते।",
    minorMeaningTitle: "अन्तर्दशा · सक्रिय माध्यम",
    minorMeaningBody:
      "अन्तर्दशा-स्वामी बड़े काल के भीतर निकटतर प्रतीकात्मक माध्यम बताता है। दोनों ग्रहों के रचनात्मक और कठिन रूप साथ पढ़ें।",
    currentPeriod: "वर्तमान विंशोत्तरी काल",
    asOf: "इस तिथि पर",
    remaining: "शेष",
    major: "महादशा",
    minor: "अन्तर्दशा",
    natalAnchors: "जन्म-कुण्डली आधार",
    largerContext: "महादशा सन्दर्भ",
    activeChannel: "अन्तर्दशा केंद्र",
    combinationCaution: "यह संश्लेषण किसी विशेष घटना को निश्चित नहीं करता।",
    birthMahadasha: "जन्म की महादशा",
    moonProgress: "चन्द्र की नक्षत्र-प्रगति",
    birthBalance: "जन्म पर शेष",
    years: "वर्ष",
    cycleTitle: "सन्दर्भ तिथि वाला महादशा-चक्र",
    starts: "आरम्भ",
    ends: "समाप्ति",
    status: "स्थिति",
    current: "वर्तमान",
    atBirth: "जन्म पर",
    antardashaList: "वर्तमान महादशा की अन्तर्दशाएँ",
    methodNote:
      "दशा पारंपरिक प्रतीकात्मक काल-पद्धति है—संभाव्यता, निदान या वादा नहीं। दूसरी परंपरा में तिथियाँ बदल सकती हैं।",
    tabPanel: "विश्लेषण",
  },
  mr: {
    analysis: "ज्योतिष विश्लेषण",
    sections: "विश्लेषण विभाग",
    views: "ज्योतिष विश्लेषण दृश्ये",
    overview: "सारांश",
    positions: "स्थिती",
    houses: "भाव",
    nakshatras: "नक्षत्रे",
    dashas: "दशा",
    horoscope: "गोचर",
    assistant: "AI ज्योतिषी",
    guide: "ज्योतिष शिका",
    method: "पद्धत व मर्यादा",
    coreSynthesis: "मूल संश्लेषण",
    rising: "उदय",
    moon: "चंद्र",
    lagna: "लग्न",
    padaShort: "पाद ",
    house: "भाव",
    symbolicReading: "पारंपरिक प्रतीकात्मक वाचन",
    computedPlacement: "मोजलेली स्थिती",
    learnTerms: "संज्ञा समजा",
    balancedSynthesis: "संतुलित संश्लेषण",
    synthesisIntro:
      "लग्न कुंडलीची बाह्य दिशा दर्शवते, तर चंद्र व त्याचे नक्षत्र सवय आणि प्रतिसादावर पारंपरिक दृष्टी जोडतात. त्यांतील मेळ व ताण चिंतनासाठी वापरा—मोजलेले व्यक्तिमत्त्व-तथ्य म्हणून नाही.",
    constructivePossibilities: "रचनात्मक शक्यता",
    cautions: "तपासण्यासारखे प्रतिरूप",
    birthNakshatra: "जन्म नक्षत्र",
    reflectionNotVerdict:
      "नक्षत्र-प्रतिमा हा पारंपरिक प्रतीकात्मक स्तर आहे. ते मानसशास्त्रीय मापन किंवा स्वभावाचा अंतिम निकाल नाही.",
    planetaryPositions: "ग्रहस्थिती",
    positionsIntro:
      "पूर्ण-राशी भावांतील लाहिरी-शैली निरयन रेखांश. अंक गणना आहेत; अर्थनिर्णय वेगळा आहे.",
    graha: "ग्रह",
    rasi: "राशी",
    degree: "अंश",
    nakshatra: "नक्षत्र",
    lord: "स्वामी",
    motion: "गती",
    direct: "मार्गी",
    retrograde: "वक्री",
    stationary: "स्थिर",
    boundaryNote:
      "राशी, नक्षत्र किंवा पादाच्या सीमेजवळील स्थिती दुसऱ्या अयनांशामुळे किंवा छोट्या इनपुट/मॉडेल फरकामुळे बदलू शकते. स्थिरतेजवळील गतीही संवेदनशील असते.",
    houseByHouse: "भावनिहाय विश्लेषण",
    housesIntro:
      "प्रत्येक भावासाठी एक कार्ड: तो काय दर्शवतो, कुठे सहज फुलतो आणि कशाकडे लक्ष द्यायचे. एकही स्थिती अंतिम निर्णय नसते.",
    houseSignificance: "हा भाव काय दर्शवतो",
    yourChart: "तुमची जन्मकुंडली",
    readingSequence: "वाचनक्रम",
    houseTopic: "भावविषय",
    signContext: "राशीसंदर्भ",
    houseLord: "भावेश",
    residentGrahas: "स्थित ग्रह",
    bhavaFoundation: "भावाचा पाया",
    domain: "पारंपरिक क्षेत्र",
    constructive: "रचनात्मक रूप",
    watchFor: "सावधानता",
    rasiContext: "राशीसंदर्भ",
    rasiContextBody:
      "ही राशी भावाला पारंपरिक शैली किंवा परिस्थिती देते. अ‍ॅप संपूर्ण भाव—किंवा व्यक्ती—या एका लेबलपुरता मर्यादित करत नाही.",
    lordPathway: "भावेशाचा मार्ग",
    lordPathwayBody:
      "या भावात ही राशी असल्याने तिचा स्वामी भावेश होतो. स्वामीचा जन्मभाव दोन्ही विषय प्रतीकात्मकरीत्या जोडतो; हे घटनेचे भाकीत नाही.",
    noGrahas: "निवासी ग्रह नाही",
    emptyHouseTitle: "रिकामा भाव अनुपस्थित नसतो",
    emptyHouseBody:
      "निवासी ग्रह नसल्यास राशी, भावेश आणि काल यांना अधिक महत्त्व दिले जाते. रिकामा म्हणजे आपोआप दुर्बल किंवा निष्क्रिय नव्हे.",
    residentTitle: "स्थित ग्रह: शैक्षणिक संश्लेषण",
    reflection: "चिंतन प्रश्न",
    highlightHouse: "कुंडलीत हा भाव दाखवा",
    mansionsTitle: "27 नक्षत्रे",
    mansionsIntro:
      "प्रत्येक 13°20′ चा निरयन विभाग असून त्यात चार पाद आहेत. खालील ग्रहस्थिती मोजलेली आहे; प्रतीकात्मक प्रतिमा पारंपरिक आहेत.",
    birthMoon: "जन्म चंद्र",
    occupiedBy: "स्थित ग्रह",
    notOccupied: "या विभागात जन्मग्रह नाही",
    timelineTitle: "विंशोत्तरी दशा कालरेषा",
    timelineIntro:
      "जन्म नक्षत्रातील चंद्राच्या मोजलेल्या प्रगतीवरून गणना. तारखांसाठी जाहीर 365.25-दिवस-वर्ष परंपरा वापरली आहे.",
    majorMeaningTitle: "महादशा · मोठा अध्याय",
    majorMeaningBody:
      "महादशास्वामी दीर्घ प्रतीकात्मक संदर्भ देतो. त्याची जन्मराशी व भाव विषयाचा आधार दाखवतात; घटना निश्चित करत नाहीत.",
    minorMeaningTitle: "अंतर्दशा · सक्रिय माध्यम",
    minorMeaningBody:
      "अंतर्दशास्वामी मोठ्या कालखंडातील जवळचे प्रतीकात्मक माध्यम दाखवतो. दोन्ही ग्रहांचे रचनात्मक आणि कठीण रूप एकत्र वाचा.",
    currentPeriod: "सध्याचा विंशोत्तरी काल",
    asOf: "या तारखेस",
    remaining: "शिल्लक",
    major: "महादशा",
    minor: "अंतर्दशा",
    natalAnchors: "जन्मकुंडली आधार",
    largerContext: "महादशा संदर्भ",
    activeChannel: "अंतर्दशा केंद्र",
    combinationCaution: "या संश्लेषणातून कोणतीही विशिष्ट घटना निश्चित होत नाही.",
    birthMahadasha: "जन्माची महादशा",
    moonProgress: "चंद्राची नक्षत्र-प्रगती",
    birthBalance: "जन्मवेळी शिल्लक",
    years: "वर्षे",
    cycleTitle: "संदर्भ तारीख असलेले महादशा-चक्र",
    starts: "आरंभ",
    ends: "समाप्ती",
    status: "स्थिती",
    current: "सध्याची",
    atBirth: "जन्मावेळी",
    antardashaList: "सध्याच्या महादशेतील अंतर्दशा",
    methodNote:
      "दशा ही पारंपरिक प्रतीकात्मक कालपद्धत आहे—संभाव्यता, निदान किंवा हमी नाही. दुसऱ्या परंपरेत तारखा बदलू शकतात.",
    tabPanel: "विश्लेषण",
  },
  de: {
    analysis: "Analyse der vedischen Astrologie",
    sections: "Analysebereiche",
    views: "Analyseansichten der vedischen Astrologie",
    overview: "Überblick",
    positions: "Positionen",
    houses: "Häuser",
    nakshatras: "Mondstationen",
    dashas: "Planetenperioden",
    horoscope: "Transite",
    assistant: "KI-Astrologe",
    guide: "Vedische Astrologie verstehen",
    method: "Methode & Grenzen",
    coreSynthesis: "Kernsynthese",
    rising: "aufsteigend",
    moon: "Mond",
    lagna: "Aszendent",
    padaShort: "V",
    house: "Haus",
    symbolicReading: "Traditionelle symbolische Deutung",
    computedPlacement: "Berechnete Position",
    learnTerms: "Begriffe kennenlernen",
    balancedSynthesis: "Ausgewogene Synthese",
    synthesisIntro:
      "Der Aszendent beschreibt die äußere Ausrichtung des Horoskops. Der Mond und seine Mondstation ergänzen eine traditionelle Perspektive auf Gewohnheiten und Reaktionen. Übereinstimmungen und Spannungen sind Anregungen zur Reflexion, keine gemessenen Tatsachen über die Persönlichkeit.",
    constructivePossibilities: "Konstruktive Möglichkeiten",
    cautions: "Gegenmuster kritisch prüfen",
    birthNakshatra: "Mondstation bei der Geburt",
    reflectionNotVerdict:
      "Die Bildsprache der Mondstationen ist eine traditionelle symbolische Ebene. Sie ist weder eine psychologische Messung noch ein Urteil über den Charakter.",
    planetaryPositions: "Positionen der Himmelskörper",
    positionsIntro:
      "Siderische Längen nach Lahiri-Art in Ganzzeichenhäusern. Die Werte sind Berechnungen; ihre interpretativen Bedeutungen sind davon zu unterscheiden.",
    graha: "Himmelskörper",
    rasi: "Tierkreiszeichen",
    degree: "Grad",
    nakshatra: "Mondstation",
    lord: "Herrscher",
    motion: "Bewegung",
    direct: "Direktläufig",
    retrograde: "Rückläufig",
    stationary: "Stationär",
    boundaryNote:
      "Eine Position nahe einer Grenze von Tierkreiszeichen, Mondstation oder Viertel kann sich bei einem anderen Ayanamsa oder kleinen Unterschieden in Eingabe und Modell ändern. Auch eine nahezu stationäre Bewegung ist empfindlich.",
    houseByHouse: "Haus-für-Haus-Analyse",
    housesIntro:
      "Eine Karte pro Haus: wofür es steht, wo es sich gut entfaltet und worauf zu achten ist. Keine einzelne Stellung ist ein Urteil.",
    houseSignificance: "Wofür dieses Haus steht",
    yourChart: "Dein Geburtshoroskop",
    readingSequence: "Lesereihenfolge",
    houseTopic: "Thema des Hauses",
    signContext: "Tierkreiszeichen-Kontext",
    houseLord: "Hausherrscher",
    residentGrahas: "Himmelskörper im Haus",
    bhavaFoundation: "Grundlage des Hauses",
    domain: "Traditioneller Lebensbereich",
    constructive: "Konstruktiver Ausdruck",
    watchFor: "Kritisch beachten",
    rasiContext: "Tierkreiszeichen-Kontext",
    rasiContextBody:
      "Dieses Tierkreiszeichen gibt dem Haus eine traditionelle Stil- oder Bedingungsebene. Die App reduziert weder das gesamte Haus noch die Person auf dieses einzelne Merkmal.",
    lordPathway: "Weg des Hausherrschers",
    lordPathwayBody:
      "Da dieses Tierkreiszeichen das Haus einnimmt, wird sein planetarer Herrscher zum Hausherrscher. Das Geburtshaus dieses Herrschers verbindet die beiden Themenbereiche symbolisch; daraus folgt keine Ereignisprognose.",
    noGrahas: "Kein Himmelskörper im Haus",
    emptyHouseTitle: "Ein unbesetztes Haus fehlt nicht",
    emptyHouseBody:
      "Ohne einen Himmelskörper im Haus stützt sich die Deutung stärker auf Tierkreiszeichen, Hausherrscher und zeitliche Modelle. Unbesetzt bedeutet nicht automatisch schwach oder inaktiv.",
    residentTitle: "Himmelskörper im Haus: didaktische Synthese",
    reflection: "Reflexionsfrage",
    highlightHouse: "Dieses Haus im Horoskop hervorheben",
    mansionsTitle: "Die 27 Mondstationen",
    mansionsIntro:
      "Jede Mondstation ist ein siderischer Abschnitt von 13°20′ mit vier Vierteln. Die Belegung unten ist berechnet; die zugehörige Bildsprache bleibt traditionell.",
    birthMoon: "Mond bei der Geburt",
    occupiedBy: "Besetzt durch",
    notOccupied: "Kein Himmelskörper der Geburtskarte in diesem Abschnitt",
    timelineTitle: "Zeitachse der Vimshottari-Perioden",
    timelineIntro:
      "Berechnet aus dem Fortschritt des Mondes durch seine Mondstation bei der Geburt. Die Datumswerte verwenden die offengelegte Konvention eines Jahres mit 365,25 Tagen.",
    majorMeaningTitle: "Hauptperiode · übergeordneter Abschnitt",
    majorMeaningBody:
      "Der Herrscher der Hauptperiode liefert einen langfristigen symbolischen Kontext. Sein Tierkreiszeichen und Haus bei der Geburt zeigen, wo die Themen verankert werden; sie garantieren kein Ereignis.",
    minorMeaningTitle: "Unterperiode · aktiver Kanal",
    minorMeaningBody:
      "Der Herrscher der Unterperiode beschreibt innerhalb der Hauptperiode einen zeitlich näheren symbolischen Kanal. Beide Himmelskörper sollten gemeinsam und mit konstruktiven wie schwierigen Ausdrucksformen gelesen werden.",
    currentPeriod: "Aktueller Vimshottari-Zeitraum",
    asOf: "Stand",
    remaining: "verbleibend",
    major: "Hauptperiode",
    minor: "Unterperiode",
    natalAnchors: "Natale Bezugspunkte",
    largerContext: "Kontext der Hauptperiode",
    activeChannel: "Fokus der Unterperiode",
    combinationCaution:
      "Diese Synthese belegt nicht, dass ein bestimmtes Ereignis eintreten wird.",
    birthMahadasha: "Hauptperiode bei der Geburt",
    moonProgress: "Fortschritt des Mondes in der Mondstation",
    birthBalance: "Verbleibende Zeit bei der Geburt",
    years: "Jahre",
    cycleTitle: "Hauptperioden-Zyklus mit dem Referenzdatum",
    starts: "Beginn",
    ends: "Ende",
    status: "Status",
    current: "Aktuell",
    atBirth: "Bei der Geburt",
    antardashaList: "Unterperioden der aktuellen Hauptperiode",
    methodNote:
      "Vimshottari ist ein traditionelles symbolisches Zeitmodell, keine Wahrscheinlichkeit, Diagnose oder Zusage. Andere Konventionen können die Datumswerte verschieben.",
    tabPanel: "Analyse",
  },
};

const TAB_DEFINITIONS: readonly {
  id: AnalysisTab;
  labelKey: keyof Pick<
    AnalysisCopy,
    | "overview"
    | "positions"
    | "nakshatras"
    | "dashas"
    | "horoscope"
    | "assistant"
    | "guide"
    | "method"
  >;
  icon: typeof Compass;
}[] = [
  { id: "overview", labelKey: "overview", icon: Compass },
  { id: "positions", labelKey: "positions", icon: TableProperties },
  { id: "nakshatras", labelKey: "nakshatras", icon: MoonStar },
  { id: "dashas", labelKey: "dashas", icon: CalendarClock },
  { id: "horoscope", labelKey: "horoscope", icon: SunMedium },
  { id: "assistant", labelKey: "assistant", icon: Bot },
  { id: "guide", labelKey: "guide", icon: GraduationCap },
  { id: "method", labelKey: "method", icon: Scale },
];

function dateLabel(
  value: string | Date,
  timeZone: string,
  locale: AppLocale,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

function numberLabel(value: number, locale: AppLocale, digits = 2): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function remainingLabel(
  end: string,
  asOf: Date,
  locale: AppLocale,
  copy: AnalysisCopy,
): string {
  const years = Math.max(
    0,
    (Date.parse(end) - asOf.getTime()) / VIMSHOTTARI_YEAR_MS,
  );
  if (years >= 2) {
    return `${numberLabel(years, locale, 1)} ${copy.years} ${copy.remaining}`;
  }
  const months = years * 12;
  if (locale === "hi") {
    return months >= 2
      ? `${Math.floor(months)} माह ${copy.remaining}`
      : `${Math.ceil(months * 30.4375)} दिन ${copy.remaining}`;
  }
  if (locale === "mr") {
    return months >= 2
      ? `${Math.floor(months)} महिने ${copy.remaining}`
      : `${Math.ceil(months * 30.4375)} दिवस ${copy.remaining}`;
  }
  if (locale === "de") {
    const days = Math.ceil(months * 30.4375);
    return months >= 2
      ? `${Math.floor(months)} Monate ${copy.remaining}`
      : `${days} ${days === 1 ? "Tag" : "Tage"} ${copy.remaining}`;
  }
  return months >= 2
    ? `${Math.floor(months)} months ${copy.remaining}`
    : `${Math.ceil(months * 30.4375)} days ${copy.remaining}`;
}

function motionLabel(
  planet: GrahaPosition,
  locale: AppLocale,
  copy: AnalysisCopy,
): string {
  const base =
    planet.motion === "direct"
      ? copy.direct
      : planet.motion === "stationary"
        ? copy.stationary
        : copy.retrograde;
  if (planet.retrograde && planet.motion !== "retrograde") {
    return `${base} · ${copy.retrograde}`;
  }
  return base;
}

function PlacementCard({
  label,
  placement,
  locale,
  copy,
  house,
}: {
  label: string;
  placement: ZodiacPlacement;
  locale: AppLocale;
  copy: AnalysisCopy;
  house?: HouseNumber;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          {label}
        </p>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
          {copy.computedPlacement}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
        {getLocalizedRasiName(placement.sign.name, locale)}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {numberLabel(placement.sign.degreeDeg, locale)}° ·{" "}
        <AstroTerm term="nakshatra">
          {getLocalizedNakshatraName(placement.nakshatra.name, locale)}
        </AstroTerm>{" "}
        ·{" "}
        <AstroTerm term="pada">
          {copy.padaShort}
          {placement.nakshatra.pada}
        </AstroTerm>
      </p>
      {house ? (
        <p className="mt-2 text-xs text-[var(--accent)]">
          <AstroTerm term="bhava">
            {copy.house} {house}
          </AstroTerm>
        </p>
      ) : null}
    </article>
  );
}

function OverviewTab({
  chart,
  locale,
  copy,
}: {
  chart: VedicChart;
  locale: AppLocale;
  copy: AnalysisCopy;
}) {
  const sun = chart.planets.find((planet) => planet.id === "sun")!;
  const moon = chart.planets.find((planet) => planet.id === "moon")!;
  const moonProfile = GRAHA_EDUCATION.moon;
  const sunProfile = GRAHA_EDUCATION.sun;

  return (
    <section aria-labelledby="analysis-overview-title" className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
          {copy.coreSynthesis}
        </p>
        <h2
          id="analysis-overview-title"
          className="mt-2 text-2xl font-semibold text-[var(--foreground)]"
        >
          {getLocalizedRasiName(chart.ascendant.sign.name, locale)} {copy.rising}
          {" · "}
          {getLocalizedNakshatraName(moon.nakshatra.name, locale)} {copy.moon}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
          {copy.synthesisIntro}
        </p>
        <div
          className="mt-4 flex flex-wrap items-center gap-2"
          aria-label={copy.learnTerms}
        >
          <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {copy.learnTerms}
          </span>
          <AstroTerm term="lagna" variant="chip" />
          <AstroTerm term="rasi" variant="chip" />
          <AstroTerm term="nakshatra" variant="chip" />
          <AstroTerm term="pada" variant="chip" />
          <AstroTerm term="vimshottari" variant="chip" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <PlacementCard
          label={copy.lagna}
          placement={chart.ascendant}
          locale={locale}
          copy={copy}
        />
        <PlacementCard
          label={readLocalized(sunProfile.name, locale)}
          placement={sun}
          locale={locale}
          copy={copy}
          house={sun.house}
        />
        <PlacementCard
          label={readLocalized(moonProfile.name, locale)}
          placement={moon}
          locale={locale}
          copy={copy}
          house={moon.house}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Sparkles aria-hidden="true" className="size-4" />
            <h3 className="font-medium">{copy.balancedSynthesis}</h3>
          </div>
          {[sunProfile, moonProfile].map((profile) => (
            <div
              key={profile.id}
              className="mt-4 border-t border-[var(--border)] pt-4 first:mt-3 first:border-0 first:pt-0"
            >
              <p className="text-sm font-medium text-[var(--foreground)]">
                {readLocalized(profile.name, locale)}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {readLocalized(profile.signifies, locale)}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="text-xs leading-5 text-emerald-600 dark:text-emerald-200/75">
                  <strong>{copy.constructivePossibilities}:</strong>{" "}
                  {readLocalized(profile.constructive, locale)}
                </p>
                <p className="text-xs leading-5 text-rose-600 dark:text-rose-200/70">
                  <strong>{copy.cautions}:</strong>{" "}
                  {readLocalized(profile.caution, locale)}
                </p>
              </div>
            </div>
          ))}
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <MoonStar aria-hidden="true" className="size-4" />
            <h3 className="font-medium">
              {copy.birthNakshatra} ·{" "}
              {getLocalizedNakshatraName(moon.nakshatra.name, locale)}
            </h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {getGenericNakshatraReading(locale)}
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-xs min-[400px]:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">{copy.lord}</dt>
              <dd className="mt-1 text-[var(--foreground)]">
                {getLocalizedGrahaName(moon.nakshatra.lord, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">
                <AstroTerm term="pada" />
              </dt>
              <dd className="mt-1 text-[var(--foreground)]">
                {moon.nakshatra.pada}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.055] p-3 text-xs leading-5 text-[var(--muted)]">
            {copy.reflectionNotVerdict}
          </p>
        </article>
      </div>
    </section>
  );
}

function PositionsTab({
  chart,
  locale,
  copy,
  onSelectPlanet,
}: {
  chart: VedicChart;
  locale: AppLocale;
  copy: AnalysisCopy;
  onSelectPlanet?: (planet: GrahaId) => void;
}) {
  return (
    <section aria-labelledby="positions-title" className="space-y-4">
      <div>
        <h2
          id="positions-title"
          className="text-xl font-semibold text-[var(--foreground)]"
        >
          {copy.planetaryPositions}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{copy.positionsIntro}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="scroll-x-fade overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-[1] [&_td:first-child]:bg-[var(--surface)] [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-[1] [&_th:first-child]:bg-[var(--surface-soft)]">
            <thead className="bg-[var(--surface-soft)] text-xs uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">{copy.graha}</th>
                <th className="px-4 py-3 font-medium">{copy.rasi}</th>
                <th className="px-4 py-3 font-medium">{copy.degree}</th>
                <th className="px-4 py-3 font-medium">{copy.nakshatra}</th>
                <th className="px-4 py-3 font-medium">{copy.lord}</th>
                <th className="px-4 py-3 font-medium">{copy.house}</th>
                <th className="px-4 py-3 font-medium">{copy.motion}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {chart.planets.map((planet) => (
                <tr
                  key={planet.id}
                  className="text-[var(--muted)] transition hover:bg-[var(--surface-soft)]"
                >
                  <td className="px-4 py-3 font-medium">
                    {onSelectPlanet ? (
                      <button
                        type="button"
                        onClick={() => onSelectPlanet(planet.id)}
                        className="rounded text-[var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                      >
                        {getLocalizedGrahaName(planet.id, locale)}
                      </button>
                    ) : (
                      <span className="text-[var(--foreground)]">
                        {getLocalizedGrahaName(planet.id, locale)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getLocalizedRasiName(planet.sign.name, locale)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {numberLabel(planet.sign.degreeDeg, locale)}°
                  </td>
                  <td className="px-4 py-3">
                    {getLocalizedNakshatraName(planet.nakshatra.name, locale)} ·{" "}
                    {copy.padaShort}
                    {planet.nakshatra.pada}
                  </td>
                  <td className="px-4 py-3">
                    {getLocalizedGrahaName(planet.nakshatra.lord, locale)}
                  </td>
                  <td className="px-4 py-3">{planet.house}</td>
                  <td className="px-4 py-3">
                    {motionLabel(planet, locale, copy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">{copy.boundaryNote}</p>
    </section>
  );
}

function HouseCard({
  houseNumber,
  chart,
  locale,
  copy,
  bhavaSummary,
  onSelect,
}: {
  houseNumber: HouseNumber;
  chart: VedicChart;
  locale: AppLocale;
  copy: AnalysisCopy;
  bhavaSummary: KundaliBhavaRow;
  onSelect?: (house: HouseNumber) => void;
}) {
  const house = chart.houses.find((item) => item.number === houseNumber)!;
  const education = BHAVA_EDUCATION[house.number];
  const lordId = RASI_PROFILES[house.sign.name].ruler;
  const lord = chart.planets.find((planet) => planet.id === lordId)!;
  const residents = house.planets;

  return (
    <article
      data-house-number={house.number}
      aria-labelledby={`house-${house.number}-analysis-title`}
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-sm font-semibold text-[var(--accent)]">
          {house.number}
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id={`house-${house.number}-analysis-title`}
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            {readLocalized(education.name, locale)}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {getLocalizedRasiName(house.sign.name, locale)} · {copy.lord}:{" "}
            {getLocalizedGrahaName(lordId, locale)} → {copy.house} {lord.house}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {residents.length ? (
            residents.map((planetId) => (
              <span
                key={planetId}
                className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              >
                {getLocalizedGrahaName(planetId, locale)}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[var(--muted)]">
              {copy.noGrahas}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-3 p-4">
        <p className="text-sm leading-6 text-[var(--foreground)]">
          {bhavaSummary.significance}
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <p className="rounded-xl bg-emerald-500/[0.07] px-3 py-2.5 text-xs leading-5 text-[var(--muted)]">
            <strong className="block text-emerald-700 dark:text-emerald-300">
              {copy.constructive}
            </strong>
            {readLocalized(education.constructive, locale)}
          </p>
          <p className="rounded-xl bg-amber-500/[0.07] px-3 py-2.5 text-xs leading-5 text-[var(--muted)]">
            <strong className="block text-amber-700 dark:text-amber-300">
              {copy.watchFor}
            </strong>
            {readLocalized(education.caution, locale)}
          </p>
        </div>

        {residents.length ? (
          <ul className="space-y-2">
            {residents.map((planetId) => (
              <li
                key={planetId}
                className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-xs leading-5"
              >
                <strong className="text-[var(--foreground)]">
                  {getLocalizedGrahaName(planetId, locale)}
                </strong>
                <span className="text-[var(--muted)]">
                  {" · "}
                  {readLocalized(GRAHA_EDUCATION[planetId].signifies, locale)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(house.number)}
            className="min-h-9 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
          >
            {copy.highlightHouse}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function HousesTab({
  chart,
  locale,
  copy,
  onSelectHouse,
}: {
  chart: VedicChart;
  locale: AppLocale;
  copy: AnalysisCopy;
  onSelectHouse?: (house: HouseNumber) => void;
}) {
  const bhavaSummaries = useMemo(
    () => buildLocalizedBhavaRows(chart, locale),
    [chart, locale],
  );

  return (
    <section aria-labelledby="houses-title" className="space-y-4">
      <div>
        <h2
          id="houses-title"
          className="text-xl font-semibold text-[var(--foreground)]"
        >
          {copy.houseByHouse}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          {copy.housesIntro}
        </p>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {chart.houses.map((house) => (
          <HouseCard
            key={house.number}
            houseNumber={house.number}
            chart={chart}
            locale={locale}
            copy={copy}
            bhavaSummary={bhavaSummaries[house.number - 1]}
            onSelect={onSelectHouse}
          />
        ))}
      </div>
    </section>
  );
}

export interface TwelveHouseSummaryProps {
  chart: VedicChart;
  onSelectHouse?: (house: HouseNumber) => void;
}

/**
 * The complete natal house reading shown before the interactive workspaces.
 * Cards are deliberately non-collapsible so no interpretation is hidden
 * behind twelve separate disclosure controls.
 */
export function TwelveHouseSummary({
  chart,
  onSelectHouse,
}: TwelveHouseSummaryProps) {
  const { locale } = useAppPreferences();
  return (
    <HousesTab
      chart={chart}
      locale={locale}
      copy={COPY[locale]}
      onSelectHouse={onSelectHouse}
    />
  );
}

function NakshatrasTab({
  chart,
  locale,
  copy,
}: {
  chart: VedicChart;
  locale: AppLocale;
  copy: AnalysisCopy;
}) {
  const occupied = useMemo(() => {
    const map = new Map<NakshatraName, GrahaId[]>();
    for (const planet of chart.planets) {
      const residents = map.get(planet.nakshatra.name) ?? [];
      residents.push(planet.id);
      map.set(planet.nakshatra.name, residents);
    }
    return map;
  }, [chart]);
  const moon = chart.planets.find((planet) => planet.id === "moon")!;

  return (
    <section aria-labelledby="nakshatras-title" className="space-y-4">
      <div>
        <h2
          id="nakshatras-title"
          className="text-xl font-semibold text-[var(--foreground)]"
        >
          {copy.mansionsTitle}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          {copy.mansionsIntro}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {NAKSHATRAS.map((name, index) => {
          const residents = occupied.get(name) ?? [];
          const isBirth = name === moon.nakshatra.name;
          return (
            <article
              key={name}
              className={`rounded-2xl border p-4 ${
                isBirth
                  ? "border-sky-500/35 bg-sky-500/[0.075]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-medium text-[var(--foreground)]">
                    {getLocalizedNakshatraName(name, locale)}
                  </h3>
                </div>
                {isBirth ? (
                  <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[11px] text-sky-700 dark:text-sky-200">
                    {copy.birthMoon}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                {residents.length
                  ? `${copy.occupiedBy}: ${residents
                      .map((id) => getLocalizedGrahaName(id, locale))
                      .join(" · ")}`
                  : copy.notOccupied}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function dashaSynthesis(
  major: GrahaId,
  minor: GrahaId,
  locale: AppLocale,
) {
  const majorProfile = GRAHA_EDUCATION[major];
  const minorProfile = GRAHA_EDUCATION[minor];
  const majorName = readLocalized(majorProfile.name, locale);
  const minorName = readLocalized(minorProfile.name, locale);
  if (locale === "hi") {
    return {
      summary: `${majorName} का दीर्घ विषय—${readLocalized(majorProfile.signifies, locale)}—${minorName} के सक्रिय माध्यम—${readLocalized(minorProfile.signifies, locale)}—से व्यक्त हो सकता है। यह दो प्रतीकात्मक कार्यों का संवाद है, घटना की भविष्यवाणी नहीं।`,
      constructive: `${readLocalized(majorProfile.constructive, locale)} को ${readLocalized(minorProfile.constructive, locale)} के साथ साधना रचनात्मक दिशा हो सकती है।`,
      caution: `${readLocalized(majorProfile.caution, locale)} और ${readLocalized(minorProfile.caution, locale)}—दोनों को बिना भय या निश्चित लेबल के जाँचें।`,
      inquiry: readLocalized(minorProfile.inquiry, locale),
    };
  }
  if (locale === "mr") {
    return {
      summary: `${majorName}चा दीर्घ विषय—${readLocalized(majorProfile.signifies, locale)}—${minorName}च्या सक्रिय माध्यमातून—${readLocalized(minorProfile.signifies, locale)}—व्यक्त होऊ शकतो. हा दोन प्रतीकात्मक कार्यांचा संवाद आहे; घटनेचे भाकीत नाही.`,
      constructive: `${readLocalized(majorProfile.constructive, locale)} याला ${readLocalized(minorProfile.constructive, locale)}सोबत साधणे ही रचनात्मक दिशा ठरू शकते.`,
      caution: `${readLocalized(majorProfile.caution, locale)} आणि ${readLocalized(minorProfile.caution, locale)}—दोन्ही भीती किंवा निश्चित लेबल न लावता तपासा.`,
      inquiry: readLocalized(minorProfile.inquiry, locale),
    };
  }
  if (locale === "de") {
    return {
      summary: `${majorName}s langfristiges Thema – ${readLocalized(majorProfile.signifies, locale)} – kann sich durch den aktiven Kanal von ${minorName} – ${readLocalized(minorProfile.signifies, locale)} – ausdrücken. Dies beschreibt das Zusammenspiel zweier symbolischer Funktionen, keine Ereignisprognose.`,
      constructive: `Eine mögliche konstruktive Richtung verbindet ${readLocalized(majorProfile.constructive, locale)} mit ${readLocalized(minorProfile.constructive, locale)}.`,
      caution: `Prüfe sowohl ${readLocalized(majorProfile.caution, locale)} als auch ${readLocalized(minorProfile.caution, locale)} ohne Angst oder starre Zuschreibung.`,
      inquiry: readLocalized(minorProfile.inquiry, locale),
    };
  }
  return {
    summary: `${majorName}'s longer theme—${readLocalized(majorProfile.signifies, locale)}—may be expressed through ${minorName}'s active channel of ${readLocalized(minorProfile.signifies, locale)}. This is a dialogue between two symbolic functions, not an event prediction.`,
    constructive: `A constructive direction combines ${readLocalized(majorProfile.constructive, locale)} with ${readLocalized(minorProfile.constructive, locale)}.`,
    caution: `Examine both ${readLocalized(majorProfile.caution, locale)} and ${readLocalized(minorProfile.caution, locale)} without fear or a fixed label.`,
    inquiry: readLocalized(minorProfile.inquiry, locale),
  };
}

function CurrentDashaCard({
  major,
  chart,
  asOf,
  timeZone,
  locale,
  copy,
}: {
  major: MahadashaPeriod;
  chart: VedicChart;
  asOf: Date;
  timeZone: string;
  locale: AppLocale;
  copy: AnalysisCopy;
}) {
  const minor = major.antardashas.find((period) => period.isCurrent)!;
  const meaning = dashaSynthesis(major.lord, minor.lord, locale);
  const majorPlacement = chart.planets.find(
    (planet) => planet.id === major.lord,
  )!;
  const minorPlacement = chart.planets.find(
    (planet) => planet.id === minor.lord,
  )!;

  return (
    <article className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.055] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300/80">
            {copy.currentPeriod}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            {copy.asOf} {dateLabel(asOf, timeZone, locale)} · {timeZone}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {getLocalizedGrahaName(major.lord, locale)} ·{" "}
            {getLocalizedGrahaName(minor.lord, locale)}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            <AstroTerm term="mahadasha">{copy.major}</AstroTerm> ·{" "}
            <AstroTerm term="antardasha">{copy.minor}</AstroTerm>
          </p>
        </div>
        <span className="rounded-full border border-amber-500/20 px-3 py-1.5 text-xs text-[var(--foreground)]">
          {remainingLabel(minor.end, asOf, locale, copy)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-[var(--muted)] sm:grid-cols-2">
        <p>
          {copy.major}: {dateLabel(major.start, timeZone, locale)} –{" "}
          {dateLabel(major.end, timeZone, locale)}
        </p>
        <p>
          {copy.minor}: {dateLabel(minor.start, timeZone, locale)} –{" "}
          {dateLabel(minor.end, timeZone, locale)}
        </p>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        <strong>{copy.natalAnchors}:</strong>{" "}
        {getLocalizedGrahaName(major.lord, locale)} ·{" "}
        {getLocalizedRasiName(majorPlacement.sign.name, locale)} · {copy.house}{" "}
        {majorPlacement.house}; {getLocalizedGrahaName(minor.lord, locale)} ·{" "}
        {getLocalizedRasiName(minorPlacement.sign.name, locale)} · {copy.house}{" "}
        {minorPlacement.house}.
      </p>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm leading-6 text-[var(--muted)]">{meaning.summary}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <p className="text-xs leading-5 text-emerald-600 dark:text-emerald-200/75">
            <strong>{copy.constructive}:</strong> {meaning.constructive}
          </p>
          <p className="text-xs leading-5 text-rose-600 dark:text-rose-200/70">
            <strong>{copy.watchFor}:</strong> {meaning.caution}
          </p>
        </div>
      </div>
    </article>
  );
}

function DashasTab({
  chart,
  birthInstant,
  asOf,
  timeZone,
  locale,
  copy,
}: {
  chart: VedicChart;
  birthInstant: Date;
  asOf: Date;
  timeZone: string;
  locale: AppLocale;
  copy: AnalysisCopy;
}) {
  const dashas = analyzeVedicChart(chart, birthInstant, asOf).dashas;

  return (
    <section aria-labelledby="dashas-title" className="space-y-5">
      <div>
        <h2
          id="dashas-title"
          className="text-xl font-semibold text-[var(--foreground)]"
        >
          {copy.timelineTitle}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          {copy.timelineIntro}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-violet-500/20 bg-violet-500/[0.045] p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            <AstroTerm term="mahadasha">{copy.majorMeaningTitle}</AstroTerm>
          </h3>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            {copy.majorMeaningBody}
          </p>
        </article>
        <article className="rounded-xl border border-sky-500/20 bg-sky-500/[0.045] p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            <AstroTerm term="antardasha">{copy.minorMeaningTitle}</AstroTerm>
          </h3>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            {copy.minorMeaningBody}
          </p>
        </article>
      </div>

      <CurrentDashaCard
        major={dashas.currentMahadasha}
        chart={chart}
        asOf={asOf}
        timeZone={timeZone}
        locale={locale}
        copy={copy}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs text-[var(--muted)]">{copy.birthMahadasha}</p>
          <p className="mt-1 font-medium text-[var(--foreground)]">
            {getLocalizedGrahaName(dashas.birthMahadashaLord, locale)}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs text-[var(--muted)]">{copy.moonProgress}</p>
          <p className="mt-1 font-medium text-[var(--foreground)]">
            {numberLabel(dashas.moonNakshatraProgress * 100, locale)}%
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs text-[var(--muted)]">{copy.birthBalance}</p>
          <p className="mt-1 font-medium text-[var(--foreground)]">
            {numberLabel(dashas.birthMahadashaBalanceYears, locale)} {copy.years}
          </p>
        </article>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <ListTree aria-hidden="true" className="size-4 text-[var(--accent)]" />
          <h3 className="font-medium text-[var(--foreground)]">
            {copy.cycleTitle}
          </h3>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="scroll-x-fade overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-sm [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-[1] [&_td:first-child]:bg-[var(--surface)] [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-[1] [&_th:first-child]:bg-[var(--surface-soft)]">
              <thead className="bg-[var(--surface-soft)] text-xs uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{copy.lord}</th>
                  <th className="px-4 py-3 font-medium">{copy.starts}</th>
                  <th className="px-4 py-3 font-medium">{copy.ends}</th>
                  <th className="px-4 py-3 font-medium">{copy.years}</th>
                  <th className="px-4 py-3 font-medium">{copy.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {dashas.mahadashas.map((period) => (
                  <tr
                    key={`${period.lord}-${period.start}`}
                    className={
                      period.isCurrent
                        ? "bg-violet-500/[0.075] text-[var(--foreground)]"
                        : "text-[var(--muted)]"
                    }
                  >
                    <td className="px-4 py-3 font-medium">
                      {getLocalizedGrahaName(period.lord, locale)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {dateLabel(period.start, timeZone, locale)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {dateLabel(period.end, timeZone, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {numberLabel(period.durationYears, locale, 0)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {period.isCurrent
                        ? copy.current
                        : period.containsBirth
                          ? copy.atBirth
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock
            aria-hidden="true"
            className="size-4 text-amber-600 dark:text-amber-300"
          />
          <h3 className="font-medium text-[var(--foreground)]">
            {copy.antardashaList}
          </h3>
        </div>
        <div className="grid items-start gap-2 lg:grid-cols-2">
          {dashas.currentMahadasha.antardashas.map((period) => {
            const meaning = dashaSynthesis(
              dashas.currentMahadasha.lord,
              period.lord,
              locale,
            );
            return (
              <details
                key={`${period.lord}-${period.start}`}
                className={`group rounded-xl border ${
                  period.isCurrent
                    ? "border-amber-500/30 bg-amber-500/[0.065]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-[var(--foreground)]">
                        {getLocalizedGrahaName(
                          dashas.currentMahadasha.lord,
                          locale,
                        )}{" "}
                        · {getLocalizedGrahaName(period.lord, locale)}
                      </h4>
                      {period.isCurrent ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-200">
                          {copy.current}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {dateLabel(period.start, timeZone, locale)} –{" "}
                      {dateLabel(period.end, timeZone, locale)}
                    </p>
                  </div>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-[var(--muted)] transition group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-[var(--border)] p-4">
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    {meaning.summary}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        {copy.largerContext}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                        {readLocalized(
                          GRAHA_EDUCATION[dashas.currentMahadasha.lord]
                            .signifies,
                          locale,
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300/80">
                        {copy.activeChannel}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                        {readLocalized(
                          GRAHA_EDUCATION[period.lord].signifies,
                          locale,
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-emerald-600 dark:text-emerald-200/75">
                    <strong>{copy.constructive}:</strong>{" "}
                    {meaning.constructive}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-rose-600 dark:text-rose-200/70">
                    <strong>{copy.watchFor}:</strong> {meaning.caution}
                  </p>
                  <p className="mt-3 rounded-lg border border-violet-500/15 bg-violet-500/[0.045] p-3 text-xs leading-5 text-[var(--muted)]">
                    <strong>{copy.reflection}:</strong> {meaning.inquiry}
                  </p>
                  <p className="mt-3 text-[10px] leading-4 text-[var(--muted)]">
                    {copy.combinationCaution}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <p className="text-xs leading-5 text-[var(--muted)]">{copy.methodNote}</p>
    </section>
  );
}

export default function InterpretationPanel(props: InterpretationPanelProps) {
  const { locale } = useAppPreferences();
  const copy = COPY[locale];
  const [activeTab, setActiveTab] = useState<AnalysisTab>(
    props.initialTab ?? "overview",
  );
  const [transitSelection, setTransitSelection] = useState<{
    chartInstant: string;
    instant: Date;
  } | null>(null);
  const transitReference =
    transitSelection?.chartInstant === props.chart.instant
      ? transitSelection.instant
      : props.asOf;
  const transits = useMemo(
    () =>
      calculateTransitAnalysis({
        natalChart: props.chart,
        asOf: transitReference,
      }),
    [props.chart, transitReference],
  );
  const activeDefinition = TAB_DEFINITIONS.find(
    (tab) => tab.id === activeTab,
  )!;
  const tabSetId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabStripRef = useRef<HTMLElement | null>(null);

  // On a phone only two or three of the eight tabs fit, so keep the active
  // one centred in the strip. Only the strip scrolls; scrollIntoView is
  // avoided because it could also move the page vertically.
  useEffect(() => {
    const strip = tabStripRef.current;
    const index = TAB_DEFINITIONS.findIndex((tab) => tab.id === activeTab);
    const button = tabRefs.current[index];
    if (!strip || !button || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({
      left: button.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeTab]);

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % TAB_DEFINITIONS.length;
    }
    if (event.key === "ArrowLeft") {
      nextIndex =
        (index - 1 + TAB_DEFINITIONS.length) % TAB_DEFINITIONS.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TAB_DEFINITIONS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    setActiveTab(TAB_DEFINITIONS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <BookOpen aria-hidden="true" className="size-4" />
            <span className="text-xs font-medium uppercase tracking-[0.22em]">
              {copy.analysis}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {props.request.person.fullName}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {props.request.location.label}
            {props.request.birth.localDate
              ? ` · ${props.request.birth.localDate}`
              : ""}
            {props.request.birth.localTime
              ? ` · ${props.request.birth.localTime}`
              : ""}
          </p>
        </div>
        {props.request.birth.timeZone ? (
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs text-[var(--muted)]">
            {props.request.birth.utcOffset
              ? `${props.request.birth.utcOffset} · `
              : ""}
            {props.request.birth.timeZone}
          </span>
        ) : null}
      </header>

      <nav
        ref={tabStripRef}
        aria-label={copy.sections}
        className="scroll-x-fade overflow-x-auto border-b border-[var(--border)]"
      >
        <div
          role="tablist"
          aria-label={copy.views}
          className="flex min-w-max gap-1"
        >
          {TAB_DEFINITIONS.map((tab, index) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`${tabSetId}-${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${tabSetId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${
                  selected
                    ? "border-[var(--accent)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {copy[tab.labelKey]}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        id={`${tabSetId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabSetId}-${activeTab}-tab`}
        aria-label={`${copy[activeDefinition.labelKey]} · ${copy.tabPanel}`}
        tabIndex={0}
      >
        {activeTab === "overview" ? (
          <OverviewTab chart={props.chart} locale={locale} copy={copy} />
        ) : null}
        {activeTab === "positions" ? (
          <PositionsTab
            chart={props.chart}
            locale={locale}
            copy={copy}
            onSelectPlanet={props.onSelectPlanet}
          />
        ) : null}
        {activeTab === "nakshatras" ? (
          <NakshatrasTab chart={props.chart} locale={locale} copy={copy} />
        ) : null}
        {activeTab === "dashas" ? (
          <DashasTab
            chart={props.chart}
            birthInstant={props.request.birth.instant}
            asOf={props.asOf}
            timeZone={props.request.birth.timeZone ?? "UTC"}
            locale={locale}
            copy={copy}
          />
        ) : null}
        {activeTab === "horoscope" ? (
          <HoroscopeTab
            natalChart={props.chart}
            referenceDate={transitReference}
            onReferenceDateChange={(instant) =>
              setTransitSelection({
                chartInstant: props.chart.instant,
                instant,
              })
            }
          />
        ) : null}
        {activeTab === "assistant" ? (
          <AiAstrologerTab
            chart={props.chart}
            request={props.request}
            asOf={transitReference}
            transits={transits}
          />
        ) : null}
        {activeTab === "guide" ? (
          <JyotishGuideTab
            locale={locale}
            chart={props.chart}
            onSelectPlanet={props.onSelectPlanet}
            onSelectHouse={props.onSelectHouse}
          />
        ) : null}
        {activeTab === "method" ? (
          <MethodologyTab chart={props.chart} />
        ) : null}
      </div>

      <aside className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.045] p-3.5 text-xs leading-5 text-[var(--muted)]">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
        />
        <p>
          {readLocalized(
            LOCALIZED_ANALYSIS_LIMITATIONS["symbolic-not-scientific"],
            locale,
          )}
        </p>
      </aside>
    </div>
  );
}
