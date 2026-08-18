import {
  GRAHA_IDS,
  type GrahaId,
  type HouseNumber,
  type NakshatraName,
} from "./ephemeris";
import type { AnalysisLimitationId } from "./analysisAudit";
import type { AstroTermId } from "./glossary";
import { getLocalizedNakshatraName } from "./localizedNames";
import type { AppLocale } from "../i18n";

export type LocalizedText = Readonly<Record<AppLocale, string>>;

const MISSING_GERMAN_TRANSLATION = "⟦DE-ÜBERSETZUNG-FEHLT⟧";

export function localized(
  en: string,
  hi: string,
  mr: string,
  de: string = MISSING_GERMAN_TRANSLATION,
): LocalizedText {
  return { en, hi, mr, de };
}

export function readLocalized(
  value: LocalizedText,
  locale: AppLocale,
): string {
  return value[locale];
}

export const EDUCATION_TERM_IDS = [
  "lagna",
  "rasi",
  "bhava",
  "graha",
  "nakshatra",
  "pada",
  "nakshatra-lord",
  "bhava-lord",
  "lagna-lord",
  "janma-rasi",
  "drishti",
  "yuti",
  "dignity",
  "vakri",
  "rahu-ketu",
  "dasha",
  "mahadasha-antardasha",
  "gochara",
  "ayanamsa",
  "whole-sign",
  "shadbala",
  "varga",
] as const;

export type EducationTermId = (typeof EDUCATION_TERM_IDS)[number];
export type CalculationStatus =
  | "calculated"
  | "partly-calculated"
  | "not-calculated"
  | "concept";

export interface EducationTerm {
  id: EducationTermId;
  category: "foundation" | "relationship" | "timing" | "method";
  name: LocalizedText;
  summary: LocalizedText;
  detail: LocalizedText;
  readingSequence: LocalizedText;
  calculationStatus: CalculationStatus;
}

