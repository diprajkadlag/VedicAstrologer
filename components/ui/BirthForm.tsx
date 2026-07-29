"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import {
  analyzeCivilTime,
  type CivilTimeCandidate,
  type CivilTimeResolution,
} from "@/lib/astro/civil-time";
import type { ChartInput } from "@/lib/astro/ephemeris";
import type {
  GeocodeErrorResponse,
  PlaceSearchResponse,
  PlaceSearchResult,
} from "@/lib/geocoding/types";
import { searchPlaces as requestPlaceSearch } from "@/lib/geocoding/client";
import { GeocodeServiceError } from "@/lib/geocoding/shared";
import { defineMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    invalidLocalTime: "The local birth time or timezone is invalid.",
    selectedPlace: "Selected {place}.",
    minSearch: "Enter at least three characters, then search.",
    searching: "Searching OpenStreetMap…",
    searchUnavailable: "Place search is temporarily unavailable.",
    invalidSearchResponse: "Place search returned an invalid response.",
    noPlaces: "No matching places found. Try a city and country.",
    onePlace: "1 place result found.",
    manyPlaces: "{count} place results found.",
    invalidLatitude: "Manual latitude must be between -90 and 90.",
    invalidLongitude: "Manual longitude must be between -180 and 180.",
    missingManualTimezone: "Enter an IANA timezone such as Asia/Kolkata.",
    usingCoordinates: "Using manual coordinates for {place}.",
    invalidName: "Enter a name between 1 and 100 characters.",
    missingGender: "Select a gender option.",
    invalidBirthDate: "Enter a valid birth date that is not in the future.",
    birthTimeSeconds: "Enter the birth time including seconds.",
    missingPlace:
      "Search for and select a birthplace, or use manual coordinates.",
    missingTimezone: "Confirm an IANA timezone for this birthplace.",
    nonexistentTime:
      "This local clock time did not exist because the clock changed. Enter another recorded time.",
    chooseAmbiguous:
      "This clock time occurred twice. Choose the earlier or later occurrence.",
    incompleteTime: "Enter a complete date, time, and valid timezone.",
    resolvedFuture: "The resolved birth instant cannot be in the future.",
    birthCoordinates: "Birth coordinates",
    title: "Generate your horoscope",
    intro:
      "Seconds and the historical timezone can change the Lagna, so confirm them carefully.",
    fullName: "Full name",
    namePlaceholder: "Name for this chart",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    dateOfBirth: "Date of birth",
    timeOfBirth: "Time of birth",
    placeOfBirth: "Place of birth",
    placePlaceholder: "City, region, country",
    search: "Search",
    searchResults: "Birthplace search results",
    searchHelp:
      "Press Search or Enter for suggestions; public Nominatim does not permit live autocomplete.",
    osmAttribution: "© OpenStreetMap contributors",
    manualSummary: "Place unavailable? Enter coordinates manually",
    locationLabel: "Location label",
    manualLocationLabel: "Manual location label",
    latitude: "Latitude",
    manualLatitude: "Manual latitude",
    longitude: "Longitude",
    manualLongitude: "Manual longitude",
    timezoneExample: "IANA timezone, e.g. Asia/Kolkata",
    manualTimezone: "Manual IANA timezone",
    useCoordinates: "Use coordinates",
    historicalTimezone: "Historical timezone",
    timezonePlaceholder: "Select a place or enter an IANA timezone",
    timezoneHelp:
      "The UTC offset is derived for the entered birth date, including historical daylight-saving rules.",
    resolvedAs: "Resolved as {candidate}",
    occurredTwice: "This local time occurred twice",
    occurrenceHelp: "Choose the occurrence recorded for the birth.",
    earlier: "Earlier",
    later: "Later",
    generate: "Generate horoscope",
  },
  hi: {
    invalidLocalTime: "स्थानीय जन्म समय या समय-क्षेत्र मान्य नहीं है।",
    selectedPlace: "{place} चुना गया।",
    minSearch: "कम से कम तीन अक्षर लिखकर खोजें।",
    searching: "OpenStreetMap पर खोज जारी है…",
    searchUnavailable: "स्थान खोज अभी उपलब्ध नहीं है।",
    invalidSearchResponse: "स्थान खोज से अमान्य उत्तर मिला।",
    noPlaces: "कोई मिलता-जुलता स्थान नहीं मिला। शहर और देश लिखकर देखें।",
    onePlace: "1 स्थान परिणाम मिला।",
    manyPlaces: "{count} स्थान परिणाम मिले।",
    invalidLatitude: "अक्षांश -90 और 90 के बीच होना चाहिए।",
    invalidLongitude: "देशांतर -180 और 180 के बीच होना चाहिए।",
    missingManualTimezone: "Asia/Kolkata जैसा IANA समय-क्षेत्र लिखें।",
    usingCoordinates: "{place} के लिए निर्देशांक उपयोग किए जा रहे हैं।",
    invalidName: "1 से 100 अक्षरों के बीच नाम लिखें।",
    missingGender: "लिंग विकल्प चुनें।",
    invalidBirthDate: "मान्य जन्मतिथि लिखें जो भविष्य की न हो।",
    birthTimeSeconds: "जन्म समय सेकंड सहित लिखें।",
    missingPlace: "जन्मस्थान खोजकर चुनें या निर्देशांक स्वयं लिखें।",
    missingTimezone: "इस जन्मस्थान का IANA समय-क्षेत्र पक्का करें।",
    nonexistentTime:
      "घड़ी बदलने के कारण यह स्थानीय समय अस्तित्व में नहीं था। कोई दूसरा दर्ज समय लिखें।",
    chooseAmbiguous:
      "यह घड़ी का समय दो बार आया था। पहले या बाद वाले अवसर को चुनें।",
    incompleteTime: "पूरी तिथि, समय और मान्य समय-क्षेत्र लिखें।",
    resolvedFuture: "निर्धारित जन्म क्षण भविष्य में नहीं हो सकता।",
    birthCoordinates: "जन्म निर्देशांक",
    title: "अपनी कुण्डली बनाएँ",
    intro:
      "सेकंड और ऐतिहासिक समय-क्षेत्र लग्न बदल सकते हैं, इसलिए ध्यान से पुष्टि करें।",
    fullName: "पूरा नाम",
    namePlaceholder: "इस कुण्डली के लिए नाम",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    dateOfBirth: "जन्मतिथि",
    timeOfBirth: "जन्म समय",
    placeOfBirth: "जन्मस्थान",
    placePlaceholder: "शहर, क्षेत्र, देश",
    search: "खोजें",
    searchResults: "जन्मस्थान खोज परिणाम",
    searchHelp:
      "सुझावों के लिए खोजें दबाएँ या Enter करें; सार्वजनिक Nominatim सजीव स्वतः-पूर्ण की अनुमति नहीं देता।",
    osmAttribution: "© OpenStreetMap योगदानकर्ता",
    manualSummary: "स्थान नहीं मिला? निर्देशांक स्वयं लिखें",
    locationLabel: "स्थान का नाम",
    manualLocationLabel: "स्वयं लिखा स्थान नाम",
    latitude: "अक्षांश",
    manualLatitude: "स्वयं लिखा अक्षांश",
    longitude: "देशांतर",
    manualLongitude: "स्वयं लिखा देशांतर",
    timezoneExample: "IANA समय-क्षेत्र, जैसे Asia/Kolkata",
    manualTimezone: "स्वयं लिखा IANA समय-क्षेत्र",
    useCoordinates: "निर्देशांक अपनाएँ",
    historicalTimezone: "ऐतिहासिक समय-क्षेत्र",
    timezonePlaceholder: "स्थान चुनें या IANA समय-क्षेत्र लिखें",
    timezoneHelp:
      "UTC अंतर दर्ज जन्मतिथि के लिए निकाला जाता है और ऐतिहासिक डेलाइट-सेविंग नियम भी शामिल होते हैं।",
    resolvedAs: "{candidate} के रूप में निर्धारित",
    occurredTwice: "यह स्थानीय समय दो बार आया था",
    occurrenceHelp: "जन्म अभिलेख में दर्ज अवसर चुनें।",
    earlier: "पहला",
    later: "बाद वाला",
    generate: "कुण्डली बनाएँ",
  },
  mr: {
    invalidLocalTime: "स्थानिक जन्मवेळ किंवा कालविभाग वैध नाही.",
    selectedPlace: "{place} निवडले.",
    minSearch: "किमान तीन अक्षरे लिहून शोधा.",
    searching: "OpenStreetMap वर शोध सुरू आहे…",
    searchUnavailable: "स्थळ शोध सध्या उपलब्ध नाही.",
    invalidSearchResponse: "स्थळ शोधातून अवैध प्रतिसाद मिळाला.",
    noPlaces: "जुळणारे स्थळ सापडले नाही. शहर आणि देश लिहून पाहा.",
    onePlace: "1 स्थळ परिणाम सापडला.",
    manyPlaces: "{count} स्थळ परिणाम सापडले.",
    invalidLatitude: "अक्षांश -90 आणि 90 यांच्या दरम्यान असावा.",
    invalidLongitude: "रेखांश -180 आणि 180 यांच्या दरम्यान असावा.",
    missingManualTimezone: "Asia/Kolkata सारखा IANA कालविभाग लिहा.",
    usingCoordinates: "{place} साठी निर्देशांक वापरले जात आहेत.",
    invalidName: "1 ते 100 अक्षरांमधील नाव लिहा.",
    missingGender: "लिंग पर्याय निवडा.",
    invalidBirthDate: "भविष्यातील नसलेली वैध जन्मतारीख लिहा.",
    birthTimeSeconds: "सेकंदांसह जन्मवेळ लिहा.",
    missingPlace: "जन्मस्थळ शोधून निवडा किंवा निर्देशांक स्वतः लिहा.",
    missingTimezone: "या जन्मस्थळाचा IANA कालविभाग निश्चित करा.",
    nonexistentTime:
      "घड्याळ बदलल्यामुळे ही स्थानिक वेळ अस्तित्वात नव्हती. नोंदवलेली दुसरी वेळ लिहा.",
    chooseAmbiguous:
      "ही घड्याळातील वेळ दोनदा आली होती. आधीचा किंवा नंतरचा प्रसंग निवडा.",
    incompleteTime: "संपूर्ण तारीख, वेळ आणि वैध कालविभाग लिहा.",
    resolvedFuture: "निश्चित केलेला जन्मक्षण भविष्यातील असू शकत नाही.",
    birthCoordinates: "जन्म निर्देशांक",
    title: "तुमची कुंडली तयार करा",
    intro:
      "सेकंद आणि ऐतिहासिक कालविभाग लग्न बदलू शकतात, म्हणून काळजीपूर्वक खात्री करा.",
    fullName: "पूर्ण नाव",
    namePlaceholder: "या कुंडलीसाठी नाव",
    gender: "लिंग",
    male: "पुरुष",
    female: "स्त्री",
    other: "इतर",
    dateOfBirth: "जन्मतारीख",
    timeOfBirth: "जन्मवेळ",
    placeOfBirth: "जन्मस्थळ",
    placePlaceholder: "शहर, प्रदेश, देश",
    search: "शोधा",
    searchResults: "जन्मस्थळ शोध परिणाम",
    searchHelp:
      "सूचनांसाठी शोधा दाबा किंवा Enter करा; सार्वजनिक Nominatim थेट स्वयं-पूर्ण करण्यास परवानगी देत नाही.",
    osmAttribution: "© OpenStreetMap योगदानकर्ते",
    manualSummary: "स्थळ उपलब्ध नाही? निर्देशांक स्वतः लिहा",
    locationLabel: "स्थळाचे नाव",
    manualLocationLabel: "स्वतः लिहिलेले स्थळ नाव",
    latitude: "अक्षांश",
    manualLatitude: "स्वतः लिहिलेला अक्षांश",
    longitude: "रेखांश",
    manualLongitude: "स्वतः लिहिलेला रेखांश",
    timezoneExample: "IANA कालविभाग, उदा. Asia/Kolkata",
    manualTimezone: "स्वतः लिहिलेला IANA कालविभाग",
    useCoordinates: "निर्देशांक वापरा",
    historicalTimezone: "ऐतिहासिक कालविभाग",
    timezonePlaceholder: "स्थळ निवडा किंवा IANA कालविभाग लिहा",
    timezoneHelp:
      "UTC फरक नोंदवलेल्या जन्मतारखेनुसार काढला जातो आणि ऐतिहासिक डेलाइट-सेव्हिंग नियमही समाविष्ट होतात.",
    resolvedAs: "{candidate} असे निश्चित",
    occurredTwice: "ही स्थानिक वेळ दोनदा आली होती",
    occurrenceHelp: "जन्मनोंदीत नोंदवलेला प्रसंग निवडा.",
    earlier: "आधीचा",
    later: "नंतरचा",
    generate: "कुंडली तयार करा",
  },
  de: {
    invalidLocalTime: "Die lokale Geburtszeit oder Zeitzone ist ungültig.",
    selectedPlace: "{place} wurde ausgewählt.",
    minSearch: "Gib mindestens drei Zeichen ein und starte dann die Suche.",
    searching: "OpenStreetMap wird durchsucht…",
    searchUnavailable: "Die Ortssuche ist vorübergehend nicht verfügbar.",
    invalidSearchResponse: "Die Ortssuche hat eine ungültige Antwort geliefert.",
    noPlaces: "Keine passenden Orte gefunden. Versuche Stadt und Land.",
    onePlace: "1 Ort gefunden.",
    manyPlaces: "{count} Orte gefunden.",
    invalidLatitude: "Der Breitengrad muss zwischen -90 und 90 liegen.",
    invalidLongitude: "Der Längengrad muss zwischen -180 und 180 liegen.",
    missingManualTimezone: "Gib eine IANA-Zeitzone wie Europe/Berlin ein.",
    usingCoordinates: "Manuelle Koordinaten werden für {place} verwendet.",
    invalidName: "Gib einen Namen mit 1 bis 100 Zeichen ein.",
    missingGender: "Wähle eine Geschlechtsoption.",
    invalidBirthDate: "Gib ein gültiges Geburtsdatum ein, das nicht in der Zukunft liegt.",
    birthTimeSeconds: "Gib eine vollständige Geburtszeit ein.",
    missingPlace: "Suche und wähle einen Geburtsort oder verwende manuelle Koordinaten.",
    missingTimezone: "Bestätige die IANA-Zeitzone für diesen Geburtsort.",
    nonexistentTime: "Diese lokale Uhrzeit existierte wegen einer Zeitumstellung nicht. Gib eine andere dokumentierte Zeit ein.",
    chooseAmbiguous: "Diese Uhrzeit trat zweimal auf. Wähle das frühere oder spätere Vorkommen.",
    incompleteTime: "Gib ein vollständiges Datum, eine Uhrzeit und eine gültige Zeitzone ein.",
    resolvedFuture: "Der aufgelöste Geburtszeitpunkt darf nicht in der Zukunft liegen.",
    birthCoordinates: "Geburtsdaten",
    title: "Erstelle deine Kundali",
    intro: "Geburtszeit und historische Zeitzone können Lagna und Bhavas verändern. Prüfe die Angaben sorgfältig.",
    fullName: "Vollständiger Name",
    namePlaceholder: "Name für diese Kundali",
    gender: "Geschlecht",
    male: "Männlich",
    female: "Weiblich",
    other: "Divers",
    dateOfBirth: "Geburtsdatum",
    timeOfBirth: "Geburtszeit",
    placeOfBirth: "Geburtsort",
    placePlaceholder: "Stadt, Region, Land",
    search: "Suchen",
    searchResults: "Ergebnisse der Geburtsortsuche",
    searchHelp: "Drücke Suchen oder Enter für Vorschläge; das öffentliche Nominatim erlaubt keine Live-Autovervollständigung.",
    osmAttribution: "© OpenStreetMap-Mitwirkende",
    manualSummary: "Ort nicht gefunden? Koordinaten manuell eingeben",
    locationLabel: "Bezeichnung des Ortes",
    manualLocationLabel: "Manuelle Ortsbezeichnung",
    latitude: "Breitengrad",
    manualLatitude: "Manueller Breitengrad",
    longitude: "Längengrad",
    manualLongitude: "Manueller Längengrad",
    timezoneExample: "IANA-Zeitzone, z. B. Europe/Berlin",
    manualTimezone: "Manuelle IANA-Zeitzone",
    useCoordinates: "Koordinaten verwenden",
    historicalTimezone: "Historische Zeitzone",
    timezonePlaceholder: "Ort wählen oder IANA-Zeitzone eingeben",
    timezoneHelp: "Der UTC-Versatz wird für das Geburtsdatum einschließlich historischer Sommerzeitregeln bestimmt.",
    resolvedAs: "Aufgelöst als {candidate}",
    occurredTwice: "Diese lokale Uhrzeit trat zweimal auf",
    occurrenceHelp: "Wähle das im Geburtsnachweis dokumentierte Vorkommen.",
    earlier: "Früher",
    later: "Später",
    generate: "Kundali erstellen",
  },
});

