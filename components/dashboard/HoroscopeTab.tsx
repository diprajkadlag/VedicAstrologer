"use client";

import {
  CalendarDays,
  ChevronDown,
  CircleGauge,
  Info,
  MoonStar,
  Orbit,
  SunMedium,
  Telescope,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "../providers/AppPreferencesProvider";
import {
  GRAHA_IDS,
  RASIS,
  type GrahaId,
  type HouseNumber,
  type VedicChart,
} from "../../lib/astro/ephemeris";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "../../lib/astro/localizedNames";
import {
  defineMessages,
  INTL_LOCALES,
  type AppLocale,
  type TranslationValues,
} from "../../lib/i18n";
import {
  TRANSIT_SCORE_BASELINE,
  TRANSIT_SCORE_MAX,
  TRANSIT_SCORE_MIN,
  calculateTransitAnalysis,
  transitScoreBand,
  type MajorTransitNotice,
  type ScoredTransitTheme,
  type TransitAnalysis,
  type TransitRuleReason,
  type TransitScoreBand,
} from "../../lib/transits";
import {
  getTransitScoreArithmetic,
  transitInstantForDateInput,
} from "./horoscope-utils";

export {
  getTransitScoreArithmetic,
  transitInstantForDateInput,
} from "./horoscope-utils";

export interface HoroscopeTabProps {
  natalChart: VedicChart;
  /**
   * Supplies the initial instant. A manually selected date is evaluated
   * at 12:00 UTC; the Today action uses the current instant.
   */
  referenceDate: Date | string;
  onReferenceDateChange?: (instant: Date) => void;
  className?: string;
}

const HOROSCOPE_MESSAGES = defineMessages({
  en: {
    eyebrow: "Gochara · transit observatory",
    title: "Daily and monthly transit focus",
    intro:
      "Current Lahiri-sidereal placements are compared with the natal Lagna and Janma Rasi. The result is a transparent traditional rule summary, not an event forecast.",
    dateLabel: "Transit date",
    today: "Today",
    calculatedAt: "Calculated for {date}",
    dailyTitle: "Daily Moon focus",
    monthlyTitle: "Monthly Sun–Mercury focus",
    majorTitle: "Slow-moving transit notices",
    dailyHeadline: "{nakshatra} Chandra · Bhava {house} from Janma Rasi",
    dailySummary:
      "Chandra is in {rasi}, {nakshatra} Pada {pada}, ruled by {lord}. It occupies Bhava {lagnaHouse} from Lagna and Bhava {moonHouse} from Janma Rasi.",
    monthlyHeadline: "Surya in {sunRasi} · Budha in {mercuryRasi}",
    monthlySummary:
      "Surya activates Bhava {sunHouse} from Lagna. Budha activates Bhava {mercuryHouse} from Janma Rasi and is {motion}.",
    rasi: "Rasi",
    nakshatraPada: "Nakshatra and Pada",
    nakshatraLord: "Nakshatra lord",
    fromLagna: "From Lagna",
    fromJanmaRasi: "From Janma Rasi",
    bhavaValue: "Bhava {house}",
    direct: "direct",
    retrograde: "retrograde",
    focusTitle: "Practical reflection",
    dailyFocus:
      "Notice {theme}. Use the {lordQuality} qualities of the Nakshatra lord deliberately.",
    monthlyFocus:
      "Surya brings attention to {sunTheme}; Budha asks for thoughtful processing of {mercuryTheme}.",
    noticeTitle: "{planet} transit",
    noticeSummary:
      "{planet} is in {rasi}: Bhava {lagnaHouse} from Lagna and Bhava {moonHouse} from Janma Rasi.",
    lagnaTheme: "Lagna reference",
    moonTheme: "Janma Rasi reference",
    intensity: "Notice level",
    intensityBackground: "Background",
    intensityNotable: "Notable",
    intensityMajor: "Major",
    score: "Reflection score",
    scoreAria: "Reflection score {score} out of 100, {band}",
    bandIntensive: "Intensive",
    bandReflective: "Reflective",
    bandSteady: "Steady",
    bandSupportive: "Supportive",
    bandHighlySupportive: "Highly supportive",
    whyScore: "Show score calculation",
    baseline: "Published baseline",
    contribution: "{amount} points",
    finalScore: "Final bounded score",
    clampNote:
      "Baseline plus the listed fixed-rule adjustments; the result is rounded and clamped to the 0–100 range.",
    methodologyTitle: "What this score does—and does not—mean",
    methodologyIntro:
      "A score summarizes this app’s fixed Gochara rules. It is not a probability, scientific measurement, certainty rating, or prediction of a concrete event.",
    methodologyOne:
      "Astronomical inputs: apparent geocentric positions, Lahiri ayanamsa, and whole-sign counting from natal Lagna and Janma Rasi.",
    methodologyTwo:
      "Interpretive inputs: a baseline of 50 plus the calculated rule contributions shown inside each card.",
    methodologyThree:
      "Low scores mean the rules emphasize effort, review, or complexity; high scores mean they emphasize support. Neither guarantees good or bad outcomes.",
    ruleMoonHouse:
      "Chandra’s Bhava {house} from Janma Rasi applies the published daily house adjustment.",
    ruleNakshatraLord:
      "The {lord}-ruled Nakshatra applies its fixed lord adjustment.",
    rulePada:
      "Pada {pada} applies its published fixed adjustment.",
    ruleSunHouse:
      "Surya’s Bhava {house} from Lagna applies the monthly Surya adjustment.",
    ruleMercuryHouse:
      "Budha’s Bhava {house} from Janma Rasi applies the monthly Budha adjustment.",
    ruleMercuryMotion:
      "Budha’s {motion} apparent motion applies the published motion adjustment.",
    ruleMajorMoon:
      "{planet} in Bhava {house} from Janma Rasi applies the slow-transit Moon-reference adjustment.",
    ruleMajorLagna:
      "{planet} in Bhava {house} from Lagna is checked against the angular and trinal house rule.",
    ruleSadeSati:
      "Shani is within the traditional three-Rasi Sade Sati zone around the natal Chandra; this flags sustained responsibility, not guaranteed harm.",
    ruleFallback: "A fixed rule contributes the displayed adjustment.",
    disclaimer:
      "Use this material for reflection and study. Do not use it alone for medical, legal, financial, safety, relationship, or other consequential decisions.",
  },
  hi: {
    eyebrow: "गोचर · ग्रह-पर्यवेक्षण",
    title: "दैनिक और मासिक गोचर केंद्र",
    intro:
      "वर्तमान लाहिरी-निरयन स्थितियों की तुलना जन्म लग्न और जन्म राशि से की जाती है। परिणाम पारदर्शी पारंपरिक नियम-सार है, घटना की भविष्यवाणी नहीं।",
    dateLabel: "गोचर तिथि",
    today: "आज",
    calculatedAt: "{date} के लिए गणना",
    dailyTitle: "दैनिक चंद्र केंद्र",
    monthlyTitle: "मासिक सूर्य–बुध केंद्र",
    majorTitle: "धीमी गति वाले ग्रहों की सूचनाएँ",
    dailyHeadline: "{nakshatra} चंद्र · जन्म राशि से भाव {house}",
    dailySummary:
      "चंद्र {rasi} में, {nakshatra} पाद {pada} में है, जिसका स्वामी {lord} है। यह लग्न से भाव {lagnaHouse} और जन्म राशि से भाव {moonHouse} में है।",
    monthlyHeadline: "{sunRasi} में सूर्य · {mercuryRasi} में बुध",
    monthlySummary:
      "सूर्य लग्न से भाव {sunHouse} सक्रिय करता है। बुध जन्म राशि से भाव {mercuryHouse} सक्रिय करता है और {motion} है।",
    rasi: "राशि",
    nakshatraPada: "नक्षत्र और पाद",
    nakshatraLord: "नक्षत्र स्वामी",
    fromLagna: "लग्न से",
    fromJanmaRasi: "जन्म राशि से",
    bhavaValue: "भाव {house}",
    direct: "मार्गी",
    retrograde: "वक्री",
    focusTitle: "व्यावहारिक चिंतन",
    dailyFocus:
      "{theme} पर ध्यान दें। नक्षत्र स्वामी के {lordQuality} गुणों का विवेकपूर्वक उपयोग करें।",
    monthlyFocus:
      "सूर्य {sunTheme} पर ध्यान लाता है; बुध {mercuryTheme} को सोच-समझकर संसाधित करने को कहता है।",
    noticeTitle: "{planet} गोचर",
    noticeSummary:
      "{planet} {rasi} में है: लग्न से भाव {lagnaHouse} और जन्म राशि से भाव {moonHouse}।",
    lagnaTheme: "लग्न संदर्भ",
    moonTheme: "जन्म राशि संदर्भ",
    intensity: "सूचना स्तर",
    intensityBackground: "पृष्ठभूमि",
    intensityNotable: "उल्लेखनीय",
    intensityMajor: "प्रमुख",
    score: "चिंतन अंक",
    scoreAria: "चिंतन अंक 100 में से {score}, {band}",
    bandIntensive: "गहन",
    bandReflective: "पुनर्विचार",
    bandSteady: "स्थिर",
    bandSupportive: "सहायक",
    bandHighlySupportive: "अत्यंत सहायक",
    whyScore: "अंक-गणना दिखाएँ",
    baseline: "प्रकाशित आधार",
    contribution: "{amount} अंक",
    finalScore: "अंतिम सीमित अंक",
    clampNote:
      "आधार में दिखाए गए स्थिर नियम-समायोजन जोड़े जाते हैं; परिणाम पूर्णांक बनाकर 0–100 के बीच सीमित किया जाता है।",
    methodologyTitle: "ये अंक क्या बताते हैं—और क्या नहीं",
    methodologyIntro:
      "अंक इस ऐप के स्थिर गोचर नियमों का सार है। यह संभावना, वैज्ञानिक माप, निश्चितता या किसी ठोस घटना की भविष्यवाणी नहीं है।",
    methodologyOne:
      "खगोलीय आधार: आभासी भूकेंद्रीय स्थितियाँ, लाहिरी अयनांश और जन्म लग्न व जन्म राशि से पूर्ण-राशि भाव-गणना।",
    methodologyTwo:
      "व्याख्यात्मक आधार: 50 का आधार और प्रत्येक कार्ड में दिखाए गए गणना किए हुए नियम-योगदान।",
    methodologyThree:
      "कम अंक प्रयास, समीक्षा या जटिलता पर बल दिखाते हैं; अधिक अंक सहयोग पर। दोनों में से कोई भी अच्छे या बुरे परिणाम की गारंटी नहीं है।",
    ruleMoonHouse:
      "जन्म राशि से चंद्र का भाव {house} प्रकाशित दैनिक भाव-समायोजन लागू करता है।",
    ruleNakshatraLord:
      "{lord}-शासित नक्षत्र अपना स्थिर स्वामी-समायोजन लागू करता है।",
    rulePada: "पाद {pada} अपना प्रकाशित स्थिर समायोजन लागू करता है।",
    ruleSunHouse:
      "लग्न से सूर्य का भाव {house} मासिक सूर्य-समायोजन लागू करता है।",
    ruleMercuryHouse:
      "जन्म राशि से बुध का भाव {house} मासिक बुध-समायोजन लागू करता है।",
    ruleMercuryMotion:
      "बुध की आभासी {motion} गति प्रकाशित गति-समायोजन लागू करती है।",
    ruleMajorMoon:
      "जन्म राशि से भाव {house} में {planet} धीमे गोचर का चंद्र-संदर्भ समायोजन लागू करता है।",
    ruleMajorLagna:
      "लग्न से भाव {house} में {planet} को केंद्र और त्रिकोण भाव-नियम से जाँचा जाता है।",
    ruleSadeSati:
      "शनि जन्म चंद्र के आसपास पारंपरिक तीन-राशि साढ़ेसाती क्षेत्र में है; यह दीर्घ दायित्व का संकेत है, निश्चित हानि का नहीं।",
    ruleFallback: "एक स्थिर नियम दिखाया गया समायोजन जोड़ता है।",
    disclaimer:
      "इस सामग्री का उपयोग चिंतन और अध्ययन के लिए करें। चिकित्सा, कानून, वित्त, सुरक्षा, संबंध या अन्य महत्वपूर्ण निर्णय केवल इसके आधार पर न लें।",
  },
  mr: {
    eyebrow: "गोचर · ग्रह निरीक्षण",
    title: "दैनिक आणि मासिक गोचर केंद्र",
    intro:
      "सध्याच्या लाहिरी-निरयन स्थानांची तुलना जन्मलग्न आणि जन्मराशीशी केली जाते. निष्कर्ष हा पारदर्शक पारंपरिक नियम-सारांश आहे; घटनेचे भाकीत नाही.",
    dateLabel: "गोचर दिनांक",
    today: "आज",
    calculatedAt: "{date} साठी गणना",
    dailyTitle: "दैनिक चंद्र केंद्र",
    monthlyTitle: "मासिक सूर्य–बुध केंद्र",
    majorTitle: "मंदगती ग्रहांच्या सूचना",
    dailyHeadline: "{nakshatra} चंद्र · जन्मराशीपासून भाव {house}",
    dailySummary:
      "चंद्र {rasi} राशीत, {nakshatra} पाद {pada} मध्ये आहे; त्याचा स्वामी {lord} आहे. तो लग्नापासून भाव {lagnaHouse} आणि जन्मराशीपासून भाव {moonHouse} मध्ये आहे.",
    monthlyHeadline: "{sunRasi} राशीत सूर्य · {mercuryRasi} राशीत बुध",
    monthlySummary:
      "सूर्य लग्नापासून भाव {sunHouse} सक्रिय करतो. बुध जन्मराशीपासून भाव {mercuryHouse} सक्रिय करतो आणि {motion} आहे.",
    rasi: "राशी",
    nakshatraPada: "नक्षत्र आणि पाद",
    nakshatraLord: "नक्षत्र स्वामी",
    fromLagna: "लग्नापासून",
    fromJanmaRasi: "जन्मराशीपासून",
    bhavaValue: "भाव {house}",
    direct: "मार्गी",
    retrograde: "वक्री",
    focusTitle: "व्यावहारिक चिंतन",
    dailyFocus:
      "{theme} याकडे लक्ष द्या. नक्षत्र स्वामीचे {lordQuality} गुण जाणीवपूर्वक वापरा.",
    monthlyFocus:
      "सूर्य {sunTheme} याकडे लक्ष आणतो; बुध {mercuryTheme} यावर विचारपूर्वक प्रक्रिया सुचवतो.",
    noticeTitle: "{planet} गोचर",
    noticeSummary:
      "{planet} {rasi} राशीत आहे: लग्नापासून भाव {lagnaHouse} आणि जन्मराशीपासून भाव {moonHouse}।",
    lagnaTheme: "लग्न संदर्भ",
    moonTheme: "जन्मराशी संदर्भ",
    intensity: "सूचना स्तर",
    intensityBackground: "पार्श्वभूमी",
    intensityNotable: "लक्षणीय",
    intensityMajor: "प्रमुख",
    score: "चिंतन गुण",
    scoreAria: "चिंतन गुण 100 पैकी {score}, {band}",
    bandIntensive: "तीव्र",
    bandReflective: "पुनर्विचार",
    bandSteady: "स्थिर",
    bandSupportive: "सहायक",
    bandHighlySupportive: "अत्यंत सहायक",
    whyScore: "गुणांची गणना दाखवा",
    baseline: "प्रकाशित आधार",
    contribution: "{amount} गुण",
    finalScore: "अंतिम मर्यादित गुण",
    clampNote:
      "आधारात दाखवलेले स्थिर नियम-समायोजन जोडले जातात; उत्तर पूर्णांक करून 0–100 मध्ये मर्यादित केले जाते.",
    methodologyTitle: "हे गुण काय सांगतात—आणि काय सांगत नाहीत",
    methodologyIntro:
      "गुण या अॅपच्या स्थिर गोचर नियमांचा सारांश आहेत. ते संभाव्यता, वैज्ञानिक मोजमाप, निश्चितता किंवा ठोस घटनेचे भाकीत नाही.",
    methodologyOne:
      "खगोलीय आधार: आभासी भूकेंद्रीय स्थाने, लाहिरी अयनांश आणि जन्मलग्न व जन्मराशीपासून पूर्ण-राशी भावमोजणी.",
    methodologyTwo:
      "अर्थनिर्णयाचा आधार: 50 चा आधार आणि प्रत्येक कार्डमध्ये दाखवलेले मोजलेले नियम-योगदान.",
    methodologyThree:
      "कमी गुण प्रयत्न, पुनरावलोकन किंवा गुंतागुंत अधोरेखित करतात; अधिक गुण सहाय्य दर्शवतात. दोन्हीही चांगल्या किंवा वाईट परिणामाची हमी देत नाहीत.",
    ruleMoonHouse:
      "जन्मराशीपासून चंद्राचा भाव {house} प्रकाशित दैनिक भाव-समायोजन लागू करतो.",
    ruleNakshatraLord:
      "{lord}-शासित नक्षत्र त्याचे स्थिर स्वामी-समायोजन लागू करते.",
    rulePada: "पाद {pada} त्याचे प्रकाशित स्थिर समायोजन लागू करतो.",
    ruleSunHouse:
      "लग्नापासून सूर्याचा भाव {house} मासिक सूर्य-समायोजन लागू करतो.",
    ruleMercuryHouse:
      "जन्मराशीपासून बुधाचा भाव {house} मासिक बुध-समायोजन लागू करतो.",
    ruleMercuryMotion:
      "बुधाची आभासी {motion} गती प्रकाशित गती-समायोजन लागू करते.",
    ruleMajorMoon:
      "जन्मराशीपासून भाव {house} मधील {planet} मंद गोचराचे चंद्र-संदर्भ समायोजन लागू करतो.",
    ruleMajorLagna:
      "लग्नापासून भाव {house} मधील {planet} केंद्र व त्रिकोण भाव-नियमाशी तपासला जातो.",
    ruleSadeSati:
      "शनि जन्मचंद्राभोवतीच्या पारंपरिक तीन-राशी साडेसाती क्षेत्रात आहे; हा दीर्घ जबाबदारीचा संकेत आहे, निश्चित हानीचा नाही.",
    ruleFallback: "एक स्थिर नियम दाखवलेले समायोजन जोडतो.",
    disclaimer:
      "ही सामग्री चिंतन आणि अभ्यासासाठी वापरा. वैद्यकीय, कायदेशीर, आर्थिक, सुरक्षितता, नातेसंबंध किंवा इतर महत्त्वाचे निर्णय केवळ यावर आधारित घेऊ नका.",
  },
});

const HOUSE_THEMES: Readonly<Record<AppLocale, readonly string[]>> = {
  en: [
    "self and vitality",
    "resources and voice",
    "courage and skills",
    "home and foundations",
    "creativity and discernment",
    "service and problem-solving",
    "partnership and exchange",
    "depth and transformation",
    "meaning and guidance",
    "work and contribution",
    "gains and community",
    "rest and release",
  ],
  hi: [
    "स्व और जीवनशक्ति",
    "संसाधन और वाणी",
    "साहस और कौशल",
    "घर और आधार",
    "सृजनशीलता और विवेक",
    "सेवा और समस्या-समाधान",
    "साझेदारी और आदान-प्रदान",
    "गहराई और परिवर्तन",
    "अर्थ और मार्गदर्शन",
    "कर्म और योगदान",
    "लाभ और समुदाय",
    "विश्राम और विमोचन",
  ],
  mr: [
    "स्व आणि जीवनशक्ती",
    "संसाधने आणि वाणी",
    "धैर्य आणि कौशल्ये",
    "घर आणि पाया",
    "सर्जनशीलता आणि विवेक",
    "सेवा आणि समस्या-निराकरण",
    "भागीदारी आणि देवाणघेवाण",
    "सखोलता आणि परिवर्तन",
    "अर्थ आणि मार्गदर्शन",
    "कार्य आणि योगदान",
    "लाभ आणि समुदाय",
    "विश्रांती आणि मुक्तता",
  ],
};

const GRAHA_QUALITIES: Readonly<
  Record<AppLocale, Readonly<Record<GrahaId, string>>>
> = {
  en: {
    sun: "purpose and clarity",
    moon: "care and responsiveness",
    mercury: "analysis and communication",
    venus: "harmony and receptivity",
    mars: "decisive and protected action",
    jupiter: "learning and perspective",
    saturn: "patience and structure",
    rahu: "experimentation with verification",
    ketu: "simplification and discernment",
  },
  hi: {
    sun: "उद्देश्य और स्पष्टता",
    moon: "देखभाल और संवेदनशीलता",
    mercury: "विश्लेषण और संचार",
    venus: "सामंजस्य और ग्रहणशीलता",
    mars: "निर्णायक और सुरक्षित कर्म",
    jupiter: "अध्ययन और दृष्टिकोण",
    saturn: "धैर्य और संरचना",
    rahu: "जाँच सहित प्रयोग",
    ketu: "सरलीकरण और विवेक",
  },
  mr: {
    sun: "उद्देश आणि स्पष्टता",
    moon: "काळजी आणि प्रतिसादक्षमता",
    mercury: "विश्लेषण आणि संवाद",
    venus: "सुसंवाद आणि ग्रहणशीलता",
    mars: "निर्णायक आणि संरक्षित कृती",
    jupiter: "अध्ययन आणि व्यापक दृष्टी",
    saturn: "संयम आणि रचना",
    rahu: "पडताळणीसह प्रयोग",
    ketu: "सुलभीकरण आणि विवेक",
  },
};

type Translate = (
  key: keyof typeof HOROSCOPE_MESSAGES.en,
  values?: TranslationValues,
) => string;

function validDate(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError("referenceDate must be a valid absolute date.");
  }
  return date;
}

