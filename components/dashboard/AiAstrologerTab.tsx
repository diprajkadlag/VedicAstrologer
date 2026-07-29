"use client";

import {
  type ChangeEvent,
  useMemo,
  useState,
} from "react";
import {
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  Code2,
  Copy,
  Heart,
  MessageSquareText,
  MoonStar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import {
  AI_ASTROLOGER_PRESET_IDS,
  ASTROLOGER_QUESTION_MAX_LENGTH,
  buildAiAstrologerPrompt,
  buildAstrologyContext,
  sanitizeAstrologerQuestion,
  type AiAstrologerPresetId,
} from "@/lib/aiPromptBuilder";
import {
  type GrahaId,
  type VedicChart,
} from "@/lib/astro/ephemeris";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import {
  defineMessages,
  INTL_LOCALES,
  type AppLocale,
} from "@/lib/i18n";
import type { TransitAnalysis } from "@/lib/transits";

const messages = defineMessages({
  en: {
    eyebrow: "AI astrologer workspace",
    title: "Ask from your calculated chart",
    intro:
      "Choose a focused question or write your own. This browser-only version prepares a grounded prompt and a calculated chart snapshot; it does not contact an AI service.",
    localOnly: "Local only · no LLM call",
    quickQuestions: "Quick analysis questions",
    presetDaily: "Generate my daily horoscope",
    presetMonthly: "Generate my monthly focus overview",
    presetCareer: "Career and life-path analysis",
    presetDasha: "Current Dasha period deep-dive",
    presetMind: "Mind and emotional strengths",
    questionDaily:
      "Using today's Chandra Nakshatra and transits from both my Janma Rasi and Lagna, give a practical daily reflection with the main theme, supportive actions, cautions, and one reflection question.",
    questionMonthly:
      "Interpret my monthly focus through current Surya and Budha transits, while noting the longer background influence of Guru and Shani. Give practical priorities, communication themes, and one reflection question.",
    questionCareer:
      "Explore career and life-path themes through the 10th Bhava, its lord and placement, grahas in the 10th Bhava, the Lagna lord, current Dashas, and relevant transits. Describe potentials and trade-offs without guaranteed outcomes.",
    questionDasha:
      "Explain my current Vimshottari Mahadasha and Antardasha: what each lord represents in my natal chart, how their Bhavas and placements interact, possible areas of emphasis, constructive uses, and balanced cautions.",
    questionMind:
      "Describe emotional patterns and practical strengths through Chandra's Rasi, Bhava, birth Nakshatra and Pada, its lord, current Dasha, and today's lunar transit. Suggest grounded reflection practices.",
    customQuestion: "Your question",
    placeholder:
      "For example: How might I reflect on my current Guru transit in relation to research work?",
    characterCount: "{count} / {maximum}",
    prepare: "Prepare grounded prompt",
    required: "Enter a question or choose one of the presets.",
    tooLong: "Keep the question to {maximum} characters or fewer.",
    contextError:
      "The prompt could not be prepared because the chart, birth instant, reference date, and transit context do not match.",
    preparedFor: "Prepared question",
    localSnapshot: "Calculated local context",
    notAiAnswer:
      "This is a calculated chart snapshot, not an AI-generated interpretation.",
    chartAnchors: "Natal anchors",
    lagnaLine: "Lagna: {rasi}.",
    moonLine:
      "Chandra: {rasi}, {nakshatra} Pada {pada}, Bhava {house}.",
    timing: "Current Vimshottari timing",
    timingLine:
      "{major} Mahadasha ({majorRasi}, Bhava {majorHouse}) · {minor} Antardasha ({minorRasi}, Bhava {minorHouse}).",
    transits: "Current Gochara positions",
    lunarTransit:
      "Chandra: {nakshatra} Pada {pada}; Bhava {lagnaHouse} from Lagna and {moonHouse} from Janma Rasi.",
    majorTransits:
      "Guru: Bhava {jupiterLagna}/{jupiterMoon} from Lagna/Janma Rasi. Shani: Bhava {saturnLagna}/{saturnMoon}.",
    responseBoundary:
      "These calculated placements are inputs for reflection, not conclusions or event predictions.",
    previewTitle: "Prompt and context preview",
    previewHelp:
      "Review before sharing. The JSON is a stable machine-readable schema and includes birth coordinates and calculated chart data. Its field names and some internal values remain in English for API compatibility; the requested answer language follows your app language.",
    systemInstructions: "System instructions",
    userContext: "Machine-readable context schema",
    copyPrompt: "Copy complete prompt",
    copied: "Prompt copied",
    copyFailed: "Copy failed. Select the preview text and copy it manually.",
    noExternalCall:
      "No external model is configured, so the app will not pretend that this local snapshot is an AI answer.",
    safeUseTitle: "Interpretive boundary",
    safeUse:
      "Jyotish is presented as a symbolic reflective tradition, not scientifically established causation. Do not use this output as medical, legal, financial, mental-health, fertility, mortality, or safety advice.",
  },
  hi: {
    eyebrow: "AI ज्योतिष कार्यक्षेत्र",
    title: "अपनी गणना की गई कुण्डली से प्रश्न पूछें",
    intro:
      "कोई केन्द्रित प्रश्न चुनें या अपना लिखें। यह ब्राउज़र-आधारित संस्करण तथ्याधारित प्रॉम्प्ट और गणना किया गया कुण्डली-सार तैयार करता है; यह किसी AI सेवा से सम्पर्क नहीं करता।",
    localOnly: "केवल स्थानीय · कोई LLM कॉल नहीं",
    quickQuestions: "त्वरित विश्लेषण प्रश्न",
    presetDaily: "मेरा दैनिक राशिफल तैयार करें",
    presetMonthly: "मेरा मासिक केन्द्र-बिन्दु बताएँ",
    presetCareer: "करियर और जीवन-पथ विश्लेषण",
    presetDasha: "वर्तमान दशा का गहन विश्लेषण",
    presetMind: "मन और भावनात्मक शक्तियाँ",
    questionDaily:
      "आज के चन्द्र नक्षत्र तथा जन्म राशि और लग्न—दोनों से गोचर देखकर एक व्यावहारिक दैनिक चिन्तन दें: मुख्य विषय, सहायक कदम, सावधानियाँ और एक आत्मचिन्तन प्रश्न।",
    questionMonthly:
      "वर्तमान सूर्य और बुध गोचर से मासिक केन्द्र समझाएँ और गुरु व शनि के दीर्घकालीन प्रभाव की पृष्ठभूमि भी दें। व्यावहारिक प्राथमिकताएँ, संवाद-विषय और एक आत्मचिन्तन प्रश्न दें।",
    questionCareer:
      "दशम भाव, उसके अधिपति व स्थिति, दशम भाव के ग्रह, लग्नेश, वर्तमान दशाएँ और प्रासंगिक गोचर देखकर करियर व जीवन-पथ के विषय समझाएँ। सम्भावनाएँ और समझौते बताएँ, निश्चित परिणाम नहीं।",
    questionDasha:
      "वर्तमान विंशोत्तरी महादशा और अन्तर्दशा समझाएँ: दोनों अधिपति जन्म-कुण्डली में क्या दर्शाते हैं, उनके भाव और स्थितियाँ कैसे जुड़ते हैं, सम्भावित प्रमुख क्षेत्र, रचनात्मक उपयोग और सन्तुलित सावधानियाँ।",
    questionMind:
      "चन्द्र की राशि, भाव, जन्म नक्षत्र व पाद, उसके अधिपति, वर्तमान दशा और आज के चन्द्र गोचर से भावनात्मक ढाँचे व व्यावहारिक शक्तियाँ समझाएँ। धरातल से जुड़ी आत्मचिन्तन विधियाँ सुझाएँ।",
    customQuestion: "आपका प्रश्न",
    placeholder:
      "उदाहरण: शोध कार्य के सन्दर्भ में वर्तमान गुरु गोचर पर मैं कैसे चिन्तन करूँ?",
    characterCount: "{count} / {maximum}",
    prepare: "तथ्याधारित प्रॉम्प्ट तैयार करें",
    required: "कोई प्रश्न लिखें या पूर्वनिर्धारित प्रश्न चुनें।",
    tooLong: "प्रश्न {maximum} अक्षर या उससे कम रखें।",
    contextError:
      "कुण्डली, जन्म क्षण, सन्दर्भ तिथि और गोचर सन्दर्भ मेल न खाने के कारण प्रॉम्प्ट तैयार नहीं हो सका।",
    preparedFor: "तैयार किया गया प्रश्न",
    localSnapshot: "गणना किया गया स्थानीय सन्दर्भ",
    notAiAnswer: "यह गणना किया गया कुण्डली-सार है, AI द्वारा बनाई व्याख्या नहीं।",
    chartAnchors: "जन्म आधार",
    lagnaLine: "लग्न: {rasi}।",
    moonLine: "चन्द्र: {rasi}, {nakshatra} पाद {pada}, भाव {house}।",
    timing: "वर्तमान विंशोत्तरी काल",
    timingLine:
      "{major} महादशा ({majorRasi}, भाव {majorHouse}) · {minor} अन्तर्दशा ({minorRasi}, भाव {minorHouse})।",
    transits: "वर्तमान गोचर स्थितियाँ",
    lunarTransit:
      "चन्द्र: {nakshatra} पाद {pada}; लग्न से भाव {lagnaHouse} और जन्म राशि से भाव {moonHouse}।",
    majorTransits:
      "गुरु: लग्न/जन्म राशि से भाव {jupiterLagna}/{jupiterMoon}। शनि: भाव {saturnLagna}/{saturnMoon}।",
    responseBoundary:
      "गणना की गई ये स्थितियाँ चिन्तन के आधार हैं, निष्कर्ष या घटना की भविष्यवाणी नहीं।",
    previewTitle: "प्रॉम्प्ट और सन्दर्भ पूर्वावलोकन",
    previewHelp:
      "साझा करने से पहले जाँचें। यह JSON स्थिर मशीन-पठनीय स्कीमा है और इसमें जन्म निर्देशांक व गणना की गई कुण्डली का डेटा है। API संगतता के लिए इसके फ़ील्ड-नाम और कुछ आन्तरिक मान अंग्रेज़ी में रहते हैं; माँगे गए उत्तर की भाषा आपके ऐप की भाषा के अनुसार रहती है।",
    systemInstructions: "सिस्टम निर्देश",
    userContext: "मशीन-पठनीय सन्दर्भ स्कीमा",
    copyPrompt: "पूरा प्रॉम्प्ट कॉपी करें",
    copied: "प्रॉम्प्ट कॉपी हुआ",
    copyFailed: "कॉपी नहीं हुआ। पूर्वावलोकन पाठ चुनकर स्वयं कॉपी करें।",
    noExternalCall:
      "कोई बाहरी मॉडल जुड़ा नहीं है, इसलिए ऐप इस स्थानीय सार को AI उत्तर बताने का दिखावा नहीं करेगा।",
    safeUseTitle: "व्याख्या की सीमा",
    safeUse:
      "ज्योतिष को प्रतीकात्मक चिन्तन-परम्परा के रूप में प्रस्तुत किया गया है, वैज्ञानिक रूप से स्थापित कारण नहीं। इसे चिकित्सा, कानूनी, वित्तीय, मानसिक स्वास्थ्य, प्रजनन, मृत्यु या सुरक्षा सलाह न मानें।",
  },
  mr: {
    eyebrow: "AI ज्योतिष कार्यक्षेत्र",
    title: "तुमच्या गणना केलेल्या कुंडलीतून प्रश्न विचारा",
    intro:
      "केंद्रित प्रश्न निवडा किंवा स्वतःचा लिहा. ही ब्राउझरमधील आवृत्ती तथ्याधारित प्रॉम्प्ट आणि गणना केलेला कुंडली-सार तयार करते; ती कोणत्याही AI सेवेशी संपर्क करत नाही.",
    localOnly: "केवळ स्थानिक · LLM कॉल नाही",
    quickQuestions: "जलद विश्लेषण प्रश्न",
    presetDaily: "माझे दैनिक राशीभविष्य तयार करा",
    presetMonthly: "माझा मासिक केंद्रबिंदू सांगा",
    presetCareer: "करिअर आणि जीवनमार्ग विश्लेषण",
    presetDasha: "चालू दशेचे सखोल विश्लेषण",
    presetMind: "मन आणि भावनिक सामर्थ्ये",
    questionDaily:
      "आजचे चंद्र नक्षत्र आणि जन्मराशी व लग्न या दोन्हींपासूनचे गोचर पाहून व्यावहारिक दैनिक चिंतन द्या: मुख्य विषय, सहाय्यक कृती, सावधगिरी आणि एक आत्मचिंतन प्रश्न.",
    questionMonthly:
      "चालू सूर्य व बुध गोचरांतून मासिक केंद्र समजावा आणि गुरु व शनीचा दीर्घकालीन पार्श्वप्रभावही नोंदवा. व्यावहारिक प्राधान्ये, संवादविषय आणि एक आत्मचिंतन प्रश्न द्या.",
    questionCareer:
      "दहावा भाव, त्याचा अधिपती व स्थान, दहाव्या भावातील ग्रह, लग्नेश, चालू दशा आणि संबंधित गोचर यांतून करिअर व जीवनमार्गाचे विषय पाहा. शक्यता व तडजोडी सांगा; हमीचे निष्कर्ष नकोत.",
    questionDasha:
      "चालू विंशोत्तरी महादशा व अंतर्दशा समजावा: दोन्ही अधिपती जन्मकुंडलीत काय दर्शवतात, त्यांचे भाव व स्थाने कसे जोडले जातात, संभाव्य भर, विधायक उपयोग आणि संतुलित सावधगिरी.",
    questionMind:
      "चंद्राची राशी, भाव, जन्मनक्षत्र व पाद, त्याचा अधिपती, चालू दशा आणि आजचे चंद्रगोचर यांतून भावनिक नमुने व व्यावहारिक सामर्थ्ये समजावा. जमिनीवरचे आत्मचिंतन उपाय सुचवा.",
    customQuestion: "तुमचा प्रश्न",
    placeholder:
      "उदा.: संशोधन कामाच्या संदर्भात चालू गुरु गोचरावर मी कसे चिंतन करू?",
    characterCount: "{count} / {maximum}",
    prepare: "तथ्याधारित प्रॉम्प्ट तयार करा",
    required: "प्रश्न लिहा किंवा पूर्वनिश्चित प्रश्न निवडा.",
    tooLong: "प्रश्न {maximum} अक्षरे किंवा त्यापेक्षा कमी ठेवा.",
    contextError:
      "कुंडली, जन्मक्षण, संदर्भ तारीख आणि गोचर संदर्भ जुळत नसल्यामुळे प्रॉम्प्ट तयार झाला नाही.",
    preparedFor: "तयार केलेला प्रश्न",
    localSnapshot: "गणना केलेला स्थानिक संदर्भ",
    notAiAnswer: "हा गणना केलेला कुंडली-सार आहे, AI-निर्मित अर्थनिर्णय नाही.",
    chartAnchors: "जन्म आधार",
    lagnaLine: "लग्न: {rasi}.",
    moonLine: "चंद्र: {rasi}, {nakshatra} पाद {pada}, भाव {house}.",
    timing: "चालू विंशोत्तरी काल",
    timingLine:
      "{major} महादशा ({majorRasi}, भाव {majorHouse}) · {minor} अंतर्दशा ({minorRasi}, भाव {minorHouse}).",
    transits: "चालू गोचर स्थिती",
    lunarTransit:
      "चंद्र: {nakshatra} पाद {pada}; लग्नापासून भाव {lagnaHouse} आणि जन्मराशीपासून भाव {moonHouse}.",
    majorTransits:
      "गुरु: लग्न/जन्मराशीपासून भाव {jupiterLagna}/{jupiterMoon}. शनि: भाव {saturnLagna}/{saturnMoon}.",
    responseBoundary:
      "गणना केलेली ही स्थाने चिंतनाची माहिती आहेत; निष्कर्ष किंवा घटनांचे भाकीत नाहीत.",
    previewTitle: "प्रॉम्प्ट आणि संदर्भ पूर्वदृश्य",
    previewHelp:
      "सामायिक करण्याआधी तपासा. हा JSON स्थिर मशीन-वाचनीय स्कीमा असून त्यात जन्म निर्देशांक आणि गणना केलेला कुंडली-डेटा आहे. API सुसंगततेसाठी फील्ड-नावे आणि काही अंतर्गत मूल्ये इंग्रजीत राहतात; मागितलेल्या उत्तराची भाषा तुमच्या ॲपच्या भाषेनुसार राहते.",
    systemInstructions: "सिस्टम सूचना",
    userContext: "मशीन-वाचनीय संदर्भ स्कीमा",
    copyPrompt: "संपूर्ण प्रॉम्प्ट कॉपी करा",
    copied: "प्रॉम्प्ट कॉपी झाला",
    copyFailed: "कॉपी झाले नाही. पूर्वदृश्य मजकूर निवडून स्वतः कॉपी करा.",
    noExternalCall:
      "बाह्य मॉडेल जोडलेले नाही; त्यामुळे ॲप हा स्थानिक सार AI उत्तर असल्याचा आव आणणार नाही.",
    safeUseTitle: "अर्थनिर्णयाची सीमा",
    safeUse:
      "ज्योतिष ही प्रतीकात्मक चिंतनपरंपरा म्हणून मांडली आहे; वैज्ञानिकरीत्या सिद्ध कारण म्हणून नाही. हे वैद्यकीय, कायदेशीर, आर्थिक, मानसिक आरोग्य, प्रजनन, मृत्यू किंवा सुरक्षितता सल्ला समजू नका.",
  },
  de: {
    eyebrow: "AI-Jyotish-Arbeitsbereich",
    title: "Fragen Sie auf Grundlage Ihrer berechneten Kundali",
    intro:
      "Wählen Sie eine gezielte Frage oder formulieren Sie eine eigene. Diese reine Browser-Version erstellt einen fundierten Prompt und einen berechneten Kundali-Datensatz; sie kontaktiert keinen AI-Dienst.",
    localOnly: "Nur lokal · kein LLM-Aufruf",
    quickQuestions: "Schnellanalysen",
    presetDaily: "Mein tägliches Gochara erstellen",
    presetMonthly: "Meinen monatlichen Fokus zusammenfassen",
    presetCareer: "Karriere- und Lebensweg-Analyse",
    presetDasha: "Aktuelle Dasha vertieft betrachten",
    presetMind: "Geistige und emotionale Stärken",
    questionDaily:
      "Erstelle anhand des heutigen Chandra-Nakshatra und der Gochara von meiner Janma Rasi und meinem Lagna eine praktische Tagesreflexion mit Hauptthema, unterstützenden Handlungen, Hinweisen zur Vorsicht und einer Reflexionsfrage.",
    questionMonthly:
      "Deute meinen monatlichen Fokus anhand der aktuellen Gochara von Surya und Budha und benenne den längerfristigen Hintergrund von Guru und Shani. Nenne praktische Prioritäten, Kommunikationsthemen und eine Reflexionsfrage.",
    questionCareer:
      "Untersuche Karriere- und Lebenswegthemen über den 10. Bhava, seinen Bhavesha und dessen Platzierung, Grahas im 10. Bhava, den Lagnesha, aktuelle Dashas und relevante Gochara. Beschreibe Potenziale und Zielkonflikte, ohne garantierte Ergebnisse zu behaupten.",
    questionDasha:
      "Erkläre meine aktuelle Vimshottari-Mahadasha und -Antardasha: was beide Herrscher in meiner Geburtskundali symbolisieren, wie ihre Bhavas und Platzierungen zusammenspielen, mögliche Schwerpunkte, konstruktive Nutzung und ausgewogene Vorsicht.",
    questionMind:
      "Beschreibe emotionale Muster und praktische Stärken anhand von Chandras Rasi und Bhava, Geburts-Nakshatra und Pada, dessen Herrscher, aktueller Dasha und heutigem Chandra-Gochara. Schlage bodenständige Reflexionspraktiken vor.",
    customQuestion: "Ihre Frage",
    placeholder:
      "Zum Beispiel: Wie kann ich über meinen aktuellen Guru-Gochara in Bezug auf meine Forschungsarbeit nachdenken?",
    characterCount: "{count} / {maximum}",
    prepare: "Fundierten Prompt vorbereiten",
    required: "Geben Sie eine Frage ein oder wählen Sie eine Schnellfrage.",
    tooLong: "Die Frage darf höchstens {maximum} Zeichen lang sein.",
    contextError:
      "Der Prompt konnte nicht erstellt werden, weil Kundali, Geburtszeitpunkt, Referenzdatum und Gochara-Kontext nicht übereinstimmen.",
    preparedFor: "Vorbereitete Frage",
    localSnapshot: "Lokal berechneter Kontext",
    notAiAnswer:
      "Dies ist ein berechneter Kundali-Datensatz, keine von AI erzeugte Deutung.",
    chartAnchors: "Geburtskundali-Anker",
    lagnaLine: "Lagna: {rasi}.",
    moonLine:
      "Chandra: {rasi}, {nakshatra}, Pada {pada}, Bhava {house}.",
    timing: "Aktuelle Vimshottari-Phase",
    timingLine:
      "{major}-Mahadasha ({majorRasi}, Bhava {majorHouse}) · {minor}-Antardasha ({minorRasi}, Bhava {minorHouse}).",
    transits: "Aktuelle Gochara-Positionen",
    lunarTransit:
      "Chandra: {nakshatra}, Pada {pada}; Bhava {lagnaHouse} vom Lagna und Bhava {moonHouse} von der Janma Rasi.",
    majorTransits:
      "Guru: Bhava {jupiterLagna}/{jupiterMoon} vom Lagna/von der Janma Rasi. Shani: Bhava {saturnLagna}/{saturnMoon}.",
    responseBoundary:
      "Diese berechneten Positionen sind Ausgangspunkte für Reflexion, keine Schlussfolgerungen oder Ereignisprognosen.",
    previewTitle: "Vorschau von Prompt und Kontext",
    previewHelp:
      "Prüfen Sie die Daten vor dem Teilen. Das JSON ist ein stabiles, maschinenlesbares Schema und enthält Geburtskoordinaten sowie berechnete Kundali-Daten. Feldnamen und einige interne Werte bleiben für API-Kompatibilität auf Englisch; die gewünschte Antwortsprache folgt der App-Sprache.",
    systemInstructions: "Systemanweisungen",
    userContext: "Maschinenlesbares Kontextschema",
    copyPrompt: "Vollständigen Prompt kopieren",
    copied: "Prompt kopiert",
    copyFailed:
      "Kopieren fehlgeschlagen. Markieren Sie den Vorschautext und kopieren Sie ihn manuell.",
    noExternalCall:
      "Es ist kein externes Modell eingerichtet. Die App gibt diesen lokalen Datensatz daher nicht als AI-Antwort aus.",
    safeUseTitle: "Grenzen der Deutung",
    safeUse:
      "Jyotish wird als symbolische Tradition zur Reflexion dargestellt, nicht als wissenschaftlich belegter Kausalzusammenhang. Verwenden Sie die Ausgabe nicht als medizinische, rechtliche, finanzielle, psychologische, Fruchtbarkeits-, Sterblichkeits- oder Sicherheitsberatung.",
  },
});

const presetUi = [
  {
    id: "daily-horoscope",
    label: "presetDaily",
    question: "questionDaily",
    icon: CalendarDays,
  },
  {
    id: "monthly-focus",
    label: "presetMonthly",
    question: "questionMonthly",
    icon: MoonStar,
  },
  {
    id: "career-life-path",
    label: "presetCareer",
    question: "questionCareer",
    icon: BriefcaseBusiness,
  },
  {
    id: "dasha-deep-dive",
    label: "presetDasha",
    question: "questionDasha",
    icon: Clock3,
  },
  {
    id: "mind-emotional-strengths",
    label: "presetMind",
    question: "questionMind",
    icon: Heart,
  },
] as const satisfies readonly {
  id: AiAstrologerPresetId;
  label: keyof typeof messages.en;
  question: keyof typeof messages.en;
  icon: typeof CalendarDays;
}[];

if (
  presetUi.map((preset) => preset.id).join("|") !==
  AI_ASTROLOGER_PRESET_IDS.join("|")
) {
  throw new Error("AI Astrologer preset UI is out of sync with the prompt builder.");
}

interface SubmittedQuestion {
  presetId: AiAstrologerPresetId | null;
  customText: string;
}

export interface AiAstrologerTabProps {
  chart: VedicChart;
  request: {
    birth: {
      instant: Date | string;
    };
  };
  asOf: Date | string;
  transits: TransitAnalysis;
  className?: string;
}

function localizedInteger(value: number, locale: AppLocale): string {
  return value.toLocaleString(INTL_LOCALES[locale], {
    maximumFractionDigits: 0,
    useGrouping: false,
  });
}

function requirePlanet(chart: VedicChart, id: GrahaId) {
  const planet = chart.planets.find((candidate) => candidate.id === id);
  if (!planet) throw new RangeError(`Natal chart is missing ${id}.`);
  return planet;
}

async function writeClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.opacity = "0";
  document.body.append(fallback);
  fallback.select();
  const copied = document.execCommand("copy");
  fallback.remove();
  if (!copied) throw new Error("Clipboard copy is unavailable.");
}

