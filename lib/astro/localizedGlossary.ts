import type { AppLocale } from "../i18n";
import {
  getEducationForAstroTerm,
  localized,
  readLocalized,
  type LocalizedText,
} from "./education";
import {
  ASTRO_TERM_IDS,
  type AstroTermId,
} from "./glossary";

export interface LocalizedAstroGlossaryEntry {
  id: AstroTermId;
  title: string;
  sanskrit?: string;
  short: string;
  detailed: string;
  calculation?: string;
  readingTips: readonly string[];
}

interface GlossarySupplement {
  title: LocalizedText;
  short: LocalizedText;
  detailed: LocalizedText;
  readingTips: readonly LocalizedText[];
}

const SANSKRIT_NAMES: Readonly<
  Partial<Record<AstroTermId, LocalizedText>>
> = {
  lagna: localized("Lagna", "लग्न", "लग्न"),
  graha: localized("Graha", "ग्रह", "ग्रह"),
  rasi: localized("Rāśi", "राशि", "राशी"),
  "janma-rasi": localized("Janma Rāśi", "जन्म राशि", "जन्म राशी"),
  bhava: localized("Bhāva", "भाव", "भाव"),
  "house-lord": localized("Bhāveśa", "भावेश", "भावेश"),
  nakshatra: localized("Nakṣatra", "नक्षत्र", "नक्षत्र"),
  pada: localized("Pāda", "पाद", "पाद"),
  "nakshatra-lord": localized(
    "Nakṣatra Adhipati",
    "नक्षत्र अधिपति",
    "नक्षत्र अधिपती",
  ),
  ayanamsa: localized("Ayanāṃśa", "अयनांश", "अयनांश"),
  lahiri: localized("Citrapakṣa", "चित्रपक्ष", "चित्रपक्ष"),
  retrograde: localized("Vakri", "वक्री", "वक्री"),
  gochara: localized("Gocara", "गोचर", "गोचर"),
  dasha: localized("Daśā", "दशा", "दशा"),
  vimshottari: localized(
    "Viṃśottarī Daśā",
    "विंशोत्तरी दशा",
    "विंशोत्तरी दशा",
  ),
  mahadasha: localized("Mahādaśā", "महादशा", "महादशा"),
  antardasha: localized("Antardaśā", "अन्तर्दशा", "अंतर्दशा"),
  "rahu-ketu": localized("Rāhu–Ketu", "राहु–केतु", "राहू–केतू"),
};

/**
 * These concepts intentionally cannot share the broader education article
 * used by their neighbouring inline terms. Keeping them separate prevents a
 * Lahiri explanation from becoming a generic ayanamsa definition, or an
 * Antardasha explanation from becoming a generic Dasha description.
 */
const DISTINCT_TERMS: Readonly<
  Record<
    "nakshatra-lord" | "lahiri" | "vimshottari" | "mahadasha" | "antardasha",
    GlossarySupplement
  >