function inputDateFromReference(value: Date | string): string {
  return validDate(value).toISOString().slice(0, 10);
}

function houseTheme(house: HouseNumber, locale: AppLocale): string {
  return HOUSE_THEMES[locale][house - 1];
}

function scoreBandLabel(band: TransitScoreBand, t: Translate): string {
  switch (band) {
    case "intensive":
      return t("bandIntensive");
    case "reflective":
      return t("bandReflective");
    case "steady":
      return t("bandSteady");
    case "supportive":
      return t("bandSupportive");
    case "highly-supportive":
      return t("bandHighlySupportive");
  }
}

function numberText(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    maximumFractionDigits: 0,
  }).format(value);
}

function signedNumberText(value: number, locale: AppLocale): string {
  const absolute = numberText(Math.abs(value), locale);
  if (value > 0) return `+${absolute}`;
  if (value < 0) return `−${absolute}`;
  return absolute;
}

function localizedReason(
  reason: TransitRuleReason,
  locale: AppLocale,
  t: Translate,
): string {
  const parts = reason.ruleId.split(".");
  const finalNumber = Number(parts.at(-1));
  const house = Number.isInteger(finalNumber) ? finalNumber : undefined;

  if (reason.ruleId.startsWith("daily.moon-house.") && house) {
    return t("ruleMoonHouse", { house });
  }
  if (reason.ruleId.startsWith("daily.nakshatra-lord.")) {
    const lord = parts.at(-1) as GrahaId;
    return t("ruleNakshatraLord", {
      lord: GRAHA_IDS.includes(lord)
        ? getLocalizedGrahaName(lord, locale)
        : lord,
    });
  }
  if (reason.ruleId.startsWith("daily.nakshatra-pada.") && house) {
    return t("rulePada", { pada: house });
  }
  if (reason.ruleId.startsWith("monthly.sun-from-lagna.") && house) {
    return t("ruleSunHouse", { house });
  }
  if (reason.ruleId.startsWith("monthly.mercury-from-moon.") && house) {
    return t("ruleMercuryHouse", { house });
  }
  if (reason.ruleId === "monthly.mercury.retrograde") {
    return t("ruleMercuryMotion", { motion: t("retrograde") });
  }
  if (reason.ruleId === "monthly.mercury.direct") {
    return t("ruleMercuryMotion", { motion: t("direct") });
  }
  if (reason.ruleId.startsWith("major.saturn.sade-sati-zone.")) {
    return t("ruleSadeSati");
  }
  if (reason.ruleId.startsWith("major.") && house) {
    const planet = parts[1] as GrahaId;
    const localizedPlanet = GRAHA_IDS.includes(planet)
      ? getLocalizedGrahaName(planet, locale)
      : planet;
    return reason.ruleId.includes(".moon-house.")
      ? t("ruleMajorMoon", { planet: localizedPlanet, house })
      : t("ruleMajorLagna", { planet: localizedPlanet, house });
  }
  return t("ruleFallback");
}