export default function AiAstrologerTab({
  chart,
  request,
  asOf,
  transits,
  className = "",
}: AiAstrologerTabProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(messages);
  const [draftPreset, setDraftPreset] =
    useState<AiAstrologerPresetId | null>(null);
  const [customDraft, setCustomDraft] = useState("");
  const [submitted, setSubmitted] = useState<SubmittedQuestion | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copied" | "failed"
  >("idle");

  const presetById = useMemo(
    () => new Map(presetUi.map((preset) => [preset.id, preset])),
    [],
  );
  const draftQuestion = draftPreset
    ? t(presetById.get(draftPreset)!.question)
    : customDraft;
  const submittedQuestion = submitted
    ? submitted.presetId
      ? t(presetById.get(submitted.presetId)!.question)
      : submitted.customText
    : null;

  const prepared = useMemo(() => {
    if (!submittedQuestion) return null;
    try {
      const context = buildAstrologyContext({
        chart,
        birthInstant: request.birth.instant,
        asOf,
        transits,
      });
      const prompt = buildAiAstrologerPrompt({
        context,
        question: submittedQuestion,
        responseLocale: locale,
      });
      return { status: "ready" as const, context, prompt };
    } catch {
      return { status: "error" as const };
    }
  }, [
    asOf,
    chart,
    request.birth.instant,
    locale,
    submittedQuestion,
    transits,
  ]);

  const moon = requirePlanet(chart, "moon");
  const transitMoon = transits.positions.find((planet) => planet.id === "moon");
  const majorLord = prepared?.status === "ready"
    ? prepared.context.vimshottari.mahadasha.lord
    : null;
  const minorLord = prepared?.status === "ready"
    ? prepared.context.vimshottari.antardasha.lord
    : null;
  const majorPlacement = majorLord ? requirePlanet(chart, majorLord) : null;
  const minorPlacement = minorLord ? requirePlanet(chart, minorLord) : null;

  function selectPreset(id: AiAstrologerPresetId) {
    setDraftPreset(id);
    setCustomDraft("");
    setInputError(null);
    setCopyStatus("idle");
  }

  function changeQuestion(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraftPreset(null);
    setCustomDraft(event.target.value);
    setInputError(null);
    setCopyStatus("idle");
  }

  function preparePrompt() {
    const normalizedLength = draftQuestion.normalize("NFKC").trim().length;
    if (normalizedLength === 0) {
      setInputError(t("required"));
      return;
    }
    if (normalizedLength > ASTROLOGER_QUESTION_MAX_LENGTH) {
      setInputError(
        t("tooLong", {
          maximum: localizedInteger(
            ASTROLOGER_QUESTION_MAX_LENGTH,
            locale,
          ),
        }),
      );
      return;
    }

    try {
      const sanitized = sanitizeAstrologerQuestion(draftQuestion);
      setSubmitted({
        presetId: draftPreset,
        customText: draftPreset ? "" : sanitized,
      });
      setInputError(null);
      setCopyStatus("idle");
    } catch {
      setInputError(t("required"));
    }
  }

  async function copyPrompt() {
    if (prepared?.status !== "ready") return;
    const completePrompt = [
      t("systemInstructions"),
      prepared.prompt.system,
      "",
      t("userContext"),
      prepared.prompt.user,
    ].join("\n");
    try {
      await writeClipboard(completePrompt);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section
      aria-labelledby="ai-astrologer-title"
      className={`space-y-6 text-[var(--foreground)] ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-violet-500">
            <BrainCircuit aria-hidden="true" className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
              {t("eyebrow")}
            </span>
          </div>
          <h2
            id="ai-astrologer-title"
            className="mt-2 text-2xl font-semibold"
          >
            {t("title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {t("intro")}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--muted)]">
          <ShieldCheck aria-hidden="true" className="size-4 text-emerald-500" />
          {t("localOnly")}
        </span>
      </header>

      <section aria-labelledby="quick-question-title">
        <h3
          id="quick-question-title"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
        >
          {t("quickQuestions")}
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {presetUi.map((preset) => {
            const Icon = preset.icon;
            const selected = draftPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => selectPreset(preset.id)}
                className={`flex min-h-24 flex-col items-start gap-3 rounded-2xl border p-3.5 text-left text-sm leading-5 transition ${
                  selected
                    ? "border-violet-500/45 bg-violet-500/15 text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-violet-500/35 hover:text-[var(--foreground)]"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`size-4 ${selected ? "text-violet-500" : ""}`}
                />
                {t(preset.label)}
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="custom-question-title"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2">
          <MessageSquareText
            aria-hidden="true"
            className="size-4 text-violet-500"
          />
          <h3 id="custom-question-title" className="text-sm font-semibold">
            {t("customQuestion")}
          </h3>
        </div>
        <textarea
          value={draftQuestion}
          onChange={changeQuestion}
          maxLength={ASTROLOGER_QUESTION_MAX_LENGTH + 1}
          rows={5}
          placeholder={t("placeholder")}
          aria-invalid={Boolean(inputError)}
          aria-describedby="ai-question-help ai-question-error"
          className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-violet-500/55 focus:ring-2 focus:ring-violet-500/15"
        />
        <div
          id="ai-question-help"
          className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]"
        >
          <span>{t("noExternalCall")}</span>
          <span>
            {t("characterCount", {
              count: localizedInteger(draftQuestion.length, locale),
              maximum: localizedInteger(
                ASTROLOGER_QUESTION_MAX_LENGTH,
                locale,
              ),
            })}
          </span>
        </div>
        {inputError ? (
          <p
            id="ai-question-error"
            role="alert"
            className="mt-2 text-xs text-rose-500"
          >
            {inputError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={preparePrompt}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-[white] shadow-lg shadow-violet-950/15 transition hover:bg-violet-500"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          {t("prepare")}
        </button>
      </section>

      {submittedQuestion ? (
        <section aria-live="polite" className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
              {t("preparedFor")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {submittedQuestion}
            </p>
          </div>

          {prepared?.status === "error" ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm leading-6 text-rose-600"
            >
              {t("contextError")}
            </div>
          ) : prepared?.status === "ready" &&
            transitMoon &&
            majorPlacement &&
            minorPlacement ? (
            <>
              <section
                aria-labelledby="local-snapshot-title"
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3
                      id="local-snapshot-title"
                      className="font-semibold"
                    >
                      {t("localSnapshot")}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {t("notAiAnswer")}
                    </p>
                  </div>
                  <Clipboard
                    aria-hidden="true"
                    className="size-5 text-violet-500"
                  />
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {t("chartAnchors")}
                    </h4>
                    <p className="mt-3 text-sm leading-6">
                      {t("lagnaLine", {
                        rasi: getLocalizedRasiName(
                          chart.ascendant.sign.name,
                          locale,
                        ),
                      })}
                    </p>
                    <p className="mt-1 text-sm leading-6">
                      {t("moonLine", {
                        rasi: getLocalizedRasiName(moon.sign.name, locale),
                        nakshatra: getLocalizedNakshatraName(
                          moon.nakshatra.name,
                          locale,
                        ),
                        pada: localizedInteger(moon.nakshatra.pada, locale),
                        house: localizedInteger(moon.house, locale),
                      })}
                    </p>
                  </article>

                  <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {t("timing")}
                    </h4>
                    <p className="mt-3 text-sm leading-6">
                      {t("timingLine", {
                        major: getLocalizedGrahaName(majorLord!, locale),
                        majorRasi: getLocalizedRasiName(
                          majorPlacement.sign.name,
                          locale,
                        ),
                        majorHouse: localizedInteger(
                          majorPlacement.house,
                          locale,
                        ),
                        minor: getLocalizedGrahaName(minorLord!, locale),
                        minorRasi: getLocalizedRasiName(
                          minorPlacement.sign.name,
                          locale,
                        ),
                        minorHouse: localizedInteger(
                          minorPlacement.house,
                          locale,
                        ),
                      })}
                    </p>
                  </article>

                  <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {t("transits")}
                    </h4>
                    <p className="mt-3 text-sm leading-6">
                      {t("lunarTransit", {
                        nakshatra: getLocalizedNakshatraName(
                          transitMoon.nakshatra,
                          locale,
                        ),
                        pada: localizedInteger(
                          transitMoon.nakshatraPada,
                          locale,
                        ),
                        lagnaHouse: localizedInteger(
                          transitMoon.houseFromLagna,
                          locale,
                        ),
                        moonHouse: localizedInteger(
                          transitMoon.houseFromMoon,
                          locale,
                        ),
                      })}
                    </p>
                    <p className="mt-1 text-sm leading-6">
                      {t("majorTransits", {
                        jupiterLagna: localizedInteger(
                          transits.majorTransits.jupiter.houseFromLagna,
                          locale,
                        ),
                        jupiterMoon: localizedInteger(
                          transits.majorTransits.jupiter.houseFromJanmaRasi,
                          locale,
                        ),
                        saturnLagna: localizedInteger(
                          transits.majorTransits.saturn.houseFromLagna,
                          locale,
                        ),
                        saturnMoon: localizedInteger(
                          transits.majorTransits.saturn.houseFromJanmaRasi,
                          locale,
                        ),
                      })}
                    </p>
                  </article>
                </div>

                <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                  {t("responseBoundary")}
                </p>
              </section>

              <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
                  <span className="flex items-center gap-2 font-semibold">
                    <Code2
                      aria-hidden="true"
                      className="size-4 text-violet-500"
                    />
                    {t("previewTitle")}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 text-[var(--muted)] transition group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-[var(--border)] p-4 sm:p-5">
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    {t("previewHelp")}
                  </p>
                  <div className="mt-4 space-y-4">
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {t("systemInstructions")}
                      </h4>
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[11px] leading-5 text-[var(--foreground)]">
                        {prepared.prompt.system}
                      </pre>
                    </section>
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {t("userContext")}
                      </h4>
                      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[11px] leading-5 text-[var(--foreground)]">
                        {prepared.prompt.user}
                      </pre>
                    </section>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void copyPrompt()}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2 text-xs font-medium transition hover:border-violet-500/35"
                    >
                      {copyStatus === "copied" ? (
                        <Check
                          aria-hidden="true"
                          className="size-4 text-emerald-500"
                        />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                      {copyStatus === "copied"
                        ? t("copied")
                        : t("copyPrompt")}
                    </button>
                    {copyStatus === "failed" ? (
                      <p role="alert" className="text-xs text-rose-500">
                        {t("copyFailed")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </details>
            </>
          ) : null}
        </section>
      ) : null}

      <aside className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
        <div className="flex gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-amber-500"
          />
          <div>
            <h3 className="text-sm font-semibold">{t("safeUseTitle")}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {t("safeUse")}
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