> = {
  "nakshatra-lord": {
    title: localized(
      "Nakshatra Lord",
      "नक्षत्र अधिपति",
      "नक्षत्र अधिपती",
    ),
    short: localized(
      "The graha assigned to a lunar mansion in the repeating Vimshottari sequence.",
      "विंशोत्तरी के दोहराते क्रम में किसी नक्षत्र को दिया गया ग्रह।",
      "विंशोत्तरीच्या पुनरावर्ती क्रमात नक्षत्राला नेमलेला ग्रह.",
    ),
    detailed: localized(
      "The sequence Ketu, Shukra, Surya, Chandra, Mangala, Rahu, Guru, Shani and Budha repeats across the 27 Nakshatras. This lord connects a placement's Nakshatra layer with that graha's natal position and, for the birth Moon, identifies the first Mahadasha lord. It is a traditional symbolic assignment, not the astronomical ruler of a constellation and not the same as a Rasi lord.",
      "केतु, शुक्र, सूर्य, चन्द्र, मंगल, राहु, गुरु, शनि और बुध का क्रम 27 नक्षत्रों में दोहरता है। यह अधिपति किसी ग्रह के नक्षत्र-स्तर को उस अधिपति की जन्म-कुण्डली स्थिति से जोड़ता है और जन्म चन्द्र के लिए आरम्भिक महादशा बताता है। यह पारंपरिक प्रतीकात्मक नियुक्ति है—किसी तारामण्डल का खगोलीय स्वामी नहीं—और राशि अधिपति से अलग है।",
      "केतू, शुक्र, सूर्य, चंद्र, मंगळ, राहू, गुरु, शनि आणि बुध हा क्रम 27 नक्षत्रांत पुनः येतो. हा अधिपती ग्रहाच्या नक्षत्र-स्तराला त्या अधिपतीच्या जन्मकुंडलीतील स्थितीशी जोडतो आणि जन्मचंद्रासाठी पहिली महादशा ठरवतो. ही पारंपरिक प्रतीकात्मक नेमणूक आहे—तारकासमूहाचा खगोलीय स्वामी नव्हे—आणि राशी अधिपतीपेक्षा वेगळी आहे.",
    ),
    readingTips: [
      localized(
        "Locate the Nakshatra lord in the natal chart before interpreting the link.",
        "संबंध की व्याख्या से पहले नक्षत्र अधिपति की जन्म-कुण्डली स्थिति देखें।",
        "संबंधाचा अर्थ लावण्याआधी नक्षत्र अधिपतीची जन्मकुंडलीतील स्थिती पाहा.",
      ),
      localized(
        "Do not confuse a Nakshatra lord with the lord of its Rasi or Bhava.",
        "नक्षत्र अधिपति को राशि या भाव के अधिपति जैसा न मानें।",
        "नक्षत्र अधिपतीला राशी किंवा भावाचा अधिपती समजू नका.",
      ),
    ],
  },
  lahiri: {
    title: localized(
      "Lahiri Ayanamsa",
      "लाहिरी अयनांश",
      "लाहिरी अयनांश",
    ),
    short: localized(
      "A widely used Indian sidereal reference convention, also called Chitrapaksha.",
      "भारत में व्यापक रूप से प्रयुक्त निरयन सन्दर्भ पद्धति, जिसे चित्रपक्ष भी कहते हैं।",
      "भारतात मोठ्या प्रमाणावर वापरली जाणारी निरयन संदर्भपद्धत, जिला चित्रपक्षही म्हणतात.",
    ),
    detailed: localized(
      "Lahiri provides the offset used to convert tropical longitudes into one consistent sidereal frame for Rasis, Nakshatras, Lagna, grahas and lunar nodes. Other accepted ayanamsa conventions produce slightly different longitudes and may change placements close to a boundary. Lahiri is this app's declared convention; it is not presented as the only possible sidereal standard.",
      "लाहिरी वह अन्तर देता है जिससे सायन देशान्तर को राशियों, नक्षत्रों, लग्न, ग्रहों और चन्द्र पातों के लिए एक संगत निरयन ढाँचे में बदला जाता है। अन्य मान्य अयनांश पद्धतियाँ थोड़े अलग देशान्तर दे सकती हैं और सीमा के पास स्थिति बदल सकती है। लाहिरी इस ऐप की घोषित पद्धति है; इसे एकमात्र सम्भव निरयन मानक नहीं बताया गया है।",
      "लाहिरी हा फरक देतो ज्याने सायन रेखांश राशी, नक्षत्रे, लग्न, ग्रह आणि चंद्रपातांसाठी एका सुसंगत निरयन चौकटीत रूपांतरित होतो. इतर मान्य अयनांश पद्धती किंचित वेगळे रेखांश देऊ शकतात आणि सीमेजवळील स्थान बदलू शकतात. लाहिरी ही या ॲपची घोषित पद्धत आहे; ती एकमेव शक्य निरयन मानक असल्याचा दावा नाही.",
    ),
    readingTips: [
      localized(
        "Use the same ayanamsa when comparing natal and transit charts.",
        "जन्म और गोचर कुण्डलियों की तुलना में एक ही अयनांश रखें।",
        "जन्म आणि गोचर कुंडल्या तुलना करताना तोच अयनांश वापरा.",
      ),
      localized(
        "Treat boundary changes between conventions as a method difference, not hidden precision.",
        "पद्धतियों के बीच सीमा-बदलाव को विधि का अन्तर मानें, छिपी हुई सटीकता नहीं।",
        "पद्धतींमधील सीमाबदल हा पद्धतीचा फरक समजा, लपलेली अचूकता नव्हे.",
      ),
    ],
  },
  vimshottari: {
    title: localized(
      "Vimshottari Dasha",
      "विंशोत्तरी दशा",
      "विंशोत्तरी दशा",
    ),
    short: localized(
      "A 120-year symbolic sequence of nine planetary periods derived from the birth Moon's Nakshatra.",
      "जन्म चन्द्र के नक्षत्र से निकला नौ ग्रह-अवधियों का 120-वर्षीय प्रतीकात्मक क्रम।",
      "जन्मचंद्राच्या नक्षत्रावरून मिळणारा नऊ ग्रहकालखंडांचा 120 वर्षांचा प्रतीकात्मक क्रम.",
    ),
    detailed: localized(
      "Vimshottari cycles through Ketu, Shukra, Surya, Chandra, Mangala, Rahu, Guru, Shani and Budha with unequal durations totalling 120 years. The Moon's birth Nakshatra selects the opening lord; its calculated progress through that mansion sets the remaining balance. It is a traditional timing framework, not an astronomical causal mechanism or a guarantee that predicted events will occur.",
      "विंशोत्तरी में केतु, शुक्र, सूर्य, चन्द्र, मंगल, राहु, गुरु, शनि और बुध की असमान अवधियाँ मिलकर 120 वर्ष बनाती हैं। जन्म चन्द्र का नक्षत्र आरम्भिक अधिपति चुनता है और उस नक्षत्र में चन्द्र की गणना की गई प्रगति पहली अवधि का शेष भाग तय करती है। यह पारंपरिक काल-ढाँचा है, कोई खगोलीय कारण-तंत्र या घटना की गारंटी नहीं।",
      "विंशोत्तरीत केतू, शुक्र, सूर्य, चंद्र, मंगळ, राहू, गुरु, शनि आणि बुध यांचे असमान कालखंड मिळून 120 वर्षे होतात. जन्मचंद्राचे नक्षत्र आरंभीचा अधिपती निवडते आणि त्या नक्षत्रातील मोजलेली प्रगती पहिल्या कालखंडाची उरलेली मुदत ठरवते. ही पारंपरिक कालचौकट आहे; खगोलीय कारणयंत्रणा किंवा घटना घडण्याची हमी नाही.",
    ),
    readingTips: [
      localized(
        "Read Mahadasha as the broad chapter and Antardasha as the nearer-term subtheme.",
        "महादशा को व्यापक अध्याय और अन्तर्दशा को निकट अवधि का उप-विषय मानें।",
        "महादशा हा व्यापक अध्याय आणि अंतर्दशा हा जवळच्या काळाचा उपविषय माना.",
      ),
      localized(
        "Judge both period lords from their natal placements; names alone are insufficient.",
        "दोनों अवधि-अधिपतियों को उनकी जन्म स्थितियों से पढ़ें; केवल नाम पर्याप्त नहीं।",
        "दोन्ही कालाधिपती जन्मस्थितींवरून वाचा; केवळ नावे पुरेशी नाहीत.",
      ),
    ],
  },
  mahadasha: {
    title: localized("Mahadasha", "महादशा", "महादशा"),
    short: localized(
      "The major planetary period that supplies the broad background chapter in Vimshottari timing.",
      "विंशोत्तरी काल में व्यापक पृष्ठभूमि देने वाली मुख्य ग्रह-अवधि।",
      "विंशोत्तरी कालात व्यापक पार्श्वभूमी देणारा मुख्य ग्रहकालखंड.",
    ),
    detailed: localized(
      "A Mahadasha lasts from 6 to 20 years according to its lord. Traditional interpretation begins with that lord's natal Bhava, Rasi, house rulerships, dignity and relationships, then adds the current Antardasha and transits. It describes a long-running area of emphasis rather than one event, and a difficult symbol does not make every year uniformly difficult.",
      "महादशा अपने अधिपति के अनुसार 6 से 20 वर्ष चलती है। पारंपरिक व्याख्या में पहले उस अधिपति का जन्म भाव, राशि, भाव-अधिपत्य, गरिमा और सम्बन्ध देखे जाते हैं; फिर वर्तमान अन्तर्दशा और गोचर जोड़े जाते हैं। यह एक घटना नहीं बल्कि लम्बे समय का प्रमुख विषय बताती है; कठिन प्रतीक का अर्थ हर वर्ष समान रूप से कठिन होना नहीं है।",
      "महादशा तिच्या अधिपतीनुसार 6 ते 20 वर्षे चालते. पारंपरिक अर्थनिर्णयात प्रथम त्या अधिपतीचा जन्मभाव, राशी, भावस्वामित्व, प्रतिष्ठा आणि संबंध पाहतात; नंतर चालू अंतर्दशा व गोचर जोडतात. ती एका घटनेऐवजी दीर्घकाळचा भर दर्शवते; कठीण प्रतीक म्हणजे प्रत्येक वर्ष सारखेच कठीण असे नाही.",
    ),
    readingTips: [
      localized(
        "Locate the Mahadasha lord and the Bhavas it rules before synthesizing themes.",
        "विषयों का संश्लेषण करने से पहले महादशा अधिपति और उसके भाव-अधिपत्य देखें।",
        "विषय जोडण्याआधी महादशा अधिपती आणि त्याची भावस्वामित्वे पाहा.",
      ),
      localized(
        "Layer the Antardasha and current transits; do not read the major period in isolation.",
        "अन्तर्दशा और वर्तमान गोचर जोड़ें; महादशा को अकेले न पढ़ें।",
        "अंतर्दशा आणि चालू गोचर जोडा; महादशा स्वतंत्रपणे वाचू नका.",
      ),
    ],
  },
  antardasha: {
    title: localized("Antardasha", "अन्तर्दशा", "अंतर्दशा"),
    short: localized(
      "A sub-period that channels a Mahadasha through a second graha.",
      "महादशा को दूसरे ग्रह के माध्यम से व्यक्त करने वाली उप-अवधि।",
      "महादशेला दुसऱ्या ग्रहामार्फत व्यक्त करणारा उपकालखंड.",
    ),
    detailed: localized(
      "The Mahadasha lord sets the larger context; the Antardasha lord describes the more immediate route through it. Interpretation compares both lords' natal Bhavas, Rasis, rulerships, dignity and relationships, then checks current transits for temporary activation. A generic lord pairing is only a starting hypothesis, not a personalized prediction or certainty.",
      "महादशा अधिपति व्यापक सन्दर्भ देता है; अन्तर्दशा अधिपति उसके भीतर निकट अवधि का मार्ग बताता है। व्याख्या दोनों अधिपतियों के जन्म भाव, राशियाँ, भाव-अधिपत्य, गरिमा और सम्बन्धों की तुलना करती है और फिर अस्थायी सक्रियता के लिए वर्तमान गोचर देखती है। केवल दो अधिपतियों की सामान्य जोड़ी आरम्भिक परिकल्पना है, व्यक्तिगत भविष्यवाणी या निश्चितता नहीं।",
      "महादशा अधिपती व्यापक संदर्भ देतो; अंतर्दशा अधिपती त्यातील जवळच्या काळाचा मार्ग दर्शवतो. अर्थनिर्णय दोन्ही अधिपतींचे जन्मभाव, राशी, भावस्वामित्व, प्रतिष्ठा व संबंध तुलना करतो आणि तात्पुरत्या सक्रियतेसाठी चालू गोचर पाहतो. दोन अधिपतींची सामान्य जोडी ही फक्त सुरुवातीची कल्पना आहे, वैयक्तिक भविष्यवाणी किंवा निश्चितता नव्हे.",
    ),
    readingTips: [
      localized(
        "Read the major lord as context and the minor lord as the active focus.",
        "महादशा अधिपति को सन्दर्भ और अन्तर्दशा अधिपति को सक्रिय केन्द्र मानें।",
        "महादशा अधिपतीला संदर्भ आणि अंतर्दशा अधिपतीला सक्रिय केंद्र माना.",
      ),
      localized(
        "Look for repeated Bhava topics between both lords, then verify rather than assume.",
        "दोनों अधिपतियों में दोहरते भाव-विषय खोजें और अनुमान के बजाय जाँचें।",
        "दोन्ही अधिपतींतील पुनरावर्ती भावविषय शोधा आणि गृहित धरण्याऐवजी तपासा.",
      ),
    ],
  },
};

