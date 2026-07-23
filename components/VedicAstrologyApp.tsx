"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ArrowDown,
  BookOpenText,
  CircleDot,
  Orbit,
  Pencil,
  Sparkles,
  Telescope,
} from "lucide-react";

import InterpretationPanel from "@/components/analysis/InterpretationPanel";
import ChartWorkspace from "@/components/dashboard/ChartWorkspace";
import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import AppPreferencesControls from "@/components/ui/AppPreferencesControls";
import BirthForm, {
  type HoroscopeRequest,
} from "@/components/ui/BirthForm";
import TimeNavigator from "@/components/ui/TimeNavigator";
import {
  calculateVedicChart,
  type GrahaId,
  type GrahaPosition,
  type HouseNumber,
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

const messages = defineMessages({
  en: {
    loadingWebgl: "Initializing WebGL observatory",
    featureSphereTitle: "3D celestial sphere",
    featureSphereBody: "Orbit the geocentric sky and select every graha.",
    featureChartsTitle: "Dual Vedic charts",
    featureChartsBody: "Switch between North and South Indian Rasi layouts.",
    featureAnalysisTitle: "Jyotish analysis",
    featureAnalysisBody:
      "Explore Bhavas, Nakshatras, traits, and Vimshottari Dashas.",
    interactiveObservatory: "Interactive observatory",
    landingTitle: "One birth moment, viewed from every angle.",
    landingBody:
      "Generate the natal chart first. The complete celestial workspace will then open with synchronized 3D, SVG, and interpretation views.",
    retrogradeShort: "R",
    selectedPlanetDetail: "{rasi} {degrees} · {nakshatra} Pada {pada} · Bhava {house}",
    clearSelection: "Clear selection",
    calculateError: "Unable to calculate this horoscope. Check the entered birth data.",
    instantError: "Unable to calculate the selected instant.",
    brand: "Jyotish Observatory",
    title: "Map the sky at the moment you arrived.",
    subtitle:
      "Explore a Lahiri sidereal horoscope through a live geocentric cosmos, traditional charts, and a transparent rule-based analysis engine.",
    ready: "Full observatory · Ready",
    birthEntry: "Birth data entry",
    updateTitle: "Update the natal foundation",
    updateBody:
      "Generating again replaces the natal chart, resets the time navigator, and recalculates every visualization and interpretation.",
    returnObservatory: "Return to observatory",
    generated: "Natal chart generated",
    bornAt: "{place} · {date} at {time}",
    editBirth: "Edit birth data",
    displayedPositions: "Displayed positions · {moment}",
    natalMoment: "Natal moment",
    simulatedInstant: "Simulated instant",
    ascendant: "Lagna",
    sun: "Surya",
    moon: "Chandra",
    planetSun: "Surya",
    planetMoon: "Chandra",
    planetMercury: "Budha",
    planetVenus: "Shukra",
    planetMars: "Mangala",
    planetJupiter: "Guru",
    planetSaturn: "Shani",
    planetRahu: "Rahu",
    planetKetu: "Ketu",
    corePada: "{nakshatra} Pada {pada}",
    coreNakshatra: "{nakshatra} · Bhava {house}",
    coreNakshatraPada: "{nakshatra} Pada {pada} · Bhava {house}",
    webglSphere: "WebGL celestial sphere",
    geocentricCosmos: "Geocentric cosmos",
    simulatedSky: "Simulated sky",
    natalInterpretation: "Natal Jyotish interpretation",
    methodology: "Lahiri ayanamsa · mean nodes · whole-sign Bhavas",
    accuracy:
      "Astronomy Engine target: about 1 arcminute · custom sidereal boundaries may differ",
  },
  hi: {
    loadingWebgl: "WebGL वेधशाला आरंभ हो रही है",
    featureSphereTitle: "3D खगोलीय गोला",
    featureSphereBody: "भूकेन्द्रीय आकाश को घुमाएँ और प्रत्येक ग्रह चुनें।",
    featureChartsTitle: "दो वैदिक कुण्डली शैलियाँ",
    featureChartsBody: "उत्तर और दक्षिण भारतीय राशि विन्यास बदलें।",
    featureAnalysisTitle: "ज्योतिष विश्लेषण",
    featureAnalysisBody: "भाव, नक्षत्र, प्रवृत्तियाँ और विंशोत्तरी दशाएँ देखें।",
    interactiveObservatory: "संवादात्मक वेधशाला",
    landingTitle: "जन्म के एक क्षण को हर कोण से देखें।",
    landingBody:
      "पहले जन्म कुण्डली बनाएँ। फिर समन्वित 3D, SVG और व्याख्या दृश्यों सहित पूरा खगोलीय कार्यक्षेत्र खुलेगा।",
    retrogradeShort: "व",
    selectedPlanetDetail: "{rasi} {degrees} · {nakshatra} पाद {pada} · भाव {house}",
    clearSelection: "चयन हटाएँ",
    calculateError: "कुण्डली की गणना नहीं हो सकी। दर्ज जन्म विवरण जाँचें।",
    instantError: "चुने हुए क्षण की गणना नहीं हो सकी।",
    brand: "ज्योतिष वेधशाला",
    title: "आपके जन्म-क्षण के आकाश का मानचित्र बनाएँ।",
    subtitle:
      "सजीव भूकेन्द्रीय ब्रह्माण्ड, पारंपरिक कुण्डलियों और पारदर्शी नियम-आधारित विश्लेषण द्वारा लाहिरी निरयन कुण्डली देखें।",
    ready: "पूर्ण वेधशाला · तैयार",
    birthEntry: "जन्म विवरण प्रविष्टि",
    updateTitle: "जन्म कुण्डली का आधार बदलें",
    updateBody:
      "दोबारा बनाने पर जन्म कुण्डली बदलेगी, समय-संचालक रीसेट होगा और हर दृश्य व व्याख्या की पुनर्गणना होगी।",
    returnObservatory: "वेधशाला पर लौटें",
    generated: "जन्म कुण्डली तैयार",
    bornAt: "{place} · {date}, {time} बजे",
    editBirth: "जन्म विवरण बदलें",
    displayedPositions: "प्रदर्शित स्थितियाँ · {moment}",
    natalMoment: "जन्म क्षण",
    simulatedInstant: "अनुकृत क्षण",
    ascendant: "लग्न",
    sun: "सूर्य",
    moon: "चन्द्र",
    planetSun: "सूर्य",
    planetMoon: "चन्द्र",
    planetMercury: "बुध",
    planetVenus: "शुक्र",
    planetMars: "मंगल",
    planetJupiter: "गुरु",
    planetSaturn: "शनि",
    planetRahu: "राहु",
    planetKetu: "केतु",
    corePada: "{nakshatra} पाद {pada}",
    coreNakshatra: "{nakshatra} · भाव {house}",
    coreNakshatraPada: "{nakshatra} पाद {pada} · भाव {house}",
    webglSphere: "WebGL खगोलीय गोला",
    geocentricCosmos: "भूकेन्द्रीय ब्रह्माण्ड",
    simulatedSky: "अनुकृत आकाश",
    natalInterpretation: "जन्म ज्योतिष व्याख्या",
    methodology: "लाहिरी अयनांश · माध्य पात · पूर्ण-राशि भाव",
    accuracy:
      "Astronomy Engine लक्ष्य: लगभग 1 चाप-मिनट · कस्टम निरयन सीमाएँ बदल सकती हैं",
  },
  mr: {
    loadingWebgl: "WebGL वेधशाळा सुरू होत आहे",
    featureSphereTitle: "3D खगोलीय गोल",
    featureSphereBody: "भूकेंद्री आकाश फिरवा आणि प्रत्येक ग्रह निवडा.",
    featureChartsTitle: "दोन वैदिक कुंडली शैली",
    featureChartsBody: "उत्तर व दक्षिण भारतीय राशी मांडणी बदला.",
    featureAnalysisTitle: "ज्योतिष विश्लेषण",
    featureAnalysisBody: "भाव, नक्षत्रे, प्रवृत्ती आणि विंशोत्तरी दशा पाहा.",
    interactiveObservatory: "परस्परसंवादी वेधशाळा",
    landingTitle: "जन्माचा एक क्षण प्रत्येक कोनातून पाहा.",
    landingBody:
      "आधी जन्मकुंडली तयार करा. नंतर समक्रमित 3D, SVG आणि अर्थनिर्णय दृश्यांसह संपूर्ण खगोलीय कार्यक्षेत्र उघडेल.",
    retrogradeShort: "व",
    selectedPlanetDetail: "{rasi} {degrees} · {nakshatra} पाद {pada} · भाव {house}",
    clearSelection: "निवड काढा",
    calculateError: "कुंडलीची गणना करता आली नाही. भरलेली जन्ममाहिती तपासा.",
    instantError: "निवडलेल्या क्षणाची गणना करता आली नाही.",
    brand: "ज्योतिष वेधशाळा",
    title: "तुमच्या जन्मक्षणातील आकाशाचा नकाशा पाहा.",
    subtitle:
      "सजीव भूकेंद्री ब्रह्मांड, पारंपरिक कुंडल्या आणि पारदर्शक नियमाधारित विश्लेषणातून लाहिरी निरयन कुंडली पाहा.",
    ready: "संपूर्ण वेधशाळा · तयार",
    birthEntry: "जन्ममाहिती नोंद",
    updateTitle: "जन्मकुंडलीचा पाया बदला",
    updateBody:
      "पुन्हा तयार केल्यास जन्मकुंडली बदलेल, कालसंचालक रीसेट होईल आणि प्रत्येक दृश्य व अर्थनिर्णय पुन्हा मोजला जाईल.",
    returnObservatory: "वेधशाळेत परत जा",
    generated: "जन्मकुंडली तयार",
    bornAt: "{place} · {date}, {time} वाजता",
    editBirth: "जन्ममाहिती बदला",
    displayedPositions: "दर्शवलेल्या स्थिती · {moment}",
    natalMoment: "जन्म क्षण",
    simulatedInstant: "अनुकृत क्षण",
    ascendant: "लग्न",
    sun: "सूर्य",
    moon: "चंद्र",
    planetSun: "सूर्य",
    planetMoon: "चंद्र",
    planetMercury: "बुध",
    planetVenus: "शुक्र",
    planetMars: "मंगळ",
    planetJupiter: "गुरु",
    planetSaturn: "शनि",
    planetRahu: "राहू",
    planetKetu: "केतू",
    corePada: "{nakshatra} पाद {pada}",
    coreNakshatra: "{nakshatra} · भाव {house}",
    coreNakshatraPada: "{nakshatra} पाद {pada} · भाव {house}",
    webglSphere: "WebGL खगोलीय गोल",
    geocentricCosmos: "भूकेंद्री ब्रह्मांड",
    simulatedSky: "अनुकृत आकाश",
    natalInterpretation: "जन्म ज्योतिष अर्थनिर्णय",
    methodology: "लाहिरी अयनांश · मध्यम पात · पूर्ण-राशी भाव",
    accuracy:
      "Astronomy Engine लक्ष्य: सुमारे 1 चाप-मिनिट · कस्टम निरयन सीमा बदलू शकतात",
  },
});

function CelestialLoading() {
  const t = useScopedTranslations(messages);
  return (
    <div className="grid min-h-[620px] place-items-center rounded-[28px] border border-white/10 bg-[#050611] text-center">
      <div>
        <Orbit
          aria-hidden="true"
          className="mx-auto size-9 animate-spin text-violet-700 dark:text-violet-300"
        />
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
          {t("loadingWebgl")}
        </p>
      </div>
    </div>
  );
}

const CelestialSphere = dynamic(
  () => import("@/components/3d/CelestialSphere"),
  {
    ssr: false,
    loading: () => <CelestialLoading />,
  },
);

function formatDegrees(value: number, locale: AppLocale): string {
  const degrees = Math.floor(value);
  const minutes = Math.floor((value - degrees) * 60);
  return `${degrees.toLocaleString(INTL_LOCALES[locale], {
    useGrouping: false,
  })}° ${minutes.toLocaleString(INTL_LOCALES[locale], {
    minimumIntegerDigits: 2,
    useGrouping: false,
  })}′`;
}

function CoreStat({
  label,
  sign,
  degrees,
  detail,
  accent = false,
}: {
  label: string;
  sign: string;
  degrees: number;
  detail: string;
  accent?: boolean;
}) {
  const { locale } = useAppPreferences();
  return (
    <article
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-amber-300/20 bg-amber-300/[0.055]"
          : "border-white/[0.08] bg-white/[0.025]"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
          accent
            ? "text-amber-800 dark:text-amber-200/70"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="text-lg font-semibold text-white">{sign}</p>
        <p className="text-xs text-slate-500">
          {formatDegrees(degrees, locale)}
        </p>
      </div>
      <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>
    </article>
  );
}

function LandingPreview() {
  const t = useScopedTranslations(messages);
  const features = [
    [t("featureSphereTitle"), t("featureSphereBody")],
    [t("featureChartsTitle"), t("featureChartsBody")],
    [t("featureAnalysisTitle"), t("featureAnalysisBody")],
  ] as const;

  return (
    <div className="relative min-h-[640px] overflow-hidden rounded-[28px] border border-white/10 bg-[#080a17]/85 p-6 sm:p-8">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[42%] size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/10" />
        <div className="absolute left-1/2 top-[42%] size-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/15" />
        <div className="absolute left-1/2 top-[42%] size-[13rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/15" />
        <div className="absolute left-1/2 top-[42%] size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 shadow-[0_0_80px_rgba(56,189,248,0.3)]" />
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="absolute size-1 rounded-full bg-white/70"
            style={{
              left: `${8 + ((index * 37) % 85)}%`,
              top: `${6 + ((index * 53) % 84)}%`,
              opacity: 0.25 + (index % 4) * 0.15,
            }}
          />
        ))}
      </div>

      <div className="relative flex min-h-[580px] flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
            <Telescope aria-hidden="true" className="size-3.5" />
            {t("interactiveObservatory")}
          </div>
          <h2 className="mt-5 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("landingTitle")}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
            {t("landingBody")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {features.map(([title, description], index) => (
            <article
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 backdrop-blur-sm"
            >
              <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300/70">
                0{index + 1}
              </span>
              <h3 className="mt-2 text-sm font-medium text-white">{title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function SelectedPlanetStrip({
  planet,
  onClear,
}: {
  planet: GrahaPosition | null;
  onClear(): void;
}) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(messages);
  if (!planet) return null;
  const grahaName = getLocalizedGrahaName(planet.id, locale);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-300/15 bg-violet-400/[0.055] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-violet-400/15 text-sm font-semibold text-violet-800 dark:text-violet-100">
          {grahaName.slice(0, 2)}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">
            {grahaName}
            {planet.retrograde ? ` (${t("retrogradeShort")})` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {t("selectedPlanetDetail", {
              rasi: getLocalizedRasiName(planet.sign.name, locale),
              degrees: formatDegrees(planet.sign.degreeDeg, locale),
              nakshatra: getLocalizedNakshatraName(
                planet.nakshatra.name,
                locale,
              ),
              pada: planet.nakshatra.pada,
              house: planet.house,
            })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
      >
        {t("clearSelection")}
      </button>
    </div>
  );
}

export default function VedicAstrologyApp() {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(messages);
  const [request, setRequest] = useState<HoroscopeRequest | null>(null);
  const [natalChart, setNatalChart] = useState<VedicChart | null>(null);
  const [displayChart, setDisplayChart] = useState<VedicChart | null>(null);
  const [selectedInstant, setSelectedInstant] = useState<Date | null>(null);
  const [analysisAsOf, setAnalysisAsOf] = useState<Date | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<GrahaId | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<HouseNumber | null>(null);
  const [showBirthForm, setShowBirthForm] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const simulationFrame = useRef<number | null>(null);
  const pendingSimulationInstant = useRef<Date | null>(null);

  useEffect(() => {
    if (!natalChart) return;
    const timer = window.setInterval(() => setAnalysisAsOf(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [natalChart]);

  useEffect(
    () => () => {
      if (simulationFrame.current !== null) {
        window.cancelAnimationFrame(simulationFrame.current);
      }
    },
    [],
  );

  const handleGenerate = useCallback((nextRequest: HoroscopeRequest) => {
    setError(null);
    startTransition(() => {
      try {
        const nextChart = calculateVedicChart(nextRequest.chartInput);
        setRequest(nextRequest);
        setNatalChart(nextChart);
        setDisplayChart(nextChart);
        setSelectedInstant(new Date(nextRequest.birth.instant));
        setAnalysisAsOf(new Date());
        setSelectedPlanetId(null);
        setSelectedHouse(1);
        setShowBirthForm(false);
        window.requestAnimationFrame(() => {
          document.getElementById("observatory")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      } catch (reason) {
        console.error(reason);
        setError(t("calculateError"));
      }
    });
  }, [t]);

  const handleTimeChange = useCallback(
    (instant: Date) => {
      if (!request) return;
      pendingSimulationInstant.current = instant;
      if (simulationFrame.current !== null) return;

      simulationFrame.current = window.requestAnimationFrame(() => {
        simulationFrame.current = null;
        const nextInstant = pendingSimulationInstant.current;
        pendingSimulationInstant.current = null;
        if (!nextInstant) return;

        try {
          const nextChart = calculateVedicChart({
            ...request.chartInput,
            instant: nextInstant,
          });
          startTransition(() => {
            setError(null);
            setSelectedInstant(nextInstant);
            setDisplayChart(nextChart);
          });
        } catch (reason) {
          console.error(reason);
          setError(t("instantError"));
        }
      });
    },
    [request, startTransition, t],
  );

  const handlePlanetSelection = useCallback(
    (planetId: GrahaId | null) => {
      setSelectedPlanetId(planetId);
      if (!planetId || !displayChart) return;
      const planet = displayChart.planets.find((item) => item.id === planetId);
      if (planet) setSelectedHouse(planet.house);
    },
    [displayChart],
  );

  const handleThreeSelection = useCallback(
    (planet: GrahaPosition | null) => handlePlanetSelection(planet?.id ?? null),
    [handlePlanetSelection],
  );

  const handleHouseSelection = useCallback((house: HouseNumber) => {
    setSelectedHouse(house);
    setSelectedPlanetId(null);
  }, []);

  const selectedPlanet = displayChart?.planets.find(
    (planet) => planet.id === selectedPlanetId,
  ) ?? null;
  const sun = displayChart?.planets.find((planet) => planet.id === "sun") ?? null;
  const moon = displayChart?.planets.find((planet) => planet.id === "moon") ?? null;
  const isNatalMoment = Boolean(
    request &&
      selectedInstant &&
      selectedInstant.getTime() === request.birth.instant.getTime(),
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060711] text-slate-100">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute left-[8%] top-[-12rem] size-[34rem] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[18rem] size-[30rem] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="celestial-grid absolute inset-0 opacity-40" />
      </div>

      <div className="relative mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Orbit aria-hidden="true" className="size-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                {t("brand")}
              </span>
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <AppPreferencesControls />
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              {t("ready")}
            </div>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-700 dark:text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <section
          id="birth-data"
          aria-label={t("birthEntry")}
          className={`${!showBirthForm && natalChart ? "hidden" : "grid"} items-start gap-6 xl:grid-cols-[minmax(360px,0.78fr)_minmax(560px,1.22fr)]`}
        >
          <div className="rounded-[28px] border border-white/10 bg-[#0d0f1d]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
            <BirthForm isGenerating={isPending} onGenerate={handleGenerate} />
          </div>
          {natalChart ? (
            <div className="rounded-[28px] border border-white/10 bg-[#0b0d19]/80 p-6 sm:p-8">
              <BookOpenText
                aria-hidden="true"
                className="size-8 text-violet-700 dark:text-violet-300"
              />
              <h2 className="mt-5 text-2xl font-semibold text-white">
                {t("updateTitle")}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {t("updateBody")}
              </p>
              <button
                type="button"
                onClick={() => setShowBirthForm(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
              >
                {t("returnObservatory")}
                <ArrowDown aria-hidden="true" className="size-4" />
              </button>
            </div>
          ) : (
            <LandingPreview />
          )}
        </section>

        {request && natalChart && displayChart && selectedInstant && analysisAsOf ? (
          <div id="observatory" className="scroll-mt-4 space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-[#0b0e1b]/90 p-5 shadow-xl shadow-black/20 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Sparkles aria-hidden="true" className="size-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                      {t("generated")}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {request.person.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {t("bornAt", {
                      place: request.location.label,
                      date: request.birth.localDate,
                      time: request.birth.localTime,
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-100/75">
                    {request.birth.utcOffset} · {request.birth.timeZone}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBirthForm(true);
                      window.requestAnimationFrame(() => {
                        document.getElementById("birth-data")?.scrollIntoView({
                          behavior: "smooth",
                        });
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil aria-hidden="true" className="size-3" />
                    {t("editBirth")}
                  </button>
                </div>
              </div>

              {sun && moon ? (
                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t("displayedPositions", {
                      moment: isNatalMoment
                        ? t("natalMoment")
                        : t("simulatedInstant"),
                    })}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <CoreStat
                      label={t("ascendant")}
                      sign={getLocalizedRasiName(
                        displayChart.ascendant.sign.name,
                        locale,
                      )}
                      degrees={displayChart.ascendant.sign.degreeDeg}
                      detail={t("corePada", {
                        nakshatra: getLocalizedNakshatraName(
                          displayChart.ascendant.nakshatra.name,
                          locale,
                        ),
                        pada: displayChart.ascendant.nakshatra.pada,
                      })}
                      accent
                    />
                    <CoreStat
                      label={getLocalizedGrahaName("sun", locale)}
                      sign={getLocalizedRasiName(sun.sign.name, locale)}
                      degrees={sun.sign.degreeDeg}
                      detail={t("coreNakshatra", {
                        nakshatra: getLocalizedNakshatraName(
                          sun.nakshatra.name,
                          locale,
                        ),
                        house: sun.house,
                      })}
                    />
                    <CoreStat
                      label={getLocalizedGrahaName("moon", locale)}
                      sign={getLocalizedRasiName(moon.sign.name, locale)}
                      degrees={moon.sign.degreeDeg}
                      detail={t("coreNakshatraPada", {
                        nakshatra: getLocalizedNakshatraName(
                          moon.nakshatra.name,
                          locale,
                        ),
                        pada: moon.nakshatra.pada,
                        house: moon.house,
                      })}
                    />
                  </div>
                </div>
              ) : null}
            </section>

            <TimeNavigator
              birthInstant={request.birth.instant}
              selectedInstant={selectedInstant}
              timeZone={request.birth.timeZone}
              onChange={handleTimeChange}
            />

            <section id="cosmos" aria-labelledby="cosmos-title" className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <Telescope aria-hidden="true" className="size-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                      {t("webglSphere")}
                    </span>
                  </div>
                  <h2 id="cosmos-title" className="mt-1 text-xl font-semibold text-white">
                    {t("geocentricCosmos")}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {isNatalMoment ? t("natalMoment") : t("simulatedSky")}
                </span>
              </div>

              <CelestialSphere
                chart={displayChart}
                selectedPlanetId={selectedPlanetId}
                onSelectPlanet={handleThreeSelection}
                showNakshatraLabels
                showPlanetTrajectories
              />
              <SelectedPlanetStrip
                planet={selectedPlanet}
                onClear={() => handlePlanetSelection(null)}
              />
            </section>

            <ChartWorkspace
              chart={displayChart}
              isNatalMoment={isNatalMoment}
              selectedHouse={selectedHouse}
              selectedPlanetId={selectedPlanetId}
              onSelectHouse={handleHouseSelection}
              onSelectPlanet={handlePlanetSelection}
            />

            <section
              aria-label={t("natalInterpretation")}
              className="rounded-[28px] border border-white/10 bg-[#0b0e1b]/90 p-5 shadow-2xl shadow-black/20 sm:p-7"
            >
              <InterpretationPanel
                chart={natalChart}
                request={request}
                asOf={analysisAsOf}
                onSelectPlanet={handlePlanetSelection}
                onSelectHouse={handleHouseSelection}
              />
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-1 py-5 text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <CircleDot aria-hidden="true" className="size-3.5" />
                {t("methodology")}
              </span>
              <span>{t("accuracy")}</span>
            </footer>
          </div>
        ) : null}
      </div>
    </main>
  );
}