const BASE_EDUCATION_TERMS: readonly EducationTerm[] = [
  {
    id: "lagna",
    category: "foundation",
    name: localized("Ascendant", "लग्न", "लग्न"),
    summary: localized(
      "The sidereal degree rising on the eastern horizon at the given time and place.",
      "दिए गए समय और स्थान पर पूर्वी क्षितिज पर उदित होने वाला निरयन अंश।",
      "दिलेल्या वेळेस आणि स्थळी पूर्व क्षितिजावर उगवणारा निरयन अंश.",
    ),
    detail: localized(
      "The ascendant anchors the twelve houses. Vedic astrology uses it as a symbolic lens for embodiment, temperament and how a person meets life. It moves quickly, so a rounded or uncertain birth time can change the ascendant and every house.",
      "लग्न बारह भावों का आधार है। ज्योतिष में इसे शरीर, स्वभाव और जीवन का सामना करने की शैली का प्रतीक माना जाता है। यह तेजी से बदलता है, इसलिए अनुमानित जन्म-समय से लग्न और सभी भाव बदल सकते हैं।",
      "लग्न बारा भावांचा आधार आहे. ज्योतिषात ते शरीर, स्वभाव आणि जीवनाला सामोरे जाण्याच्या पद्धतीचे प्रतीक मानले जाते. ते वेगाने बदलते; म्हणून अंदाजे जन्मवेळेमुळे लग्न व सर्व भाव बदलू शकतात.",
    ),
    readingSequence: localized(
      "Read its zodiac sign, its ruler, planetary bodies in the first house, then relevant timing. No single factor is a verdict.",
      "पहले इसकी राशि, फिर लग्नेश, प्रथम भाव के ग्रह और उसके बाद संबंधित काल देखें। कोई एक कारक अंतिम निर्णय नहीं है।",
      "प्रथम त्याची राशी, मग लग्नेश, पहिल्या भावातील ग्रह आणि नंतर संबंधित काल पाहा. एकच घटक अंतिम निर्णय नसतो.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "rasi",
    category: "foundation",
    name: localized("Zodiac sign", "राशि", "राशी"),
    summary: localized(
      "One of twelve equal 30° divisions of the sidereal zodiac.",
      "निरयन राशि-चक्र के बारह समान 30° भागों में से एक।",
      "निरयन राशिचक्रातील बारा समान 30° विभागांपैकी एक.",
    ),
    detail: localized(
      "A zodiac sign describes the style and conditions through which a planetary body or house is traditionally interpreted. A zodiac sign is not the same as a planet, constellation or personality label.",
      "राशि उस शैली और परिस्थिति का प्रतीक है जिसके माध्यम से ग्रह या भाव की व्याख्या की जाती है। राशि ग्रह, नक्षत्र या संपूर्ण व्यक्तित्व का लेबल नहीं है।",
      "ग्रह किंवा भाव ज्या शैलीत व परिस्थितीत व्यक्त होतो त्याचे प्रतीक म्हणजे राशी. राशी म्हणजे ग्रह, नक्षत्र किंवा संपूर्ण व्यक्तिमत्त्वाचे लेबल नव्हे.",
    ),
    readingSequence: localized(
      "Identify the planetary body or house first, then use the zodiac sign to qualify how it operates.",
      "पहले ग्रह या भाव पहचानें, फिर राशि से उसके काम करने की शैली समझें।",
      "आधी ग्रह किंवा भाव ओळखा; नंतर तो कसा कार्य करतो हे राशीने स्पष्ट करा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "bhava",
    category: "foundation",
    name: localized("House", "भाव / घर", "भाव / घर"),
    summary: localized(
      "One of twelve symbolic life fields counted from the ascendant.",
      "लग्न से गिने जाने वाले जीवन के बारह प्रतीकात्मक क्षेत्रों में से एक।",
      "लग्नापासून मोजल्या जाणाऱ्या जीवनाच्या बारा प्रतीकात्मक क्षेत्रांपैकी एक.",
    ),
    detail: localized(
      "Houses organize topics such as body, resources, learning, home, partnership and work. A house is read through its topics, zodiac sign, ruler, resident planetary bodies and timing. An empty house is not inactive; its ruler still connects it to the chart.",
      "भाव शरीर, संसाधन, सीख, घर, संबंध और कर्म जैसे विषय व्यवस्थित करते हैं। भाव को उसके विषय, राशि, भावेश, स्थित ग्रह और काल के साथ पढ़ा जाता है। खाली भाव निष्क्रिय नहीं होता; उसका स्वामी फिर भी कुंडली से संबंध बनाता है।",
      "भाव शरीर, साधने, शिक्षण, घर, संबंध व कर्म यांसारखे विषय मांडतात. भावाचे विषय, राशी, भावेश, त्यातील ग्रह आणि काल एकत्र वाचले जातात. रिकामा भाव निष्क्रिय नसतो; त्याचा स्वामी त्याला कुंडलीशी जोडतो.",
    ),
    readingSequence: localized(
      "Start with the house topic, add its zodiac sign and ruler, then resident planetary bodies. This app uses whole-sign houses.",
      "भाव के विषय से शुरू करें; फिर राशि, भावेश और उसमें स्थित ग्रह जोड़ें। यह ऐप पूर्ण-राशि भाव पद्धति उपयोग करता है।",
      "भावाच्या विषयापासून सुरुवात करा; नंतर राशी, भावेश व त्यातील ग्रह जोडा. हे अ‍ॅप पूर्ण-राशी भावपद्धत वापरते.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "graha",
    category: "foundation",
    name: localized("Planetary body", "ग्रह", "ग्रह"),
    summary: localized(
      "A Vedic-astrology symbolic agent representing a function of experience.",
      "अनुभव के किसी कार्य का प्रतिनिधित्व करने वाला ज्योतिषीय प्रतीक।",
      "अनुभवातील एखाद्या कार्याचे प्रतिनिधित्व करणारा ज्योतिषीय प्रतीक.",
    ),
    detail: localized(
      "The nine planetary bodies here are the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, North Node and South Node. The Sun and Moon are luminaries; the North and South Nodes are mathematical lunar nodes. Calling all nine 'planets' is a traditional convenience, not an astronomy claim.",
      "यहाँ नौ ग्रह सूर्य, चंद्र, मंगल, बुध, गुरु, शुक्र, शनि, राहु और केतु हैं। सूर्य-चंद्र ज्योति-पिंड हैं; राहु-केतु गणितीय चंद्र-नोड हैं। सभी को 'ग्रह' कहना परंपरागत सुविधा है, खगोल-विज्ञान का दावा नहीं।",
      "येथे सूर्य, चंद्र, मंगळ, बुध, गुरु, शुक्र, शनि, राहू व केतू हे नऊ ग्रह आहेत. सूर्य-चंद्र ज्योतिर्गोल, तर राहू-केतू गणितीय चंद्रनोड आहेत. सर्वांना 'ग्रह' म्हणणे ही पारंपरिक सोय आहे; खगोलशास्त्रीय दावा नाही.",
    ),
    readingSequence: localized(
      "The planetary body says what function, the zodiac sign says how, and the house says where. Condition and timing add context.",
      "ग्रह बताता है कौन-सा कार्य, राशि बताती है कैसे, और भाव बताता है कहाँ। अवस्था और काल संदर्भ जोड़ते हैं।",
      "ग्रह कोणते कार्य, राशी कसे, आणि भाव कुठे हे सांगतो. अवस्था व काल संदर्भ देतात.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "nakshatra",
    category: "foundation",
    name: localized("Lunar mansion", "नक्षत्र", "नक्षत्र"),
    summary: localized(
      "One of 27 equal lunar-mansion segments, each 13°20′ wide.",
      "27 समान चंद्र-मंडल खंडों में से एक, प्रत्येक 13°20′ चौड़ा।",
      "27 समान चंद्रमंडल विभागांपैकी एक; प्रत्येक 13°20′ रुंद.",
    ),
    detail: localized(
      "Lunar mansions provide a finer traditional symbolic layer. The Moon's birth lunar mansion sets the starting Vimshottari sequence. Mansion imagery and personality descriptions are interpretive traditions, not measured psychological traits.",
      "नक्षत्र एक सूक्ष्म पारंपरिक प्रतीकात्मक परत देते हैं। जन्म-चंद्र का नक्षत्र विम्शोत्तरी क्रम का आरंभ तय करता है। नक्षत्र-चित्र और व्यक्तित्व-वर्णन व्याख्यात्मक परंपराएँ हैं, मापे गए मनोवैज्ञानिक गुण नहीं।",
      "नक्षत्र अधिक सूक्ष्म पारंपरिक प्रतीकात्मक स्तर देतात. जन्मचंद्राचे नक्षत्र विंशोत्तरी क्रमाची सुरुवात ठरवते. नक्षत्र-प्रतिमा व व्यक्तिमत्त्ववर्णने ही परंपरागत व्याख्या आहेत; मोजलेले मानसशास्त्रीय गुण नाहीत.",
    ),
    readingSequence: localized(
      "Use it after the planetary body, zodiac sign and house; avoid turning one image or deity into a literal prediction.",
      "इसे ग्रह, राशि और भाव के बाद पढ़ें; किसी एक प्रतीक या देवता को शाब्दिक भविष्यवाणी न बनाएँ।",
      "ग्रह, राशी व भावानंतर ते वाचा; एखादी प्रतिमा किंवा देवता यांना शब्दशः भविष्यवाणी बनवू नका.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "pada",
    category: "foundation",
    name: localized("Quarter", "पाद", "पाद"),
    summary: localized(
      "One of four 3°20′ quarters within a lunar mansion.",
      "नक्षत्र के चार 3°20′ चरणों में से एक।",
      "नक्षत्रातील चार 3°20′ चरणांपैकी एक.",
    ),
    detail: localized(
      "A quarter refines a lunar-mansion placement and links it to a ninth-division section. This app calculates the quarter number but does not currently calculate or display a ninth-division chart.",
      "पाद नक्षत्र-स्थिति को सूक्ष्म करता है और उसे नवांश से जोड़ता है। यह ऐप पाद संख्या निकालता है, पर अभी नवांश कुंडली नहीं निकालता या दिखाता।",
      "पाद नक्षत्रस्थिती अधिक सूक्ष्म करतो व नवांशाशी जोडतो. हे अ‍ॅप पाद क्रमांक मोजते; मात्र सध्या नवांश कुंडली मोजत किंवा दाखवत नाही.",
    ),
    readingSequence: localized(
      "Treat the quarter as refinement, not as a replacement for the whole chart.",
      "पाद को सूक्ष्मता मानें, पूरी कुंडली का विकल्प नहीं।",
      "पाद हा बारकावा आहे; संपूर्ण कुंडलीचा पर्याय नाही.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "nakshatra-lord",
    category: "relationship",
    name: localized(
      "Lunar-mansion ruler",
      "नक्षत्र स्वामी",
      "नक्षत्र स्वामी",
    ),
    summary: localized(
      "The planetary body assigned to a lunar mansion in the repeating Vimshottari sequence.",
      "विम्शोत्तरी क्रम में किसी नक्षत्र को दिया गया ग्रह-स्वामी।",
      "विंशोत्तरी क्रमात एखाद्या नक्षत्राला दिलेला ग्रहस्वामी.",
    ),
    detail: localized(
      "The sequence South Node, Venus, Sun, Moon, Mars, North Node, Jupiter, Saturn and Mercury repeats across all 27 lunar mansions. The ruler creates a traditional interpretive link to that planetary body's natal placement; it is different from the zodiac-sign ruler or house ruler.",
      "केतु, शुक्र, सूर्य, चंद्र, मंगल, राहु, गुरु, शनि और बुध का क्रम 27 नक्षत्रों में दोहरता है। स्वामी उस ग्रह की जन्म-स्थिति से पारंपरिक संबंध बनाता है; वह राशि-स्वामी या भावेश से अलग है।",
      "केतू, शुक्र, सूर्य, चंद्र, मंगळ, राहू, गुरु, शनि व बुध हा क्रम 27 नक्षत्रांत पुनरावृत्त होतो. स्वामी त्या ग्रहाच्या जन्मस्थितीशी पारंपरिक दुवा जोडतो; तो राशीस्वामी किंवा भावेशापेक्षा वेगळा आहे.",
    ),
    readingSequence: localized(
      "First identify which planetary body occupies the lunar mansion; then locate the lunar-mansion ruler by zodiac sign and house.",
      "पहले नक्षत्र में स्थित ग्रह पहचानें; फिर नक्षत्र-स्वामी की राशि और भाव देखें।",
      "आधी नक्षत्रातील ग्रह ओळखा; मग नक्षत्रस्वामीची राशी व भाव पाहा.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "bhava-lord",
    category: "relationship",
    name: localized("House ruler", "भावेश", "भावेश"),
    summary: localized(
      "The planetary body ruling the zodiac sign that occupies a house.",
      "किसी भाव में स्थित राशि का स्वामी ग्रह।",
      "एखाद्या भावात असलेल्या राशीचा स्वामी ग्रह.",
    ),
    detail: localized(
      "The house ruler links its source house to the house where that planetary body is placed. This is a traditional topic connection—not proof that a specific event will happen.",
      "भावेश अपने मूल भाव को उस भाव से जोड़ता है जहाँ वह ग्रह स्थित है। यह पारंपरिक विषय-संबंध है—किसी निश्चित घटना का प्रमाण नहीं।",
      "भावेश आपल्या मूळ भावाला तो ग्रह ज्या भावात आहे त्याच्याशी जोडतो. हा पारंपरिक विषयसंबंध आहे—विशिष्ट घटना घडेल याचा पुरावा नाही.",
    ),
    readingSequence: localized(
      "Find the house's zodiac sign, its ruler, then that ruler's placement and condition.",
      "भाव की राशि, उसका स्वामी, फिर उस स्वामी की स्थिति और अवस्था देखें।",
      "भावाची राशी, तिचा स्वामी, नंतर त्या स्वामीचे स्थान व अवस्था पाहा.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "lagna-lord",
    category: "relationship",
    name: localized("Ascendant ruler", "लग्नेश", "लग्नेश"),
    summary: localized(
      "The planetary body ruling the ascendant's zodiac sign.",
      "लग्न राशि का स्वामी ग्रह।",
      "लग्न राशीचा स्वामी ग्रह.",
    ),
    detail: localized(
      "The ascendant ruler is read as a symbolic carrier of vitality and life orientation. Its house placement connects first-house topics with another field, while its zodiac sign describes style. Strength claims require methods this app may not calculate.",
      "लग्नेश को जीवन-ऊर्जा और दिशा का प्रतीकात्मक वाहक माना जाता है। उसका भाव प्रथम भाव को दूसरे क्षेत्र से जोड़ता है और राशि उसकी शैली बताती है। बल के दावों के लिए ऐसी विधियाँ चाहिए जो यह ऐप शायद न निकालता हो।",
      "लग्नेश हा जीवनशक्ती व दिशेचा प्रतीकात्मक वाहक मानला जातो. त्याचा भाव पहिल्या भावाला दुसऱ्या क्षेत्राशी जोडतो व राशी शैली सांगते. बळाविषयी दाव्यांसाठी या अ‍ॅपमध्ये नसलेली गणना लागू शकते.",
    ),
    readingSequence: localized(
      "Read the ascendant and its ruler together; do not label a person solely from either one.",
      "लग्न और लग्नेश को साथ पढ़ें; किसी एक से व्यक्ति पर अंतिम लेबल न लगाएँ।",
      "लग्न व लग्नेश एकत्र वाचा; एकाच घटकावरून व्यक्तीला अंतिम लेबल देऊ नका.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "janma-rasi",
    category: "relationship",
    name: localized("Birth Moon sign", "जन्म राशि", "जन्म राशी"),
    summary: localized(
      "The zodiac sign occupied by the Moon at birth.",
      "जन्म के समय चंद्र जिस राशि में स्थित हो।",
      "जन्मावेळी चंद्र ज्या राशीत असतो ती राशी.",
    ),
    detail: localized(
      "The birth Moon sign is used as a reference for emotional symbolism and Moon-relative transit counting. It complements rather than replaces the ascendant.",
      "जन्म राशि भावनात्मक प्रतीक और चंद्र से गोचर-गणना का संदर्भ है। यह लग्न का पूरक है, उसका विकल्प नहीं।",
      "जन्म राशी भावनिक प्रतीक व चंद्रापासून गोचर मोजण्याचा संदर्भ आहे. ती लग्नाला पूरक आहे; पर्याय नाही.",
    ),
    readingSequence: localized(
      "Compare Moon-relative themes with ascendant-relative houses; disagreement suggests different lenses, not an error.",
      "चंद्र-सापेक्ष विषयों की तुलना लग्न-सापेक्ष भावों से करें; अंतर अलग दृष्टि है, जरूरी नहीं कि त्रुटि हो।",
      "चंद्रसापेक्ष विषयांची तुलना लग्नसापेक्ष भावांशी करा; फरक म्हणजे भिन्न दृष्टी, चूकच असे नाही.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "drishti",
    category: "relationship",
    name: localized("Aspect", "दृष्टि", "दृष्टी"),
    summary: localized(
      "A traditional rule for one planetary body or zodiac sign influencing another by aspect.",
      "एक ग्रह या राशि का दूसरे पर पहलू द्वारा प्रभाव बताने वाला पारंपरिक नियम।",
      "एका ग्रहाचा किंवा राशीचा दुसऱ्यावर पैलूने प्रभाव सांगणारा पारंपरिक नियम.",
    ),
    detail: localized(
      "Vedic astrology has planetary and zodiac-sign aspect systems, and traditions differ on weighting. This app does not yet calculate classical aspects, strength or aspect orbs, so educational references are not chart findings.",
      "ज्योतिष में ग्रह-दृष्टि और राशि-दृष्टि प्रणालियाँ हैं तथा परंपराओं में भार अलग हो सकता है। यह ऐप अभी शास्त्रीय दृष्टि, उसका बल या अंश-अंतर नहीं निकालता; इसलिए शैक्षिक उल्लेख कुंडली-निष्कर्ष नहीं हैं।",
      "ज्योतिषात ग्रहदृष्टी व राशीदृष्टी पद्धती आहेत आणि परंपरेनुसार वजन बदलते. हे अ‍ॅप सध्या शास्त्रीय दृष्टी, तिचे बळ किंवा अंशांतर मोजत नाही; शैक्षणिक उल्लेख हा कुंडलीतील निष्कर्ष नाही.",
    ),
    readingSequence: localized(
      "Choose and disclose one aspect system before interpreting it.",
      "व्याख्या से पहले एक दृष्टि-पद्धति चुनें और स्पष्ट बताएँ।",
      "अर्थ लावण्यापूर्वी एक दृष्टीपद्धत निवडा व ती स्पष्ट सांगा.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "yuti",
    category: "relationship",
    name: localized("Conjunction", "युति", "युती"),
    summary: localized(
      "Two or more planetary bodies occupying the same zodiac sign or a chosen angular range.",
      "दो या अधिक ग्रहों का एक राशि या चुने हुए अंश-अंतर में होना।",
      "दोन किंवा अधिक ग्रह एकाच राशीत किंवा निवडलेल्या अंशांतरात असणे.",
    ),
    detail: localized(
      "A same-sign conjunction is broad; close degree contact is more specific. Different schools use different orbs. This app displays longitudes but does not assign conjunction strength or automatically judge a conjunction as beneficial or harmful.",
      "एक-राशि युति व्यापक है; निकट अंश संपर्क अधिक विशिष्ट है। अलग परंपराएँ अलग अंश-अंतर लेती हैं। यह ऐप देशांतर दिखाता है, पर युति-बल या स्वतः शुभ-अशुभ निर्णय नहीं देता।",
      "एकाच राशीतील युती व्यापक, तर जवळचा अंशसंपर्क अधिक विशिष्ट असतो. परंपरेनुसार अंशांतर बदलते. हे अ‍ॅप रेखांश दाखवते; युतीचे बळ किंवा आपोआप शुभ-अशुभ निर्णय देत नाही.",
    ),
    readingSequence: localized(
      "Check actual angular separation and each planetary body's role before synthesizing.",
      "संश्लेषण से पहले वास्तविक अंश-अंतर और हर ग्रह की भूमिका जाँचें।",
      "संश्लेषणाआधी प्रत्यक्ष अंशांतर व प्रत्येक ग्रहाची भूमिका तपासा.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "dignity",
    category: "relationship",
    name: localized("Planetary condition / dignity", "ग्रह अवस्था / गरिमा", "ग्रह अवस्था / प्रतिष्ठा"),
    summary: localized(
      "Traditional classifications of how comfortably or effectively a planetary body may express in a zodiac sign.",
      "किसी राशि में ग्रह कितनी सहजता या प्रभाव से व्यक्त हो सकता है, इसकी पारंपरिक श्रेणियाँ।",
      "एखाद्या राशीत ग्रह किती सहजतेने किंवा प्रभावीपणे व्यक्त होऊ शकतो याच्या पारंपरिक श्रेणी.",
    ),
    detail: localized(
      "Examples include own zodiac sign, exaltation, debilitation, friendship and enmity. Dignity modifies expression; it does not make a person or life area simply good or bad. This app does not yet calculate a complete dignity model.",
      "उदाहरण हैं स्व-राशि, उच्च, नीच, मित्रता और शत्रुता। अवस्था अभिव्यक्ति बदलती है; व्यक्ति या जीवन-क्षेत्र को केवल अच्छा-बुरा नहीं बनाती। यह ऐप अभी पूर्ण अवस्था-मॉडल नहीं निकालता।",
      "स्वराशी, उच्च, नीच, मैत्री व शत्रुत्व ही उदाहरणे. अवस्था अभिव्यक्ती बदलते; व्यक्ती किंवा जीवनक्षेत्र फक्त चांगले-वाईट ठरत नाही. हे अ‍ॅप सध्या पूर्ण अवस्थामॉडेल मोजत नाही.",
    ),
    readingSequence: localized(
      "Treat dignity as one modifier alongside house, rulership, motion, aspects and timing.",
      "अवस्था को भाव, स्वामित्व, गति, दृष्टि और काल के साथ एक कारक मानें।",
      "अवस्थेला भाव, स्वामित्व, गती, दृष्टी व काल यांच्यासह एक घटक माना.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "vakri",
    category: "relationship",
    name: localized("Retrograde motion", "वक्री", "वक्री"),
    summary: localized(
      "Apparent backward motion in geocentric zodiac longitude.",
      "भूकेंद्रित राशि-देशांतर में दिखाई देने वाली उलटी गति।",
      "भूकेंद्री राशीरेखांशात दिसणारी उलटी गती.",
    ),
    detail: localized(
      "Retrograde motion is an astronomical perspective effect. Traditional readings may associate it with review, intensity or non-linear expression, but it does not automatically reverse a planetary body or make it harmful.",
      "वक्री गति खगोलीय दृष्टिकोण का प्रभाव है। परंपरा इसे पुनर्विचार, तीव्रता या गैर-सीधी अभिव्यक्ति से जोड़ सकती है, पर यह ग्रह को स्वतः उलट या हानिकारक नहीं बनाती।",
      "वक्री गती हा खगोलीय दृष्टीकोनाचा परिणाम आहे. परंपरेत ती पुनर्विचार, तीव्रता किंवा अरेषीय अभिव्यक्तीशी जोडली जाऊ शकते; पण ग्रह आपोआप उलटा किंवा हानिकारक होत नाही.",
    ),
    readingSequence: localized(
      "Read the planetary body, zodiac sign, house and rulership first; retrograde motion is a modifier.",
      "पहले ग्रह, राशि, भाव और स्वामित्व पढ़ें; वक्री एक संशोधक है।",
      "प्रथम ग्रह, राशी, भाव व स्वामित्व वाचा; वक्री हा बदल करणारा घटक आहे.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "rahu-ketu",
    category: "foundation",
    name: localized("Lunar nodes", "राहु–केतु", "राहू–केतू"),
    summary: localized(
      "The opposite ascending and descending nodes of the Moon's orbit.",
      "चंद्र-कक्षा के परस्पर विपरीत आरोही और अवरोही नोड।",
      "चंद्रकक्षेचे परस्परविरुद्ध आरोही व अवरोही नोड.",
    ),
    detail: localized(
      "They are mathematical points connected with eclipse geometry, not physical planets. Vedic astrology often associates the North Node with amplification and unfamiliar appetite, and the South Node with separation and inward discrimination. Those are symbolic lenses, not diagnoses.",
      "ये ग्रह नहीं, ग्रहण-ज्यामिति से जुड़े गणितीय बिंदु हैं। ज्योतिष राहु को विस्तार और अपरिचित चाह, केतु को अलगाव और अंतर्मुखी विवेक से जोड़ता है। ये प्रतीक हैं, निदान नहीं।",
      "ते भौतिक ग्रह नसून ग्रहणभूमितीशी संबंधित गणितीय बिंदू आहेत. ज्योतिष राहूला विस्तार व अपरिचित ओढ, केतूला विलगता व अंतर्मुख विवेकाशी जोडते. ही प्रतीके आहेत; निदान नाही.",
    ),
    readingSequence: localized(
      "This app uses mean nodes; true-node positions can differ near boundaries.",
      "यह ऐप मध्यम नोड उपयोग करता है; सीमा के पास वास्तविक नोड की स्थिति अलग हो सकती है।",
      "हे अ‍ॅप मध्यम नोड वापरते; सीमेजवळ खरा नोड वेगळा असू शकतो.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "dasha",
    category: "timing",
    name: localized("Planetary period", "दशा", "दशा"),
    summary: localized(
      "A traditional planetary-period framework for organizing symbolic time.",
      "प्रतीकात्मक समय व्यवस्थित करने की पारंपरिक ग्रह-काल पद्धति।",
      "प्रतीकात्मक काळ मांडण्याची पारंपरिक ग्रहकाल पद्धत.",
    ),
    detail: localized(
      "A planetary period emphasizes the natal themes of its ruler. It is not a transit and does not guarantee an event. This app uses Vimshottari timing from the Moon's lunar mansion; other planetary-period systems exist.",
      "दशा अपने स्वामी के जन्म-कुंडली विषयों पर जोर देती है। यह गोचर नहीं और घटना की गारंटी नहीं। यह ऐप जन्म-चंद्र के नक्षत्र से विम्शोत्तरी काल उपयोग करता है; अन्य दशा प्रणालियाँ भी हैं।",
      "दशा तिच्या स्वामीच्या जन्मकुंडलीतील विषयांना भर देते. ती गोचर नाही व घटना निश्चित करत नाही. हे अ‍ॅप जन्मचंद्राच्या नक्षत्रावरून विंशोत्तरी काल वापरते; इतर दशापद्धतीही आहेत.",
    ),
    readingSequence: localized(
      "Locate the period ruler in the natal chart, then add the sub-period and current transit.",
      "दशा-स्वामी की जन्म-स्थिति देखें, फिर अंतर्दशा और वर्तमान गोचर जोड़ें।",
      "दशास्वामीचे जन्मस्थान पाहा; मग अंतर्दशा व वर्तमान गोचर जोडा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "mahadasha-antardasha",
    category: "timing",
    name: localized(
      "Major period–sub-period",
      "महादशा–अंतर्दशा",
      "महादशा–अंतर्दशा",
    ),
    summary: localized(
      "A broad planetary chapter and its shorter nested subperiod.",
      "एक लंबा ग्रह-काल अध्याय और उसके भीतर छोटी उप-अवधि।",
      "दीर्घ ग्रहकालीन अध्याय व त्यातील लहान उपकाल.",
    ),
    detail: localized(
      "The major period supplies the background theme; the sub-period changes the nearer focus. Their combination is read through both rulers' natal placements and rulerships. Generic ruler-pair text cannot replace that chart context.",
      "महादशा पृष्ठभूमि देती है; अंतर्दशा निकट ध्यान बदलती है। दोनों स्वामियों की जन्म-स्थिति और स्वामित्व से संयोजन पढ़ा जाता है। सामान्य ग्रह-युग्म पाठ कुंडली-संदर्भ का विकल्प नहीं।",
      "महादशा पार्श्वभूमी देते; अंतर्दशा जवळचा भर बदलते. दोन्ही स्वामींची जन्मस्थिती व स्वामित्व पाहून संयोग वाचला जातो. सामान्य ग्रहजोडी मजकूर हा कुंडलीसंदर्भाचा पर्याय नाही.",
    ),
    readingSequence: localized(
      "Ask what the major lord sustains and what the minor lord currently activates.",
      "पूछें: महादशा-स्वामी क्या बनाए रखता है और अंतर्दशा-स्वामी अभी क्या सक्रिय करता है?",
      "विचारा: महादशास्वामी काय टिकवतो आणि अंतर्दशास्वामी सध्या काय सक्रिय करतो?",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "gochara",
    category: "timing",
    name: localized("Transit", "गोचर", "गोचर"),
    summary: localized(
      "Current planetary-body positions compared with a natal chart.",
      "वर्तमान ग्रह-स्थितियों की जन्म-कुंडली से तुलना।",
      "वर्तमान ग्रहस्थितींची जन्मकुंडलीशी तुलना.",
    ),
    detail: localized(
      "A transit indicates temporary symbolic emphasis. Vedic astrology commonly counts from both the ascendant and birth Moon sign. A transit score in this app is a disclosed rule summary—not a probability, fact or promise.",
      "गोचर अस्थायी प्रतीकात्मक जोर बताता है। ज्योतिष में लग्न और जन्म राशि दोनों से गिनती होती है। ऐप का गोचर-अंक स्पष्ट नियमों का सार है—संभाव्यता, तथ्य या वादा नहीं।",
      "गोचर तात्पुरता प्रतीकात्मक भर दर्शवतो. ज्योतिषात लग्न व जन्म राशी दोन्हीपासून मोजणी होते. अ‍ॅपमधील गोचर गुण हा स्पष्ट नियमांचा सारांश आहे—संभाव्यता, तथ्य किंवा हमी नाही.",
    ),
    readingSequence: localized(
      "State the reference point and selected date; combine slow and fast planetary bodies cautiously.",
      "संदर्भ-बिंदु और चुनी तारीख बताएँ; धीमे और तेज ग्रहों को सावधानी से मिलाएँ।",
      "संदर्भबिंदू व निवडलेली तारीख सांगा; मंद व जलद ग्रह सावधपणे एकत्र वाचा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "ayanamsa",
    category: "method",
    name: localized("Sidereal offset", "अयनांश", "अयनांश"),
    summary: localized(
      "The angular offset used to convert tropical longitude to a sidereal frame.",
      "सायन देशांतर को निरयन संदर्भ में बदलने वाला कोणीय अंतर।",
      "सायन रेखांश निरयन संदर्भात बदलण्यासाठीचे कोनीय अंतर.",
    ),
    detail: localized(
      "Different sidereal-offset conventions can move placements near boundaries. This app consistently applies its documented Lahiri model to the ascendant, planetary bodies, zodiac signs and lunar mansions.",
      "अलग अयनांश पद्धतियाँ सीमा के पास स्थिति बदल सकती हैं। यह ऐप लग्न, ग्रह, राशि और नक्षत्र पर दस्तावेजित लाहिड़ी मॉडल लगातार लागू करता है।",
      "वेगवेगळ्या अयनांश पद्धतींमुळे सीमेजवळील स्थान बदलू शकते. हे अ‍ॅप लग्न, ग्रह, राशी व नक्षत्रांसाठी दस्तऐवजीकृत लाहिरी मॉडेल सातत्याने वापरते.",
    ),
    readingSequence: localized(
      "Compare charts only after confirming the same sidereal-offset and node model.",
      "कुंडलियों की तुलना से पहले समान अयनांश और नोड मॉडल सुनिश्चित करें।",
      "कुंडल्या तुलना करण्याआधी समान अयनांश व नोड मॉडेल तपासा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "whole-sign",
    category: "method",
    name: localized(
      "Whole-sign houses",
      "पूर्ण-राशि भाव",
      "पूर्ण-राशी भाव",
    ),
    summary: localized(
      "The ascendant's entire zodiac sign is House 1; each following zodiac sign is the next house.",
      "पूरी लग्न राशि प्रथम भाव और हर अगली राशि अगला भाव बनती है।",
      "संपूर्ण लग्न राशी पहिला भाव व पुढील प्रत्येक राशी पुढचा भाव बनते.",
    ),
    detail: localized(
      "This makes every house boundary a zodiac-sign boundary. The exact ascendant degree remains an important angle but is not a cusp in this system. Other house systems can assign planets differently.",
      "इसमें हर भाव-सीमा राशि-सीमा होती है। लग्न का सटीक अंश महत्वपूर्ण कोण है, पर इस पद्धति में भाव-संधि नहीं। दूसरी भाव पद्धतियाँ ग्रहों को अलग भाव दे सकती हैं।",
      "यात प्रत्येक भावसीमा ही राशीसीमा असते. लग्नाचा अचूक अंश महत्त्वाचा कोन आहे; मात्र या पद्धतीत भावसंधी नाही. इतर भावपद्धती ग्रहांना वेगळे भाव देऊ शकतात.",
    ),
    readingSequence: localized(
      "Keep one house system consistent when comparing natal and transit readings.",
      "जन्म और गोचर पढ़ते समय एक ही भाव-पद्धति लगातार रखें।",
      "जन्म व गोचर वाचताना एकच भावपद्धत सातत्याने वापरा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "shadbala",
    category: "method",
    name: localized("Sixfold strength assessment", "षड्बल", "षड्बल"),
    summary: localized(
      "A classical multi-part system for quantifying six categories of planetary strength.",
      "ग्रह-बल की छह श्रेणियों को मापने वाली शास्त्रीय बहु-भाग पद्धति।",
      "ग्रहबळाच्या सहा श्रेणी मोजणारी शास्त्रीय बहुभागी पद्धत.",
    ),
    detail: localized(
      "The sixfold strength assessment combines positional, directional, temporal, motional, natural and aspect-related components with specific units and thresholds. This app does not calculate it, so it must not call a planetary body 'strong' from that method.",
      "षड्बल स्थान, दिशा, काल, गति, नैसर्गिक और दृष्टि-आधारित घटकों को विशेष इकाइयों और सीमाओं से जोड़ता है। यह ऐप षड्बल नहीं निकालता, इसलिए षड्बल के आधार पर किसी ग्रह को 'बलवान' नहीं कह सकता।",
      "षड्बल स्थान, दिशा, काल, गती, नैसर्गिक व दृष्टीसंबंधित घटक विशिष्ट एकके व मर्यादांनी जोडते. हे अ‍ॅप षड्बल मोजत नाही; म्हणून षड्बलावरून ग्रहाला 'बलवान' म्हणू शकत नाही.",
    ),
    readingSequence: localized(
      "Require a transparent component-by-component calculation before citing a sixfold-strength result.",
      "षड्बल परिणाम बताने से पहले हर घटक की पारदर्शी गणना आवश्यक है।",
      "षड्बल निष्कर्ष सांगण्याआधी प्रत्येक घटकाची पारदर्शक गणना आवश्यक आहे.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "varga",
    category: "method",
    name: localized("Divisional chart", "वर्ग", "वर्ग"),
    summary: localized(
      "A divisional chart derived by mapping portions of each zodiac sign into another zodiac.",
      "हर राशि के अंशों को दूसरे राशि-चक्र में रखकर बनी विभागीय कुंडली।",
      "प्रत्येक राशीचे अंश दुसऱ्या राशिचक्रात नकाशित करून तयार होणारी विभागीय कुंडली.",
    ),
    detail: localized(
      "Divisional charts are used for focused traditional analysis; the ninth-division chart is one example. Exact boundary handling and birth-time precision matter. This app reports the lunar-mansion quarter but does not yet calculate or interpret divisional charts.",
      "वर्ग विशिष्ट पारंपरिक विश्लेषण के लिए उपयोग होते हैं; नवांश एक उदाहरण है। सीमा-गणना और जन्म-समय की शुद्धता महत्वपूर्ण हैं। यह ऐप नक्षत्र-पाद बताता है, पर वर्ग-कुंडली नहीं निकालता या समझाता।",
      "वर्ग विशिष्ट पारंपरिक विश्लेषणासाठी वापरले जातात; नवांश हे उदाहरण. सीमा हाताळणी व जन्मवेळेची अचूकता महत्त्वाची. हे अ‍ॅप नक्षत्रपाद दाखवते; वर्गकुंडली मोजत किंवा अर्थ लावत नाही.",
    ),
    readingSequence: localized(
      "Do not infer a complete ninth-division reading from the quarter alone.",
      "केवल पाद से पूरी नवांश व्याख्या न निकालें।",
      "फक्त पादावरून संपूर्ण नवांश अर्थ काढू नका.",
    ),
    calculationStatus: "not-calculated",
  },
] as const;

type GermanEducationTerm = Readonly<
  Pick<EducationTerm, "id"> & {
    name: string;
    summary: string;
    detail: string;
    readingSequence: string;
  }
>;

const GERMAN_EDUCATION_TERMS: Readonly<
  Record<EducationTermId, GermanEducationTerm>
> = {
  lagna: {
    id: "lagna",
    name: "Aszendent",
    summary:
      "Der siderische Grad, der zur eingegebenen Zeit am angegebenen Ort am östlichen Horizont aufsteigt.",
    detail:
      "Der Aszendent verankert die zwölf Häuser. In der vedischen Astrologie dient er als symbolische Perspektive auf Verkörperung, Temperament und die Art, dem Leben zu begegnen. Er bewegt sich schnell; eine gerundete oder unsichere Geburtszeit kann daher den Aszendenten und alle Häuser verändern.",
    readingSequence:
      "Zuerst sein Tierkreiszeichen und dessen Herrscher, dann Himmelskörper im ersten Haus und schließlich die relevanten Zeitfaktoren lesen. Kein Einzelfaktor ist ein Urteil.",
  },
  rasi: {
    id: "rasi",
    name: "Tierkreiszeichen",
    summary:
      "Einer von zwölf gleich großen 30°-Abschnitten des siderischen Tierkreises.",
    detail:
      "Ein Tierkreiszeichen beschreibt traditionell Stil und Bedingungen, durch die ein Himmelskörper oder Haus interpretiert wird. Ein Tierkreiszeichen ist weder ein Planet noch ein Sternbild oder ein Etikett für die gesamte Persönlichkeit.",
    readingSequence:
      "Zuerst den Himmelskörper oder das Haus bestimmen; danach mit dem Tierkreiszeichen präzisieren, auf welche Weise er beziehungsweise es sich ausdrückt.",
  },
  bhava: {
    id: "bhava",
    name: "Haus",
    summary:
      "Eines von zwölf symbolischen Lebensfeldern, die vom Aszendenten aus gezählt werden.",
    detail:
      "Häuser ordnen Themen wie Körper, Ressourcen, Lernen, Zuhause, Partnerschaft und Arbeit. Gelesen werden Thema, Tierkreiszeichen, Hausherrscher, anwesende Himmelskörper und Zeitfaktoren gemeinsam. Ein leeres Haus ist nicht inaktiv; sein Herrscher verbindet es weiterhin mit dem Geburtshoroskop.",
    readingSequence:
      "Mit dem Thema des Hauses beginnen, dann sein Tierkreiszeichen und dessen Herrscher sowie die anwesenden Himmelskörper ergänzen. Diese App verwendet Ganzzeichenhäuser.",
  },
  graha: {
    id: "graha",
    name: "Himmelskörper",
    summary:
      "Ein symbolischer Akteur der vedischen Astrologie, der eine Erfahrungsfunktion verkörpert.",
    detail:
      "Die neun Himmelskörper sind hier Sonne, Mond, Mars, Merkur, Jupiter, Venus, Saturn, Nordknoten und Südknoten. Sonne und Mond sind Leuchtkörper; Nord- und Südknoten sind mathematische Mondknoten. Alle neun als „Planeten“ zu bezeichnen ist eine traditionelle Vereinfachung, keine astronomische Behauptung.",
    readingSequence:
      "Der Himmelskörper beschreibt welche Funktion, das Tierkreiszeichen wie und das Haus wo. Zustand und Zeitfaktoren liefern den weiteren Kontext.",
  },
  nakshatra: {
    id: "nakshatra",
    name: "Mondstation",
    summary:
      "Einer von 27 gleich großen Mondstations-Abschnitten mit jeweils 13°20′.",
    detail:
      "Mondstationen bilden eine feinere traditionelle Symbolebene. Die Geburts-Mondstation des Mondes bestimmt den Beginn der Vimshottari-Abfolge. Bilder und Persönlichkeitsbeschreibungen der Mondstationen sind Auslegungstraditionen, keine gemessenen psychologischen Eigenschaften.",
    readingSequence:
      "Nach Himmelskörper, Tierkreiszeichen und Haus lesen; ein einzelnes Bild oder eine Gottheit niemals in eine wörtliche Vorhersage verwandeln.",
  },
  pada: {
    id: "pada",
    name: "Viertel",
    summary:
      "Eines von vier gleich großen Vierteln zu je 3°20′ innerhalb einer Mondstation.",
    detail:
      "Ein Viertel verfeinert eine Mondstationsposition und verbindet sie mit einer neunten Unterteilung. Diese App berechnet die Viertelnummer, erstellt oder interpretiert derzeit jedoch kein neuntes Teilhoroskop.",
    readingSequence:
      "Das Viertel als Verfeinerung lesen, nicht als Ersatz für das gesamte Geburtshoroskop.",
  },
  "nakshatra-lord": {
    id: "nakshatra-lord",
    name: "Herrscher der Mondstation",
    summary:
      "Der Himmelskörper, der einer Mondstation in der wiederkehrenden Vimshottari-Abfolge zugeordnet ist.",
    detail:
      "Die Reihenfolge Südknoten, Venus, Sonne, Mond, Mars, Nordknoten, Jupiter, Saturn und Merkur wiederholt sich über alle 27 Mondstationen. Der Herrscher schafft eine traditionelle Deutungsverbindung zu seiner Stellung im Geburtshoroskop; er ist nicht mit dem Tierkreiszeichen- oder Hausherrscher gleichzusetzen.",
    readingSequence:
      "Zuerst den Himmelskörper in der Mondstation bestimmen; anschließend Tierkreiszeichen und Haus des Mondstationsherrschers aufsuchen.",
  },
  "bhava-lord": {
    id: "bhava-lord",
    name: "Hausherrscher",
    summary:
      "Der Himmelskörper, der das Tierkreiszeichen eines Hauses beherrscht.",
    detail:
      "Der Hausherrscher verbindet sein Ausgangshaus mit dem Haus, in dem dieser Himmelskörper steht. Das ist eine traditionelle thematische Verbindung und kein Beleg dafür, dass ein bestimmtes Ereignis eintreten wird.",
    readingSequence:
      "Das Tierkreiszeichen des Hauses und dessen Herrscher bestimmen; danach Stellung und Zustand dieses Herrschers untersuchen.",
  },
  "lagna-lord": {
    id: "lagna-lord",
    name: "Herrscher des Aszendenten",
    summary:
      "Der Himmelskörper, der das Tierkreiszeichen des Aszendenten beherrscht.",
    detail:
      "Der Herrscher des Aszendenten gilt symbolisch als Träger von Lebenskraft und Lebensorientierung. Seine Hausstellung verbindet Themen des ersten Hauses mit einem weiteren Lebensfeld; sein Tierkreiszeichen beschreibt den Stil. Aussagen über Stärke erfordern Methoden, die diese App teilweise nicht berechnet.",
    readingSequence:
      "Aszendent und dessen Herrscher gemeinsam lesen; eine Person niemals allein aus einem der beiden Faktoren ableiten.",
  },
  "janma-rasi": {
    id: "janma-rasi",
    name: "Geburts-Mondzeichen",
    summary:
      "Das Tierkreiszeichen, in dem der Mond zum Zeitpunkt der Geburt steht.",
    detail:
      "Das Geburts-Mondzeichen dient als Bezugspunkt für emotionale Symbolik und für die Zählung von Transiten relativ zum Mond. Es ergänzt den Aszendenten, ersetzt ihn jedoch nicht.",
    readingSequence:
      "Mondbezogene Themen mit den vom Aszendenten gezählten Häusern vergleichen. Unterschiede zeigen verschiedene Perspektiven, nicht zwangsläufig einen Fehler.",
  },
  drishti: {
    id: "drishti",
    name: "Aspekt",
    summary:
      "Eine traditionelle Aspektregel, nach der ein Himmelskörper oder Tierkreiszeichen auf einen anderen beziehungsweise ein anderes einwirkt.",
    detail:
      "Die vedische Astrologie kennt Aspektsysteme für Himmelskörper und Tierkreiszeichen; Traditionen gewichten sie unterschiedlich. Diese App berechnet derzeit keine klassischen Aspekte, Aspektstärken oder Orben. Hinweise darauf sind daher Lerninhalte und keine Befunde des Geburtshoroskops.",
    readingSequence:
      "Vor jeder Interpretation ein Aspektsystem auswählen und transparent benennen.",
  },
  yuti: {
    id: "yuti",
    name: "Konjunktion",
    summary:
      "Zwei oder mehr Himmelskörper im selben Tierkreiszeichen oder innerhalb eines festgelegten Winkelabstands.",
    detail:
      "Eine Konjunktion im selben Tierkreiszeichen ist eine breite Definition; enger Gradkontakt ist spezifischer. Verschiedene Schulen verwenden unterschiedliche Orben. Die App zeigt Längengrade, bewertet jedoch weder die Stärke einer Konjunktion noch diese automatisch als förderlich oder schwierig.",
    readingSequence:
      "Vor der Synthese den tatsächlichen Winkelabstand und die jeweilige Rolle jedes Himmelskörpers prüfen.",
  },
  dignity: {
    id: "dignity",
    name: "Planetenzustand / Würde",
    summary:
      "Traditionelle Kategorien dafür, wie stimmig oder wirksam sich ein Himmelskörper in einem Tierkreiszeichen ausdrücken kann.",
    detail:
      "Dazu gehören eigenes Tierkreiszeichen, Erhöhung, Schwächung, Freundschaft und Feindschaft. Würde modifiziert die Ausdrucksweise; sie macht weder eine Person noch ein Lebensfeld einfach gut oder schlecht. Diese App berechnet noch kein vollständiges Würdemodell.",
    readingSequence:
      "Würde als einen Modifikator neben Haus, Herrschaft, Bewegung, Aspekten und Zeitfaktoren behandeln.",
  },
  vakri: {
    id: "vakri",
    name: "Rückläufigkeit",
    summary:
      "Die scheinbare Rückwärtsbewegung im geozentrischen Tierkreis-Längengrad.",
    detail:
      "Rückläufige Bewegung ist ein astronomischer Perspektiveffekt. Traditionelle Deutungen verbinden sie teils mit Überprüfung, Intensität oder nichtlinearem Ausdruck; sie kehrt einen Himmelskörper jedoch nicht automatisch um und macht ihn nicht automatisch schädlich.",
    readingSequence:
      "Zuerst Himmelskörper, Tierkreiszeichen, Haus und Herrschaft lesen; Rückläufigkeit ist ein zusätzlicher Modifikator.",
  },
  "rahu-ketu": {
    id: "rahu-ketu",
    name: "Mondknoten",
    summary:
      "Die einander gegenüberliegenden aufsteigenden und absteigenden Knoten der Mondbahn.",
    detail:
      "Sie sind mathematische Punkte der Finsternisgeometrie und keine physischen Planeten. Die vedische Astrologie verbindet den Nordknoten häufig mit Verstärkung und ungewohntem Begehren, den Südknoten mit Trennung und nach innen gerichteter Unterscheidung. Das sind symbolische Perspektiven, keine Diagnosen.",
    readingSequence:
      "Diese App verwendet mittlere Knoten; Positionen wahrer Knoten können nahe einer Grenze abweichen.",
  },
  dasha: {
    id: "dasha",
    name: "Planetenperiode",
    summary:
      "Ein traditionelles System planetarer Perioden zur Gliederung symbolischer Zeit.",
    detail:
      "Eine Planetenperiode betont die Geburtsthemen ihres Herrschers. Sie ist kein Transit und garantiert kein Ereignis. Diese App verwendet Vimshottari-Zeitperioden aus der Mondstation des Mondes; daneben bestehen weitere Planetenperiodensysteme.",
    readingSequence:
      "Den Periodenherrscher im Geburtshoroskop lokalisieren und danach Unterperiode sowie aktuellen Transitkontext ergänzen.",
  },
  "mahadasha-antardasha": {
    id: "mahadasha-antardasha",
    name: "Haupt- und Unterperiode",
    summary:
      "Ein umfassendes planetares Kapitel und seine kürzere, darin verschachtelte Unterperiode.",
    detail:
      "Die Hauptperiode liefert das Hintergrundthema; die Unterperiode verschiebt den näheren Fokus. Die Kombination wird über Geburtsstellungen und Herrschaften beider Himmelskörper gelesen. Ein allgemeiner Text über ein Herrscherpaar kann diesen Kontext des Geburtshoroskops nicht ersetzen.",
    readingSequence:
      "Fragen, was der Herrscher der Hauptperiode langfristig trägt und was der Herrscher der Unterperiode aktuell aktiviert.",
  },
  gochara: {
    id: "gochara",
    name: "Transit",
    summary:
      "Aktuelle Positionen der Himmelskörper im Vergleich mit einem Geburtshoroskop.",
    detail:
      "Ein Transit beschreibt eine vorübergehende symbolische Betonung. In der vedischen Astrologie wird häufig sowohl vom Aszendenten als auch vom Geburts-Mondzeichen gezählt. Ein Transitwert dieser App ist eine offengelegte Regelzusammenfassung, keine Wahrscheinlichkeit, Tatsache oder Zusage.",
    readingSequence:
      "Bezugspunkt und ausgewähltes Datum nennen; langsame und schnelle Himmelskörper nur mit Vorsicht zusammenführen.",
  },
  ayanamsa: {
    id: "ayanamsa",
    name: "Siderischer Versatz",
    summary:
      "Der Winkelversatz zur Umrechnung tropischer Längengrade in einen siderischen Bezugsrahmen.",
    detail:
      "Verschiedene Konventionen für den siderischen Versatz können Positionen nahe einer Grenze verschieben. Diese App wendet ihr dokumentiertes Lahiri-Modell einheitlich auf Aszendent, Himmelskörper, Tierkreiszeichen und Mondstationen an.",
    readingSequence:
      "Geburtshoroskope erst vergleichen, nachdem dasselbe Modell für siderischen Versatz und Mondknoten bestätigt wurde.",
  },
  "whole-sign": {
    id: "whole-sign",
    name: "Ganzzeichenhäuser",
    summary:
      "Das gesamte Tierkreiszeichen des Aszendenten bildet Haus 1; jedes folgende Tierkreiszeichen bildet das nächste Haus.",
    detail:
      "Damit entspricht jede Hausgrenze einer Tierkreiszeichengrenze. Der genaue Aszendentengrad bleibt ein wichtiger Winkel, ist in diesem System aber keine Häuserspitze. Andere Häusersysteme können Himmelskörper anderen Häusern zuordnen.",
    readingSequence:
      "Beim Vergleich von Geburts- und Transitdeutungen durchgehend dasselbe Häusersystem verwenden.",
  },
  shadbala: {
    id: "shadbala",
    name: "Sechsfache Stärkebewertung",
    summary:
      "Ein klassisches mehrteiliges System zur Quantifizierung von sechs Kategorien planetarer Stärke.",
    detail:
      "Die sechsfache Stärkebewertung kombiniert positions-, richtungs-, zeit-, bewegungs-, natur- und aspektbezogene Komponenten mit bestimmten Einheiten und Schwellenwerten. Diese App berechnet sie nicht und darf deshalb keinen Himmelskörper aufgrund dieser Methode als „stark“ bezeichnen.",
    readingSequence:
      "Vor jeder Aussage zur sechsfachen Stärke eine transparente Berechnung jeder einzelnen Komponente verlangen.",
  },
  varga: {
    id: "varga",
    name: "Teilhoroskop",
    summary:
      "Ein Teilhoroskop, das Abschnitte jedes Tierkreiszeichens einem weiteren Tierkreis zuordnet.",
    detail:
      "Teilhoroskope werden für fokussierte traditionelle Analysen verwendet; das neunte Teilhoroskop ist ein Beispiel. Exakte Grenzbehandlung und präzise Geburtszeit sind wichtig. Diese App zeigt das Viertel der Mondstation, berechnet oder interpretiert derzeit jedoch keine Teilhoroskope.",
    readingSequence:
      "Aus dem Viertel allein keine vollständige Deutung des neunten Teilhoroskops ableiten.",
  },
};

function addGerman(value: LocalizedText, de: string): LocalizedText {
  return { ...value, de };
}

export const EDUCATION_TERMS: readonly EducationTerm[] =
  BASE_EDUCATION_TERMS.map((term) => {
    const german = GERMAN_EDUCATION_TERMS[term.id];
    return {
      ...term,
      name: addGerman(term.name, german.name),
      summary: addGerman(term.summary, german.summary),
      detail: addGerman(term.detail, german.detail),
      readingSequence: addGerman(
        term.readingSequence,
        german.readingSequence,
      ),
    };
  });

const ASTRO_TERM_TO_EDUCATION: Readonly<
  Record<AstroTermId, EducationTermId>
> = {
  lagna: "lagna",
  graha: "graha",
  rasi: "rasi",
  "janma-rasi": "janma-rasi",
  bhava: "bhava",
  "whole-sign-house": "whole-sign",
  "house-lord": "bhava-lord",
  nakshatra: "nakshatra",
  pada: "pada",
  "nakshatra-lord": "nakshatra-lord",
  ayanamsa: "ayanamsa",
  lahiri: "ayanamsa",
  retrograde: "vakri",
  gochara: "gochara",
  dasha: "dasha",
  vimshottari: "dasha",
  mahadasha: "mahadasha-antardasha",
  antardasha: "mahadasha-antardasha",
  "rahu-ketu": "rahu-ketu",
};

const EDUCATION_BY_ID = Object.fromEntries(
  EDUCATION_TERMS.map((term) => [term.id, term]),
) as Record<EducationTermId, EducationTerm>;

export function getEducationTerm(id: EducationTermId): EducationTerm {
  return EDUCATION_BY_ID[id];
}

/**
 * Bridges the existing inline AstroTerm IDs to the richer multilingual guide.
 * A few related inline terms intentionally share one foundational article.
 */
export function getEducationForAstroTerm(id: AstroTermId): EducationTerm {
  return getEducationTerm(ASTRO_TERM_TO_EDUCATION[id]);
}

export interface GrahaEducationProfile {
  id: GrahaId;
  name: LocalizedText;
  astronomicalKind: LocalizedText;
  signifies: LocalizedText;
  constructive: LocalizedText;
  caution: LocalizedText;
  inquiry: LocalizedText;
}

const BASE_GRAHA_EDUCATION: Readonly<
  Record<GrahaId, GrahaEducationProfile>
> = {
  sun: {
    id: "sun",
    name: localized("Sun", "सूर्य", "सूर्य"),
    astronomicalKind: localized("luminary: star", "ज्योति-पिंड: तारा", "ज्योतिर्गोल: तारा"),
    signifies: localized(
      "identity, vitality, visibility, authority and purpose",
      "पहचान, जीवन-शक्ति, दृश्यता, अधिकार और उद्देश्य",
      "ओळख, जीवनशक्ती, दृश्यता, अधिकार आणि उद्देश",
    ),
    constructive: localized(
      "clear direction, responsible leadership and coherent self-expression",
      "स्पष्ट दिशा, उत्तरदायी नेतृत्व और सुसंगत आत्म-अभिव्यक्ति",
      "स्पष्ट दिशा, जबाबदार नेतृत्व आणि सुसंगत आत्मअभिव्यक्ती",
    ),
    caution: localized(
      "over-identification, pride, dominance or dependence on recognition",
      "अति-अहम्, गर्व, वर्चस्व या मान्यता पर निर्भरता",
      "अति-अहंभाव, गर्व, वर्चस्व किंवा मान्यतेवर अवलंबन",
    ),
    inquiry: localized(
      "Where can I act with integrity without needing to control the result?",
      "मैं परिणाम को नियंत्रित किए बिना कहाँ ईमानदारी से नेतृत्व कर सकता/सकती हूँ?",
      "परिणामावर नियंत्रण न ठेवता मी कुठे प्रामाणिकपणे नेतृत्व करू शकतो/शकते?",
    ),
  },
  moon: {
    id: "moon",
    name: localized("Moon", "चंद्र", "चंद्र"),
    astronomicalKind: localized("luminary: natural satellite", "ज्योति-पिंड: प्राकृतिक उपग्रह", "ज्योतिर्गोल: नैसर्गिक उपग्रह"),
    signifies: localized(
      "mind, feeling, habit, care, memory and responsiveness",
      "मन, भावना, आदत, पोषण, स्मृति और प्रतिक्रिया",
      "मन, भावना, सवय, संगोपन, स्मृती आणि प्रतिसाद",
    ),
    constructive: localized(
      "emotional attunement, adaptability, belonging and restorative rhythm",
      "भावनात्मक सामंजस्य, अनुकूलन, अपनापन और पुनर्स्थापक लय",
      "भावनिक समरसता, जुळवून घेणे, आपलेपणा आणि पुनर्स्थापक लय",
    ),
    caution: localized(
      "reactivity, mood-led decisions, over-accommodation or clinging",
      "अति-प्रतिक्रिया, मनोदशा-आधारित निर्णय, अति-समायोजन या आसक्ति",
      "अति-प्रतिक्रिया, मनःस्थितीवरचे निर्णय, अति-जुळवून घेणे किंवा आसक्ती",
    ),
    inquiry: localized(
      "What rhythm helps me respond rather than merely react?",
      "कौन-सी दिनचर्या मुझे केवल प्रतिक्रिया के बजाय समझदारी से उत्तर देने में मदद करती है?",
      "कोणती लय मला केवळ प्रतिक्रिया न देता समजूतदार प्रतिसाद द्यायला मदत करते?",
    ),
  },
  mars: {
    id: "mars",
    name: localized("Mars", "मंगल", "मंगळ"),
    astronomicalKind: localized("physical planet", "भौतिक ग्रह", "भौतिक ग्रह"),
    signifies: localized(
      "action, courage, boundary, competition, heat and technical force",
      "कर्म, साहस, सीमा, प्रतिस्पर्धा, ताप और तकनीकी शक्ति",
      "कृती, धैर्य, सीमा, स्पर्धा, उष्णता आणि तांत्रिक शक्ती",
    ),
    constructive: localized(
      "decisive effort, protection, stamina and direct problem-solving",
      "निर्णायक प्रयास, सुरक्षा, सहनशक्ति और सीधा समस्या-समाधान",
      "निर्णायक प्रयत्न, संरक्षण, सहनशक्ती आणि थेट समस्यासमाधान",
    ),
    caution: localized(
      "haste, conflict, injury-prone overdrive or treating every issue as a contest",
      "जल्दबाजी, संघर्ष, चोट का जोखिम या हर विषय को प्रतियोगिता मानना",
      "घाई, संघर्ष, दुखापतीचा धोका किंवा प्रत्येक विषयाला स्पर्धा मानणे",
    ),
    inquiry: localized(
      "What deserves direct action, and what needs restraint?",
      "किस विषय पर सीधी कार्रवाई और किस पर संयम चाहिए?",
      "कशावर थेट कृती आणि कशावर संयम आवश्यक आहे?",
    ),
  },
  mercury: {
    id: "mercury",
    name: localized("Mercury", "बुध", "बुध"),
    astronomicalKind: localized("physical planet", "भौतिक ग्रह", "भौतिक ग्रह"),
    signifies: localized(
      "reason, language, learning, exchange, classification and adaptation",
      "तर्क, भाषा, सीख, विनिमय, वर्गीकरण और अनुकूलन",
      "तर्क, भाषा, शिक्षण, देवाणघेवाण, वर्गीकरण आणि अनुकूलन",
    ),
    constructive: localized(
      "curiosity, precise communication, useful analysis and flexible skill",
      "जिज्ञासा, सटीक संवाद, उपयोगी विश्लेषण और लचीला कौशल",
      "कुतूहल, अचूक संवाद, उपयुक्त विश्लेषण आणि लवचिक कौशल्य",
    ),
    caution: localized(
      "over-analysis, scattered attention, cleverness without ethics or nervous speed",
      "अति-विश्लेषण, बिखरा ध्यान, नैतिकता-विहीन चतुराई या बेचैन गति",
      "अति-विश्लेषण, विखुरलेले लक्ष, नैतिकतेविना चातुर्य किंवा अस्वस्थ वेग",
    ),
    inquiry: localized(
      "Which facts need checking before I form a conclusion?",
      "निष्कर्ष बनाने से पहले किन तथ्यों की जाँच आवश्यक है?",
      "निष्कर्षापूर्वी कोणती तथ्ये तपासणे आवश्यक आहेत?",
    ),
  },
  jupiter: {
    id: "jupiter",
    name: localized("Jupiter", "गुरु", "गुरु"),
    astronomicalKind: localized("physical planet", "भौतिक ग्रह", "भौतिक ग्रह"),
    signifies: localized(
      "meaning, ethics, counsel, growth, teaching and confidence",
      "अर्थ, नीति, परामर्श, विस्तार, शिक्षा और विश्वास",
      "अर्थ, नीती, सल्ला, विस्तार, शिक्षण आणि विश्वास",
    ),
    constructive: localized(
      "perspective, generosity, principled growth and wise guidance",
      "व्यापक दृष्टि, उदारता, सिद्धांतपूर्ण विकास और विवेकपूर्ण मार्गदर्शन",
      "व्यापक दृष्टी, उदारता, तत्त्वनिष्ठ वाढ आणि सुज्ञ मार्गदर्शन",
    ),
    caution: localized(
      "excess, overconfidence, dogma, moralizing or promises beyond capacity",
      "अति, अति-विश्वास, कट्टरता, उपदेश या क्षमता से बड़े वादे",
      "अतिरेक, अतिआत्मविश्वास, कट्टरता, उपदेश किंवा क्षमतेपलीकडील आश्वासने",
    ),
    inquiry: localized(
      "What belief is supported by evidence and lived ethics?",
      "कौन-सा विश्वास प्रमाण और आचरण—दोनों से समर्थित है?",
      "कोणता विश्वास पुरावा आणि आचरण या दोन्हींनी समर्थित आहे?",
    ),
  },
  venus: {
    id: "venus",
    name: localized("Venus", "शुक्र", "शुक्र"),
    astronomicalKind: localized("physical planet", "भौतिक ग्रह", "भौतिक ग्रह"),
    signifies: localized(
      "relationship, attraction, value, pleasure, art and agreement",
      "संबंध, आकर्षण, मूल्य, आनंद, कला और सहमति",
      "संबंध, आकर्षण, मूल्य, आनंद, कला आणि सहमती",
    ),
    constructive: localized(
      "reciprocity, aesthetic intelligence, diplomacy and sustainable enjoyment",
      "पारस्परिकता, सौंदर्य-बुद्धि, कूटनीति और संतुलित आनंद",
      "परस्परता, सौंदर्यबुद्धी, मुत्सद्देगिरी आणि शाश्वत आनंद",
    ),
    caution: localized(
      "appeasement, indulgence, avoidance of necessary conflict or valuing appearance over substance",
      "तुष्टीकरण, भोग, आवश्यक संघर्ष से बचना या सार से अधिक दिखावे को मानना",
      "तुष्टीकरण, भोग, आवश्यक संघर्ष टाळणे किंवा आशयापेक्षा देखाव्याला महत्त्व देणे",
    ),
    inquiry: localized(
      "What creates mutual value rather than short-term approval?",
      "क्या चीज़ अल्पकालीन स्वीकृति के बजाय पारस्परिक मूल्य बनाती है?",
      "अल्पकालीन मान्यतेऐवजी परस्पर मूल्य काय निर्माण करते?",
    ),
  },
  saturn: {
    id: "saturn",
    name: localized("Saturn", "शनि", "शनि"),
    astronomicalKind: localized("physical planet", "भौतिक ग्रह", "भौतिक ग्रह"),
    signifies: localized(
      "time, duty, constraint, endurance, structure and consequence",
      "समय, कर्तव्य, सीमा, धैर्य, संरचना और परिणाम",
      "काळ, कर्तव्य, मर्यादा, धैर्य, रचना आणि परिणाम",
    ),
    constructive: localized(
      "patience, accountability, durable systems and earned competence",
      "धैर्य, उत्तरदायित्व, टिकाऊ व्यवस्था और अर्जित क्षमता",
      "संयम, जबाबदारी, टिकाऊ व्यवस्था आणि कमावलेले कौशल्य",
    ),
    caution: localized(
      "fear, rigidity, deprivation stories, delay or punitive self-judgment",
      "भय, कठोरता, अभाव-कथा, विलंब या दंडात्मक आत्म-निर्णय",
      "भीती, कठोरता, अभावकथा, विलंब किंवा दंडात्मक आत्मनिर्णय",
    ),
    inquiry: localized(
      "What small duty, repeated consistently, would create real stability?",
      "कौन-सा छोटा कर्तव्य लगातार निभाने से वास्तविक स्थिरता बनेगी?",
      "कोणते छोटे कर्तव्य सातत्याने केल्यास खरी स्थिरता निर्माण होईल?",
    ),
  },
  rahu: {
    id: "rahu",
    name: localized("North Node", "राहु", "राहू"),
    astronomicalKind: localized("mean ascending lunar node", "मध्यम आरोही चंद्र-नोड", "मध्यम आरोही चंद्रनोड"),
    signifies: localized(
      "amplification, appetite, novelty, foreignness, disruption and worldly experimentation",
      "विस्तार, लालसा, नवीनता, अपरिचितता, विघटन और सांसारिक प्रयोग",
      "विस्तार, ओढ, नावीन्य, अपरिचितता, व्यत्यय आणि लौकिक प्रयोग",
    ),
    constructive: localized(
      "innovation, crossing stale boundaries and learning through unfamiliar experience",
      "नवाचार, जड़ सीमाएँ पार करना और अपरिचित अनुभव से सीखना",
      "नावीन्य, जुन्या सीमा ओलांडणे आणि अपरिचित अनुभवातून शिकणे",
    ),
    caution: localized(
      "obsession, distortion, endless escalation, shortcuts or mistaking novelty for value",
      "आसक्ति, विकृति, अंतहीन विस्तार, शॉर्टकट या नवीनता को मूल्य समझना",
      "ध्यास, विकृती, अंतहीन वाढ, शॉर्टकट किंवा नावीन्यालाच मूल्य समजणे",
    ),
    inquiry: localized(
      "Is this desire expanding capacity or only intensifying restlessness?",
      "क्या यह इच्छा क्षमता बढ़ा रही है या केवल बेचैनी?",
      "ही इच्छा क्षमता वाढवते आहे की फक्त अस्वस्थता?",
    ),
  },
  ketu: {
    id: "ketu",
    name: localized("South Node", "केतु", "केतू"),
    astronomicalKind: localized("mean descending lunar node", "मध्यम अवरोही चंद्र-नोड", "मध्यम अवरोही चंद्रनोड"),
    signifies: localized(
      "separation, inwardness, pattern recognition, discontinuity and release",
      "विरक्ति, अंतर्मुखता, पैटर्न-पहचान, विच्छेद और मुक्ति",
      "विलगता, अंतर्मुखता, आकृतिबंध ओळख, खंड आणि मुक्तता",
    ),
    constructive: localized(
      "discernment, simplification, concentrated insight and freedom from stale identification",
      "विवेक, सरलता, केंद्रित अंतर्दृष्टि और पुरानी पहचान से स्वतंत्रता",
      "विवेक, साधेपणा, केंद्रित अंतर्दृष्टी आणि जुन्या ओळखीपासून स्वातंत्र्य",
    ),
    caution: localized(
      "withdrawal, fragmentation, dismissal, loss of context or premature detachment",
      "अलगाव, विखंडन, उपेक्षा, संदर्भ खोना या समयपूर्व विरक्ति",
      "माघार, विखंडन, उपेक्षा, संदर्भ गमावणे किंवा अकाली अलिप्तता",
    ),
    inquiry: localized(
      "What can be released without abandoning necessary responsibility?",
      "आवश्यक उत्तरदायित्व छोड़े बिना क्या मुक्त किया जा सकता है?",
      "आवश्यक जबाबदारी न सोडता काय मुक्त करता येईल?",
    ),
  },
};

type GermanGrahaProfile = Readonly<{
  name: string;
  astronomicalKind: string;
  signifies: string;
  constructive: string;
  caution: string;
  inquiry: string;
}>;

const GERMAN_GRAHA_EDUCATION: Readonly<
  Record<GrahaId, GermanGrahaProfile>
> = {
  sun: {
    name: "Sonne",
    astronomicalKind: "Leuchtkörper: Stern",
    signifies:
      "Identität, Lebenskraft, Sichtbarkeit, Autorität und Zielorientierung",
    constructive:
      "klare Ausrichtung, verantwortliche Führung und stimmiger Selbstausdruck",
    caution:
      "Überidentifikation, Stolz, Dominanz oder Abhängigkeit von Anerkennung",
    inquiry:
      "Wo kann ich integer handeln, ohne das Ergebnis kontrollieren zu müssen?",
  },
  moon: {
    name: "Mond",
    astronomicalKind: "Leuchtkörper: natürlicher Satellit",
    signifies:
      "Geist, Gefühl, Gewohnheit, Fürsorge, Erinnerung und Reaktionsfähigkeit",
    constructive:
      "emotionale Feinabstimmung, Anpassungsfähigkeit, Zugehörigkeit und erholsamer Rhythmus",
    caution:
      "Reaktivität, stimmungsgeleitete Entscheidungen, übermäßige Anpassung oder Festhalten",
    inquiry:
      "Welcher Rhythmus hilft mir zu antworten, statt nur zu reagieren?",
  },
  mars: {
    name: "Mars",
    astronomicalKind: "physischer Planet",
    signifies:
      "Handlung, Mut, Grenzen, Wettbewerb, Hitze und technische Kraft",
    constructive:
      "entschlossener Einsatz, Schutz, Ausdauer und direkte Problemlösung",
    caution:
      "Hast, Konflikt, verletzungsträchtige Übersteuerung oder jedes Problem als Wettkampf zu behandeln",
    inquiry:
      "Was verlangt direkte Handlung, und wo ist Zurückhaltung angemessen?",
  },
  mercury: {
    name: "Merkur",
    astronomicalKind: "physischer Planet",
    signifies:
      "Vernunft, Sprache, Lernen, Austausch, Einordnung und Anpassung",
    constructive:
      "Neugier, präzise Kommunikation, nützliche Analyse und flexible Fähigkeiten",
    caution:
      "Überanalyse, zerstreute Aufmerksamkeit, Schläue ohne Ethik oder nervöse Hast",
    inquiry:
      "Welche Fakten muss ich prüfen, bevor ich eine Schlussfolgerung bilde?",
  },
  jupiter: {
    name: "Jupiter",
    astronomicalKind: "physischer Planet",
    signifies:
      "Sinn, Ethik, Beratung, Wachstum, Lehren und Zuversicht",
    constructive:
      "Perspektive, Großzügigkeit, prinzipiengeleitetes Wachstum und weise Orientierung",
    caution:
      "Übermaß, Selbstüberschätzung, Dogmatismus, Moralisieren oder Versprechen jenseits der eigenen Möglichkeiten",
    inquiry:
      "Welche Überzeugung wird sowohl durch Belege als auch durch gelebte Ethik gestützt?",
  },
  venus: {
    name: "Venus",
    astronomicalKind: "physischer Planet",
    signifies:
      "Beziehung, Anziehung, Werte, Genuss, Kunst und Übereinkunft",
    constructive:
      "Gegenseitigkeit, ästhetische Intelligenz, Diplomatie und nachhaltiger Genuss",
    caution:
      "Beschwichtigung, Maßlosigkeit, Vermeidung notwendiger Konflikte oder Schein über Substanz zu stellen",
    inquiry:
      "Was schafft gegenseitigen Wert statt nur kurzfristiger Zustimmung?",
  },
  saturn: {
    name: "Saturn",
    astronomicalKind: "physischer Planet",
    signifies:
      "Zeit, Pflicht, Begrenzung, Ausdauer, Struktur und Konsequenz",
    constructive:
      "Geduld, Verantwortlichkeit, belastbare Systeme und erworbene Kompetenz",
    caution:
      "Angst, Starrheit, Mangelgeschichten, Verzögerung oder strafende Selbstbeurteilung",
    inquiry:
      "Welche kleine, konsequent wiederholte Pflicht würde echte Stabilität schaffen?",
  },
  rahu: {
    name: "Nordknoten",
    astronomicalKind: "mittlerer aufsteigender Mondknoten",
    signifies:
      "Verstärkung, Begehren, Neuheit, Fremdheit, Störung und weltliches Experimentieren",
    constructive:
      "Innovation, überholte Grenzen überschreiten und durch unvertraute Erfahrung lernen",
    caution:
      "Besessenheit, Verzerrung, endlose Steigerung, Abkürzungen oder Neuheit mit Wert zu verwechseln",
    inquiry:
      "Erweitert dieses Begehren meine Fähigkeiten oder verstärkt es nur die Unruhe?",
  },
  ketu: {
    name: "Südknoten",
    astronomicalKind: "mittlerer absteigender Mondknoten",
    signifies:
      "Trennung, Innerlichkeit, Mustererkennung, Unterbrechung und Loslassen",
    constructive:
      "Unterscheidungsvermögen, Vereinfachung, konzentrierte Einsicht und Freiheit von überholter Identifikation",
    caution:
      "Rückzug, Fragmentierung, Abwertung, Kontextverlust oder voreilige Loslösung",
    inquiry:
      "Was kann ich loslassen, ohne notwendige Verantwortung aufzugeben?",
  },
};

export const GRAHA_EDUCATION: Readonly<
  Record<GrahaId, GrahaEducationProfile>
> = Object.fromEntries(
  GRAHA_IDS.map((id) => {
    const profile = BASE_GRAHA_EDUCATION[id];
    const german = GERMAN_GRAHA_EDUCATION[id];
    return [
      id,
      {
        ...profile,
        name: addGerman(profile.name, german.name),
        astronomicalKind: addGerman(
          profile.astronomicalKind,
          german.astronomicalKind,
        ),
        signifies: addGerman(profile.signifies, german.signifies),
        constructive: addGerman(
          profile.constructive,
          german.constructive,
        ),
        caution: addGerman(profile.caution, german.caution),
        inquiry: addGerman(profile.inquiry, german.inquiry),
      },
    ];
  }),
) as Record<GrahaId, GrahaEducationProfile>;

export interface BhavaEducationProfile {
  number: HouseNumber;
  name: LocalizedText;
  domain: LocalizedText;
  constructive: LocalizedText;
  caution: LocalizedText;
  constructiveDetail: LocalizedText;
  cautionDetail: LocalizedText;
}

type BhavaCoreEducationProfile = Omit<
  BhavaEducationProfile,
  "constructiveDetail" | "cautionDetail"
>;

const BHAVA_ROWS: readonly [
  HouseNumber,
  LocalizedText,
  LocalizedText,
  LocalizedText,
  LocalizedText,
][] = [
  [1, localized("House of self and body", "तनु भाव", "तनु भाव"), localized("body, identity, vitality and approach", "शरीर, पहचान, जीवन-शक्ति और जीवन-दृष्टि", "शरीर, ओळख, जीवनशक्ती आणि जीवनदृष्टी"), localized("embodied self-awareness and proportionate initiative", "शरीर-जागरूकता और संतुलित पहल", "देहजाणीव आणि संतुलित पुढाकार"), localized("self-absorption or defining the whole person by appearance", "आत्म-केंद्रण या रूप से पूरे व्यक्ति को परिभाषित करना", "आत्मकेंद्रीपणा किंवा रूपावरून संपूर्ण व्यक्ती ठरवणे")],
  [2, localized("House of resources and speech", "धन भाव", "धन भाव"), localized("resources, speech, family continuity, food and values", "संसाधन, वाणी, परिवार-निरंतरता, भोजन और मूल्य", "साधने, वाणी, कुटुंबसातत्य, अन्न आणि मूल्ये"), localized("careful stewardship, truthful speech and stable priorities", "सावधान संसाधन-प्रबंधन, सत्य वाणी और स्थिर प्राथमिकताएँ", "काळजीपूर्वक साधनव्यवस्थापन, सत्य वाणी आणि स्थिर प्राधान्ये"), localized("possessiveness, harsh speech or equating worth with wealth", "अधिकारभाव, कठोर वाणी या मूल्य को धन से जोड़ना", "मालकीभाव, कठोर वाणी किंवा स्वमूल्याला संपत्तीशी जोडणे")],
  [3, localized("House of courage and skills", "सहज भाव", "सहज भाव"), localized("effort, courage, skills, communication and siblings", "प्रयास, साहस, कौशल, संचार और सहोदर", "प्रयत्न, धैर्य, कौशल्य, संवाद आणि भावंडे"), localized("practiced skill, brave communication and self-directed effort", "अभ्यस्त कौशल, साहसी संवाद और स्व-निर्देशित प्रयास", "सरावलेले कौशल्य, धैर्यपूर्ण संवाद आणि स्वप्रेरित प्रयत्न"), localized("restless comparison, provocation or activity without direction", "बेचैन तुलना, उकसावा या दिशाहीन गतिविधि", "अस्वस्थ तुलना, चिथावणी किंवा दिशाहीन कृती")],
  [4, localized("House of home and inner grounding", "सुख भाव", "सुख भाव"), localized("home, care, emotional grounding, land and private life", "घर, देखभाल, भावनात्मक आधार, भूमि और निजी जीवन", "घर, संगोपन, भावनिक आधार, जमीन आणि खासगी जीवन"), localized("secure foundations, restorative space and mature care", "सुरक्षित आधार, पुनर्स्थापक स्थान और परिपक्व देखभाल", "सुरक्षित पाया, पुनर्स्थापक अवकाश आणि परिपक्व काळजी"), localized("retreating into comfort, family projection or possessive care", "सुविधा में छिपना, परिवार-प्रक्षेपण या अधिकारपूर्ण देखभाल", "सोयीत लपणे, कुटुंबीय प्रक्षेपण किंवा मालकीची काळजी")],
  [5, localized("House of learning and creativity", "पुत्र भाव", "पुत्र भाव"), localized("learning, creativity, discernment, children and counsel", "सीख, सृजन, विवेक, संतान और परामर्श", "शिक्षण, सर्जन, विवेक, संतती आणि सल्ला"), localized("responsible creativity, joyful learning and thoughtful guidance", "उत्तरदायी सृजन, आनंदपूर्ण सीख और विचारशील मार्गदर्शन", "जबाबदार सर्जन, आनंदी शिक्षण आणि विचारशील मार्गदर्शन"), localized("performance for approval, speculation or projecting expectations onto children", "स्वीकृति के लिए प्रदर्शन, सट्टा या संतानों पर अपेक्षाएँ थोपना", "मान्यतेसाठी प्रदर्शन, सट्टा किंवा संततीवर अपेक्षा लादणे")],
  [6, localized("House of service and challenges", "अरि भाव", "अरि भाव"), localized("service, routine, obstacles, illness, debt and disputes", "सेवा, दिनचर्या, बाधा, रोग, ऋण और विवाद", "सेवा, दिनक्रम, अडथळे, आजार, कर्ज आणि वाद"), localized("practical service, sound routines and skillful problem-solving", "व्यावहारिक सेवा, स्वस्थ दिनचर्या और कुशल समस्या-समाधान", "व्यावहारिक सेवा, निरोगी दिनक्रम आणि कुशल समस्यासमाधान"), localized("chronic conflict, overwork, self-diagnosis or treating strain as destiny", "लगातार संघर्ष, अति-काम, स्व-निदान या तनाव को नियति मानना", "सतत संघर्ष, अतिश्रम, स्वयंनिदान किंवा ताणाला नियती मानणे")],
  [7, localized("House of partnership", "युवति भाव", "युवती भाव"), localized("partnership, contracts, clients and encounter with others", "साझेदारी, अनुबंध, ग्राहक और दूसरों से सामना", "भागीदारी, करार, ग्राहक आणि इतरांशी भेट"), localized("reciprocity, explicit agreements and respectful difference", "पारस्परिकता, स्पष्ट सहमति और मतभेद का सम्मान", "परस्परता, स्पष्ट करार आणि मतभेदाचा आदर"), localized("projection, dependency or surrendering agency for harmony", "प्रक्षेपण, निर्भरता या सामंजस्य हेतु अपना अधिकार छोड़ना", "प्रक्षेपण, अवलंबन किंवा समरसतेसाठी स्वतःचे कर्तृत्व सोडणे")],
  [8, localized("House of shared resources and transformation", "रंध्र भाव", "रंध्र भाव"), localized("shared resources, vulnerability, secrets, loss and transformation", "साझा संसाधन, असुरक्षा, रहस्य, हानि और परिवर्तन", "सामायिक साधने, असुरक्षितता, रहस्य, हानी आणि परिवर्तन"), localized("honest risk awareness, ethical sharing and resilience through change", "ईमानदार जोखिम-बोध, नैतिक साझेदारी और परिवर्तन में धैर्य", "प्रामाणिक जोखीमजाणीव, नैतिक वाटणी आणि बदलातील लवचिकता"), localized("catastrophizing, secrecy, coercion or predicting death", "विपत्ति-कल्पना, गोपनीयता, दबाव या मृत्यु-भविष्यवाणी", "आपत्तीकरण, गुप्तता, दबाव किंवा मृत्यूभविष्यवाणी")],
  [9, localized("House of meaning and higher learning", "धर्म भाव", "धर्म भाव"), localized("ethics, worldview, teachers, higher learning and pilgrimage", "नीति, विश्वदृष्टि, गुरु, उच्च शिक्षा और तीर्थ", "नीती, विश्वदृष्टी, गुरु, उच्च शिक्षण आणि तीर्थयात्रा"), localized("tested principles, humility in learning and meaningful perspective", "परीक्षित सिद्धांत, सीख में विनम्रता और अर्थपूर्ण दृष्टि", "परीक्षित तत्त्वे, शिक्षणातील नम्रता आणि अर्थपूर्ण दृष्टी"), localized("dogma, borrowed certainty or using belief to avoid evidence", "कट्टरता, उधार का विश्वास या प्रमाण से बचने के लिए मान्यता", "कट्टरता, उसने घेतलेली खात्री किंवा पुरावा टाळण्यासाठी श्रद्धा")],
  [10, localized("House of work and responsibility", "कर्म भाव", "कर्म भाव"), localized("work, responsibility, public conduct, vocation and contribution", "कार्य, उत्तरदायित्व, सार्वजनिक आचरण, व्यवसाय और योगदान", "काम, जबाबदारी, सार्वजनिक आचरण, व्यवसाय आणि योगदान"), localized("competent contribution, accountable authority and useful work", "कुशल योगदान, उत्तरदायी अधिकार और उपयोगी कार्य", "कुशल योगदान, जबाबदार अधिकार आणि उपयुक्त काम"), localized("status fixation, burnout or confusing a role with total identity", "पद-आसक्ति, थकावट या भूमिका को पूरी पहचान समझना", "पदासक्ती, थकवा किंवा भूमिकेलाच संपूर्ण ओळख मानणे")],
  [11, localized("House of gains and community", "लाभ भाव", "लाभ भाव"), localized("gains, networks, aspirations, community and fulfilment", "लाभ, नेटवर्क, आकांक्षा, समुदाय और पूर्ति", "लाभ, जाळे, आकांक्षा, समुदाय आणि पूर्ती"), localized("reciprocal networks, realistic goals and shared benefit", "पारस्परिक नेटवर्क, यथार्थ लक्ष्य और साझा लाभ", "परस्पर जाळे, वास्तववादी ध्येये आणि सामायिक लाभ"), localized("instrumental relationships, endless wanting or group conformity", "उपयोगवादी संबंध, अंतहीन चाह या समूह-अनुरूपता", "उपयोगवादी संबंध, अंतहीन इच्छा किंवा समूहानुरूपता")],
  [12, localized("House of retreat and release", "व्यय भाव", "व्यय भाव"), localized("expense, retreat, sleep, distance, institutions and release", "व्यय, एकांत, निद्रा, दूरी, संस्थान और मुक्ति", "व्यय, एकांत, झोप, अंतर, संस्था आणि मुक्तता"), localized("conscious closure, restorative solitude and wise allocation", "सचेत समापन, पुनर्स्थापक एकांत और विवेकपूर्ण आवंटन", "जाणीवपूर्वक समाप्ती, पुनर्स्थापक एकांत आणि सुज्ञ वाटप"), localized("avoidance, leakage, isolation or romanticizing loss", "पलायन, रिसाव, अलगाव या हानि का रोमानीकरण", "पलायन, गळती, एकाकीपणा किंवा हानीचे रोमँटीकरण")],
] as const;

const BASE_BHAVA_EDUCATION: Readonly<
  Record<HouseNumber, BhavaCoreEducationProfile>
> = Object.fromEntries(
  BHAVA_ROWS.map(([number, name, domain, constructive, caution]) => [
    number,
    { number, name, domain, constructive, caution },
  ]),
) as Record<HouseNumber, BhavaEducationProfile>;

type GermanBhavaProfile = Readonly<{
  name: string;
  domain: string;
  constructive: string;
  caution: string;
}>;

const GERMAN_BHAVA_EDUCATION: Readonly<
  Record<HouseNumber, GermanBhavaProfile>
> = {
  1: {
    name: "Haus des Selbst und Körpers",
    domain: "Körper, Identität, Lebenskraft und Herangehensweise",
    constructive:
      "verkörperte Selbstwahrnehmung und angemessene Eigeninitiative",
    caution:
      "Selbstbezogenheit oder die ganze Person über ihr Erscheinungsbild zu definieren",
  },
  2: {
    name: "Haus der Ressourcen und Sprache",
    domain:
      "Ressourcen, Sprache, familiäre Kontinuität, Nahrung und Werte",
    constructive:
      "sorgfältiger Umgang, wahrhaftige Sprache und stabile Prioritäten",
    caution:
      "Besitzdenken, verletzende Sprache oder den eigenen Wert mit Vermögen gleichzusetzen",
  },
  3: {
    name: "Haus von Mut und Fertigkeiten",
    domain:
      "Anstrengung, Mut, Fertigkeiten, Kommunikation und Geschwister",
    constructive:
      "eingeübte Fertigkeit, mutige Kommunikation und selbstbestimmter Einsatz",
    caution:
      "ruheloser Vergleich, Provokation oder Aktivität ohne klare Richtung",
  },
  4: {
    name: "Haus von Zuhause und innerem Halt",
    domain:
      "Zuhause, Fürsorge, emotionale Verwurzelung, Land und Privatleben",
    constructive:
      "sichere Grundlagen, erholsamer Raum und reife Fürsorge",
    caution:
      "Rückzug in Bequemlichkeit, familiäre Projektion oder vereinnahmende Fürsorge",
  },
  5: {
    name: "Haus von Lernen und Kreativität",
    domain:
      "Lernen, Kreativität, Unterscheidung, Kinder und Beratung",
    constructive:
      "verantwortliche Kreativität, freudiges Lernen und umsichtige Begleitung",
    caution:
      "Selbstdarstellung für Zustimmung, Spekulation oder Erwartungen auf Kinder zu projizieren",
  },
  6: {
    name: "Haus von Dienst und Herausforderungen",
    domain:
      "Dienst, Routine, Hindernisse, Krankheit, Schulden und Konflikte",
    constructive:
      "praktischer Dienst, tragfähige Routinen und geschickte Problemlösung",
    caution:
      "chronischer Konflikt, Überarbeitung, Selbstdiagnose oder Belastung als Schicksal zu behandeln",
  },
  7: {
    name: "Haus der Partnerschaft",
    domain:
      "Partnerschaft, Verträge, Klienten und Begegnung mit anderen",
    constructive:
      "Gegenseitigkeit, ausdrückliche Vereinbarungen und respektierter Unterschied",
    caution:
      "Projektion, Abhängigkeit oder für Harmonie die eigene Handlungsfähigkeit aufzugeben",
  },
  8: {
    name: "Haus gemeinsamer Ressourcen und Wandlung",
    domain:
      "gemeinsame Ressourcen, Verletzlichkeit, Geheimnisse, Verlust und Wandlung",
    constructive:
      "ehrliches Risikobewusstsein, ethisches Teilen und Widerstandskraft im Wandel",
    caution:
      "Katastrophisieren, Geheimhaltung, Zwang oder den Tod vorherzusagen",
  },
  9: {
    name: "Haus von Sinn und höherem Lernen",
    domain:
      "Ethik, Weltbild, Lehrende, höhere Bildung und Pilgerreise",
    constructive:
      "geprüfte Grundsätze, Demut beim Lernen und sinnstiftende Perspektive",
    caution:
      "Dogmatismus, geliehene Gewissheit oder Glauben zur Vermeidung von Belegen einzusetzen",
  },
  10: {
    name: "Haus von Arbeit und Verantwortung",
    domain:
      "Arbeit, Verantwortung, öffentliches Handeln, Berufung und Beitrag",
    constructive:
      "kompetenter Beitrag, verantwortbare Autorität und nützliche Arbeit",
    caution:
      "Statusfixierung, Erschöpfung oder eine Rolle mit der gesamten Identität zu verwechseln",
  },
  11: {
    name: "Haus von Gewinnen und Gemeinschaft",
    domain:
      "Gewinne, Netzwerke, Bestrebungen, Gemeinschaft und Erfüllung",
    constructive:
      "wechselseitige Netzwerke, realistische Ziele und gemeinsamer Nutzen",
    caution:
      "instrumentelle Beziehungen, endloses Wollen oder Gruppenkonformität",
  },
  12: {
    name: "Haus von Rückzug und Loslassen",
    domain:
      "Ausgaben, Rückzug, Schlaf, Ferne, Institutionen und Loslassen",
    constructive:
      "bewusster Abschluss, erholsame Zurückgezogenheit und kluge Zuteilung",
    caution:
      "Vermeidung, Ressourcenverlust, Isolation oder Verlust zu romantisieren",
  },
};

type BhavaDetailGuidance = Readonly<
  Pick<BhavaEducationProfile, "constructiveDetail" | "cautionDetail">
>;

const BHAVA_DETAIL_GUIDANCE: Readonly<
  Record<HouseNumber, BhavaDetailGuidance>
> = {
  1: {
    constructiveDetail: localized(
      "If this field is emphasized, steady body awareness, proportionate initiative, and routines that protect vitality can offer a practical outlet. Consider tracking which choices increase grounded confidence without making appearance or performance the measure of identity.",
      "यदि यह क्षेत्र प्रमुख लगे, तो शरीर-जागरूकता, संतुलित पहल और जीवन-शक्ति सँभालने वाली दिनचर्या व्यावहारिक दिशा दे सकती हैं। देखिए कि कौन-से चुनाव रूप या प्रदर्शन को पहचान का माप बनाए बिना स्थिर आत्मविश्वास बढ़ाते हैं।",
      "जर या क्षेत्रावर भर जाणवत असेल, तर देहजाणीव, संतुलित पुढाकार आणि जीवनशक्ती जपणारा दिनक्रम व्यावहारिक दिशा देऊ शकतो. रूप किंवा कामगिरीला ओळखीचे मोजमाप न बनवता कोणते निर्णय स्थिर आत्मविश्वास वाढवतात हे पाहा.",
      "Wenn dieses Feld betont erscheint, können beständige Körperwahrnehmung, angemessene Eigeninitiative und kräfteschonende Routinen einen praktischen Ausdruck bieten. Beobachten Sie, welche Entscheidungen geerdetes Selbstvertrauen fördern, ohne Aussehen oder Leistung zum Maß der Identität zu machen.",
    ),
    cautionDetail: localized(
      "When attention to self becomes strained, self-absorption, impulsive self-definition, or overreading bodily signals may become reflection points. Check patterns against lived context and qualified health advice rather than treating a house placement as a diagnosis or a fixed personality label.",
      "जब स्वयं पर ध्यान तनावपूर्ण हो, तब आत्म-केंद्रण, जल्दबाज़ आत्म-परिभाषा या शारीरिक संकेतों को अधिक अर्थ देना चिंतन के विषय हो सकते हैं। भाव की स्थिति को निदान या स्थायी व्यक्तित्व-लेबल न मानें; वास्तविक संदर्भ और योग्य स्वास्थ्य-सलाह से जाँचें।",
      "स्वतःकडे पाहणे तणावपूर्ण झाले, तर आत्मकेंद्रीपणा, घाईची स्वव्याख्या किंवा शारीरिक संकेतांचा अति अर्थ लावणे हे चिंतनाचे मुद्दे ठरू शकतात. भावस्थितीला निदान किंवा कायम व्यक्तिमत्त्वाचा शिक्का न मानता प्रत्यक्ष संदर्भ आणि पात्र आरोग्यसल्ल्याशी पडताळा.",
      "Wenn die Beschäftigung mit dem Selbst angespannt wird, können Selbstbezogenheit, vorschnelle Selbstdefinition oder die Überdeutung körperlicher Signale zu Reflexionspunkten werden. Prüfen Sie Muster anhand des gelebten Kontexts und qualifizierter Gesundheitsberatung, statt eine Hausstellung als Diagnose oder festes Persönlichkeitsurteil zu lesen.",
    ),
  },
  2: {
    constructiveDetail: localized(
      "If this field asks for attention, a simple budget, deliberate speech, and periodic review of values can make its themes concrete. Consider whether spending, saving, food choices, and words support both practical security and humane priorities.",
      "यदि यह क्षेत्र ध्यान माँगे, तो सरल बजट, सोच-समझकर बोली गई वाणी और मूल्यों की नियमित समीक्षा इसके विषयों को व्यावहारिक बना सकती है। देखिए कि खर्च, बचत, भोजन और शब्द व्यावहारिक सुरक्षा के साथ मानवीय प्राथमिकताओं का भी समर्थन करते हैं या नहीं।",
      "जर या क्षेत्राकडे लक्ष द्यावेसे वाटत असेल, तर साधे अंदाजपत्रक, विचारपूर्वक वाणी आणि मूल्यांचा नियमित आढावा हे विषय ठोस करू शकतात. खर्च, बचत, अन्ननिवड आणि शब्द व्यवहार्य सुरक्षिततेबरोबर मानवी प्राधान्यांना साथ देतात का ते पाहा.",
      "Wenn dieses Feld Aufmerksamkeit verlangt, können ein einfacher Haushaltsplan, bedachte Sprache und eine regelmäßige Werteprüfung seine Themen greifbar machen. Prüfen Sie, ob Ausgaben, Sparen, Ernährung und Worte sowohl praktische Sicherheit als auch menschliche Prioritäten unterstützen.",
    ),
    cautionDetail: localized(
      "Under strain, possessiveness, sharp speech, or measuring self-worth through resources may be useful patterns to notice. Verify financial choices with evidence and suitable professional advice instead of reading wealth, loss, or family outcomes from one placement.",
      "तनाव में अधिकारभाव, कठोर वाणी या संसाधनों से आत्म-मूल्य नापना ध्यान देने योग्य प्रवृत्तियाँ हो सकती हैं। एक स्थिति से धन, हानि या परिवार का परिणाम न निकालें; वित्तीय निर्णय प्रमाण और उपयुक्त पेशेवर सलाह से जाँचें।",
      "ताणाच्या वेळी मालकीभाव, कठोर वाणी किंवा साधनांवरून स्वमूल्य मोजणे या लक्षात घेण्यासारख्या शक्यता असू शकतात. एका स्थितीवरून धन, हानी किंवा कुटुंबाचा निकाल न काढता आर्थिक निर्णय पुरावे आणि योग्य व्यावसायिक सल्ल्याने तपासा.",
      "Unter Belastung können Besitzdenken, verletzende Sprache oder die Messung des Selbstwerts an Ressourcen hilfreiche Beobachtungspunkte sein. Prüfen Sie finanzielle Entscheidungen anhand von Belegen und geeigneter Fachberatung, statt aus einer Stellung Vermögen, Verlust oder Familienergebnisse abzuleiten.",
    ),
  },
  3: {
    constructiveDetail: localized(
      "If this field is active, deliberate practice, concise communication, and small self-directed projects can channel effort constructively. Consider setting a repeatable learning goal and checking whether messages are clear, accurate, and respectful before sending them.",
      "यदि यह क्षेत्र सक्रिय लगे, तो नियमित अभ्यास, संक्षिप्त संवाद और छोटे स्व-निर्देशित काम प्रयास को रचनात्मक दिशा दे सकते हैं। दोहराए जा सकने वाला सीखने का लक्ष्य रखें और संदेश भेजने से पहले उसकी स्पष्टता, शुद्धता और सम्मान जाँचें।",
      "जर हे क्षेत्र सक्रिय वाटत असेल, तर जाणीवपूर्वक सराव, नेमका संवाद आणि लहान स्वप्रेरित प्रकल्प प्रयत्नांना रचनात्मक दिशा देऊ शकतात. पुनरावृत्ती करता येईल असे शिकण्याचे ध्येय ठेवा आणि संदेश पाठवण्यापूर्वी त्याची स्पष्टता, अचूकता व आदर तपासा.",
      "Wenn dieses Feld aktiv wirkt, können bewusstes Üben, präzise Kommunikation und kleine selbstbestimmte Vorhaben den Einsatz konstruktiv bündeln. Setzen Sie ein wiederholbares Lernziel und prüfen Sie vor dem Senden, ob Mitteilungen klar, korrekt und respektvoll sind.",
    ),
    cautionDetail: localized(
      "If comparison, provocation, or scattered activity increases, pause and distinguish genuine courage from reactive motion. Check facts and relationship context rather than assuming that one house placement defines communication ability or sibling outcomes.",
      "यदि तुलना, उकसावा या बिखरी गतिविधि बढ़े, तो रुककर वास्तविक साहस और प्रतिक्रियात्मक हलचल में भेद करें। एक भावस्थिति को संवाद-कौशल या सहोदर संबंधों का निश्चित परिणाम न मानें; तथ्य और संबंध-संदर्भ जाँचें।",
      "जर तुलना, चिथावणी किंवा विखुरलेली कृती वाढत असेल, तर थांबून खरे धैर्य आणि प्रतिक्रियात्मक हालचाल यात फरक करा. एका भावस्थितीला संवादकौशल्य किंवा भावंडांच्या नात्याचा ठरलेला निकाल न मानता तथ्ये व नात्याचा संदर्भ तपासा.",
      "Wenn Vergleich, Provokation oder zerstreute Aktivität zunehmen, halten Sie inne und unterscheiden Sie echten Mut von reaktiver Bewegung. Prüfen Sie Fakten und Beziehungskontext, statt einer einzelnen Hausstellung Kommunikationsfähigkeit oder Geschwisterbeziehungen zuzuschreiben.",
    ),
  },
  4: {
    constructiveDetail: localized(
      "If this field needs support, restorative space, dependable home routines, and care with clear boundaries can strengthen inner grounding. Consider which private practices create belonging while still allowing independence and honest emotional expression.",
      "यदि इस क्षेत्र को सहारा चाहिए, तो विश्रामदायक स्थान, भरोसेमंद घरेलू दिनचर्या और स्पष्ट सीमाओं वाली देखभाल आंतरिक आधार को मजबूत कर सकती है। देखिए कि कौन-से निजी अभ्यास अपनापन बनाते हुए स्वतंत्रता और ईमानदार भाव-अभिव्यक्ति भी रहने देते हैं।",
      "जर या क्षेत्राला आधार हवा असेल, तर पुनर्स्थापक जागा, विश्वासार्ह घरगुती दिनक्रम आणि स्पष्ट मर्यादांसह काळजी अंतर्गत स्थैर्य वाढवू शकते. कोणत्या खाजगी सवयी आपलेपणा निर्माण करताना स्वातंत्र्य आणि प्रामाणिक भावनिक अभिव्यक्तीलाही जागा देतात ते पाहा.",
      "Wenn dieses Feld Unterstützung braucht, können erholsame Räume, verlässliche häusliche Routinen und Fürsorge mit klaren Grenzen den inneren Halt stärken. Prüfen Sie, welche privaten Praktiken Zugehörigkeit schaffen und zugleich Unabhängigkeit sowie ehrlichen Gefühlsausdruck ermöglichen.",
    ),
    cautionDetail: localized(
      "When comfort becomes avoidance, family projection, possessive care, or withdrawal may deserve closer observation. Use direct conversation and practical housing or family evidence rather than treating this placement as proof of childhood, property, or parental outcomes.",
      "जब सुविधा पलायन बनने लगे, तब परिवार-प्रक्षेपण, अधिकारपूर्ण देखभाल या पीछे हटना ध्यान से देखने योग्य हो सकते हैं। इस स्थिति को बचपन, संपत्ति या माता-पिता के परिणाम का प्रमाण न मानें; सीधी बातचीत और व्यावहारिक पारिवारिक या आवास-संबंधी तथ्य देखें।",
      "जेव्हा सोय टाळाटाळ बनते, तेव्हा कौटुंबिक प्रक्षेपण, मालकीची काळजी किंवा माघार यांचे बारकाईने निरीक्षण उपयोगी ठरू शकते. या स्थितीला बालपण, मालमत्ता किंवा पालकांबाबतचा पुरावा न मानता थेट संवाद आणि प्रत्यक्ष घर-कुटुंबातील तथ्ये पाहा.",
      "Wenn Bequemlichkeit zur Vermeidung wird, können familiäre Projektion, vereinnahmende Fürsorge oder Rückzug eine genauere Beobachtung verdienen. Nutzen Sie direkte Gespräche und praktische Fakten zu Wohnen oder Familie, statt die Stellung als Beweis für Kindheit, Eigentum oder elterliche Entwicklungen zu behandeln.",
    ),
  },
  5: {
    constructiveDetail: localized(
      "If this field invites expression, a regular creative practice, disciplined study, and ethical mentoring can help inspiration mature. Consider making room for play while giving ideas, learners, or children support that respects their separate agency.",
      "यदि यह क्षेत्र अभिव्यक्ति माँगे, तो नियमित सृजन-अभ्यास, अनुशासित अध्ययन और नैतिक मार्गदर्शन प्रेरणा को परिपक्व कर सकते हैं। खेल और आनंद के लिए जगह रखें, साथ ही विचारों, विद्यार्थियों या बच्चों को उनकी स्वतंत्रता का सम्मान करने वाला सहारा दें।",
      "जर हे क्षेत्र अभिव्यक्तीची मागणी करत असेल, तर नियमित सर्जनशील सराव, शिस्तबद्ध अध्ययन आणि नैतिक मार्गदर्शन प्रेरणेला परिपक्व करू शकतात. खेळासाठी जागा ठेवा आणि कल्पना, विद्यार्थी किंवा मुलांना त्यांच्या स्वतंत्र कर्तृत्वाचा आदर करणारा आधार द्या.",
      "Wenn dieses Feld Ausdruck sucht, können regelmäßige kreative Praxis, diszipliniertes Lernen und ethische Begleitung Inspiration reifen lassen. Geben Sie dem Spiel Raum und unterstützen Sie zugleich Ideen, Lernende oder Kinder auf eine Weise, die deren eigene Handlungsfähigkeit achtet.",
    ),
    cautionDetail: localized(
      "If approval-seeking, speculative risk, or projecting expectations onto others appears, slow the process and review motives. Do not use this house to infer fertility, a child's future, romance, or investment results; rely on consent, evidence, and qualified guidance.",
      "यदि स्वीकृति की चाह, सट्टात्मक जोखिम या दूसरों पर अपेक्षाएँ थोपना दिखे, तो गति धीमी करके उद्देश्य जाँचें। इस भाव से प्रजनन, संतान का भविष्य, प्रेम या निवेश-परिणाम न निकालें; सहमति, प्रमाण और योग्य सलाह पर भरोसा करें।",
      "जर मान्यतेची ओढ, सट्टेबाज जोखीम किंवा इतरांवर अपेक्षा लादणे दिसत असेल, तर प्रक्रिया मंद करून हेतू तपासा. या भावावरून प्रजनन, मुलांचे भविष्य, प्रणय किंवा गुंतवणुकीचा निकाल ठरवू नका; संमती, पुरावे आणि पात्र सल्ल्यावर विसंबा.",
      "Wenn Anerkennungssuche, spekulatives Risiko oder übertragene Erwartungen auftreten, verlangsamen Sie den Prozess und prüfen Sie die Motive. Leiten Sie aus diesem Haus weder Fruchtbarkeit noch die Zukunft eines Kindes, Romantik oder Anlageergebnisse ab; stützen Sie sich auf Einwilligung, Belege und qualifizierte Beratung.",
    ),
  },
  6: {
    constructiveDetail: localized(
      "If this field is prominent, sustainable routines, useful service, careful records, and stepwise problem-solving can turn friction into skill. Consider choosing one manageable habit and seeking qualified medical, legal, or financial help whenever the issue exceeds personal expertise.",
      "यदि यह क्षेत्र प्रमुख हो, तो टिकाऊ दिनचर्या, उपयोगी सेवा, सावधानी से रखे अभिलेख और क्रमिक समस्या-समाधान कठिनाई को कौशल में बदल सकते हैं। एक संभालने योग्य आदत चुनें और विषय निजी विशेषज्ञता से बाहर हो तो योग्य चिकित्सकीय, कानूनी या वित्तीय सहायता लें।",
      "जर हे क्षेत्र ठळक असेल, तर टिकाऊ दिनक्रम, उपयुक्त सेवा, काळजीपूर्वक नोंदी आणि टप्प्याटप्प्याने समस्या सोडवणे यामुळे घर्षण कौशल्यात बदलू शकते. एक सांभाळता येईल अशी सवय निवडा आणि विषय वैयक्तिक तज्ज्ञतेबाहेर असेल तर पात्र वैद्यकीय, कायदेशीर किंवा आर्थिक मदत घ्या.",
      "Wenn dieses Feld hervortritt, können tragfähige Routinen, nützlicher Dienst, sorgfältige Aufzeichnungen und schrittweise Problemlösung Reibung in Können verwandeln. Wählen Sie eine überschaubare Gewohnheit und suchen Sie qualifizierte medizinische, rechtliche oder finanzielle Hilfe, sobald das Thema die eigene Fachkenntnis übersteigt.",
    ),
    cautionDetail: localized(
      "If conflict, overwork, self-diagnosis, or a permanent struggle narrative grows, pause and assess workload, evidence, and available support. A house placement cannot establish illness, debt, litigation, or defeat, so consequential decisions need current facts and appropriate professionals.",
      "यदि संघर्ष, अति-काम, स्व-निदान या स्थायी कठिनाई की कथा बढ़े, तो रुककर कार्यभार, प्रमाण और उपलब्ध सहायता का आकलन करें। भावस्थिति रोग, ऋण, मुकदमा या हार सिद्ध नहीं कर सकती, इसलिए गंभीर निर्णयों के लिए वर्तमान तथ्य और उपयुक्त विशेषज्ञ आवश्यक हैं।",
      "जर संघर्ष, अतिश्रम, स्वयंनिदान किंवा कायम अडचणीची कथा वाढत असेल, तर थांबून कामाचा भार, पुरावे आणि उपलब्ध आधार तपासा. भावस्थिती आजार, कर्ज, खटला किंवा पराभव सिद्ध करू शकत नाही, त्यामुळे महत्त्वाच्या निर्णयांसाठी अद्ययावत तथ्ये आणि योग्य तज्ज्ञ आवश्यक आहेत.",
      "Wenn Konflikt, Überarbeit, Selbstdiagnose oder eine dauerhafte Belastungserzählung zunimmt, halten Sie inne und prüfen Sie Arbeitslast, Belege und verfügbare Unterstützung. Eine Hausstellung kann Krankheit, Schulden, Rechtsstreit oder Niederlage nicht feststellen, daher brauchen folgenreiche Entscheidungen aktuelle Fakten und geeignete Fachleute.",
    ),
  },
  7: {
    constructiveDetail: localized(
      "If this field is emphasized, explicit agreements, attentive listening, and boundaries that preserve both parties' agency can support reciprocity. Consider reviewing expectations aloud and checking whether cooperation remains voluntary, fair, and open to revision.",
      "यदि यह क्षेत्र प्रमुख हो, तो स्पष्ट समझौते, ध्यान से सुनना और दोनों पक्षों की स्वतंत्रता बचाने वाली सीमाएँ पारस्परिकता को सहारा दे सकती हैं। अपेक्षाएँ खुलकर दोहराएँ और देखें कि सहयोग स्वैच्छिक, न्यायपूर्ण तथा संशोधन के लिए खुला रहता है या नहीं।",
      "जर या क्षेत्रावर भर असेल, तर स्पष्ट करार, लक्षपूर्वक ऐकणे आणि दोन्ही बाजूंचे कर्तृत्व जपणाऱ्या मर्यादा परस्परतेला आधार देऊ शकतात. अपेक्षा उघडपणे तपासा आणि सहकार्य स्वेच्छेचे, न्याय्य व बदलासाठी खुले राहते का ते पाहा.",
      "Wenn dieses Feld betont ist, können ausdrückliche Vereinbarungen, aufmerksames Zuhören und Grenzen, die beiden Seiten Handlungsspielraum lassen, Gegenseitigkeit fördern. Sprechen Sie Erwartungen offen durch und prüfen Sie, ob Zusammenarbeit freiwillig, fair und veränderbar bleibt.",
    ),
    cautionDetail: localized(
      "If projection, dependency, or self-erasure for harmony appears, create space to identify each person's needs and choices. This placement does not determine marriage, separation, a partner's character, or contractual success, so use direct evidence and qualified advice where stakes are high.",
      "यदि प्रक्षेपण, निर्भरता या सामंजस्य के लिए स्वयं को मिटाना दिखे, तो हर व्यक्ति की जरूरत और चुनाव अलग पहचानने की जगह बनाइए। यह स्थिति विवाह, अलगाव, साथी के चरित्र या अनुबंध की सफलता तय नहीं करती; बड़े दाँव पर सीधे प्रमाण और योग्य सलाह लें।",
      "जर प्रक्षेपण, अवलंबन किंवा सलोख्यासाठी स्वतःला पुसून टाकणे दिसत असेल, तर प्रत्येकाच्या गरजा व निवडी वेगळ्या ओळखण्यासाठी अवकाश तयार करा. ही स्थिती विवाह, विभक्तता, जोडीदाराचा स्वभाव किंवा कराराचे यश ठरवत नाही; मोठ्या परिणामांच्या वेळी थेट पुरावे आणि पात्र सल्ला घ्या.",
      "Wenn Projektion, Abhängigkeit oder Selbstaufgabe zugunsten von Harmonie auftauchen, schaffen Sie Raum, um Bedürfnisse und Entscheidungen jeder Person getrennt zu erkennen. Diese Stellung bestimmt weder Ehe noch Trennung, Charakter eines Partners oder Vertragserfolg; bei hohem Einsatz zählen direkte Belege und qualifizierte Beratung.",
    ),
  },
  8: {
    constructiveDetail: localized(
      "If this field is activated, transparent shared-resource agreements, informed consent, careful records, and contingency planning can support resilience. Consider approaching difficult change through paced research and honest conversation instead of demanding immediate certainty or control.",
      "यदि यह क्षेत्र सक्रिय हो, तो साझा संसाधनों के पारदर्शी समझौते, सूचित सहमति, सावधान अभिलेख और वैकल्पिक योजना लचीलापन बढ़ा सकते हैं। कठिन परिवर्तन को तुरंत निश्चितता या नियंत्रण माँगने के बजाय क्रमिक शोध और ईमानदार संवाद से देखें।",
      "जर हे क्षेत्र सक्रिय असेल, तर सामायिक साधनांचे पारदर्शक करार, माहितीपूर्ण संमती, काळजीपूर्वक नोंदी आणि पर्यायी नियोजन लवचिकतेला आधार देऊ शकतात. कठीण बदलाकडे तातडीची खात्री किंवा नियंत्रण मागण्याऐवजी टप्प्याटप्प्याच्या संशोधनाने आणि प्रामाणिक संवादाने पाहा.",
      "Wenn dieses Feld aktiviert erscheint, können transparente Vereinbarungen über gemeinsame Ressourcen, informierte Einwilligung, sorgfältige Unterlagen und Notfallplanung Widerstandskraft fördern. Nähern Sie sich schwierigen Veränderungen mit schrittweiser Recherche und ehrlichem Gespräch, statt sofortige Gewissheit oder Kontrolle zu verlangen.",
    ),
    cautionDetail: localized(
      "If secrecy, coercion, catastrophic thinking, or compulsive control develops, slow down and bring in trustworthy oversight. Never infer death, inheritance, abuse, crisis, or another person's hidden motives from this house; safety, legal, financial, and health concerns require direct evidence and qualified support.",
      "यदि गोपनीयता, दबाव, विपत्ति-कल्पना या बाध्यकारी नियंत्रण बढ़े, तो गति धीमी करके विश्वसनीय निगरानी जोड़ें। इस भाव से मृत्यु, विरासत, दुर्व्यवहार, संकट या किसी के छिपे उद्देश्य न निकालें; सुरक्षा, कानूनी, वित्तीय और स्वास्थ्य विषयों में प्रत्यक्ष प्रमाण व योग्य सहायता चाहिए।",
      "जर गुप्तता, दबाव, आपत्तीची कल्पना किंवा सक्तीचे नियंत्रण वाढत असेल, तर गती कमी करून विश्वासार्ह देखरेख घ्या. या भावावरून मृत्यू, वारसा, अत्याचार, संकट किंवा इतरांचा गुप्त हेतू ठरवू नका; सुरक्षा, कायदेशीर, आर्थिक व आरोग्यविषयक बाबींना थेट पुरावे आणि पात्र मदत लागते.",
      "Wenn Geheimhaltung, Zwang, Katastrophendenken oder kontrollierendes Verhalten zunehmen, verlangsamen Sie den Prozess und beziehen Sie vertrauenswürdige Aufsicht ein. Leiten Sie aus diesem Haus niemals Tod, Erbschaft, Missbrauch, Krise oder verborgene Motive anderer ab; Sicherheits-, Rechts-, Finanz- und Gesundheitsfragen brauchen direkte Belege und qualifizierte Unterstützung.",
    ),
  },
  9: {
    constructiveDetail: localized(
      "If this field seeks growth, tested principles, careful study, ethical mentors, and contact with unfamiliar perspectives can broaden judgment. Consider asking what evidence, lived experience, and consequences support a belief before using it to guide other people.",
      "यदि यह क्षेत्र विकास चाहे, तो परखे हुए सिद्धांत, सावधान अध्ययन, नैतिक शिक्षक और अपरिचित दृष्टियों से संपर्क निर्णय को व्यापक बना सकते हैं। किसी मान्यता से दूसरों का मार्गदर्शन करने से पहले पूछें कि कौन-से प्रमाण, जीवित अनुभव और परिणाम उसका समर्थन करते हैं।",
      "जर हे क्षेत्र वाढ शोधत असेल, तर तपासलेली तत्त्वे, काळजीपूर्वक अध्ययन, नैतिक मार्गदर्शक आणि अपरिचित दृष्टिकोन निर्णयक्षमता व्यापक करू शकतात. एखाद्या विश्वासाने इतरांना दिशा देण्यापूर्वी त्याला कोणते पुरावे, जगलेला अनुभव आणि परिणाम आधार देतात हे विचारा.",
      "Wenn dieses Feld Wachstum sucht, können geprüfte Grundsätze, sorgfältiges Studium, ethische Lehrende und Begegnungen mit fremden Perspektiven das Urteil erweitern. Fragen Sie, welche Belege, Erfahrungen und Folgen eine Überzeugung tragen, bevor Sie damit andere anleiten.",
    ),
    cautionDetail: localized(
      "If dogma, borrowed certainty, or deference to authority replaces inquiry, compare claims with evidence and multiple credible sources. This house cannot guarantee fortune, admission, travel, spiritual status, or a teacher's reliability, so practical verification remains necessary.",
      "यदि कट्टरता, उधार की निश्चितता या अधिकार के आगे समर्पण जिज्ञासा की जगह ले, तो दावों को प्रमाण और कई विश्वसनीय स्रोतों से मिलाएँ। यह भाव भाग्य, प्रवेश, यात्रा, आध्यात्मिक दर्जा या शिक्षक की विश्वसनीयता की गारंटी नहीं देता, इसलिए व्यावहारिक जाँच आवश्यक है।",
      "जर कट्टरता, उसनी खात्री किंवा अधिकारापुढील शरणागतीने चौकशीची जागा घेतली, तर दावे पुरावे आणि अनेक विश्वसनीय स्रोतांशी तपासा. हा भाव भाग्य, प्रवेश, प्रवास, आध्यात्मिक दर्जा किंवा शिक्षकाची विश्वासार्हता हमी देत नाही, म्हणून व्यवहार्य पडताळणी आवश्यक आहे.",
      "Wenn Dogma, geliehene Gewissheit oder Autoritätsgläubigkeit die Prüfung ersetzt, vergleichen Sie Behauptungen mit Belegen und mehreren glaubwürdigen Quellen. Dieses Haus garantiert weder Glück noch Zulassung, Reise, spirituellen Rang oder Zuverlässigkeit eines Lehrers, daher bleibt praktische Überprüfung notwendig.",
    ),
  },
  10: {
    constructiveDetail: localized(
      "If this field carries emphasis, accountable goals, durable work systems, skill development, and service to a clear purpose can support useful contribution. Consider defining success through quality, responsibility, and sustainable pace rather than visibility alone.",
      "यदि यह क्षेत्र प्रमुख हो, तो जवाबदेह लक्ष्य, टिकाऊ कार्य-प्रणाली, कौशल-विकास और स्पष्ट उद्देश्य की सेवा उपयोगी योगदान को सहारा दे सकते हैं। सफलता को केवल दृश्यता से नहीं, बल्कि गुणवत्ता, जिम्मेदारी और टिकाऊ गति से परिभाषित करने पर विचार करें।",
      "जर या क्षेत्रावर भर असेल, तर उत्तरदायी ध्येये, टिकाऊ कामपद्धती, कौशल्यविकास आणि स्पष्ट उद्देशाची सेवा उपयुक्त योगदानाला आधार देऊ शकतात. यशाची व्याख्या केवळ प्रसिद्धीने न करता गुणवत्ता, जबाबदारी आणि टिकाऊ गतीने करण्याचा विचार करा.",
      "Wenn dieses Feld Gewicht trägt, können verantwortbare Ziele, belastbare Arbeitssysteme, Kompetenzaufbau und Dienst an einem klaren Zweck einen nützlichen Beitrag fördern. Definieren Sie Erfolg eher über Qualität, Verantwortung und ein tragfähiges Tempo als allein über Sichtbarkeit.",
    ),
    cautionDetail: localized(
      "If status fixation, exhaustion, or identification with one role grows, review workload, authority, and the costs paid outside work. A house placement does not promise promotion, public recognition, job loss, or a single vocation, so career decisions need current evidence and relevant professional counsel.",
      "यदि पद-आसक्ति, थकावट या एक भूमिका से पूरी पहचान जुड़ने लगे, तो कार्यभार, अधिकार और काम के बाहर चुकाई जा रही कीमत की समीक्षा करें। भावस्थिति पदोन्नति, प्रसिद्धि, नौकरी-हानि या एकमात्र व्यवसाय का वादा नहीं करती, इसलिए करियर निर्णयों को वर्तमान प्रमाण और उपयुक्त पेशेवर सलाह चाहिए।",
      "जर पदासक्ती, थकवा किंवा एका भूमिकेशी संपूर्ण ओळख जोडली जात असेल, तर कामाचा भार, अधिकार आणि कामाबाहेर मोजावी लागणारी किंमत तपासा. भावस्थिती बढती, प्रसिद्धी, नोकरी जाणे किंवा एकमेव व्यवसायाचे वचन देत नाही, त्यामुळे करिअर निर्णयांना अद्ययावत पुरावे आणि योग्य व्यावसायिक सल्ला हवा.",
      "Wenn Statusfixierung, Erschöpfung oder Identifikation mit einer einzigen Rolle zunehmen, prüfen Sie Arbeitslast, Autorität und die außerhalb der Arbeit entstehenden Kosten. Eine Hausstellung verspricht weder Beförderung noch Anerkennung, Arbeitsplatzverlust oder eine einzige Berufung; Karriereentscheidungen brauchen aktuelle Belege und passende Fachberatung.",
    ),
  },
  11: {
    constructiveDetail: localized(
      "If this field is highlighted, reciprocal networks, measurable shared goals, and transparent distribution of benefits can make aspiration more grounded. Consider contributing before asking, inviting diverse viewpoints, and reviewing whether a group's incentives match its stated values.",
      "यदि यह क्षेत्र उभरता हो, तो पारस्परिक नेटवर्क, मापे जा सकने वाले साझा लक्ष्य और लाभ का पारदर्शी वितरण आकांक्षा को अधिक धरातलीय बना सकते हैं। माँगने से पहले योगदान दें, विविध दृष्टियाँ बुलाएँ और जाँचें कि समूह के प्रोत्साहन उसके घोषित मूल्यों से मेल खाते हैं या नहीं।",
      "जर हे क्षेत्र ठळक असेल, तर परस्पर जाळे, मोजता येणारी सामायिक ध्येये आणि लाभांचे पारदर्शक वाटप आकांक्षा अधिक वास्तववादी करू शकतात. मागण्यापूर्वी योगदान द्या, विविध दृष्टिकोनांना आमंत्रण द्या आणि समूहाची प्रोत्साहने त्याच्या जाहीर मूल्यांशी जुळतात का ते तपासा.",
      "Wenn dieses Feld hervorgehoben ist, können wechselseitige Netzwerke, messbare gemeinsame Ziele und transparente Nutzenverteilung Bestrebungen erden. Tragen Sie bei, bevor Sie fordern, laden Sie unterschiedliche Sichtweisen ein und prüfen Sie, ob Gruppenanreize zu den erklärten Werten passen.",
    ),
    cautionDetail: localized(
      "If relationships become instrumental, wanting becomes endless, or group approval suppresses judgment, step back and review reciprocity. This house cannot predict income, popularity, patronage, or social success, so plans should rest on realistic resources, consent, and observable commitments.",
      "यदि संबंध केवल साधन बनें, चाह अंतहीन हो या समूह-स्वीकृति निर्णय दबाए, तो पीछे हटकर पारस्परिकता की समीक्षा करें। यह भाव आय, लोकप्रियता, संरक्षण या सामाजिक सफलता की भविष्यवाणी नहीं कर सकता, इसलिए योजना यथार्थ संसाधनों, सहमति और दिखने वाली प्रतिबद्धताओं पर रखें।",
      "जर नाती केवळ साधने बनली, इच्छा अंतहीन झाली किंवा समूहमान्यतेने निर्णय दडपला, तर थोडे मागे हटून परस्परता तपासा. हा भाव उत्पन्न, लोकप्रियता, आश्रय किंवा सामाजिक यशाचे भाकीत करू शकत नाही, म्हणून योजना वास्तव साधने, संमती आणि दिसणाऱ्या बांधिलकीवर आधाराव्यात.",
      "Wenn Beziehungen instrumentell werden, Wünsche kein Ende finden oder Gruppenzustimmung das Urteil verdrängt, treten Sie zurück und prüfen Sie Gegenseitigkeit. Dieses Haus kann Einkommen, Beliebtheit, Förderung oder sozialen Erfolg nicht vorhersagen; Pläne sollten auf realistischen Ressourcen, Einwilligung und beobachtbaren Zusagen beruhen.",
    ),
  },
  12: {
    constructiveDetail: localized(
      "If this field calls for release, scheduled rest, sleep care, budgeted generosity, reflective solitude, and clear institutional boundaries can make withdrawal restorative. Consider naming what is complete and choosing a small closing practice that preserves necessary responsibilities.",
      "यदि यह क्षेत्र छोड़ने की ओर बुलाए, तो नियोजित विश्राम, नींद की देखभाल, बजट में उदारता, चिंतनशील एकांत और संस्थागत सीमाएँ पीछे हटने को पुनर्स्थापक बना सकती हैं। जो पूरा हो चुका है उसे नाम दें और आवश्यक जिम्मेदारियाँ बचाते हुए एक छोटा समापन-अभ्यास चुनें।",
      "जर हे क्षेत्र सोडून देण्याकडे बोलावत असेल, तर नियोजित विश्रांती, झोपेची काळजी, अंदाजपत्रकातील उदारता, चिंतनशील एकांत आणि संस्थात्मक मर्यादा माघार पुनर्स्थापक करू शकतात. जे पूर्ण झाले आहे त्याला नाव द्या आणि आवश्यक जबाबदाऱ्या जपत एक लहान समापनकृती निवडा.",
      "Wenn dieses Feld zum Loslassen einlädt, können geplante Ruhe, Schlafpflege, eingeplante Großzügigkeit, reflektierte Einsamkeit und klare institutionelle Grenzen Rückzug erholsam machen. Benennen Sie, was abgeschlossen ist, und wählen Sie eine kleine Abschlusspraktik, die notwendige Verantwortung bewahrt.",
    ),
    cautionDetail: localized(
      "If avoidance, resource leakage, isolation, or romanticizing loss increases, reconnect with practical schedules, trusted people, and documented needs. Do not infer hospitalization, exile, hidden enemies, or inevitable loss from this house; health, safety, and financial concerns require direct assessment and qualified support.",
      "यदि पलायन, संसाधन-रिसाव, अलगाव या हानि का रोमानीकरण बढ़े, तो व्यावहारिक समय-सारणी, भरोसेमंद लोगों और दर्ज जरूरतों से फिर जुड़ें। इस भाव से अस्पताल, निर्वासन, छिपे शत्रु या अनिवार्य हानि न निकालें; स्वास्थ्य, सुरक्षा और वित्तीय चिंता को प्रत्यक्ष आकलन व योग्य सहायता चाहिए।",
      "जर टाळाटाळ, साधनांची गळती, एकाकीपणा किंवा हानीचे रोमँटीकरण वाढत असेल, तर व्यवहार्य वेळापत्रक, विश्वासू माणसे आणि नोंदवलेल्या गरजांशी पुन्हा जोडा. या भावावरून रुग्णालय, निर्वासन, गुप्त शत्रू किंवा अटळ हानी ठरवू नका; आरोग्य, सुरक्षा व आर्थिक चिंतेला थेट मूल्यमापन आणि पात्र मदत हवी.",
      "Wenn Vermeidung, Ressourcenverlust, Isolation oder romantisierte Verlusterzählungen zunehmen, verbinden Sie sich erneut mit praktischen Zeitplänen, vertrauten Menschen und dokumentierten Bedürfnissen. Leiten Sie aus diesem Haus weder Krankenhausaufenthalt noch Exil, verborgene Feinde oder unvermeidlichen Verlust ab; Gesundheits-, Sicherheits- und Finanzfragen brauchen direkte Einschätzung und qualifizierte Unterstützung.",
    ),
  },
};

export const BHAVA_EDUCATION: Readonly<
  Record<HouseNumber, BhavaEducationProfile>
> = Object.fromEntries(
  BHAVA_ROWS.map(([number]) => {
    const profile = BASE_BHAVA_EDUCATION[number];
    const german = GERMAN_BHAVA_EDUCATION[number];
    return [
      number,
      {
        ...profile,
        ...BHAVA_DETAIL_GUIDANCE[number],
        name: addGerman(profile.name, german.name),
        domain: addGerman(profile.domain, german.domain),
        constructive: addGerman(
          profile.constructive,
          german.constructive,
        ),
        caution: addGerman(profile.caution, german.caution),
      },
    ];
  }),
) as Record<HouseNumber, BhavaEducationProfile>;

export interface GrahaInBhavaReading {
  graha: GrahaId;
  bhava: HouseNumber;
  title: string;
  summary: string;
  constructive: string;
  caution: string;
  inquiry: string;
  methodNote: string;
}

/**
 * Produces all 9 × 12 educational combinations from disclosed symbolic rules.
 * It deliberately does not claim to be a personalized placement judgment.
 */
export function buildGrahaInBhavaReading(
  grahaId: GrahaId,
  bhavaNumber: HouseNumber,
  locale: AppLocale,
): GrahaInBhavaReading {
  const graha = GRAHA_EDUCATION[grahaId];
  const bhava = BHAVA_EDUCATION[bhavaNumber];
  const grahaName = readLocalized(graha.name, locale);
  const bhavaName = readLocalized(bhava.name, locale);
  const grahaFunction = readLocalized(graha.signifies, locale);
  const bhavaDomain = readLocalized(bhava.domain, locale);

  if (locale === "de") {
    return {
      graha: grahaId,
      bhava: bhavaNumber,
      title: `${grahaName} — ${bhavaName}`,
      summary: `In der traditionellen vedischen Astrologie wird die Funktion von ${grahaName} — ${grahaFunction} — durch das Feld von ${bhavaName} gelesen: ${bhavaDomain}. Das deutet auf eine Betonung dieses Lebensfelds hin, nicht auf ein garantiertes Ereignis.`,
      constructive: `${readLocalized(graha.constructive, locale)} kann sich stimmiger entfalten, wenn es mit ${readLocalized(bhava.constructive, locale)} verbunden wird. Eine kleine, wiederholbare Handlung kann beide Themen erproben; ihre tatsächliche Wirkung sollte beobachtet statt vorausgesetzt werden.`,
      caution: `Falls ${readLocalized(graha.caution, locale)} mit ${readLocalized(bhava.caution, locale)} zusammentrifft, sollte das Muster nicht als feste Eigenschaft gelesen werden. Kontext, Häufigkeit und reale Folgen sollten geprüft werden; bei medizinischen, rechtlichen, finanziellen oder Sicherheitsfragen ist qualifizierte Hilfe angemessen.`,
      inquiry: readLocalized(graha.inquiry, locale),
      methodNote:
        "Diese pädagogische 9×12-Synthese verbindet ausschließlich Bedeutungen der Himmelskörper mit Hausthemen. Tierkreiszeichen, Hausherrscher, Aspekte, Konjunktionen, Würde, Planetenperioden und Transite wurden dabei nicht bewertet.",
    };
  }

  if (locale === "hi") {
    return {
      graha: grahaId,
      bhava: bhavaNumber,
      title: `${grahaName} — ${bhavaName}`,
      summary: `पारंपरिक ज्योतिष में ${grahaName} के कारकत्व—${grahaFunction}—को यहाँ ${bhavaName} के क्षेत्र—${bhavaDomain}—के माध्यम से पढ़ा जाता है। इसका अर्थ उस क्षेत्र में अधिक ध्यान है, निश्चित घटना नहीं।`,
      constructive: `${readLocalized(graha.constructive, locale)} को ${readLocalized(bhava.constructive, locale)} के साथ जोड़ने पर यह स्थिति अधिक रचनात्मक ढंग से व्यक्त हो सकती है। दोनों विषयों को व्यक्त करने वाला एक छोटा, दोहराया जा सकने वाला कदम चुनें और अनुमान लगाने के बजाय उसके वास्तविक प्रभाव को देखें।`,
      caution: `यदि ${readLocalized(graha.caution, locale)} के साथ ${readLocalized(bhava.caution, locale)} दिखाई दे, तो इसे स्थायी गुण न मानें। संदर्भ, बारंबारता और वास्तविक परिणाम जाँचें; चिकित्सकीय, कानूनी, वित्तीय या सुरक्षा-विषयक प्रश्न में योग्य सहायता लें।`,
      inquiry: readLocalized(graha.inquiry, locale),
      methodNote:
        "यह 9×12 शैक्षिक संश्लेषण केवल ग्रह-कारकत्व और भाव-विषय जोड़ता है। राशि, भावेश, दृष्टि, युति, गरिमा, दशा और गोचर का निर्णय इसमें नहीं हुआ है।",
    };
  }

  if (locale === "mr") {
    return {
      graha: grahaId,
      bhava: bhavaNumber,
      title: `${grahaName} — ${bhavaName}`,
      summary: `पारंपरिक ज्योतिषात ${grahaName}चे कारकत्व—${grahaFunction}—येथे ${bhavaName}च्या क्षेत्रातून—${bhavaDomain}—वाचले जाते. याचा अर्थ त्या क्षेत्रावर अधिक भर; निश्चित घटना नव्हे.`,
      constructive: `${readLocalized(graha.constructive, locale)} याला ${readLocalized(bhava.constructive, locale)}शी जोडल्यास ही स्थिती अधिक रचनात्मकपणे व्यक्त होऊ शकते. दोन्ही विषय व्यक्त करणारी एक लहान, पुन्हा करता येणारी कृती निवडा आणि अंदाजाऐवजी तिचा प्रत्यक्ष परिणाम पाहा.`,
      caution: `जर ${readLocalized(graha.caution, locale)} यासोबत ${readLocalized(bhava.caution, locale)} दिसत असेल, तर त्याला कायम गुण मानू नका. संदर्भ, वारंवारता आणि प्रत्यक्ष परिणाम तपासा; वैद्यकीय, कायदेशीर, आर्थिक किंवा सुरक्षाविषयक प्रश्नांसाठी पात्र मदत घ्या.`,
      inquiry: readLocalized(graha.inquiry, locale),
      methodNote:
        "हे 9×12 शैक्षणिक संश्लेषण फक्त ग्रहकारकत्व व भावविषय जोडते. राशी, भावेश, दृष्टी, युती, प्रतिष्ठा, दशा व गोचर यांचा निर्णय यात केलेला नाही.",
    };
  }

  return {
    graha: grahaId,
    bhava: bhavaNumber,
    title: `${grahaName} — ${bhavaName}`,
    summary: `In traditional Vedic astrology, ${grahaName}'s function—${grahaFunction}—is read through ${bhavaName}'s field of ${bhavaDomain}. This suggests emphasis in that field, not a guaranteed event.`,
    constructive: `${readLocalized(graha.constructive, locale)} can become more workable when joined with ${readLocalized(bhava.constructive, locale)}. Consider one small repeatable action that expresses both themes, then review its actual effect rather than assuming an outcome.`,
    caution: `If ${readLocalized(graha.caution, locale)} interacts with ${readLocalized(bhava.caution, locale)}, pause before treating the pattern as a fixed trait. Check context, frequency, and real-world consequences, and seek qualified help when the issue is medical, legal, financial, or safety-related.`,
    inquiry: readLocalized(graha.inquiry, locale),
    methodNote:
      "This 9×12 educational synthesis combines only planetary significations and house topics. It has not judged zodiac sign, house ruler, aspects, conjunctions, dignity, planetary periods, or transits.",
  };
}

export function getNakshatraEducationName(
  name: NakshatraName,
  locale: AppLocale,
): string {
  return getLocalizedNakshatraName(name, locale);
}

export function getGenericNakshatraReading(locale: AppLocale): string {
  return {
    en: "A lunar mansion is a fine symbolic qualifier. Read its planetary body, zodiac sign, house and ruler before using mansion imagery; the imagery is traditional, not a measured trait or prediction.",
    hi: "नक्षत्र एक सूक्ष्म प्रतीकात्मक विशेषता है। नक्षत्र-चित्र से पहले ग्रह, राशि, भाव और नक्षत्र-स्वामी पढ़ें; चित्र परंपरागत है, मापा हुआ गुण या भविष्यवाणी नहीं।",
    mr: "नक्षत्र हा सूक्ष्म प्रतीकात्मक विशेषक आहे. नक्षत्रप्रतिमेआधी ग्रह, राशी, भाव व नक्षत्रस्वामी वाचा; प्रतिमा पारंपरिक आहे, मोजलेला गुण किंवा भविष्यवाणी नाही.",
    de: "Eine Mondstation ist eine feine symbolische Präzisierung. Vor ihrer Bildsprache zuerst Himmelskörper, Tierkreiszeichen, Haus und Herrscher lesen; die Bilder sind traditionell, keine gemessene Eigenschaft oder Vorhersage.",
  }[locale];
}

export const LOCALIZED_ANALYSIS_LIMITATIONS: Readonly<
  Record<AnalysisLimitationId, LocalizedText>
> = {
  "symbolic-not-scientific": localized(
    "Vedic-astrology readings here are traditional and symbolic. Astrology has not been scientifically validated as a reliable way to predict events, personality, health or outcomes.",
    "यहाँ ज्योतिषीय पाठ पारंपरिक और प्रतीकात्मक हैं। घटनाओं, व्यक्तित्व, स्वास्थ्य या परिणामों की विश्वसनीय भविष्यवाणी के रूप में ज्योतिष वैज्ञानिक रूप से प्रमाणित नहीं है।",
    "येथील ज्योतिषवाचन पारंपरिक व प्रतीकात्मक आहे. घटना, व्यक्तिमत्त्व, आरोग्य किंवा परिणाम यांचे विश्वासार्ह भाकीत म्हणून ज्योतिष वैज्ञानिकदृष्ट्या प्रमाणित नाही.",
    "Die Deutungen der vedischen Astrologie hier sind traditionell und symbolisch. Astrologie ist wissenschaftlich nicht als zuverlässige Methode zur Vorhersage von Ereignissen, Persönlichkeit, Gesundheit oder Ergebnissen validiert.",
  ),
  "birth-time-sensitivity": localized(
    "The ascendant and houses are sensitive to birth time and place. Rounded or uncertain input can materially change them.",
    "लग्न और भाव जन्म-समय व स्थान के प्रति संवेदनशील हैं। अनुमानित या अनिश्चित जानकारी इन्हें महत्वपूर्ण रूप से बदल सकती है।",
    "लग्न व भाव जन्मवेळ व स्थळाबाबत संवेदनशील आहेत. अंदाजे किंवा अनिश्चित माहितीमुळे ते लक्षणीय बदलू शकतात.",
    "Aszendent und Häuser reagieren empfindlich auf Geburtszeit und -ort. Gerundete oder unsichere Eingaben können sie wesentlich verändern.",
  ),
  "model-dependence": localized(
    "Results depend on convention. This app uses its documented Lahiri sidereal offset and whole-sign houses; another model may differ near boundaries.",
    "परिणाम पद्धति पर निर्भर हैं। यह ऐप दस्तावेजित लाहिड़ी अयनांश और पूर्ण-राशि भाव उपयोग करता है; दूसरी पद्धति सीमा के पास अलग परिणाम दे सकती है।",
    "निष्कर्ष पद्धतीवर अवलंबून असतात. हे अ‍ॅप दस्तऐवजीकृत लाहिरी अयनांश व पूर्ण-राशी भाव वापरते; दुसरी पद्धत सीमेजवळ वेगळा निष्कर्ष देऊ शकते.",
    "Ergebnisse hängen von der Konvention ab. Diese App verwendet ihren dokumentierten siderischen Lahiri-Versatz und Ganzzeichenhäuser; andere Modelle können nahe Grenzen abweichen.",
  ),
  "mean-node-model": localized(
    "The North and South Nodes use mean-node positions. True-node positions may differ, especially near a boundary.",
    "राहु और केतु के लिए मध्यम नोड उपयोग होते हैं। विशेषकर सीमा के पास वास्तविक नोड अलग हो सकता है।",
    "राहू व केतूसाठी मध्यम नोड वापरले आहेत. विशेषतः सीमेजवळ खरा नोड वेगळा असू शकतो.",
    "Für Nord- und Südknoten werden mittlere Mondknotenpositionen verwendet. Positionen wahrer Knoten können insbesondere nahe einer Grenze abweichen.",
  ),
  "feature-scope": localized(
    "Sixfold strength, divisional charts, combustion, classical aspects, conjunction strength, combinations and event probabilities are not calculated. Mention of them is educational only.",
    "षड्बल, वर्ग-कुंडली, अस्तता, शास्त्रीय दृष्टि, युति-बल, योग और घटना-संभाव्यता की गणना नहीं होती। उनका उल्लेख केवल शैक्षिक है।",
    "षड्बल, वर्गकुंडली, अस्तता, शास्त्रीय दृष्टी, युतीबळ, योग व घटनासंभाव्यता मोजली जात नाही. त्यांचा उल्लेख फक्त शैक्षणिक आहे.",
    "Sechsfache Stärke, Teilhoroskope, Verbrennung, klassische Aspekte, Konjunktionsstärke, Kombinationen und Ereigniswahrscheinlichkeiten werden nicht berechnet. Erwähnungen dienen ausschließlich der Bildung.",
  ),
  "ephemeris-tolerance": localized(
    "The approximately one-arcminute figure is an engineering target, not independent certification against Swiss Ephemeris or JPL for every date, place, body and boundary.",
    "लगभग एक चाप-मिनट का आँकड़ा इंजीनियरिंग लक्ष्य है; हर तारीख, स्थान, पिंड और सीमा के लिए स्विस एफेमेरिस या JPL के विरुद्ध स्वतंत्र प्रमाणन नहीं।",
    "सुमारे एक चाप-मिनिट हा अभियांत्रिकी उद्देश आहे; प्रत्येक तारीख, स्थळ, पिंड व सीमेसाठी स्विस एफेमेरिस किंवा JPL विरुद्ध स्वतंत्र प्रमाणपत्र नाही.",
    "Die Angabe von ungefähr einer Bogenminute ist ein Entwicklungsziel, keine unabhängige Zertifizierung gegenüber Swiss Ephemeris oder JPL für jedes Datum, jeden Ort, Himmelskörper und jede Grenze.",
  ),
  "dasha-convention": localized(
    "Vimshottari dates use a disclosed 365.25-day year. Traditions or software using another year length or boundary rule can produce different dates.",
    "विम्शोत्तरी तिथियाँ घोषित 365.25-दिन वर्ष उपयोग करती हैं। दूसरी वर्ष-लंबाई या सीमा-नियम वाली परंपरा अथवा सॉफ्टवेयर अलग तारीख दे सकता है।",
    "विंशोत्तरी तारखा स्पष्ट केलेले 365.25-दिवस वर्ष वापरतात. वेगळे वर्षमान किंवा सीमेनियम वापरणारी परंपरा अथवा सॉफ्टवेअर वेगळ्या तारखा देऊ शकते.",
    "Vimshottari-Daten beruhen auf der offengelegten Konvention eines Jahres mit 365,25 Tagen. Traditionen oder Programme mit anderer Jahreslänge oder Grenzregel können andere Daten ergeben.",
  ),
  "transit-score-method": localized(
    "Daily and monthly transit scores are app-specific weighted rule summaries—not a universal Vedic-astrology measure, probability, scientific forecast or outcome rating.",
    "दैनिक और मासिक गोचर-अंक ऐप के अपने भारित नियमों का सार हैं—सार्वभौमिक ज्योतिषीय माप, संभाव्यता, वैज्ञानिक पूर्वानुमान या परिणाम-रेटिंग नहीं।",
    "दैनिक व मासिक गोचर गुण हे अ‍ॅपच्या स्वतःच्या भारित नियमांचे सार आहेत—सार्वत्रिक ज्योतिषमापन, संभाव्यता, वैज्ञानिक अंदाज किंवा परिणामगुणांकन नाही.",
    "Tägliche und monatliche Transitwerte sind app-spezifische, gewichtete Regelzusammenfassungen — kein universelles Maß der vedischen Astrologie, keine Wahrscheinlichkeit, wissenschaftliche Prognose oder Ergebnisbewertung.",
  ),
};