const CALCULATION_NOTES: Readonly<
  Partial<Record<AstroTermId, LocalizedText>>
> = {
  lagna: localized(
    "The app finds the eastern horizon–ecliptic intersection for the entered time and coordinates, applies Lahiri ayanamsa, and uses its Rasi as the first whole-sign Bhava.",
    "ऐप दर्ज समय और निर्देशांक के लिए पूर्वी क्षितिज व क्रान्तिवृत्त का प्रतिच्छेद निकालता है, लाहिरी अयनांश लगाता है और उसकी राशि को पहला पूर्ण-राशि भाव मानता है।",
    "ॲप दिलेल्या वेळ व निर्देशांकांसाठी पूर्व क्षितिज आणि क्रांतिवृत्ताचा छेद काढते, लाहिरी अयनांश लावते आणि त्याची राशी पहिला पूर्ण-राशी भाव मानते.",
  ),
  rasi: localized(
    "Normalized sidereal longitude is divided into twelve consecutive 30° sections from Mesha through Meena.",
    "सामान्यीकृत निरयन देशान्तर को मेष से मीन तक बारह लगातार 30° खण्डों में बाँटा जाता है।",
    "सामान्यीकृत निरयन रेखांश मेष ते मीन अशा बारा सलग 30° विभागांत वाटला जातो.",
  ),
  "janma-rasi": localized(
    "The Moon's Lahiri-sidereal longitude at birth determines its 30° Rasi section.",
    "जन्म समय चन्द्र का लाहिरी-निरयन देशान्तर उसका 30° राशि खण्ड तय करता है।",
    "जन्मवेळचा चंद्राचा लाहिरी-निरयन रेखांश त्याचा 30° राशी विभाग ठरवतो.",
  ),
  bhava: localized(
    "This app uses whole-sign Bhavas: the Lagna Rasi is Bhava 1 and each following Rasi is the next Bhava.",
    "यह ऐप पूर्ण-राशि भाव उपयोग करता है: लग्न राशि भाव 1 है और हर अगली राशि अगला भाव है।",
    "हे ॲप पूर्ण-राशी भाव वापरते: लग्न राशी भाव 1 आणि प्रत्येक पुढील राशी पुढील भाव असते.",
  ),
  "whole-sign-house": localized(
    "Bhava number is the inclusive sign-count from the Lagna Rasi, wrapping after Meena.",
    "भाव संख्या लग्न राशि से समावेशी राशि-गणना है, जो मीन के बाद फिर आरम्भ होती है।",
    "भाव क्रमांक हा लग्न राशीपासूनचा समावेशक राशीहिशेब आहे, जो मीननंतर पुन्हा सुरू होतो.",
  ),
  "house-lord": localized(
    "The app looks up the classical graha ruler of the Rasi occupying each Bhava, then locates that graha in the natal chart.",
    "ऐप प्रत्येक भाव की राशि का पारंपरिक ग्रह-अधिपति देखता है और फिर जन्म-कुण्डली में उस ग्रह की स्थिति खोजता है।",
    "ॲप प्रत्येक भावातील राशीचा पारंपरिक ग्रह-अधिपती पाहते आणि नंतर जन्मकुंडलीत त्या ग्रहाचे स्थान शोधते.",
  ),
  nakshatra: localized(
    "The 360° sidereal zodiac is divided into 27 equal sections of 13°20′, beginning with Ashwini at zero degrees Mesha.",
    "360° निरयन राशि-चक्र को 13°20′ के 27 समान भागों में बाँटा जाता है, जिसकी शुरुआत शून्य अंश मेष पर अश्विनी से होती है।",
    "360° निरयन राशिचक्र 13°20′ च्या 27 समान भागांत विभागले जाते; सुरुवात मेष शून्य अंशावरील अश्विनीपासून होते.",
  ),
  pada: localized(
    "The degree within a Nakshatra is divided into four equal 3°20′ quarters, numbered 1 through 4.",
    "नक्षत्र के भीतर अंश को 3°20′ के चार समान पादों में बाँटकर 1 से 4 तक क्रम दिया जाता है।",
    "नक्षत्रातील अंश 3°20′ च्या चार समान पादांत विभागून 1 ते 4 क्रम दिला जातो.",
  ),
  "nakshatra-lord": localized(
    "The app applies the fixed nine-lord Vimshottari sequence to the calculated Nakshatra index.",
    "ऐप गणित नक्षत्र क्रमांक पर विंशोत्तरी का निश्चित नौ-अधिपति क्रम लागू करता है।",
    "ॲप गणित नक्षत्र क्रमांकावर विंशोत्तरीचा निश्चित नऊ-अधिपती क्रम लावते.",
  ),
  ayanamsa: localized(
    "The selected ayanamsa offset is subtracted from tropical ecliptic longitude to obtain sidereal longitude.",
    "चुना हुआ अयनांश अन्तर सायन क्रान्तिवृत्तीय देशान्तर से घटाकर निरयन देशान्तर मिलता है।",
    "निवडलेला अयनांश फरक सायन क्रांतिवृत्तीय रेखांशातून वजा करून निरयन रेखांश मिळतो.",
  ),
  lahiri: localized(
    "The ephemeris applies its documented Lahiri precession model consistently to natal, simulated and transit positions.",
    "पंचांग इंजन अपनी प्रलेखित लाहिरी पूर्वगमन पद्धति को जन्म, अनुकृत और गोचर स्थितियों पर समान रूप से लगाता है।",
    "पंचांग इंजिन आपली नोंदवलेली लाहिरी पुरस्सरण पद्धत जन्म, अनुकृत आणि गोचर स्थितींना सुसंगतपणे लावते.",
  ),
  retrograde: localized(
    "Longitude is sampled around the selected instant. Negative geocentric longitudinal speed is marked retrograde; near-zero speed is stationary.",
    "चुने क्षण के आसपास देशान्तर नमूने लिए जाते हैं। ऋणात्मक भूकेन्द्रीय देशान्तर गति वक्री और लगभग शून्य गति स्थिर मानी जाती है।",
    "निवडलेल्या क्षणाभोवती रेखांश नमुने घेतले जातात. ऋण भूकेंद्री रेखांशगती वक्री आणि जवळपास शून्य गती स्थिर मानली जाते.",
  ),
  gochara: localized(
    "The app calculates graha positions for the selected date and compares their whole-sign Bhavas from both natal Lagna and Janma Rasi.",
    "ऐप चुनी तिथि की ग्रह स्थितियाँ निकालकर जन्म लग्न और जन्म राशि—दोनों से उनके पूर्ण-राशि भावों की तुलना करता है।",
    "ॲप निवडलेल्या तारखेच्या ग्रहस्थिती काढून जन्मलग्न आणि जन्मराशी या दोन्हींपासून त्यांच्या पूर्ण-राशी भावांची तुलना करते.",
  ),
  vimshottari: localized(
    "Calculated Moon progress through its birth Nakshatra sets the remaining first period; the app uses a disclosed 365.25-day year convention and half-open boundaries.",
    "जन्म नक्षत्र में चन्द्र की गणना की गई प्रगति पहली अवधि का शेष भाग तय करती है; ऐप घोषित 365.25-दिन वर्ष और अर्ध-खुली सीमाएँ उपयोग करता है।",
    "जन्मनक्षत्रातील चंद्राची मोजलेली प्रगती पहिल्या कालखंडाची उरलेली मुदत ठरवते; ॲप घोषित 365.25-दिवस वर्ष आणि अर्ध-उघड सीमा वापरते.",
  ),
  antardasha: localized(
    "Each Mahadasha is divided into nine sub-periods. Duration equals major-lord years × minor-lord years ÷ 120.",
    "हर महादशा नौ उप-अवधियों में बँटती है। अवधि = महादशा-अधिपति वर्ष × अन्तर्दशा-अधिपति वर्ष ÷ 120।",
    "प्रत्येक महादशा नऊ उपकालखंडांत विभागली जाते. कालावधी = महादशा-अधिपती वर्षे × अंतर्दशा-अधिपती वर्षे ÷ 120.",
  ),
  "rahu-ketu": localized(
    "The app uses the mean ascending lunar node for Rahu and places Ketu exactly 180° opposite.",
    "ऐप राहु के लिए माध्य आरोही चन्द्र पात उपयोग करता है और केतु को ठीक 180° विपरीत रखता है।",
    "ॲप राहूसाठी मध्यम आरोही चंद्रपात वापरते आणि केतूला नेमके 180° विरुद्ध ठेवते.",
  ),
};