const wizardMessages = defineMessages({
  en: {
    step: "Step {current} of {total}",
    progress: "Birth-data progress",
    nameQuestion: "What should we call this Kundali?",
    nameHelp: "This name appears only in your chart and downloaded PDF.",
    genderQuestion: "How would you like to be addressed?",
    genderHelp: "Optional. Gender does not change the astronomical calculation.",
    choiceAdvances: "Choose an option to continue automatically.",
    preferNot: "Prefer not to say",
    dateQuestion: "When were you born?",
    dateHelp: "Use the date recorded on the birth certificate when available.",
    timeQuestion: "What time were you born?",
    timeHelp: "Do not guess. Lagna and Bhavas can change quickly; an uncertain time should be checked before relying on them.",
    knowSeconds: "I know the exact seconds",
    minutePrecision: "Minute precision",
    secondPrecision: "Second precision",
    placeQuestion: "Where were you born?",
    placeHelp: "Choose the matching place so latitude, longitude, and historical timezone can be resolved.",
    reviewQuestion: "Please confirm your birth details",
    reviewHelp: "The calculation starts only after you confirm. You can go back and correct any item.",
    back: "Back",
    continue: "Continue",
    change: "Change",
    optional: "Optional",
    nameSummary: "Name",
    genderSummary: "Addressing",
    dateSummary: "Date",
    timeSummary: "Time",
    placeSummary: "Place",
    privacy: "Calculation happens in your browser. Only the city search is sent to OpenStreetMap.",
  },
  hi: {
    step: "चरण {current} / {total}",
    progress: "जन्म-विवरण प्रगति",
    nameQuestion: "इस कुंडली को किस नाम से रखें?",
    nameHelp: "यह नाम केवल आपकी कुंडली और डाउनलोड की गई PDF में दिखेगा।",
    genderQuestion: "आपको किस प्रकार संबोधित किया जाए?",
    genderHelp: "वैकल्पिक। इससे खगोलीय गणना नहीं बदलती।",
    choiceAdvances: "विकल्प चुनते ही अगला चरण खुल जाएगा।",
    preferNot: "नहीं बताना चाहते",
    dateQuestion: "आपका जन्म कब हुआ?",
    dateHelp: "जहाँ संभव हो, जन्म प्रमाणपत्र में दर्ज तारीख उपयोग करें।",
    timeQuestion: "आपका जन्म किस समय हुआ?",
    timeHelp: "अनुमान न लगाएँ। लग्न और भाव जल्दी बदल सकते हैं; अनिश्चित समय पर निर्भर होने से पहले उसे जाँचें।",
    knowSeconds: "मुझे सटीक सेकंड पता हैं",
    minutePrecision: "मिनट तक सटीक",
    secondPrecision: "सेकंड तक सटीक",
    placeQuestion: "आपका जन्म कहाँ हुआ?",
    placeHelp: "सही स्थान चुनें ताकि अक्षांश, देशांतर और ऐतिहासिक समय-क्षेत्र मिल सके।",
    reviewQuestion: "कृपया जन्म-विवरण की पुष्टि करें",
    reviewHelp: "पुष्टि के बाद ही गणना शुरू होगी। किसी भी जानकारी को वापस जाकर बदल सकते हैं।",
    back: "पीछे",
    continue: "आगे",
    change: "बदलें",
    optional: "वैकल्पिक",
    nameSummary: "नाम",
    genderSummary: "संबोधन",
    dateSummary: "तारीख",
    timeSummary: "समय",
    placeSummary: "स्थान",
    privacy: "गणना आपके ब्राउज़र में होती है। केवल शहर की खोज OpenStreetMap को भेजी जाती है।",
  },
  mr: {
    step: "पायरी {current} / {total}",
    progress: "जन्ममाहिती प्रगती",
    nameQuestion: "या कुंडलीला कोणते नाव द्यायचे?",
    nameHelp: "हे नाव फक्त तुमच्या कुंडलीत आणि डाउनलोड केलेल्या PDF मध्ये दिसेल.",
    genderQuestion: "तुम्हाला कसे संबोधावे?",
    genderHelp: "ऐच्छिक. यामुळे खगोलीय गणना बदलत नाही.",
    choiceAdvances: "पर्याय निवडताच पुढची पायरी उघडेल.",
    preferNot: "सांगायचे नाही",
    dateQuestion: "तुमचा जन्म कधी झाला?",
    dateHelp: "शक्य असल्यास जन्मदाखल्यावरील तारीख वापरा.",
    timeQuestion: "तुमचा जन्म किती वाजता झाला?",
    timeHelp: "अंदाज लावू नका. लग्न आणि भाव वेगाने बदलू शकतात; अनिश्चित वेळेवर अवलंबून राहण्यापूर्वी ती तपासा.",
    knowSeconds: "मला अचूक सेकंद माहीत आहेत",
    minutePrecision: "मिनिटांपर्यंत अचूक",
    secondPrecision: "सेकंदांपर्यंत अचूक",
    placeQuestion: "तुमचा जन्म कुठे झाला?",
    placeHelp: "अक्षांश, रेखांश आणि ऐतिहासिक कालविभाग मिळण्यासाठी योग्य स्थळ निवडा.",
    reviewQuestion: "कृपया जन्ममाहिती निश्चित करा",
    reviewHelp: "निश्चित केल्यानंतरच गणना सुरू होईल. कोणतीही माहिती मागे जाऊन बदलता येते.",
    back: "मागे",
    continue: "पुढे",
    change: "बदला",
    optional: "ऐच्छिक",
    nameSummary: "नाव",
    genderSummary: "संबोधन",
    dateSummary: "तारीख",
    timeSummary: "वेळ",
    placeSummary: "स्थळ",
    privacy: "गणना तुमच्या ब्राउझरमध्ये होते. फक्त शहराचा शोध OpenStreetMap कडे पाठवला जातो.",
  },
  de: {
    step: "Schritt {current} von {total}",
    progress: "Fortschritt der Geburtsdaten",
    nameQuestion: "Wie sollen wir diese Kundali nennen?",
    nameHelp: "Der Name erscheint nur in deiner Kundali und der heruntergeladenen PDF.",
    genderQuestion: "Wie möchtest du angesprochen werden?",
    genderHelp: "Optional. Diese Angabe verändert die astronomische Berechnung nicht.",
    choiceAdvances: "Nach der Auswahl geht es automatisch weiter.",
    preferNot: "Keine Angabe",
    dateQuestion: "Wann wurdest du geboren?",
    dateHelp: "Verwende nach Möglichkeit das Datum aus der Geburtsurkunde.",
    timeQuestion: "Um welche Uhrzeit wurdest du geboren?",
    timeHelp: "Bitte nicht raten. Lagna und Bhavas können sich schnell ändern; eine unsichere Zeit sollte vor der Deutung geprüft werden.",
    knowSeconds: "Ich kenne die genauen Sekunden",
    minutePrecision: "Minutengenau",
    secondPrecision: "Sekundengenau",
    placeQuestion: "Wo wurdest du geboren?",
    placeHelp: "Wähle den passenden Ort, damit Koordinaten und historische Zeitzone bestimmt werden können.",
    reviewQuestion: "Bitte bestätige deine Geburtsdaten",
    reviewHelp: "Die Berechnung beginnt erst nach deiner Bestätigung. Du kannst jede Angabe vorher ändern.",
    back: "Zurück",
    continue: "Weiter",
    change: "Ändern",
    optional: "Optional",
    nameSummary: "Name",
    genderSummary: "Anrede",
    dateSummary: "Datum",
    timeSummary: "Zeit",
    placeSummary: "Ort",
    privacy: "Die Berechnung erfolgt in deinem Browser. Nur die Stadtanfrage wird an OpenStreetMap gesendet.",
  },
});