function ScoreBadge({
  score,
  locale,
  t,
}: {
  score: number;
  locale: AppLocale;
  t: Translate;
}) {
  const band = transitScoreBand(score);
  const bandLabel = scoreBandLabel(band, t);

  return (
    <div
      aria-label={t("scoreAria", {
        score: numberText(score, locale),
        band: bandLabel,
      })}
      className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-right"
    >
      <p className="text-lg font-semibold text-[var(--foreground)]">
        {numberText(score, locale)}
        <span className="text-xs font-normal text-[var(--muted)]">/100</span>
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
        {bandLabel}
      </p>
    </div>
  );
}

function ScoreBreakdown({
  theme,
  locale,
  t,
}: {
  theme: Pick<ScoredTransitTheme, "baseline" | "score" | "reasons">;
  locale: AppLocale;
  t: Translate;
}) {
  const arithmetic = getTransitScoreArithmetic(theme);

  return (
    <details className="group mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]">
      <summary className="flex min-h-11 list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-[var(--foreground)]">
        <span className="flex items-center gap-2">
          <CircleGauge aria-hidden="true" className="size-4 text-[var(--accent)]" />
          {t("whyScore")}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-[var(--muted)] transition group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-[var(--border)] px-4 py-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[var(--muted)]">{t("baseline")}</span>
          <span className="font-semibold text-[var(--foreground)]">
            {numberText(arithmetic.baseline, locale)}
          </span>
        </div>
        <ul className="mt-3 space-y-3">
          {theme.reasons.map((reason) => (
            <li
              key={reason.ruleId}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs"
            >
              <span className="text-[var(--foreground)]">
                {localizedReason(reason, locale, t)}
              </span>
              <span
                className="font-semibold tabular-nums text-[var(--accent)]"
                title={t("contribution", {
                  amount: signedNumberText(reason.contribution, locale),
                })}
              >
                {signedNumberText(reason.contribution, locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs">
          <span className="font-semibold text-[var(--foreground)]">
            {t("finalScore")}
          </span>
          <span className="font-semibold tabular-nums text-[var(--foreground)]">
            {numberText(arithmetic.unbounded, locale)}
            {arithmetic.unbounded !== arithmetic.bounded
              ? ` → ${numberText(arithmetic.bounded, locale)}`
              : ""}
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">
          {t("clampNote")}
        </p>
      </div>
    </details>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-xs font-medium text-[var(--foreground)]">
        {children}
      </dd>
    </div>
  );
}

function noticeTheme(
  notice: MajorTransitNotice,
): Pick<ScoredTransitTheme, "baseline" | "score" | "reasons"> {
  return {
    baseline: TRANSIT_SCORE_BASELINE,
    score: notice.score,
    reasons: notice.reasons,
  };
}

function intensityLabel(
  intensity: MajorTransitNotice["intensity"],
  t: Translate,
): string {
  if (intensity === "major") return t("intensityMajor");
  if (intensity === "notable") return t("intensityNotable");
  return t("intensityBackground");
}

function MajorNoticeCard({
  notice,
  analysis,
  locale,
  t,
}: {
  notice: MajorTransitNotice;
  analysis: TransitAnalysis;
  locale: AppLocale;
  t: Translate;
}) {
  const position = analysis.positions.find(
    (candidate) => candidate.id === notice.planet,
  );
  if (!position) return null;
  const planet = getLocalizedGrahaName(notice.planet, locale);
  const rasi = getLocalizedRasiName(RASIS[position.signIndex], locale);

  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t("noticeTitle", { planet })}
          </p>
          <h4 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("noticeSummary", {
              planet,
              rasi,
              lagnaHouse: notice.houseFromLagna,
              moonHouse: notice.houseFromJanmaRasi,
            })}
          </h4>
        </div>
        <ScoreBadge score={notice.score} locale={locale} t={t} />
      </div>
      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        <Fact label={t("intensity")}>
          {intensityLabel(notice.intensity, t)}
        </Fact>
        <Fact label={t("lagnaTheme")}>
          {houseTheme(notice.houseFromLagna, locale)}
        </Fact>
        <Fact label={t("moonTheme")}>
          {houseTheme(notice.houseFromJanmaRasi, locale)}
        </Fact>
      </dl>
      <ScoreBreakdown
        theme={noticeTheme(notice)}
        locale={locale}
        t={t}
      />
    </article>
  );
}

export default function HoroscopeTab({
  natalChart,
  referenceDate,
  onReferenceDateChange,
  className = "",
}: HoroscopeTabProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(HOROSCOPE_MESSAGES);
  const referenceDateInput = inputDateFromReference(referenceDate);
  const referenceInstant = new Date(referenceDate);
  const referenceKey = referenceInstant.toISOString();
  const [localSelection, setLocalSelection] = useState(() => ({
    referenceKey,
    value: referenceDateInput,
    instant: referenceInstant,
  }));
  const isLocalSelectionCurrent =
    localSelection.referenceKey === referenceKey;
  const selectedDate = isLocalSelectionCurrent
    ? localSelection.value
    : referenceDateInput;
  const transitInstant = isLocalSelectionCurrent
    ? localSelection.instant
    : referenceInstant;
  const analysis = useMemo(
    () =>
      calculateTransitAnalysis({
        natalChart,
        asOf: transitInstant,
      }),
    [natalChart, transitInstant],
  );
  const positions = useMemo(
    () => Object.fromEntries(analysis.positions.map((item) => [item.id, item])),
    [analysis.positions],
  ) as Record<GrahaId, TransitAnalysis["positions"][number]>;
  const moon = positions.moon;
  const sun = positions.sun;
  const mercury = positions.mercury;
  const dateLabel = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(transitInstant);
  const dailyRasi = getLocalizedRasiName(RASIS[moon.signIndex], locale);
  const dailyNakshatra = getLocalizedNakshatraName(
    analysis.daily.moonNakshatra,
    locale,
  );
  const dailyLord = getLocalizedGrahaName(
    analysis.daily.moonNakshatraLord,
    locale,
  );
  const sunRasi = getLocalizedRasiName(RASIS[sun.signIndex], locale);
  const mercuryRasi = getLocalizedRasiName(
    RASIS[mercury.signIndex],
    locale,
  );

  function selectDate(value: string) {
    if (!value) return;
    const instant = transitInstantForDateInput(value);
    setLocalSelection({
      referenceKey: instant.toISOString(),
      value,
      instant,
    });
    onReferenceDateChange?.(instant);
  }

  function selectNow() {
    const instant = new Date();
    const value = instant.toISOString().slice(0, 10);
    setLocalSelection({
      referenceKey: instant.toISOString(),
      value,
      instant,
    });
    onReferenceDateChange?.(instant);
  }

  return (
    <section
      aria-labelledby="horoscope-transit-title"
      className={`space-y-6 text-[var(--foreground)] ${className}`}
    >
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              <Telescope aria-hidden="true" className="size-4" />
              {t("eyebrow")}
            </p>
            <h3
              id="horoscope-transit-title"
              className="mt-2 text-xl font-semibold text-[var(--foreground)]"
            >
              {t("title")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {t("intro")}
            </p>
          </div>
          <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 lg:w-auto lg:min-w-72">
            <label
              htmlFor="transit-reference-date"
              className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]"
            >
              <CalendarDays aria-hidden="true" className="size-4 text-[var(--accent)]" />
              {t("dateLabel")}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="transit-reference-date"
                type="date"
                value={selectedDate}
                onChange={(event) => selectDate(event.target.value)}
                className="min-h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]"
              />
              <button
                type="button"
                onClick={selectNow}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--accent)] transition hover:brightness-110"
              >
                {t("today")}
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">
              {t("calculatedAt", { date: dateLabel })}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                <MoonStar aria-hidden="true" className="size-4" />
                {t("dailyTitle")}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {t("dailyHeadline", {
                  nakshatra: dailyNakshatra,
                  house: analysis.daily.moonHouseFromJanmaRasi,
                })}
              </h4>
            </div>
            <ScoreBadge
              score={analysis.daily.score}
              locale={locale}
              t={t}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {t("dailySummary", {
              rasi: dailyRasi,
              nakshatra: dailyNakshatra,
              pada: analysis.daily.moonNakshatraPada,
              lord: dailyLord,
              lagnaHouse: analysis.daily.moonHouseFromLagna,
              moonHouse: analysis.daily.moonHouseFromJanmaRasi,
            })}
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <Fact label={t("rasi")}>{dailyRasi}</Fact>
            <Fact label={t("nakshatraPada")}>
              {dailyNakshatra} · {analysis.daily.moonNakshatraPada}
            </Fact>
            <Fact label={t("fromLagna")}>
              {t("bhavaValue", {
                house: analysis.daily.moonHouseFromLagna,
              })}
            </Fact>
            <Fact label={t("fromJanmaRasi")}>
              {t("bhavaValue", {
                house: analysis.daily.moonHouseFromJanmaRasi,
              })}
            </Fact>
          </dl>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {t("focusTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {t("dailyFocus", {
                theme: houseTheme(
                  analysis.daily.moonHouseFromJanmaRasi,
                  locale,
                ),
                lordQuality:
                  GRAHA_QUALITIES[locale][analysis.daily.moonNakshatraLord],
              })}
            </p>
          </div>
          <ScoreBreakdown theme={analysis.daily} locale={locale} t={t} />
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                <SunMedium aria-hidden="true" className="size-4" />
                {t("monthlyTitle")}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {t("monthlyHeadline", { sunRasi, mercuryRasi })}
              </h4>
            </div>
            <ScoreBadge
              score={analysis.monthly.score}
              locale={locale}
              t={t}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {t("monthlySummary", {
              sunHouse: analysis.monthly.sunHouseFromLagna,
              mercuryHouse: analysis.monthly.mercuryHouseFromJanmaRasi,
              motion: analysis.monthly.mercuryRetrograde
                ? t("retrograde")
                : t("direct"),
            })}
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <Fact label={getLocalizedGrahaName("sun", locale)}>
              {sunRasi} ·{" "}
              {t("bhavaValue", {
                house: analysis.monthly.sunHouseFromLagna,
              })}{" "}
              {t("fromLagna")}
            </Fact>
            <Fact label={getLocalizedGrahaName("mercury", locale)}>
              {mercuryRasi} ·{" "}
              {t("bhavaValue", {
                house: analysis.monthly.mercuryHouseFromJanmaRasi,
              })}{" "}
              {t("fromJanmaRasi")}
            </Fact>
          </dl>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {t("focusTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {t("monthlyFocus", {
                sunTheme: houseTheme(
                  analysis.monthly.sunHouseFromLagna,
                  locale,
                ),
                mercuryTheme: houseTheme(
                  analysis.monthly.mercuryHouseFromJanmaRasi,
                  locale,
                ),
              })}
            </p>
          </div>
          <ScoreBreakdown theme={analysis.monthly} locale={locale} t={t} />
        </article>
      </div>

      <section aria-labelledby="major-transits-title">
        <h3
          id="major-transits-title"
          className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]"
        >
          <Orbit aria-hidden="true" className="size-5 text-[var(--accent)]" />
          {t("majorTitle")}
        </h3>
        <div className="mt-3 grid gap-5 xl:grid-cols-2">
          <MajorNoticeCard
            notice={analysis.majorTransits.jupiter}
            analysis={analysis}
            locale={locale}
            t={t}
          />
          <MajorNoticeCard
            notice={analysis.majorTransits.saturn}
            analysis={analysis}
            locale={locale}
            t={t}
          />
        </div>
      </section>

      <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
          <Info aria-hidden="true" className="size-5 text-[var(--accent)]" />
          {t("methodologyTitle")}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
          {t("methodologyIntro")}
        </p>
        <ul className="mt-4 grid gap-3 text-xs leading-5 text-[var(--muted)] md:grid-cols-3">
          <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            {t("methodologyOne")}
          </li>
          <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            {t("methodologyTwo")}
          </li>
          <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            {t("methodologyThree")}
          </li>
        </ul>
        <p className="mt-4 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted)]">
          {t("disclaimer")}
        </p>
        <p className="mt-2 text-[10px] text-[var(--muted)]">
          {analysis.metadata.ruleSet} · {analysis.metadata.ayanamsa} ·{" "}
          {TRANSIT_SCORE_MIN}–{TRANSIT_SCORE_MAX}
        </p>
      </aside>
    </section>
  );
}