function isDistinctTerm(
  id: AstroTermId,
): id is keyof typeof DISTINCT_TERMS {
  return Object.prototype.hasOwnProperty.call(DISTINCT_TERMS, id);
}

export function getLocalizedAstroGlossaryEntry(
  id: AstroTermId,
  locale: AppLocale,
): LocalizedAstroGlossaryEntry {
  const sanskrit = SANSKRIT_NAMES[id]
    ? readLocalized(SANSKRIT_NAMES[id], locale)
    : undefined;
  const calculation = CALCULATION_NOTES[id]
    ? readLocalized(CALCULATION_NOTES[id], locale)
    : undefined;

  if (isDistinctTerm(id)) {
    const term = DISTINCT_TERMS[id];
    return {
      id,
      title: readLocalized(term.title, locale),
      sanskrit,
      short: readLocalized(term.short, locale),
      detailed: readLocalized(term.detailed, locale),
      calculation,
      readingTips: term.readingTips.map((tip) =>
        readLocalized(tip, locale),
      ),
    };
  }

  const education = getEducationForAstroTerm(id);
  return {
    id,
    title: readLocalized(education.name, locale),
    sanskrit,
    short: readLocalized(education.summary, locale),
    detailed: readLocalized(education.detail, locale),
    calculation,
    readingTips: [readLocalized(education.readingSequence, locale)],
  };
}

if (ASTRO_TERM_IDS.some((id) => !getLocalizedAstroGlossaryEntry(id, "en"))) {
  throw new Error("Localized AstroTerm glossary is incomplete.");
}