export type Gender = "male" | "female" | "other" | "unspecified";
export type TimeDisambiguation = "earlier" | "later";

export interface HoroscopeRequest {
  person: {
    fullName: string;
    gender: Gender;
  };
  birth: {
    localDate: string;
    localTime: string;
    timeZone: string;
    utcOffset: string;
    precision: "minute" | "second";
    disambiguation: "compatible" | TimeDisambiguation;
    instant: Date;
  };
  location: {
    label: string;
    latitude: number;
    longitude: number;
  };
  chartInput: ChartInput;
}

export interface BirthFormProps {
  isGenerating?: boolean;
  onGenerate(request: HoroscopeRequest): void;
}

interface SelectedPlace {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  timeZones: string[];
}

type FormErrors = Partial<
  Record<"fullName" | "gender" | "birthDate" | "birthTime" | "place" | "timeZone" | "form", string>
>;

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/50 focus:ring-2 focus:ring-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "text-sm font-medium text-slate-200";

function ErrorMessage({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 text-xs leading-5 text-rose-700 dark:text-rose-300"
    >
      {children}
    </p>
  );
}

function candidateLabel(candidate: CivilTimeCandidate): string {
  return `${candidate.offset} · ${candidate.instantIso.replace(".000Z", "Z")}`;
}

