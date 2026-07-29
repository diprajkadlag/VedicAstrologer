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
    name: localized("Lagna", "लग्न", "लग्न"),
    summary: localized(
      "The sidereal degree rising on the eastern horizon at the given time and place.",
      "दिए गए समय और स्थान पर पूर्वी क्षितिज पर उदित होने वाला निरयन अंश।",
      "दिलेल्या वेळेस आणि स्थळी पूर्व क्षितिजावर उगवणारा निरयन अंश.",
    ),
    detail: localized(
      "Lagna anchors the twelve Bhavas. Jyotish uses it as a symbolic lens for embodiment, temperament and how a person meets life. It moves quickly, so a rounded or uncertain birth time can change the Lagna and every Bhava.",
      "लग्न बारह भावों का आधार है। ज्योतिष में इसे शरीर, स्वभाव और जीवन का सामना करने की शैली का प्रतीक माना जाता है। यह तेजी से बदलता है, इसलिए अनुमानित जन्म-समय से लग्न और सभी भाव बदल सकते हैं।",
      "लग्न बारा भावांचा आधार आहे. ज्योतिषात ते शरीर, स्वभाव आणि जीवनाला सामोरे जाण्याच्या पद्धतीचे प्रतीक मानले जाते. ते वेगाने बदलते; म्हणून अंदाजे जन्मवेळेमुळे लग्न व सर्व भाव बदलू शकतात.",
    ),
    readingSequence: localized(
      "Read its Rasi, its lord, grahas in the first Bhava, then relevant timing. No single factor is a verdict.",
      "पहले इसकी राशि, फिर लग्नेश, प्रथम भाव के ग्रह और उसके बाद संबंधित काल देखें। कोई एक कारक अंतिम निर्णय नहीं है।",
      "प्रथम त्याची राशी, मग लग्नेश, पहिल्या भावातील ग्रह आणि नंतर संबंधित काल पाहा. एकच घटक अंतिम निर्णय नसतो.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "rasi",
    category: "foundation",
    name: localized("Rasi", "राशि", "राशी"),
    summary: localized(
      "One of twelve equal 30° divisions of the sidereal zodiac.",
      "निरयन राशि-चक्र के बारह समान 30° भागों में से एक।",
      "निरयन राशिचक्रातील बारा समान 30° विभागांपैकी एक.",
    ),
    detail: localized(
      "A Rasi describes the style and conditions through which a graha or Bhava is traditionally interpreted. Rasi is not the same as a planet, constellation or personality label.",
      "राशि उस शैली और परिस्थिति का प्रतीक है जिसके माध्यम से ग्रह या भाव की व्याख्या की जाती है। राशि ग्रह, नक्षत्र या संपूर्ण व्यक्तित्व का लेबल नहीं है।",
      "ग्रह किंवा भाव ज्या शैलीत व परिस्थितीत व्यक्त होतो त्याचे प्रतीक म्हणजे राशी. राशी म्हणजे ग्रह, नक्षत्र किंवा संपूर्ण व्यक्तिमत्त्वाचे लेबल नव्हे.",
    ),
    readingSequence: localized(
      "Identify the graha or Bhava first, then use the Rasi to qualify how it operates.",
      "पहले ग्रह या भाव पहचानें, फिर राशि से उसके काम करने की शैली समझें।",
      "आधी ग्रह किंवा भाव ओळखा; नंतर तो कसा कार्य करतो हे राशीने स्पष्ट करा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "bhava",
    category: "foundation",
    name: localized("Bhava / Ghara", "भाव / घर", "भाव / घर"),
    summary: localized(
      "One of twelve symbolic life fields counted from Lagna.",
      "लग्न से गिने जाने वाले जीवन के बारह प्रतीकात्मक क्षेत्रों में से एक।",
      "लग्नापासून मोजल्या जाणाऱ्या जीवनाच्या बारा प्रतीकात्मक क्षेत्रांपैकी एक.",
    ),
    detail: localized(
      "Bhavas organize topics such as body, resources, learning, home, partnership and work. A Bhava is read through its topics, Rasi, lord, resident grahas and timing. An empty Bhava is not inactive; its lord still connects it to the chart.",
      "भाव शरीर, संसाधन, सीख, घर, संबंध और कर्म जैसे विषय व्यवस्थित करते हैं। भाव को उसके विषय, राशि, भावेश, स्थित ग्रह और काल के साथ पढ़ा जाता है। खाली भाव निष्क्रिय नहीं होता; उसका स्वामी फिर भी कुंडली से संबंध बनाता है।",
      "भाव शरीर, साधने, शिक्षण, घर, संबंध व कर्म यांसारखे विषय मांडतात. भावाचे विषय, राशी, भावेश, त्यातील ग्रह आणि काल एकत्र वाचले जातात. रिकामा भाव निष्क्रिय नसतो; त्याचा स्वामी त्याला कुंडलीशी जोडतो.",
    ),
    readingSequence: localized(
      "Start with the Bhava topic, add its Rasi and lord, then resident grahas. This app uses whole-sign Bhavas.",
      "भाव के विषय से शुरू करें; फिर राशि, भावेश और उसमें स्थित ग्रह जोड़ें। यह ऐप पूर्ण-राशि भाव पद्धति उपयोग करता है।",
      "भावाच्या विषयापासून सुरुवात करा; नंतर राशी, भावेश व त्यातील ग्रह जोडा. हे अ‍ॅप पूर्ण-राशी भावपद्धत वापरते.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "graha",
    category: "foundation",
    name: localized("Graha", "ग्रह", "ग्रह"),
    summary: localized(
      "A Jyotish symbolic agent representing a function of experience.",
      "अनुभव के किसी कार्य का प्रतिनिधित्व करने वाला ज्योतिषीय प्रतीक।",
      "अनुभवातील एखाद्या कार्याचे प्रतिनिधित्व करणारा ज्योतिषीय प्रतीक.",
    ),
    detail: localized(
      "The nine grahas here are Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu and Ketu. Surya and Chandra are luminaries; Rahu and Ketu are mathematical lunar nodes. Calling all nine 'planets' is a traditional convenience, not an astronomy claim.",
      "यहाँ नौ ग्रह सूर्य, चंद्र, मंगल, बुध, गुरु, शुक्र, शनि, राहु और केतु हैं। सूर्य-चंद्र ज्योति-पिंड हैं; राहु-केतु गणितीय चंद्र-नोड हैं। सभी को 'ग्रह' कहना परंपरागत सुविधा है, खगोल-विज्ञान का दावा नहीं।",
      "येथे सूर्य, चंद्र, मंगळ, बुध, गुरु, शुक्र, शनि, राहू व केतू हे नऊ ग्रह आहेत. सूर्य-चंद्र ज्योतिर्गोल, तर राहू-केतू गणितीय चंद्रनोड आहेत. सर्वांना 'ग्रह' म्हणणे ही पारंपरिक सोय आहे; खगोलशास्त्रीय दावा नाही.",
    ),
    readingSequence: localized(
      "Graha says what function; Rasi says how; Bhava says where. Condition and timing add context.",
      "ग्रह बताता है कौन-सा कार्य, राशि बताती है कैसे, और भाव बताता है कहाँ। अवस्था और काल संदर्भ जोड़ते हैं।",
      "ग्रह कोणते कार्य, राशी कसे, आणि भाव कुठे हे सांगतो. अवस्था व काल संदर्भ देतात.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "nakshatra",
    category: "foundation",
    name: localized("Nakshatra", "नक्षत्र", "नक्षत्र"),
    summary: localized(
      "One of 27 equal lunar-mansion segments, each 13°20′ wide.",
      "27 समान चंद्र-मंडल खंडों में से एक, प्रत्येक 13°20′ चौड़ा।",
      "27 समान चंद्रमंडल विभागांपैकी एक; प्रत्येक 13°20′ रुंद.",
    ),
    detail: localized(
      "Nakshatras provide a finer traditional symbolic layer. Chandra's birth Nakshatra sets the starting Vimshottari sequence. Mansion imagery and personality descriptions are interpretive traditions, not measured psychological traits.",
      "नक्षत्र एक सूक्ष्म पारंपरिक प्रतीकात्मक परत देते हैं। जन्म-चंद्र का नक्षत्र विम्शोत्तरी क्रम का आरंभ तय करता है। नक्षत्र-चित्र और व्यक्तित्व-वर्णन व्याख्यात्मक परंपराएँ हैं, मापे गए मनोवैज्ञानिक गुण नहीं।",
      "नक्षत्र अधिक सूक्ष्म पारंपरिक प्रतीकात्मक स्तर देतात. जन्मचंद्राचे नक्षत्र विंशोत्तरी क्रमाची सुरुवात ठरवते. नक्षत्र-प्रतिमा व व्यक्तिमत्त्ववर्णने ही परंपरागत व्याख्या आहेत; मोजलेले मानसशास्त्रीय गुण नाहीत.",
    ),
    readingSequence: localized(
      "Use it after graha, Rasi and Bhava; avoid turning one image or deity into a literal prediction.",
      "इसे ग्रह, राशि और भाव के बाद पढ़ें; किसी एक प्रतीक या देवता को शाब्दिक भविष्यवाणी न बनाएँ।",
      "ग्रह, राशी व भावानंतर ते वाचा; एखादी प्रतिमा किंवा देवता यांना शब्दशः भविष्यवाणी बनवू नका.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "pada",
    category: "foundation",
    name: localized("Pada", "पाद", "पाद"),
    summary: localized(
      "One of four 3°20′ quarters within a Nakshatra.",
      "नक्षत्र के चार 3°20′ चरणों में से एक।",
      "नक्षत्रातील चार 3°20′ चरणांपैकी एक.",
    ),
    detail: localized(
      "Pada refines a Nakshatra placement and links it to a Navamsha division. This app calculates the Pada number but does not currently calculate or display a Navamsha chart.",
      "पाद नक्षत्र-स्थिति को सूक्ष्म करता है और उसे नवांश से जोड़ता है। यह ऐप पाद संख्या निकालता है, पर अभी नवांश कुंडली नहीं निकालता या दिखाता।",
      "पाद नक्षत्रस्थिती अधिक सूक्ष्म करतो व नवांशाशी जोडतो. हे अ‍ॅप पाद क्रमांक मोजते; मात्र सध्या नवांश कुंडली मोजत किंवा दाखवत नाही.",
    ),
    readingSequence: localized(
      "Treat Pada as refinement, not as a replacement for the whole chart.",
      "पाद को सूक्ष्मता मानें, पूरी कुंडली का विकल्प नहीं।",
      "पाद हा बारकावा आहे; संपूर्ण कुंडलीचा पर्याय नाही.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "nakshatra-lord",
    category: "relationship",
    name: localized(
      "Nakshatra lord",
      "नक्षत्र स्वामी",
      "नक्षत्र स्वामी",
    ),
    summary: localized(
      "The graha assigned to a Nakshatra in the repeating Vimshottari sequence.",
      "विम्शोत्तरी क्रम में किसी नक्षत्र को दिया गया ग्रह-स्वामी।",
      "विंशोत्तरी क्रमात एखाद्या नक्षत्राला दिलेला ग्रहस्वामी.",
    ),
    detail: localized(
      "The sequence Ketu, Shukra, Surya, Chandra, Mangala, Rahu, Guru, Shani and Budha repeats across all 27 Nakshatras. The lord creates a traditional interpretive link to that graha's natal placement; it is different from the Rasi lord or Bhavesha.",
      "केतु, शुक्र, सूर्य, चंद्र, मंगल, राहु, गुरु, शनि और बुध का क्रम 27 नक्षत्रों में दोहरता है। स्वामी उस ग्रह की जन्म-स्थिति से पारंपरिक संबंध बनाता है; वह राशि-स्वामी या भावेश से अलग है।",
      "केतू, शुक्र, सूर्य, चंद्र, मंगळ, राहू, गुरु, शनि व बुध हा क्रम 27 नक्षत्रांत पुनरावृत्त होतो. स्वामी त्या ग्रहाच्या जन्मस्थितीशी पारंपरिक दुवा जोडतो; तो राशीस्वामी किंवा भावेशापेक्षा वेगळा आहे.",
    ),
    readingSequence: localized(
      "First identify which graha occupies the Nakshatra; then locate the Nakshatra lord by Rasi and Bhava.",
      "पहले नक्षत्र में स्थित ग्रह पहचानें; फिर नक्षत्र-स्वामी की राशि और भाव देखें।",
      "आधी नक्षत्रातील ग्रह ओळखा; मग नक्षत्रस्वामीची राशी व भाव पाहा.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "bhava-lord",
    category: "relationship",
    name: localized("Bhavesha", "भावेश", "भावेश"),
    summary: localized(
      "The graha ruling the Rasi that occupies a Bhava.",
      "किसी भाव में स्थित राशि का स्वामी ग्रह।",
      "एखाद्या भावात असलेल्या राशीचा स्वामी ग्रह.",
    ),
    detail: localized(
      "Bhavesha links its source Bhava to the Bhava where that graha is placed. This is a traditional topic connection—not proof that a specific event will happen.",
      "भावेश अपने मूल भाव को उस भाव से जोड़ता है जहाँ वह ग्रह स्थित है। यह पारंपरिक विषय-संबंध है—किसी निश्चित घटना का प्रमाण नहीं।",
      "भावेश आपल्या मूळ भावाला तो ग्रह ज्या भावात आहे त्याच्याशी जोडतो. हा पारंपरिक विषयसंबंध आहे—विशिष्ट घटना घडेल याचा पुरावा नाही.",
    ),
    readingSequence: localized(
      "Find the Bhava's Rasi, its ruler, then that ruler's placement and condition.",
      "भाव की राशि, उसका स्वामी, फिर उस स्वामी की स्थिति और अवस्था देखें।",
      "भावाची राशी, तिचा स्वामी, नंतर त्या स्वामीचे स्थान व अवस्था पाहा.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "lagna-lord",
    category: "relationship",
    name: localized("Lagnesha", "लग्नेश", "लग्नेश"),
    summary: localized(
      "The graha ruling the Lagna Rasi.",
      "लग्न राशि का स्वामी ग्रह।",
      "लग्न राशीचा स्वामी ग्रह.",
    ),
    detail: localized(
      "Lagnesha is read as a symbolic carrier of vitality and life orientation. Its Bhava placement connects first-Bhava topics with another field, while its Rasi describes style. Strength claims require methods this app may not calculate.",
      "लग्नेश को जीवन-ऊर्जा और दिशा का प्रतीकात्मक वाहक माना जाता है। उसका भाव प्रथम भाव को दूसरे क्षेत्र से जोड़ता है और राशि उसकी शैली बताती है। बल के दावों के लिए ऐसी विधियाँ चाहिए जो यह ऐप शायद न निकालता हो।",
      "लग्नेश हा जीवनशक्ती व दिशेचा प्रतीकात्मक वाहक मानला जातो. त्याचा भाव पहिल्या भावाला दुसऱ्या क्षेत्राशी जोडतो व राशी शैली सांगते. बळाविषयी दाव्यांसाठी या अ‍ॅपमध्ये नसलेली गणना लागू शकते.",
    ),
    readingSequence: localized(
      "Read Lagna and Lagnesha together; do not label a person solely from either one.",
      "लग्न और लग्नेश को साथ पढ़ें; किसी एक से व्यक्ति पर अंतिम लेबल न लगाएँ।",
      "लग्न व लग्नेश एकत्र वाचा; एकाच घटकावरून व्यक्तीला अंतिम लेबल देऊ नका.",
    ),
    calculationStatus: "partly-calculated",
  },
  {
    id: "janma-rasi",
    category: "relationship",
    name: localized("Janma Rasi", "जन्म राशि", "जन्म राशी"),
    summary: localized(
      "The Rasi occupied by Chandra at birth.",
      "जन्म के समय चंद्र जिस राशि में स्थित हो।",
      "जन्मावेळी चंद्र ज्या राशीत असतो ती राशी.",
    ),
    detail: localized(
      "Janma Rasi is used as a reference for emotional symbolism and Moon-relative Gochara counting. It complements rather than replaces Lagna.",
      "जन्म राशि भावनात्मक प्रतीक और चंद्र से गोचर-गणना का संदर्भ है। यह लग्न का पूरक है, उसका विकल्प नहीं।",
      "जन्म राशी भावनिक प्रतीक व चंद्रापासून गोचर मोजण्याचा संदर्भ आहे. ती लग्नाला पूरक आहे; पर्याय नाही.",
    ),
    readingSequence: localized(
      "Compare Moon-relative themes with Lagna-relative Bhavas; disagreement suggests different lenses, not an error.",
      "चंद्र-सापेक्ष विषयों की तुलना लग्न-सापेक्ष भावों से करें; अंतर अलग दृष्टि है, जरूरी नहीं कि त्रुटि हो।",
      "चंद्रसापेक्ष विषयांची तुलना लग्नसापेक्ष भावांशी करा; फरक म्हणजे भिन्न दृष्टी, चूकच असे नाही.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "drishti",
    category: "relationship",
    name: localized("Drishti", "दृष्टि", "दृष्टी"),
    summary: localized(
      "A traditional rule for one graha or Rasi influencing another by aspect.",
      "एक ग्रह या राशि का दूसरे पर पहलू द्वारा प्रभाव बताने वाला पारंपरिक नियम।",
      "एका ग्रहाचा किंवा राशीचा दुसऱ्यावर पैलूने प्रभाव सांगणारा पारंपरिक नियम.",
    ),
    detail: localized(
      "Jyotish has graha Drishti and Rasi Drishti systems, and traditions differ on weighting. This app does not yet calculate classical aspects, strength or aspect orbs, so educational references are not chart findings.",
      "ज्योतिष में ग्रह-दृष्टि और राशि-दृष्टि प्रणालियाँ हैं तथा परंपराओं में भार अलग हो सकता है। यह ऐप अभी शास्त्रीय दृष्टि, उसका बल या अंश-अंतर नहीं निकालता; इसलिए शैक्षिक उल्लेख कुंडली-निष्कर्ष नहीं हैं।",
      "ज्योतिषात ग्रहदृष्टी व राशीदृष्टी पद्धती आहेत आणि परंपरेनुसार वजन बदलते. हे अ‍ॅप सध्या शास्त्रीय दृष्टी, तिचे बळ किंवा अंशांतर मोजत नाही; शैक्षणिक उल्लेख हा कुंडलीतील निष्कर्ष नाही.",
    ),
    readingSequence: localized(
      "Choose and disclose one Drishti system before interpreting it.",
      "व्याख्या से पहले एक दृष्टि-पद्धति चुनें और स्पष्ट बताएँ।",
      "अर्थ लावण्यापूर्वी एक दृष्टीपद्धत निवडा व ती स्पष्ट सांगा.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "yuti",
    category: "relationship",
    name: localized("Yuti", "युति", "युती"),
    summary: localized(
      "Two or more grahas occupying the same Rasi or a chosen angular range.",
      "दो या अधिक ग्रहों का एक राशि या चुने हुए अंश-अंतर में होना।",
      "दोन किंवा अधिक ग्रह एकाच राशीत किंवा निवडलेल्या अंशांतरात असणे.",
    ),
    detail: localized(
      "A same-Rasi Yuti is broad; close degree contact is more specific. Different schools use different orbs. This app displays longitudes but does not assign Yuti strength or automatically judge a conjunction as beneficial or harmful.",
      "एक-राशि युति व्यापक है; निकट अंश संपर्क अधिक विशिष्ट है। अलग परंपराएँ अलग अंश-अंतर लेती हैं। यह ऐप देशांतर दिखाता है, पर युति-बल या स्वतः शुभ-अशुभ निर्णय नहीं देता।",
      "एकाच राशीतील युती व्यापक, तर जवळचा अंशसंपर्क अधिक विशिष्ट असतो. परंपरेनुसार अंशांतर बदलते. हे अ‍ॅप रेखांश दाखवते; युतीचे बळ किंवा आपोआप शुभ-अशुभ निर्णय देत नाही.",
    ),
    readingSequence: localized(
      "Check actual angular separation and each graha's role before synthesizing.",
      "संश्लेषण से पहले वास्तविक अंश-अंतर और हर ग्रह की भूमिका जाँचें।",
      "संश्लेषणाआधी प्रत्यक्ष अंशांतर व प्रत्येक ग्रहाची भूमिका तपासा.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "dignity",
    category: "relationship",
    name: localized("Graha Avastha / Dignity", "ग्रह अवस्था / गरिमा", "ग्रह अवस्था / प्रतिष्ठा"),
    summary: localized(
      "Traditional classifications of how comfortably or effectively a graha may express in a Rasi.",
      "किसी राशि में ग्रह कितनी सहजता या प्रभाव से व्यक्त हो सकता है, इसकी पारंपरिक श्रेणियाँ।",
      "एखाद्या राशीत ग्रह किती सहजतेने किंवा प्रभावीपणे व्यक्त होऊ शकतो याच्या पारंपरिक श्रेणी.",
    ),
    detail: localized(
      "Examples include own Rasi, exaltation, debilitation, friendship and enmity. Dignity modifies expression; it does not make a person or life area simply good or bad. This app does not yet calculate a complete dignity model.",
      "उदाहरण हैं स्व-राशि, उच्च, नीच, मित्रता और शत्रुता। अवस्था अभिव्यक्ति बदलती है; व्यक्ति या जीवन-क्षेत्र को केवल अच्छा-बुरा नहीं बनाती। यह ऐप अभी पूर्ण अवस्था-मॉडल नहीं निकालता।",
      "स्वराशी, उच्च, नीच, मैत्री व शत्रुत्व ही उदाहरणे. अवस्था अभिव्यक्ती बदलते; व्यक्ती किंवा जीवनक्षेत्र फक्त चांगले-वाईट ठरत नाही. हे अ‍ॅप सध्या पूर्ण अवस्थामॉडेल मोजत नाही.",
    ),
    readingSequence: localized(
      "Treat dignity as one modifier alongside Bhava, rulership, motion, aspects and timing.",
      "अवस्था को भाव, स्वामित्व, गति, दृष्टि और काल के साथ एक कारक मानें।",
      "अवस्थेला भाव, स्वामित्व, गती, दृष्टी व काल यांच्यासह एक घटक माना.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "vakri",
    category: "relationship",
    name: localized("Vakri", "वक्री", "वक्री"),
    summary: localized(
      "Apparent backward motion in geocentric zodiac longitude.",
      "भूकेंद्रित राशि-देशांतर में दिखाई देने वाली उलटी गति।",
      "भूकेंद्री राशीरेखांशात दिसणारी उलटी गती.",
    ),
    detail: localized(
      "Vakri motion is an astronomical perspective effect. Traditional readings may associate it with review, intensity or non-linear expression, but it does not automatically reverse a graha or make it harmful.",
      "वक्री गति खगोलीय दृष्टिकोण का प्रभाव है। परंपरा इसे पुनर्विचार, तीव्रता या गैर-सीधी अभिव्यक्ति से जोड़ सकती है, पर यह ग्रह को स्वतः उलट या हानिकारक नहीं बनाती।",
      "वक्री गती हा खगोलीय दृष्टीकोनाचा परिणाम आहे. परंपरेत ती पुनर्विचार, तीव्रता किंवा अरेषीय अभिव्यक्तीशी जोडली जाऊ शकते; पण ग्रह आपोआप उलटा किंवा हानिकारक होत नाही.",
    ),
    readingSequence: localized(
      "Read the graha, Rasi, Bhava and rulership first; Vakri is a modifier.",
      "पहले ग्रह, राशि, भाव और स्वामित्व पढ़ें; वक्री एक संशोधक है।",
      "प्रथम ग्रह, राशी, भाव व स्वामित्व वाचा; वक्री हा बदल करणारा घटक आहे.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "rahu-ketu",
    category: "foundation",
    name: localized("Rahu–Ketu", "राहु–केतु", "राहू–केतू"),
    summary: localized(
      "The opposite ascending and descending nodes of Chandra's orbit.",
      "चंद्र-कक्षा के परस्पर विपरीत आरोही और अवरोही नोड।",
      "चंद्रकक्षेचे परस्परविरुद्ध आरोही व अवरोही नोड.",
    ),
    detail: localized(
      "They are mathematical points connected with eclipse geometry, not physical planets. Jyotish often uses Rahu for amplification and unfamiliar appetite, Ketu for separation and inward discrimination. Those are symbolic lenses, not diagnoses.",
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
    name: localized("Dasha", "दशा", "दशा"),
    summary: localized(
      "A traditional planetary-period framework for organizing symbolic time.",
      "प्रतीकात्मक समय व्यवस्थित करने की पारंपरिक ग्रह-काल पद्धति।",
      "प्रतीकात्मक काळ मांडण्याची पारंपरिक ग्रहकाल पद्धत.",
    ),
    detail: localized(
      "A Dasha emphasizes the natal themes of its lord. It is not a transit and does not guarantee an event. This app uses Vimshottari timing from Chandra's Nakshatra; other Dasha systems exist.",
      "दशा अपने स्वामी के जन्म-कुंडली विषयों पर जोर देती है। यह गोचर नहीं और घटना की गारंटी नहीं। यह ऐप जन्म-चंद्र के नक्षत्र से विम्शोत्तरी काल उपयोग करता है; अन्य दशा प्रणालियाँ भी हैं।",
      "दशा तिच्या स्वामीच्या जन्मकुंडलीतील विषयांना भर देते. ती गोचर नाही व घटना निश्चित करत नाही. हे अ‍ॅप जन्मचंद्राच्या नक्षत्रावरून विंशोत्तरी काल वापरते; इतर दशापद्धतीही आहेत.",
    ),
    readingSequence: localized(
      "Locate the period lord in the natal chart, then add the subperiod and current Gochara.",
      "दशा-स्वामी की जन्म-स्थिति देखें, फिर अंतर्दशा और वर्तमान गोचर जोड़ें।",
      "दशास्वामीचे जन्मस्थान पाहा; मग अंतर्दशा व वर्तमान गोचर जोडा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "mahadasha-antardasha",
    category: "timing",
    name: localized(
      "Mahadasha–Antardasha",
      "महादशा–अंतर्दशा",
      "महादशा–अंतर्दशा",
    ),
    summary: localized(
      "A broad planetary chapter and its shorter nested subperiod.",
      "एक लंबा ग्रह-काल अध्याय और उसके भीतर छोटी उप-अवधि।",
      "दीर्घ ग्रहकालीन अध्याय व त्यातील लहान उपकाल.",
    ),
    detail: localized(
      "Mahadasha supplies the background theme; Antardasha changes the nearer focus. Their combination is read through both lords' natal placements and rulerships. Generic lord-pair text cannot replace that chart context.",
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
    name: localized("Gochara", "गोचर", "गोचर"),
    summary: localized(
      "Current graha positions compared with a natal chart.",
      "वर्तमान ग्रह-स्थितियों की जन्म-कुंडली से तुलना।",
      "वर्तमान ग्रहस्थितींची जन्मकुंडलीशी तुलना.",
    ),
    detail: localized(
      "Gochara indicates temporary symbolic emphasis. Jyotish commonly counts from both Lagna and Janma Rasi. A transit score in this app is a disclosed rule summary—not a probability, fact or promise.",
      "गोचर अस्थायी प्रतीकात्मक जोर बताता है। ज्योतिष में लग्न और जन्म राशि दोनों से गिनती होती है। ऐप का गोचर-अंक स्पष्ट नियमों का सार है—संभाव्यता, तथ्य या वादा नहीं।",
      "गोचर तात्पुरता प्रतीकात्मक भर दर्शवतो. ज्योतिषात लग्न व जन्म राशी दोन्हीपासून मोजणी होते. अ‍ॅपमधील गोचर गुण हा स्पष्ट नियमांचा सारांश आहे—संभाव्यता, तथ्य किंवा हमी नाही.",
    ),
    readingSequence: localized(
      "State the reference point and selected date; combine slow and fast grahas cautiously.",
      "संदर्भ-बिंदु और चुनी तारीख बताएँ; धीमे और तेज ग्रहों को सावधानी से मिलाएँ।",
      "संदर्भबिंदू व निवडलेली तारीख सांगा; मंद व जलद ग्रह सावधपणे एकत्र वाचा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "ayanamsa",
    category: "method",
    name: localized("Ayanamsha", "अयनांश", "अयनांश"),
    summary: localized(
      "The angular offset used to convert tropical longitude to a sidereal frame.",
      "सायन देशांतर को निरयन संदर्भ में बदलने वाला कोणीय अंतर।",
      "सायन रेखांश निरयन संदर्भात बदलण्यासाठीचे कोनीय अंतर.",
    ),
    detail: localized(
      "Different Ayanamsha conventions can move placements near boundaries. This app consistently applies its documented Lahiri model to Lagna, grahas, Rasis and Nakshatras.",
      "अलग अयनांश पद्धतियाँ सीमा के पास स्थिति बदल सकती हैं। यह ऐप लग्न, ग्रह, राशि और नक्षत्र पर दस्तावेजित लाहिड़ी मॉडल लगातार लागू करता है।",
      "वेगवेगळ्या अयनांश पद्धतींमुळे सीमेजवळील स्थान बदलू शकते. हे अ‍ॅप लग्न, ग्रह, राशी व नक्षत्रांसाठी दस्तऐवजीकृत लाहिरी मॉडेल सातत्याने वापरते.",
    ),
    readingSequence: localized(
      "Compare charts only after confirming the same Ayanamsha and node model.",
      "कुंडलियों की तुलना से पहले समान अयनांश और नोड मॉडल सुनिश्चित करें।",
      "कुंडल्या तुलना करण्याआधी समान अयनांश व नोड मॉडेल तपासा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "whole-sign",
    category: "method",
    name: localized(
      "Whole-sign Bhavas",
      "पूर्ण-राशि भाव",
      "पूर्ण-राशी भाव",
    ),
    summary: localized(
      "The entire Lagna Rasi is Bhava 1; each following Rasi is the next Bhava.",
      "पूरी लग्न राशि प्रथम भाव और हर अगली राशि अगला भाव बनती है।",
      "संपूर्ण लग्न राशी पहिला भाव व पुढील प्रत्येक राशी पुढचा भाव बनते.",
    ),
    detail: localized(
      "This makes every Bhava boundary a Rasi boundary. The exact Lagna degree remains an important angle but is not a cusp in this system. Other Bhava systems can assign planets differently.",
      "इसमें हर भाव-सीमा राशि-सीमा होती है। लग्न का सटीक अंश महत्वपूर्ण कोण है, पर इस पद्धति में भाव-संधि नहीं। दूसरी भाव पद्धतियाँ ग्रहों को अलग भाव दे सकती हैं।",
      "यात प्रत्येक भावसीमा ही राशीसीमा असते. लग्नाचा अचूक अंश महत्त्वाचा कोन आहे; मात्र या पद्धतीत भावसंधी नाही. इतर भावपद्धती ग्रहांना वेगळे भाव देऊ शकतात.",
    ),
    readingSequence: localized(
      "Keep one house system consistent when comparing natal and Gochara readings.",
      "जन्म और गोचर पढ़ते समय एक ही भाव-पद्धति लगातार रखें।",
      "जन्म व गोचर वाचताना एकच भावपद्धत सातत्याने वापरा.",
    ),
    calculationStatus: "calculated",
  },
  {
    id: "shadbala",
    category: "method",
    name: localized("Shadbala", "षड्बल", "षड्बल"),
    summary: localized(
      "A classical multi-part system for quantifying six categories of graha strength.",
      "ग्रह-बल की छह श्रेणियों को मापने वाली शास्त्रीय बहु-भाग पद्धति।",
      "ग्रहबळाच्या सहा श्रेणी मोजणारी शास्त्रीय बहुभागी पद्धत.",
    ),
    detail: localized(
      "Shadbala combines positional, directional, temporal, motional, natural and aspect-related components with specific units and thresholds. This app does not calculate Shadbala, so it must not call a graha 'strong' from Shadbala.",
      "षड्बल स्थान, दिशा, काल, गति, नैसर्गिक और दृष्टि-आधारित घटकों को विशेष इकाइयों और सीमाओं से जोड़ता है। यह ऐप षड्बल नहीं निकालता, इसलिए षड्बल के आधार पर किसी ग्रह को 'बलवान' नहीं कह सकता।",
      "षड्बल स्थान, दिशा, काल, गती, नैसर्गिक व दृष्टीसंबंधित घटक विशिष्ट एकके व मर्यादांनी जोडते. हे अ‍ॅप षड्बल मोजत नाही; म्हणून षड्बलावरून ग्रहाला 'बलवान' म्हणू शकत नाही.",
    ),
    readingSequence: localized(
      "Require a transparent component-by-component calculation before citing a Shadbala result.",
      "षड्बल परिणाम बताने से पहले हर घटक की पारदर्शी गणना आवश्यक है।",
      "षड्बल निष्कर्ष सांगण्याआधी प्रत्येक घटकाची पारदर्शक गणना आवश्यक आहे.",
    ),
    calculationStatus: "not-calculated",
  },
  {
    id: "varga",
    category: "method",
    name: localized("Varga", "वर्ग", "वर्ग"),
    summary: localized(
      "A divisional chart derived by mapping portions of each Rasi into another zodiac.",
      "हर राशि के अंशों को दूसरे राशि-चक्र में रखकर बनी विभागीय कुंडली।",
      "प्रत्येक राशीचे अंश दुसऱ्या राशिचक्रात नकाशित करून तयार होणारी विभागीय कुंडली.",
    ),
    detail: localized(
      "Vargas are used for focused traditional analysis; Navamsha is one example. Exact boundary handling and birth-time precision matter. This app reports Nakshatra Pada but does not yet calculate or interpret varga charts.",
      "वर्ग विशिष्ट पारंपरिक विश्लेषण के लिए उपयोग होते हैं; नवांश एक उदाहरण है। सीमा-गणना और जन्म-समय की शुद्धता महत्वपूर्ण हैं। यह ऐप नक्षत्र-पाद बताता है, पर वर्ग-कुंडली नहीं निकालता या समझाता।",
      "वर्ग विशिष्ट पारंपरिक विश्लेषणासाठी वापरले जातात; नवांश हे उदाहरण. सीमा हाताळणी व जन्मवेळेची अचूकता महत्त्वाची. हे अ‍ॅप नक्षत्रपाद दाखवते; वर्गकुंडली मोजत किंवा अर्थ लावत नाही.",
    ),
    readingSequence: localized(
      "Do not infer a complete Navamsha reading from Pada alone.",
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
    name: "Lagna",
    summary:
      "Der siderische Grad, der zur eingegebenen Zeit am angegebenen Ort am östlichen Horizont aufsteigt.",
    detail:
      "Das Lagna verankert die zwölf Bhavas. Im Jyotish dient es als symbolische Perspektive auf Verkörperung, Temperament und die Art, dem Leben zu begegnen. Es bewegt sich schnell; eine gerundete oder unsichere Geburtszeit kann daher das Lagna und alle Bhavas verändern.",
    readingSequence:
      "Zuerst seine Rasi und deren Herrscher, dann Grahas im ersten Bhava und schließlich die relevanten Zeitfaktoren lesen. Kein Einzelfaktor ist ein Urteil.",
  },
  rasi: {
    id: "rasi",
    name: "Rasi",
    summary:
      "Einer von zwölf gleich großen 30°-Abschnitten des siderischen Tierkreises.",
    detail:
      "Eine Rasi beschreibt traditionell Stil und Bedingungen, durch die ein Graha oder Bhava interpretiert wird. Eine Rasi ist weder ein Planet noch ein Sternbild oder ein Etikett für die gesamte Persönlichkeit.",
    readingSequence:
      "Zuerst den Graha oder Bhava bestimmen; danach mit der Rasi präzisieren, auf welche Weise er sich ausdrückt.",
  },
  bhava: {
    id: "bhava",
    name: "Bhava / Ghara",
    summary:
      "Eines von zwölf symbolischen Lebensfeldern, die vom Lagna aus gezählt werden.",
    detail:
      "Bhavas ordnen Themen wie Körper, Ressourcen, Lernen, Zuhause, Partnerschaft und Arbeit. Gelesen werden Thema, Rasi, Bhavesha, anwesende Grahas und Zeitfaktoren gemeinsam. Ein leerer Bhava ist nicht inaktiv; sein Herrscher verbindet ihn weiterhin mit der Kundali.",
    readingSequence:
      "Mit dem Thema des Bhava beginnen, dann seine Rasi und deren Herrscher sowie die anwesenden Grahas ergänzen. Diese App verwendet Ganzzeichen-Bhavas.",
  },
  graha: {
    id: "graha",
    name: "Graha",
    summary:
      "Ein symbolischer Akteur des Jyotish, der eine Erfahrungsfunktion verkörpert.",
    detail:
      "Die neun Grahas sind hier Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu und Ketu. Surya und Chandra sind Lichter; Rahu und Ketu sind mathematische Mondknoten. Alle neun als „Planeten“ zu bezeichnen ist eine traditionelle Vereinfachung, keine astronomische Behauptung.",
    readingSequence:
      "Der Graha beschreibt welche Funktion, die Rasi wie und der Bhava wo. Zustand und Zeitfaktoren liefern den weiteren Kontext.",
  },
  nakshatra: {
    id: "nakshatra",
    name: "Nakshatra",
    summary:
      "Einer von 27 gleich großen Mondstations-Abschnitten mit jeweils 13°20′.",
    detail:
      "Nakshatras bilden eine feinere traditionelle Symbolebene. Chandras Geburts-Nakshatra bestimmt den Beginn der Vimshottari-Abfolge. Bilder und Persönlichkeitsbeschreibungen der Mondstationen sind Auslegungstraditionen, keine gemessenen psychologischen Eigenschaften.",
    readingSequence:
      "Nach Graha, Rasi und Bhava lesen; ein einzelnes Bild oder eine Gottheit niemals in eine wörtliche Vorhersage verwandeln.",
  },
  pada: {
    id: "pada",
    name: "Pada",
    summary:
      "Eines von vier gleich großen Vierteln zu je 3°20′ innerhalb eines Nakshatra.",
    detail:
      "Ein Pada verfeinert eine Nakshatra-Position und verbindet sie mit einer Navamsha-Unterteilung. Diese App berechnet die Pada-Nummer, erstellt oder interpretiert derzeit jedoch keine Navamsha-Kundali.",
    readingSequence:
      "Das Pada als Verfeinerung lesen, nicht als Ersatz für die gesamte Kundali.",
  },
  "nakshatra-lord": {
    id: "nakshatra-lord",
    name: "Nakshatra-Herrscher",
    summary:
      "Der Graha, der einem Nakshatra in der wiederkehrenden Vimshottari-Abfolge zugeordnet ist.",
    detail:
      "Die Reihenfolge Ketu, Shukra, Surya, Chandra, Mangala, Rahu, Guru, Shani und Budha wiederholt sich über alle 27 Nakshatras. Der Herrscher schafft eine traditionelle Deutungsverbindung zu seiner Stellung in der Geburtskundali; er ist nicht mit dem Rasi-Herrscher oder Bhavesha gleichzusetzen.",
    readingSequence:
      "Zuerst den Graha im Nakshatra bestimmen; anschließend Rasi und Bhava des Nakshatra-Herrschers aufsuchen.",
  },
  "bhava-lord": {
    id: "bhava-lord",
    name: "Bhavesha",
    summary:
      "Der Graha, der die Rasi beherrscht, die einen Bhava einnimmt.",
    detail:
      "Bhavesha verbindet seinen Ausgangs-Bhava mit dem Bhava, in dem dieser Graha steht. Das ist eine traditionelle thematische Verbindung und kein Beleg dafür, dass ein bestimmtes Ereignis eintreten wird.",
    readingSequence:
      "Die Rasi des Bhava und deren Herrscher bestimmen; danach Stellung und Zustand dieses Herrschers untersuchen.",
  },
  "lagna-lord": {
    id: "lagna-lord",
    name: "Lagnesha",
    summary:
      "Der Graha, der die Rasi des Lagna beherrscht.",
    detail:
      "Lagnesha gilt symbolisch als Träger von Lebenskraft und Lebensorientierung. Seine Bhava-Stellung verbindet Themen des ersten Bhava mit einem weiteren Lebensfeld; seine Rasi beschreibt den Stil. Aussagen über Stärke erfordern Methoden, die diese App teilweise nicht berechnet.",
    readingSequence:
      "Lagna und Lagnesha gemeinsam lesen; eine Person niemals allein aus einem der beiden Faktoren ableiten.",
  },
  "janma-rasi": {
    id: "janma-rasi",
    name: "Janma Rasi",
    summary:
      "Die Rasi, in der Chandra zum Zeitpunkt der Geburt steht.",
    detail:
      "Janma Rasi dient als Bezugspunkt für emotionale Symbolik und für die Zählung von Gochara relativ zu Chandra. Sie ergänzt das Lagna, ersetzt es jedoch nicht.",
    readingSequence:
      "Chandra-bezogene Themen mit den vom Lagna gezählten Bhavas vergleichen. Unterschiede zeigen verschiedene Perspektiven, nicht zwangsläufig einen Fehler.",
  },
  drishti: {
    id: "drishti",
    name: "Drishti",
    summary:
      "Eine traditionelle Aspektregel, nach der ein Graha oder eine Rasi auf einen anderen beziehungsweise eine andere einwirkt.",
    detail:
      "Jyotish kennt Systeme der Graha-Drishti und Rasi-Drishti; Traditionen gewichten sie unterschiedlich. Diese App berechnet derzeit keine klassischen Aspekte, Aspektstärken oder Orben. Hinweise darauf sind daher Lerninhalte und keine Befunde der Kundali.",
    readingSequence:
      "Vor jeder Interpretation ein Drishti-System auswählen und transparent benennen.",
  },
  yuti: {
    id: "yuti",
    name: "Yuti",
    summary:
      "Zwei oder mehr Grahas in derselben Rasi oder innerhalb eines festgelegten Winkelabstands.",
    detail:
      "Eine Yuti in derselben Rasi ist eine breite Definition; enger Gradkontakt ist spezifischer. Verschiedene Schulen verwenden unterschiedliche Orben. Die App zeigt Längengrade, bewertet jedoch weder die Stärke einer Yuti noch eine Konjunktion automatisch als förderlich oder schwierig.",
    readingSequence:
      "Vor der Synthese den tatsächlichen Winkelabstand und die jeweilige Rolle jedes Graha prüfen.",
  },
  dignity: {
    id: "dignity",
    name: "Graha Avastha / Würde",
    summary:
      "Traditionelle Kategorien dafür, wie stimmig oder wirksam sich ein Graha in einer Rasi ausdrücken kann.",
    detail:
      "Dazu gehören eigene Rasi, Erhöhung, Schwächung, Freundschaft und Feindschaft. Würde modifiziert die Ausdrucksweise; sie macht weder eine Person noch ein Lebensfeld einfach gut oder schlecht. Diese App berechnet noch kein vollständiges Würdemodell.",
    readingSequence:
      "Würde als einen Modifikator neben Bhava, Herrschaft, Bewegung, Aspekten und Zeitfaktoren behandeln.",
  },
  vakri: {
    id: "vakri",
    name: "Vakri",
    summary:
      "Die scheinbare Rückwärtsbewegung im geozentrischen Tierkreis-Längengrad.",
    detail:
      "Vakri-Bewegung ist ein astronomischer Perspektiveffekt. Traditionelle Deutungen verbinden sie teils mit Überprüfung, Intensität oder nichtlinearem Ausdruck; sie kehrt einen Graha jedoch nicht automatisch um und macht ihn nicht automatisch schädlich.",
    readingSequence:
      "Zuerst Graha, Rasi, Bhava und Herrschaft lesen; Vakri ist ein zusätzlicher Modifikator.",
  },
  "rahu-ketu": {
    id: "rahu-ketu",
    name: "Rahu–Ketu",
    summary:
      "Die einander gegenüberliegenden aufsteigenden und absteigenden Knoten der Chandra-Bahn.",
    detail:
      "Sie sind mathematische Punkte der Finsternisgeometrie und keine physischen Planeten. Jyotish verbindet Rahu häufig mit Verstärkung und ungewohntem Begehren, Ketu mit Trennung und nach innen gerichteter Unterscheidung. Das sind symbolische Perspektiven, keine Diagnosen.",
    readingSequence:
      "Diese App verwendet mittlere Knoten; Positionen wahrer Knoten können nahe einer Grenze abweichen.",
  },
  dasha: {
    id: "dasha",
    name: "Dasha",
    summary:
      "Ein traditionelles System planetarer Perioden zur Gliederung symbolischer Zeit.",
    detail:
      "Eine Dasha betont die Geburtsthemen ihres Herrschers. Sie ist kein Gochara und garantiert kein Ereignis. Diese App verwendet Vimshottari-Zeitperioden aus Chandras Nakshatra; daneben bestehen weitere Dasha-Systeme.",
    readingSequence:
      "Den Periodenherrscher in der Geburtskundali lokalisieren und danach Unterperiode sowie aktuellen Gochara-Kontext ergänzen.",
  },
  "mahadasha-antardasha": {
    id: "mahadasha-antardasha",
    name: "Mahadasha–Antardasha",
    summary:
      "Ein umfassendes planetares Kapitel und seine kürzere, darin verschachtelte Unterperiode.",
    detail:
      "Mahadasha liefert das Hintergrundthema; Antardasha verschiebt den näheren Fokus. Die Kombination wird über Geburtsstellungen und Herrschaften beider Grahas gelesen. Ein allgemeiner Text über ein Herrscherpaar kann diesen Kundali-Kontext nicht ersetzen.",
    readingSequence:
      "Fragen, was der Mahadasha-Herrscher langfristig trägt und was der Antardasha-Herrscher aktuell aktiviert.",
  },
  gochara: {
    id: "gochara",
    name: "Gochara",
    summary:
      "Aktuelle Graha-Positionen im Vergleich mit einer Geburtskundali.",
    detail:
      "Gochara beschreibt eine vorübergehende symbolische Betonung. Im Jyotish wird häufig sowohl vom Lagna als auch von Janma Rasi gezählt. Ein Gochara-Wert dieser App ist eine offengelegte Regelzusammenfassung, keine Wahrscheinlichkeit, Tatsache oder Zusage.",
    readingSequence:
      "Bezugspunkt und ausgewähltes Datum nennen; langsame und schnelle Grahas nur mit Vorsicht zusammenführen.",
  },
  ayanamsa: {
    id: "ayanamsa",
    name: "Ayanamsa",
    summary:
      "Der Winkelversatz zur Umrechnung tropischer Längengrade in einen siderischen Bezugsrahmen.",
    detail:
      "Verschiedene Ayanamsa-Konventionen können Positionen nahe einer Grenze verschieben. Diese App wendet ihr dokumentiertes Lahiri-Modell einheitlich auf Lagna, Grahas, Rasis und Nakshatras an.",
    readingSequence:
      "Kundalis erst vergleichen, nachdem dasselbe Ayanamsa- und Knotenmodell bestätigt wurde.",
  },
  "whole-sign": {
    id: "whole-sign",
    name: "Ganzzeichen-Bhavas",
    summary:
      "Die gesamte Lagna-Rasi bildet Bhava 1; jede folgende Rasi bildet den nächsten Bhava.",
    detail:
      "Damit entspricht jede Bhava-Grenze einer Rasi-Grenze. Der genaue Lagna-Grad bleibt ein wichtiger Winkel, ist in diesem System aber keine Häuserspitze. Andere Bhava-Systeme können Grahas anderen Häusern zuordnen.",
    readingSequence:
      "Beim Vergleich von Geburts- und Gochara-Deutungen durchgehend dasselbe Häusersystem verwenden.",
  },
  shadbala: {
    id: "shadbala",
    name: "Shadbala",
    summary:
      "Ein klassisches mehrteiliges System zur Quantifizierung von sechs Kategorien der Graha-Stärke.",
    detail:
      "Shadbala kombiniert positions-, richtungs-, zeit-, bewegungs-, natur- und aspektbezogene Komponenten mit bestimmten Einheiten und Schwellenwerten. Diese App berechnet Shadbala nicht und darf deshalb keinen Graha aufgrund von Shadbala als „stark“ bezeichnen.",
    readingSequence:
      "Vor jeder Aussage zu Shadbala eine transparente Berechnung jeder einzelnen Komponente verlangen.",
  },
  varga: {
    id: "varga",
    name: "Varga",
    summary:
      "Eine Teilkundali, die Abschnitte jeder Rasi einem weiteren Tierkreis zuordnet.",
    detail:
      "Vargas werden für fokussierte traditionelle Analysen verwendet; Navamsha ist ein Beispiel. Exakte Grenzbehandlung und präzise Geburtszeit sind wichtig. Diese App zeigt das Nakshatra-Pada, berechnet oder interpretiert derzeit jedoch keine Varga-Kundalis.",
    readingSequence:
      "Aus dem Pada allein keine vollständige Navamsha-Deutung ableiten.",
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
    name: localized("Surya", "सूर्य", "सूर्य"),
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
    name: localized("Chandra", "चंद्र", "चंद्र"),
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
    name: localized("Mangala", "मंगल", "मंगळ"),
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
    name: localized("Budha", "बुध", "बुध"),
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
    name: localized("Guru", "गुरु", "गुरु"),
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
    name: localized("Shukra", "शुक्र", "शुक्र"),
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
    name: localized("Shani", "शनि", "शनि"),
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
    name: localized("Rahu", "राहु", "राहू"),
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
    name: localized("Ketu", "केतु", "केतू"),
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
    name: "Surya",
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
    name: "Chandra",
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
    name: "Mangala",
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
    name: "Budha",
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
    name: "Guru",
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
    name: "Shukra",
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
    name: "Shani",
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
    name: "Rahu",
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
    name: "Ketu",
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
}

const BHAVA_ROWS: readonly [
  HouseNumber,
  LocalizedText,
  LocalizedText,
  LocalizedText,
  LocalizedText,
][] = [
  [1, localized("Tanu Bhava", "तनु भाव", "तनु भाव"), localized("body, identity, vitality and approach", "शरीर, पहचान, जीवन-शक्ति और जीवन-दृष्टि", "शरीर, ओळख, जीवनशक्ती आणि जीवनदृष्टी"), localized("embodied self-awareness and proportionate initiative", "शरीर-जागरूकता और संतुलित पहल", "देहजाणीव आणि संतुलित पुढाकार"), localized("self-absorption or defining the whole person by appearance", "आत्म-केंद्रण या रूप से पूरे व्यक्ति को परिभाषित करना", "आत्मकेंद्रीपणा किंवा रूपावरून संपूर्ण व्यक्ती ठरवणे")],
  [2, localized("Dhana Bhava", "धन भाव", "धन भाव"), localized("resources, speech, family continuity, food and values", "संसाधन, वाणी, परिवार-निरंतरता, भोजन और मूल्य", "साधने, वाणी, कुटुंबसातत्य, अन्न आणि मूल्ये"), localized("careful stewardship, truthful speech and stable priorities", "सावधान संसाधन-प्रबंधन, सत्य वाणी और स्थिर प्राथमिकताएँ", "काळजीपूर्वक साधनव्यवस्थापन, सत्य वाणी आणि स्थिर प्राधान्ये"), localized("possessiveness, harsh speech or equating worth with wealth", "अधिकारभाव, कठोर वाणी या मूल्य को धन से जोड़ना", "मालकीभाव, कठोर वाणी किंवा स्वमूल्याला संपत्तीशी जोडणे")],
  [3, localized("Sahaja Bhava", "सहज भाव", "सहज भाव"), localized("effort, courage, skills, communication and siblings", "प्रयास, साहस, कौशल, संचार और सहोदर", "प्रयत्न, धैर्य, कौशल्य, संवाद आणि भावंडे"), localized("practiced skill, brave communication and self-directed effort", "अभ्यस्त कौशल, साहसी संवाद और स्व-निर्देशित प्रयास", "सरावलेले कौशल्य, धैर्यपूर्ण संवाद आणि स्वप्रेरित प्रयत्न"), localized("restless comparison, provocation or activity without direction", "बेचैन तुलना, उकसावा या दिशाहीन गतिविधि", "अस्वस्थ तुलना, चिथावणी किंवा दिशाहीन कृती")],
  [4, localized("Sukha Bhava", "सुख भाव", "सुख भाव"), localized("home, care, emotional grounding, land and private life", "घर, देखभाल, भावनात्मक आधार, भूमि और निजी जीवन", "घर, संगोपन, भावनिक आधार, जमीन आणि खासगी जीवन"), localized("secure foundations, restorative space and mature care", "सुरक्षित आधार, पुनर्स्थापक स्थान और परिपक्व देखभाल", "सुरक्षित पाया, पुनर्स्थापक अवकाश आणि परिपक्व काळजी"), localized("retreating into comfort, family projection or possessive care", "सुविधा में छिपना, परिवार-प्रक्षेपण या अधिकारपूर्ण देखभाल", "सोयीत लपणे, कुटुंबीय प्रक्षेपण किंवा मालकीची काळजी")],
  [5, localized("Putra Bhava", "पुत्र भाव", "पुत्र भाव"), localized("learning, creativity, discernment, children and counsel", "सीख, सृजन, विवेक, संतान और परामर्श", "शिक्षण, सर्जन, विवेक, संतती आणि सल्ला"), localized("responsible creativity, joyful learning and thoughtful guidance", "उत्तरदायी सृजन, आनंदपूर्ण सीख और विचारशील मार्गदर्शन", "जबाबदार सर्जन, आनंदी शिक्षण आणि विचारशील मार्गदर्शन"), localized("performance for approval, speculation or projecting expectations onto children", "स्वीकृति के लिए प्रदर्शन, सट्टा या संतानों पर अपेक्षाएँ थोपना", "मान्यतेसाठी प्रदर्शन, सट्टा किंवा संततीवर अपेक्षा लादणे")],
  [6, localized("Ari Bhava", "अरि भाव", "अरि भाव"), localized("service, routine, obstacles, illness, debt and disputes", "सेवा, दिनचर्या, बाधा, रोग, ऋण और विवाद", "सेवा, दिनक्रम, अडथळे, आजार, कर्ज आणि वाद"), localized("practical service, sound routines and skillful problem-solving", "व्यावहारिक सेवा, स्वस्थ दिनचर्या और कुशल समस्या-समाधान", "व्यावहारिक सेवा, निरोगी दिनक्रम आणि कुशल समस्यासमाधान"), localized("chronic conflict, overwork, self-diagnosis or treating strain as destiny", "लगातार संघर्ष, अति-काम, स्व-निदान या तनाव को नियति मानना", "सतत संघर्ष, अतिश्रम, स्वयंनिदान किंवा ताणाला नियती मानणे")],
  [7, localized("Yuvati Bhava", "युवति भाव", "युवती भाव"), localized("partnership, contracts, clients and encounter with others", "साझेदारी, अनुबंध, ग्राहक और दूसरों से सामना", "भागीदारी, करार, ग्राहक आणि इतरांशी भेट"), localized("reciprocity, explicit agreements and respectful difference", "पारस्परिकता, स्पष्ट सहमति और मतभेद का सम्मान", "परस्परता, स्पष्ट करार आणि मतभेदाचा आदर"), localized("projection, dependency or surrendering agency for harmony", "प्रक्षेपण, निर्भरता या सामंजस्य हेतु अपना अधिकार छोड़ना", "प्रक्षेपण, अवलंबन किंवा समरसतेसाठी स्वतःचे कर्तृत्व सोडणे")],
  [8, localized("Randhra Bhava", "रंध्र भाव", "रंध्र भाव"), localized("shared resources, vulnerability, secrets, loss and transformation", "साझा संसाधन, असुरक्षा, रहस्य, हानि और परिवर्तन", "सामायिक साधने, असुरक्षितता, रहस्य, हानी आणि परिवर्तन"), localized("honest risk awareness, ethical sharing and resilience through change", "ईमानदार जोखिम-बोध, नैतिक साझेदारी और परिवर्तन में धैर्य", "प्रामाणिक जोखीमजाणीव, नैतिक वाटणी आणि बदलातील लवचिकता"), localized("catastrophizing, secrecy, coercion or predicting death", "विपत्ति-कल्पना, गोपनीयता, दबाव या मृत्यु-भविष्यवाणी", "आपत्तीकरण, गुप्तता, दबाव किंवा मृत्यूभविष्यवाणी")],
  [9, localized("Dharma Bhava", "धर्म भाव", "धर्म भाव"), localized("ethics, worldview, teachers, higher learning and pilgrimage", "नीति, विश्वदृष्टि, गुरु, उच्च शिक्षा और तीर्थ", "नीती, विश्वदृष्टी, गुरु, उच्च शिक्षण आणि तीर्थयात्रा"), localized("tested principles, humility in learning and meaningful perspective", "परीक्षित सिद्धांत, सीख में विनम्रता और अर्थपूर्ण दृष्टि", "परीक्षित तत्त्वे, शिक्षणातील नम्रता आणि अर्थपूर्ण दृष्टी"), localized("dogma, borrowed certainty or using belief to avoid evidence", "कट्टरता, उधार का विश्वास या प्रमाण से बचने के लिए मान्यता", "कट्टरता, उसने घेतलेली खात्री किंवा पुरावा टाळण्यासाठी श्रद्धा")],
  [10, localized("Karma Bhava", "कर्म भाव", "कर्म भाव"), localized("work, responsibility, public conduct, vocation and contribution", "कार्य, उत्तरदायित्व, सार्वजनिक आचरण, व्यवसाय और योगदान", "काम, जबाबदारी, सार्वजनिक आचरण, व्यवसाय आणि योगदान"), localized("competent contribution, accountable authority and useful work", "कुशल योगदान, उत्तरदायी अधिकार और उपयोगी कार्य", "कुशल योगदान, जबाबदार अधिकार आणि उपयुक्त काम"), localized("status fixation, burnout or confusing a role with total identity", "पद-आसक्ति, थकावट या भूमिका को पूरी पहचान समझना", "पदासक्ती, थकवा किंवा भूमिकेलाच संपूर्ण ओळख मानणे")],
  [11, localized("Labha Bhava", "लाभ भाव", "लाभ भाव"), localized("gains, networks, aspirations, community and fulfilment", "लाभ, नेटवर्क, आकांक्षा, समुदाय और पूर्ति", "लाभ, जाळे, आकांक्षा, समुदाय आणि पूर्ती"), localized("reciprocal networks, realistic goals and shared benefit", "पारस्परिक नेटवर्क, यथार्थ लक्ष्य और साझा लाभ", "परस्पर जाळे, वास्तववादी ध्येये आणि सामायिक लाभ"), localized("instrumental relationships, endless wanting or group conformity", "उपयोगवादी संबंध, अंतहीन चाह या समूह-अनुरूपता", "उपयोगवादी संबंध, अंतहीन इच्छा किंवा समूहानुरूपता")],
  [12, localized("Vyaya Bhava", "व्यय भाव", "व्यय भाव"), localized("expense, retreat, sleep, distance, institutions and release", "व्यय, एकांत, निद्रा, दूरी, संस्थान और मुक्ति", "व्यय, एकांत, झोप, अंतर, संस्था आणि मुक्तता"), localized("conscious closure, restorative solitude and wise allocation", "सचेत समापन, पुनर्स्थापक एकांत और विवेकपूर्ण आवंटन", "जाणीवपूर्वक समाप्ती, पुनर्स्थापक एकांत आणि सुज्ञ वाटप"), localized("avoidance, leakage, isolation or romanticizing loss", "पलायन, रिसाव, अलगाव या हानि का रोमानीकरण", "पलायन, गळती, एकाकीपणा किंवा हानीचे रोमँटीकरण")],
] as const;

const BASE_BHAVA_EDUCATION: Readonly<
  Record<HouseNumber, BhavaEducationProfile>
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
    name: "Tanu Bhava",
    domain: "Körper, Identität, Lebenskraft und Herangehensweise",
    constructive:
      "verkörperte Selbstwahrnehmung und angemessene Eigeninitiative",
    caution:
      "Selbstbezogenheit oder die ganze Person über ihr Erscheinungsbild zu definieren",
  },
  2: {
    name: "Dhana Bhava",
    domain:
      "Ressourcen, Sprache, familiäre Kontinuität, Nahrung und Werte",
    constructive:
      "sorgfältiger Umgang, wahrhaftige Sprache und stabile Prioritäten",
    caution:
      "Besitzdenken, verletzende Sprache oder den eigenen Wert mit Vermögen gleichzusetzen",
  },
  3: {
    name: "Sahaja Bhava",
    domain:
      "Anstrengung, Mut, Fertigkeiten, Kommunikation und Geschwister",
    constructive:
      "eingeübte Fertigkeit, mutige Kommunikation und selbstbestimmter Einsatz",
    caution:
      "ruheloser Vergleich, Provokation oder Aktivität ohne klare Richtung",
  },
  4: {
    name: "Sukha Bhava",
    domain:
      "Zuhause, Fürsorge, emotionale Verwurzelung, Land und Privatleben",
    constructive:
      "sichere Grundlagen, erholsamer Raum und reife Fürsorge",
    caution:
      "Rückzug in Bequemlichkeit, familiäre Projektion oder vereinnahmende Fürsorge",
  },
  5: {
    name: "Putra Bhava",
    domain:
      "Lernen, Kreativität, Unterscheidung, Kinder und Beratung",
    constructive:
      "verantwortliche Kreativität, freudiges Lernen und umsichtige Begleitung",
    caution:
      "Selbstdarstellung für Zustimmung, Spekulation oder Erwartungen auf Kinder zu projizieren",
  },
  6: {
    name: "Ari Bhava",
    domain:
      "Dienst, Routine, Hindernisse, Krankheit, Schulden und Konflikte",
    constructive:
      "praktischer Dienst, tragfähige Routinen und geschickte Problemlösung",
    caution:
      "chronischer Konflikt, Überarbeitung, Selbstdiagnose oder Belastung als Schicksal zu behandeln",
  },
  7: {
    name: "Yuvati Bhava",
    domain:
      "Partnerschaft, Verträge, Klienten und Begegnung mit anderen",
    constructive:
      "Gegenseitigkeit, ausdrückliche Vereinbarungen und respektierter Unterschied",
    caution:
      "Projektion, Abhängigkeit oder für Harmonie die eigene Handlungsfähigkeit aufzugeben",
  },
  8: {
    name: "Randhra Bhava",
    domain:
      "gemeinsame Ressourcen, Verletzlichkeit, Geheimnisse, Verlust und Wandlung",
    constructive:
      "ehrliches Risikobewusstsein, ethisches Teilen und Widerstandskraft im Wandel",
    caution:
      "Katastrophisieren, Geheimhaltung, Zwang oder den Tod vorherzusagen",
  },
  9: {
    name: "Dharma Bhava",
    domain:
      "Ethik, Weltbild, Lehrende, höhere Bildung und Pilgerreise",
    constructive:
      "geprüfte Grundsätze, Demut beim Lernen und sinnstiftende Perspektive",
    caution:
      "Dogmatismus, geliehene Gewissheit oder Glauben zur Vermeidung von Belegen einzusetzen",
  },
  10: {
    name: "Karma Bhava",
    domain:
      "Arbeit, Verantwortung, öffentliches Handeln, Berufung und Beitrag",
    constructive:
      "kompetenter Beitrag, verantwortbare Autorität und nützliche Arbeit",
    caution:
      "Statusfixierung, Erschöpfung oder eine Rolle mit der gesamten Identität zu verwechseln",
  },
  11: {
    name: "Labha Bhava",
    domain:
      "Gewinne, Netzwerke, Bestrebungen, Gemeinschaft und Erfüllung",
    constructive:
      "wechselseitige Netzwerke, realistische Ziele und gemeinsamer Nutzen",
    caution:
      "instrumentelle Beziehungen, endloses Wollen oder Gruppenkonformität",
  },
  12: {
    name: "Vyaya Bhava",
    domain:
      "Ausgaben, Rückzug, Schlaf, Ferne, Institutionen und Loslassen",
    constructive:
      "bewusster Abschluss, erholsame Zurückgezogenheit und kluge Zuteilung",
    caution:
      "Vermeidung, Ressourcenverlust, Isolation oder Verlust zu romantisieren",
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
      summary: `Im traditionellen Jyotish wird die Funktion von ${grahaName} — ${grahaFunction} — durch das Feld von ${bhavaName} gelesen: ${bhavaDomain}. Das deutet auf eine Betonung dieses Lebensfelds hin, nicht auf ein garantiertes Ereignis.`,
      constructive: `${readLocalized(graha.constructive, locale)} kann sich stimmiger entfalten, wenn es mit ${readLocalized(bhava.constructive, locale)} verbunden wird.`,
      caution: `Sowohl ${readLocalized(graha.caution, locale)} als auch ${readLocalized(bhava.caution, locale)} ohne Angst und ohne festes Etikett prüfen.`,
      inquiry: readLocalized(graha.inquiry, locale),
      methodNote:
        "Diese pädagogische 9×12-Synthese verbindet ausschließlich Graha-Karakatvas mit Bhava-Themen. Rasi, Bhavesha, Drishti, Yuti, Würde, Dasha und Gochara wurden dabei nicht bewertet.",
    };
  }

  if (locale === "hi") {
    return {
      graha: grahaId,
      bhava: bhavaNumber,
      title: `${grahaName} — ${bhavaName}`,
      summary: `पारंपरिक ज्योतिष में ${grahaName} के कारकत्व—${grahaFunction}—को यहाँ ${bhavaName} के क्षेत्र—${bhavaDomain}—के माध्यम से पढ़ा जाता है। इसका अर्थ उस क्षेत्र में अधिक ध्यान है, निश्चित घटना नहीं।`,
      constructive: `${readLocalized(graha.constructive, locale)} को ${readLocalized(bhava.constructive, locale)} के साथ जोड़ने पर यह स्थिति अधिक रचनात्मक ढंग से व्यक्त हो सकती है।`,
      caution: `${readLocalized(graha.caution, locale)} और ${readLocalized(bhava.caution, locale)}—दोनों की संभावना को बिना भय या अंतिम लेबल के जाँचें।`,
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
      constructive: `${readLocalized(graha.constructive, locale)} याला ${readLocalized(bhava.constructive, locale)}शी जोडल्यास ही स्थिती अधिक रचनात्मकपणे व्यक्त होऊ शकते.`,
      caution: `${readLocalized(graha.caution, locale)} आणि ${readLocalized(bhava.caution, locale)}—दोन्ही शक्यता भीती किंवा अंतिम शिक्का न लावता तपासा.`,
      inquiry: readLocalized(graha.inquiry, locale),
      methodNote:
        "हे 9×12 शैक्षणिक संश्लेषण फक्त ग्रहकारकत्व व भावविषय जोडते. राशी, भावेश, दृष्टी, युती, प्रतिष्ठा, दशा व गोचर यांचा निर्णय यात केलेला नाही.",
    };
  }

  return {
    graha: grahaId,
    bhava: bhavaNumber,
    title: `${grahaName} — ${bhavaName}`,
    summary: `In traditional Jyotish, ${grahaName}'s function—${grahaFunction}—is read through ${bhavaName}'s field of ${bhavaDomain}. This suggests emphasis in that field, not a guaranteed event.`,
    constructive: `${readLocalized(graha.constructive, locale)} can become more workable when joined with ${readLocalized(bhava.constructive, locale)}.`,
    caution: `Examine both ${readLocalized(graha.caution, locale)} and ${readLocalized(bhava.caution, locale)} without fear or a fixed label.`,
    inquiry: readLocalized(graha.inquiry, locale),
    methodNote:
      "This 9×12 educational synthesis combines only graha significations and Bhava topics. It has not judged Rasi, Bhavesha, Drishti, Yuti, dignity, Dasha or Gochara.",
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
    en: "A Nakshatra is a fine symbolic qualifier. Read its graha, Rasi, Bhava and lord before using mansion imagery; the imagery is traditional, not a measured trait or prediction.",
    hi: "नक्षत्र एक सूक्ष्म प्रतीकात्मक विशेषता है। नक्षत्र-चित्र से पहले ग्रह, राशि, भाव और नक्षत्र-स्वामी पढ़ें; चित्र परंपरागत है, मापा हुआ गुण या भविष्यवाणी नहीं।",
    mr: "नक्षत्र हा सूक्ष्म प्रतीकात्मक विशेषक आहे. नक्षत्रप्रतिमेआधी ग्रह, राशी, भाव व नक्षत्रस्वामी वाचा; प्रतिमा पारंपरिक आहे, मोजलेला गुण किंवा भविष्यवाणी नाही.",
    de: "Ein Nakshatra ist eine feine symbolische Präzisierung. Vor der Bildsprache der Mondstation zuerst Graha, Rasi, Bhava und Herrscher lesen; die Bilder sind traditionell, keine gemessene Eigenschaft oder Vorhersage.",
  }[locale];
}

export const LOCALIZED_ANALYSIS_LIMITATIONS: Readonly<
  Record<AnalysisLimitationId, LocalizedText>
> = {
  "symbolic-not-scientific": localized(
    "Jyotish readings here are traditional and symbolic. Astrology has not been scientifically validated as a reliable way to predict events, personality, health or outcomes.",
    "यहाँ ज्योतिषीय पाठ पारंपरिक और प्रतीकात्मक हैं। घटनाओं, व्यक्तित्व, स्वास्थ्य या परिणामों की विश्वसनीय भविष्यवाणी के रूप में ज्योतिष वैज्ञानिक रूप से प्रमाणित नहीं है।",
    "येथील ज्योतिषवाचन पारंपरिक व प्रतीकात्मक आहे. घटना, व्यक्तिमत्त्व, आरोग्य किंवा परिणाम यांचे विश्वासार्ह भाकीत म्हणून ज्योतिष वैज्ञानिकदृष्ट्या प्रमाणित नाही.",
    "Die Jyotish-Deutungen hier sind traditionell und symbolisch. Astrologie ist wissenschaftlich nicht als zuverlässige Methode zur Vorhersage von Ereignissen, Persönlichkeit, Gesundheit oder Ergebnissen validiert.",
  ),
  "birth-time-sensitivity": localized(
    "Lagna and Bhavas are sensitive to birth time and place. Rounded or uncertain input can materially change them.",
    "लग्न और भाव जन्म-समय व स्थान के प्रति संवेदनशील हैं। अनुमानित या अनिश्चित जानकारी इन्हें महत्वपूर्ण रूप से बदल सकती है।",
    "लग्न व भाव जन्मवेळ व स्थळाबाबत संवेदनशील आहेत. अंदाजे किंवा अनिश्चित माहितीमुळे ते लक्षणीय बदलू शकतात.",
    "Lagna und Bhavas reagieren empfindlich auf Geburtszeit und -ort. Gerundete oder unsichere Eingaben können sie wesentlich verändern.",
  ),
  "model-dependence": localized(
    "Results depend on convention. This app uses its documented Lahiri Ayanamsha and whole-sign Bhavas; another model may differ near boundaries.",
    "परिणाम पद्धति पर निर्भर हैं। यह ऐप दस्तावेजित लाहिड़ी अयनांश और पूर्ण-राशि भाव उपयोग करता है; दूसरी पद्धति सीमा के पास अलग परिणाम दे सकती है।",
    "निष्कर्ष पद्धतीवर अवलंबून असतात. हे अ‍ॅप दस्तऐवजीकृत लाहिरी अयनांश व पूर्ण-राशी भाव वापरते; दुसरी पद्धत सीमेजवळ वेगळा निष्कर्ष देऊ शकते.",
    "Ergebnisse hängen von der Konvention ab. Diese App verwendet ihr dokumentiertes Lahiri-Ayanamsa und Ganzzeichen-Bhavas; andere Modelle können nahe Grenzen abweichen.",
  ),
  "mean-node-model": localized(
    "Rahu and Ketu use mean nodes. True-node positions may differ, especially near a boundary.",
    "राहु और केतु के लिए मध्यम नोड उपयोग होते हैं। विशेषकर सीमा के पास वास्तविक नोड अलग हो सकता है।",
    "राहू व केतूसाठी मध्यम नोड वापरले आहेत. विशेषतः सीमेजवळ खरा नोड वेगळा असू शकतो.",
    "Für Rahu und Ketu werden mittlere Mondknoten verwendet. Positionen wahrer Knoten können insbesondere nahe einer Grenze abweichen.",
  ),
  "feature-scope": localized(
    "Shadbala, varga charts, combustion, classical Drishti, Yuti strength, yogas and event probabilities are not calculated. Mention of them is educational only.",
    "षड्बल, वर्ग-कुंडली, अस्तता, शास्त्रीय दृष्टि, युति-बल, योग और घटना-संभाव्यता की गणना नहीं होती। उनका उल्लेख केवल शैक्षिक है।",
    "षड्बल, वर्गकुंडली, अस्तता, शास्त्रीय दृष्टी, युतीबळ, योग व घटनासंभाव्यता मोजली जात नाही. त्यांचा उल्लेख फक्त शैक्षणिक आहे.",
    "Shadbala, Varga-Kundalis, Verbrennung, klassische Drishti, Yuti-Stärke, Yogas und Ereigniswahrscheinlichkeiten werden nicht berechnet. Erwähnungen dienen ausschließlich der Bildung.",
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
    "Daily and monthly Gochara scores are app-specific weighted rule summaries—not a universal Jyotish measure, probability, scientific forecast or outcome rating.",
    "दैनिक और मासिक गोचर-अंक ऐप के अपने भारित नियमों का सार हैं—सार्वभौमिक ज्योतिषीय माप, संभाव्यता, वैज्ञानिक पूर्वानुमान या परिणाम-रेटिंग नहीं।",
    "दैनिक व मासिक गोचर गुण हे अ‍ॅपच्या स्वतःच्या भारित नियमांचे सार आहेत—सार्वत्रिक ज्योतिषमापन, संभाव्यता, वैज्ञानिक अंदाज किंवा परिणामगुणांकन नाही.",
    "Tägliche und monatliche Gochara-Werte sind app-spezifische, gewichtete Regelzusammenfassungen — kein universelles Jyotish-Maß, keine Wahrscheinlichkeit, wissenschaftliche Prognose oder Ergebnisbewertung.",
  ),
};
