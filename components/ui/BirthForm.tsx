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
  CalendarDays,
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
});

export type Gender = "male" | "female" | "other";
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
  const listboxId = useId();
  const requestSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00:00");
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setErrors({});
      setSearchMessage("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [locale]);

  const civilTime = useMemo<
    { resolution: CivilTimeResolution | null; error: string | null }
  >(() => {
    if (!birthDate || !birthTime || !timeZone.trim()) {
      return { resolution: null, error: null };
    }

    try {
      return {
        resolution: analyzeCivilTime({
          date: birthDate,
          time: birthTime,
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
  }, [birthDate, birthTime, t, timeZone]);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function handlePlaceInput(value: string) {
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
    const timeZones = place.timeZones ?? [];
    setSelectedPlace({
      id: place.id,
      label: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      timeZones,
    });
    setPlaceQuery(place.label);
    setTimeZone(timeZones[0] ?? "");
    setDisambiguation(null);
    setResults([]);
    setActiveResult(-1);
    setSearchMessage(t("selectedPlace", { place: place.label }));
    clearFieldError("place");
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
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      const payload = (await response.json()) as
        | PlaceSearchResponse
        | GeocodeErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in payload
            ? t("searchUnavailable")
            : t("searchUnavailable"),
        );
      }

      if (!("results" in payload)) {
        throw new Error(t("invalidSearchResponse"));
      }

      if (sequence !== requestSequence.current) return;
      setResults(payload.results);
      setSearchMessage(
        payload.results.length === 0
          ? t("noPlaces")
          : payload.results.length === 1
            ? t("onePlace")
            : t("manyPlaces", { count: payload.results.length }),
      );
    } catch (reason) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return;
      const message =
        reason instanceof Error &&
        reason.message === t("invalidSearchResponse")
          ? reason.message
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
    const latitude = Number(manualLatitude);
    const longitude = Number(manualLongitude);
    const zone = manualTimeZone.trim();
    const label = normalizeName(manualLabel) || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    if (!Number.isFinite(latitude) || latitude <= -90 || latitude >= 90) {
      setErrors((current) => ({ ...current, place: t("invalidLatitude") }));
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
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
    if (!gender) nextErrors.gender = t("missingGender");
    if (!birthDate || birthDate > today) {
      nextErrors.birthDate = t("invalidBirthDate");
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(birthTime)) {
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
    if (Object.keys(nextErrors).length > 0 || !gender || !selectedPlace || !chosen.candidate) return;

    onGenerate({
      person: { fullName: name, gender },
      birth: {
        localDate: birthDate,
        localTime: birthTime,
        timeZone: timeZone.trim(),
        utcOffset: chosen.candidate.offset,
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

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
          <Compass aria-hidden="true" className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em]">
            {t("birthCoordinates")}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">{t("title")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {t("intro")}
        </p>
      </div>

      <div>
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
      </div>

      <fieldset
        aria-invalid={Boolean(errors.gender)}
        aria-describedby={errors.gender ? "gender-error" : undefined}
      >
        <legend className={labelClass}>{t("gender")}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["male", "female", "other"] as const).map((option) => (
            <label
              key={option}
              className={`rounded-xl border px-3 py-2.5 text-center text-sm capitalize transition focus-within:ring-2 focus-within:ring-violet-300/60 focus-within:ring-offset-2 focus-within:ring-offset-[#0d0f1d] ${
                gender === option
                  ? "border-violet-300/50 bg-violet-400/15 text-white"
                  : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={option}
                checked={gender === option}
                onChange={() => {
                  setGender(option);
                  clearFieldError("gender");
                }}
                className="sr-only"
              />
              {t(option)}
            </label>
          ))}
        </div>
        <ErrorMessage id="gender-error">{errors.gender}</ErrorMessage>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
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
              setBirthDate(event.target.value);
              setDisambiguation(null);
              clearFieldError("birthDate");
            }}
            aria-invalid={Boolean(errors.birthDate)}
            aria-describedby={errors.birthDate ? "birth-date-error" : undefined}
            className={inputClass}
          />
          <ErrorMessage id="birth-date-error">{errors.birthDate}</ErrorMessage>
        </div>
        <div>
          <label htmlFor="birth-time" className={labelClass}>
            <span className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-slate-500" />
              {t("timeOfBirth")}
            </span>
          </label>
          <input
            id="birth-time"
            type="time"
            step="1"
            value={birthTime}
            onChange={(event) => {
              setBirthTime(event.target.value);
              setDisambiguation(null);
              clearFieldError("birthTime");
            }}
            aria-invalid={Boolean(errors.birthTime)}
            aria-describedby={errors.birthTime ? "birth-time-error" : undefined}
            className={inputClass}
          />
          <ErrorMessage id="birth-time-error">{errors.birthTime}</ErrorMessage>
        </div>
      </div>

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
                <label key={choice} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/15 p-2.5 text-xs text-slate-200">
                  <input type="radio" name="time-disambiguation" checked={disambiguation === choice} onChange={() => setDisambiguation(choice)} />
                  <span>{t(choice)}</span>
                  <span className="text-slate-500">{candidateLabel(candidate)}</span>
                </label>
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

      <ErrorMessage id="form-error">{errors.form}</ErrorMessage>

      <button
        type="submit"
        disabled={isGenerating}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      >
        {isGenerating ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
        {t("generate")}
        <ChevronRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