function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export default function BirthForm({ isGenerating = false, onGenerate }: BirthFormProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(messages);
  const tw = useScopedTranslations(wizardMessages);
  const listboxId = useId();
  const requestSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [showSeconds, setShowSeconds] = useState(false);
  const [step, setStep] = useState(0);
  const [placeQuery, setPlaceQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [timeZone, setTimeZone] = useState("");
  const [disambiguation, setDisambiguation] = useState<TimeDisambiguation | null>(null);
  const [activeResult, setActiveResult] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [manualLabel, setManualLabel] = useState("");
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [manualTimeZone, setManualTimeZone] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const totalSteps = 6;
  const normalizedBirthTime =
    birthTime.length === 5 ? `${birthTime}:00` : birthTime;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setErrors({});
      setSearchMessage("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [locale]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    [],
  );

  const civilTime = useMemo<
    { resolution: CivilTimeResolution | null; error: string | null }
  >(() => {
    if (!birthDate || !normalizedBirthTime || !timeZone.trim()) {
      return { resolution: null, error: null };
    }

    try {
      return {
        resolution: analyzeCivilTime({
          date: birthDate,
          time: normalizedBirthTime,
          timeZone: timeZone.trim(),
        }),
        error: null,
      };
    } catch {
      return {
        resolution: null,
        error: t("invalidLocalTime"),
      };
    }
  }, [birthDate, normalizedBirthTime, t, timeZone]);

  function validateStep(currentStep: number): boolean {
    const nextErrors: FormErrors = {};
    if (currentStep === 0) {
      const name = normalizeName(fullName);
      if (name.length < 1 || name.length > 100) {
        nextErrors.fullName = t("invalidName");
      }
    }
    if (currentStep === 2 && (!birthDate || birthDate > today)) {
      nextErrors.birthDate = t("invalidBirthDate");
    }
    if (
      currentStep === 3 &&
      !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(birthTime)
    ) {
      nextErrors.birthTime = t("birthTimeSeconds");
    }
    if (currentStep === 4) {
      if (!selectedPlace) nextErrors.place = t("missingPlace");
      if (!timeZone.trim()) nextErrors.timeZone = t("missingTimezone");
      if (civilTime.error) nextErrors.birthTime = t("invalidLocalTime");
      if (civilTime.resolution?.status === "nonexistent") {
        nextErrors.birthTime = t("nonexistentTime");
      }
      if (civilTime.resolution?.status === "ambiguous" && !disambiguation) {
        nextErrors.birthTime = t("chooseAmbiguous");
      }
      const chosen = selectedCandidate();
      if (!chosen.candidate && !nextErrors.birthTime) {
        nextErrors.birthTime = t("incompleteTime");
      }
      if (chosen.candidate && chosen.candidate.instant.getTime() > Date.now()) {
        nextErrors.birthDate = t("resolvedFuture");
      }
    }
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function focusStepHeading() {
    window.requestAnimationFrame(() => {
      document.getElementById("guided-birth-heading")?.focus();
    });
  }

  function advanceFrom(expectedStep: number) {
    setStep((current) =>
      current === expectedStep
        ? Math.min(totalSteps - 1, current + 1)
        : current,
    );
    focusStepHeading();
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step === 1 && !gender) setGender("unspecified");
    advanceFrom(step);
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
    focusStepHeading();
  }

  function clearFieldError(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function uniquePastCandidate(zone: string): CivilTimeCandidate | null {
    if (!zone || !birthDate || !normalizedBirthTime) return null;

    try {
      const resolution = analyzeCivilTime({
        date: birthDate,
        time: normalizedBirthTime,
        timeZone: zone,
      });
      return resolution.status === "unique" &&
        resolution.candidate.instant.getTime() <= Date.now()
        ? resolution.candidate
        : null;
    } catch {
      return null;
    }
  }

  function handlePlaceInput(value: string) {
    activeRequest.current?.abort();
    requestSequence.current += 1;
    setIsSearching(false);
    setPlaceQuery(value);
    setSelectedPlace(null);
    setTimeZone("");
    setDisambiguation(null);
    setResults([]);
    setActiveResult(-1);
    setSearchMessage("");
    clearFieldError("place");
  }

  function choosePlace(place: PlaceSearchResult) {
    activeRequest.current?.abort();
    requestSequence.current += 1;
    setIsSearching(false);
    const timeZones = place.timeZones ?? [];
    const selectedZone = timeZones.length === 1 ? timeZones[0] : "";
    setSelectedPlace({
      id: place.id,
      label: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      timeZones,
    });
    setPlaceQuery(place.label);
    setTimeZone(selectedZone || timeZones[0] || "");
    setDisambiguation(null);
    setResults([]);
    setActiveResult(-1);
    setSearchMessage(t("selectedPlace", { place: place.label }));
    clearFieldError("place");
    if (selectedZone && uniquePastCandidate(selectedZone)) advanceFrom(4);
  }

  async function searchPlaces() {
    const query = placeQuery.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (query.length < 3) {
      setErrors((current) => ({
        ...current,
        place: t("minSearch"),
      }));
      return;
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const sequence = ++requestSequence.current;
    setIsSearching(true);
    setResults([]);
    setActiveResult(-1);
    setSearchMessage(t("searching"));
    clearFieldError("place");

    try {
      const found = await requestPlaceSearch(query, controller.signal);

      if (sequence !== requestSequence.current) return;
      setResults(found);
      setSearchMessage(
        found.length === 0
          ? t("noPlaces")
          : found.length === 1
            ? t("onePlace")
            : t("manyPlaces", { count: found.length }),
      );
    } catch (reason) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return;
      // A malformed payload is worth naming; everything else — offline, rate
      // limited, upstream down — is the same thing to the person searching.
      const message =
        reason instanceof GeocodeServiceError && reason.kind === "invalid-response"
          ? t("invalidSearchResponse")
          : t("searchUnavailable");
      setErrors((current) => ({ ...current, place: message }));
      setSearchMessage(message);
    } finally {
      if (sequence === requestSequence.current) setIsSearching(false);
    }
  }

  function handlePlaceKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveResult((current) => (current + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveResult((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }
    if (event.key === "Escape") {
      setResults([]);
      setActiveResult(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeResult >= 0 && results[activeResult]) {
        choosePlace(results[activeResult]);
      } else {
        void searchPlaces();
      }
    }
  }

  function useManualCoordinates() {
    const latitudeText = manualLatitude.trim();
    const longitudeText = manualLongitude.trim();
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    const zone = manualTimeZone.trim();
    const label = normalizeName(manualLabel) || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    if (
      !latitudeText ||
      !Number.isFinite(latitude) ||
      latitude <= -90 ||
      latitude >= 90
    ) {
      setErrors((current) => ({ ...current, place: t("invalidLatitude") }));
      return;
    }
    if (
      !longitudeText ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setErrors((current) => ({ ...current, place: t("invalidLongitude") }));
      return;
    }
    if (!zone) {
      setErrors((current) => ({
        ...current,
        timeZone: t("missingManualTimezone"),
      }));
      return;
    }

    activeRequest.current?.abort();
    requestSequence.current += 1;
    setIsSearching(false);
    setSelectedPlace({
      id: "manual",
      label,
      latitude,
      longitude,
      timeZones: [zone],
    });
    setPlaceQuery(label);
    setTimeZone(zone);
    setDisambiguation(null);
    setResults([]);
    setSearchMessage(t("usingCoordinates", { place: label }));
    setErrors((current) => ({ ...current, place: undefined, timeZone: undefined }));
    if (uniquePastCandidate(zone)) advanceFrom(4);
  }

  function selectedCandidate(): {
    candidate: CivilTimeCandidate | null;
    disambiguation: "compatible" | TimeDisambiguation;
  } {
    const resolution = civilTime.resolution;
    if (!resolution) return { candidate: null, disambiguation: "compatible" };
    if (resolution.status === "unique") {
      return { candidate: resolution.candidate, disambiguation: "compatible" };
    }
    if (resolution.status === "ambiguous" && disambiguation) {
      return {
        candidate: disambiguation === "earlier" ? resolution.earlier : resolution.later,
        disambiguation,
      };
    }
    return { candidate: null, disambiguation: "compatible" };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const name = normalizeName(fullName);

    if (name.length < 1 || name.length > 100) {
      nextErrors.fullName = t("invalidName");
    }
    if (!birthDate || birthDate > today) {
      nextErrors.birthDate = t("invalidBirthDate");
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(birthTime)) {
      nextErrors.birthTime = t("birthTimeSeconds");
    }
    if (!selectedPlace) nextErrors.place = t("missingPlace");
    if (!timeZone.trim()) nextErrors.timeZone = t("missingTimezone");
    if (civilTime.error) nextErrors.birthTime = t("invalidLocalTime");
    if (civilTime.resolution?.status === "nonexistent") {
      nextErrors.birthTime = t("nonexistentTime");
    }
    if (civilTime.resolution?.status === "ambiguous" && !disambiguation) {
      nextErrors.birthTime = t("chooseAmbiguous");
    }

    const chosen = selectedCandidate();
    if (!chosen.candidate && !nextErrors.birthTime) {
      nextErrors.birthTime = t("incompleteTime");
    }
    if (chosen.candidate && chosen.candidate.instant.getTime() > Date.now()) {
      nextErrors.birthDate = t("resolvedFuture");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedPlace || !chosen.candidate) return;

    onGenerate({
      person: { fullName: name, gender: gender || "unspecified" },
      birth: {
        localDate: birthDate,
        localTime: normalizedBirthTime,
        timeZone: timeZone.trim(),
        utcOffset: chosen.candidate.offset,
        precision: showSeconds ? "second" : "minute",
        disambiguation: chosen.disambiguation,
        instant: chosen.candidate.instant,
      },
      location: {
        label: selectedPlace.label,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      },
      chartInput: {
        instant: chosen.candidate.instant,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      },
    });
  }

  const activeDescendant = activeResult >= 0 ? `${listboxId}-option-${activeResult}` : undefined;
  const ambiguousTime =
    civilTime.resolution?.status === "ambiguous"
      ? civilTime.resolution
      : null;
  const stepCopy = [
    [tw("nameQuestion"), tw("nameHelp")],
    [tw("genderQuestion"), tw("genderHelp")],
    [tw("dateQuestion"), tw("dateHelp")],
    [tw("timeQuestion"), tw("timeHelp")],
    [tw("placeQuestion"), tw("placeHelp")],
    [tw("reviewQuestion"), tw("reviewHelp")],
  ] as const;
  const genderLabel =
    gender === "unspecified"
      ? tw("preferNot")
      : gender
        ? t(gender)
        : tw("preferNot");

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          step < totalSteps - 1 &&
          !event.defaultPrevented &&
          !(event.target instanceof HTMLButtonElement)
        ) {
          event.preventDefault();
          goNext();
        }
      }}
      className="space-y-6"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Compass aria-hidden="true" className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">
              {t("birthCoordinates")}
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--muted)]">
            {tw("step", { current: step + 1, total: totalSteps })}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={tw("progress")}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={step + 1}
          className="mt-4 grid grid-cols-6 gap-1.5"
        >
          {Array.from({ length: totalSteps }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition ${
                index <= step ? "bg-violet-600" : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>
        <h2
          id="guided-birth-heading"
          tabIndex={-1}
          className="mt-5 text-2xl font-semibold text-[var(--foreground)] outline-none"
        >
          {stepCopy[step][0]}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {stepCopy[step][1]}
        </p>
      </div>

      {step === 0 ? <div>
        <label htmlFor="full-name" className={labelClass}>
          <span className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-4 text-slate-500" />
            {t("fullName")}
          </span>
        </label>
        <input
          id="full-name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            clearFieldError("fullName");
          }}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "full-name-error" : undefined}
          placeholder={t("namePlaceholder")}
          className={inputClass}
        />
        <ErrorMessage id="full-name-error">{errors.fullName}</ErrorMessage>
      </div> : null}

      {step === 1 ? <fieldset
        aria-invalid={Boolean(errors.gender)}
        aria-describedby={errors.gender ? "gender-error" : undefined}
      >
        <legend className={`${labelClass} flex items-center gap-2`}>
          {t("gender")}
          <span className="text-xs font-normal text-[var(--muted)]">
            · {tw("optional")}
          </span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["male", t("male")],
              ["female", t("female")],
              ["other", t("other")],
              ["unspecified", tw("preferNot")],
            ] as const
          ).map(([option, label]) => (
            <button
              key={option}
              type="button"
              aria-pressed={gender === option}
              onClick={() => {
                setGender(option);
                clearFieldError("gender");
                advanceFrom(1);
              }}
              className={`rounded-xl border px-3 py-2.5 text-center text-sm capitalize transition focus-within:ring-2 focus-within:ring-violet-300/60 focus-within:ring-offset-2 focus-within:ring-offset-[#0d0f1d] ${
                gender === option
                  ? "border-violet-300/50 bg-violet-400/15 text-white"
                  : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          {tw("choiceAdvances")}
        </p>
        <ErrorMessage id="gender-error">{errors.gender}</ErrorMessage>
      </fieldset> : null}

      {step === 2 ? (
        <div>
          <label htmlFor="birth-date" className={labelClass}>
            <span className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 text-slate-500" />
              {t("dateOfBirth")}
            </span>
          </label>
          <input
            id="birth-date"
            type="date"
            max={today}
            value={birthDate}
            onChange={(event) => {
              const value = event.target.value;
              setBirthDate(value);
              setDisambiguation(null);
              clearFieldError("birthDate");
              if (value && value <= today) advanceFrom(2);
            }}
            aria-invalid={Boolean(errors.birthDate)}
            aria-describedby={errors.birthDate ? "birth-date-error" : undefined}
            className={inputClass}
          />
          <ErrorMessage id="birth-date-error">{errors.birthDate}</ErrorMessage>
        </div>
      ) : null}
      {step === 3 ? (
        <div>
          <label htmlFor="birth-time" className={labelClass}>
            <span className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-slate-500" />
              {t("timeOfBirth")}
            </span>
          </label>
          <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={showSeconds}
              onChange={(event) => {
                const enabled = event.target.checked;
                setShowSeconds(enabled);
                setBirthTime((current) =>
                  enabled && current.length === 5
                    ? `${current}:00`
                    : !enabled && current.length === 8
                      ? current.slice(0, 5)
                      : current,
                );
              }}
            />
            <span>
              <span className="block font-medium">{tw("knowSeconds")}</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                {showSeconds ? tw("secondPrecision") : tw("minutePrecision")}
              </span>
            </span>
          </label>
          <input
            id="birth-time"
            type="time"
            step={showSeconds ? 1 : 60}
            value={birthTime}
            onChange={(event) => {
              const value = event.target.value;
              setBirthTime(value);
              setDisambiguation(null);
              clearFieldError("birthTime");
              const isComplete = showSeconds
                ? /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)
                : /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
              if (isComplete) advanceFrom(3);
            }}
            aria-invalid={Boolean(errors.birthTime)}
            aria-describedby={errors.birthTime ? "birth-time-error" : undefined}
            className={inputClass}
          />
          <ErrorMessage id="birth-time-error">{errors.birthTime}</ErrorMessage>
        </div>
      ) : null}

      {step === 4 ? <div className="space-y-5">
      <div>
        <label htmlFor="place-search" className={labelClass}>
          <span className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 text-slate-500" />
            {t("placeOfBirth")}
          </span>
        </label>
        <div className="relative mt-2">
          <div className="flex gap-2">
            <input
              id="place-search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={activeDescendant}
              aria-invalid={Boolean(errors.place)}
              aria-describedby={errors.place ? "place-search-status place-error" : "place-search-status"}
              value={placeQuery}
              onChange={(event) => handlePlaceInput(event.target.value)}
              onKeyDown={handlePlaceKeyDown}
              placeholder={t("placePlaceholder")}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/50 focus:ring-2 focus:ring-violet-400/15"
            />
            <button
              type="button"
              onClick={() => void searchPlaces()}
              disabled={isSearching}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {isSearching ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />}
              {t("search")}
            </button>
          </div>

          {results.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t("searchResults")}
              className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#151827] p-1.5 shadow-2xl shadow-black/60"
            >
              {results.map((place, index) => (
                <li
                  id={`${listboxId}-option-${index}`}
                  key={place.id}
                  role="option"
                  aria-selected={index === activeResult}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choosePlace(place)}
                  className={`cursor-pointer rounded-lg px-3 py-3 text-left transition ${
                    index === activeResult ? "bg-violet-400/15" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="block text-sm text-white">{place.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                    {place.timeZones?.[0] ? ` · ${place.timeZones[0]}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p id="place-search-status" aria-live="polite" className="mt-2 text-xs leading-5 text-slate-500">
          {searchMessage || t("searchHelp")}
        </p>
        <ErrorMessage id="place-error">{errors.place}</ErrorMessage>

        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs text-slate-500 underline decoration-slate-700 underline-offset-4 transition hover:text-slate-300"
        >
          {t("osmAttribution")}
        </a>

        <details className="mt-3 rounded-xl border border-white/[0.08] bg-black/10 p-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-400">
            {t("manualSummary")}
          </summary>
          <div className="mt-4 space-y-3">
            <input
              value={manualLabel}
              onChange={(event) => setManualLabel(event.target.value)}
              placeholder={t("locationLabel")}
              aria-label={t("manualLocationLabel")}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={manualLatitude}
                onChange={(event) => setManualLatitude(event.target.value)}
                inputMode="decimal"
                placeholder={t("latitude")}
                aria-label={t("manualLatitude")}
                className={inputClass}
              />
              <input
                value={manualLongitude}
                onChange={(event) => setManualLongitude(event.target.value)}
                inputMode="decimal"
                placeholder={t("longitude")}
                aria-label={t("manualLongitude")}
                className={inputClass}
              />
            </div>
            <input
              value={manualTimeZone}
              onChange={(event) => setManualTimeZone(event.target.value)}
              placeholder={t("timezoneExample")}
              aria-label={t("manualTimezone")}
              className={inputClass}
            />
            <button type="button" onClick={useManualCoordinates} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white hover:bg-white/10">
              <LocateFixed aria-hidden="true" className="size-3.5" />{" "}
              {t("useCoordinates")}
            </button>
          </div>
        </details>
      </div>

      {selectedPlace ? (
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3.5">
          <div className="flex items-start gap-3">
            <LocateFixed
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-100">
                {selectedPlace.label}
              </p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-100/60">
                {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="time-zone" className={labelClass}>
          {t("historicalTimezone")}
        </label>
        <input
          id="time-zone"
          list="detected-timezones"
          value={timeZone}
          onChange={(event) => {
            setTimeZone(event.target.value);
            setDisambiguation(null);
            clearFieldError("timeZone");
          }}
          placeholder={t("timezonePlaceholder")}
          aria-invalid={Boolean(errors.timeZone)}
          aria-describedby={errors.timeZone ? "timezone-help time-zone-error" : "timezone-help"}
          className={inputClass}
        />
        <datalist id="detected-timezones">
          {selectedPlace?.timeZones.map((zone) => <option key={zone} value={zone} />)}
        </datalist>
        <p id="timezone-help" className="mt-2 text-xs leading-5 text-slate-500">
          {t("timezoneHelp")}
        </p>
        <ErrorMessage id="time-zone-error">{errors.timeZone}</ErrorMessage>
      </div>

      {civilTime.resolution?.status === "unique" ? (
        <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-3.5 py-3 text-xs text-sky-800 dark:text-sky-100/80">
          {t("resolvedAs", {
            candidate: candidateLabel(civilTime.resolution.candidate),
          })}
        </div>
      ) : null}

      {ambiguousTime ? (
        <fieldset className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3.5">
          <legend className="px-1 text-xs font-medium text-amber-800 dark:text-amber-200">
            {t("occurredTwice")}
          </legend>
          <p className="mb-3 text-xs leading-5 text-amber-800 dark:text-amber-100/60">
            {t("occurrenceHelp")}
          </p>
          <div className="space-y-2">
            {(["earlier", "later"] as const).map((choice) => {
              const candidate = ambiguousTime[choice];
              return (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={disambiguation === choice}
                  onClick={() => {
                    setDisambiguation(choice);
                    clearFieldError("birthTime");
                    if (candidate.instant.getTime() > Date.now()) {
                      setErrors((current) => ({
                        ...current,
                        birthDate: t("resolvedFuture"),
                      }));
                      return;
                    }
                    advanceFrom(4);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left text-xs transition ${
                    disambiguation === choice
                      ? "border-violet-400/45 bg-violet-400/12 text-violet-900 dark:text-violet-100"
                      : "border-white/10 bg-black/15 text-slate-200 hover:border-violet-400/30"
                  }`}
                >
                  <span>{t(choice)}</span>
                  <span className="text-slate-500">{candidateLabel(candidate)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {civilTime.resolution?.status === "nonexistent" ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-700 dark:text-rose-200"
        >
          {t("nonexistentTime")}
        </div>
      ) : null}

      {civilTime.error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-700 dark:text-rose-200"
        >
          {t("invalidLocalTime")}
        </div>
      ) : null}
      </div> : null}

      {step === 5 ? (
        <div className="space-y-3">
          {[
            [tw("nameSummary"), fullName, 0],
            [tw("genderSummary"), genderLabel, 1],
            [tw("dateSummary"), birthDate, 2],
            [
              tw("timeSummary"),
              `${normalizedBirthTime} · ${
                showSeconds ? tw("secondPrecision") : tw("minutePrecision")
              }`,
              3,
            ],
            [
              tw("placeSummary"),
              selectedPlace
                ? `${selectedPlace.label} · ${timeZone}`
                : t("missingPlace"),
              4,
            ],
          ].map(([label, value, target]) => (
            <div
              key={String(label)}
              className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {String(label)}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">
                  {String(value)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(Number(target))}
                className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--accent)]"
              >
                {tw("change")}
              </button>
            </div>
          ))}
          <p className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.055] p-3 text-xs leading-5 text-[var(--muted)]">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            {tw("privacy")}
          </p>
        </div>
      ) : null}

      <ErrorMessage id="form-error">{errors.form}</ErrorMessage>

      <div className="flex gap-2 border-t border-[var(--border)] pt-5">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm font-semibold text-[var(--foreground)]"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {tw("back")}
          </button>
        ) : null}
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="group flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:brightness-110"
          >
            {tw("continue")}
            <ChevronRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isGenerating}
            className="group flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {isGenerating ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
            {t("generate")}
            <ChevronRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </form>
  );
}
