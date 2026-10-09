"use client";

import { useMemo, useRef, useState } from "react";
import { Diamond, Grid2X2, MapPinned } from "lucide-react";

import {
  NorthIndianChart,
  SouthIndianChart,
} from "@/components/chart";
import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import type {
  GrahaId,
  HouseNumber,
  VedicChart,
} from "@/lib/astro/ephemeris";
import { calculateNavamsaChart, isVargottama } from "@/lib/astro/divisional";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import { defineMessages, INTL_LOCALES, type AppLocale } from "@/lib/i18n";
import type { ChartDensity, ChartDivision } from "@/components/chart/types";
import { useContainerWidth } from "@/components/ui/useContainerWidth";

export type VedicChartStyle = "north" | "south";

const WORKSPACE_MESSAGES = defineMessages({
  en: {
    rasiChart: "Zodiac chart",
    natalMap: "Natal whole-sign house map",
    simulatedMap: "Simulated whole-sign house map",
    styleAria: "Vedic chart style",
    north: "North Indian",
    south: "South Indian",
    northNatalAria: "Interactive North Indian Vedic birth chart",
    northSimulatedAria:
      "Interactive North Indian Vedic selected-time chart",
    southNatalAria: "Interactive South Indian Vedic birth chart",
    southSimulatedAria:
      "Interactive South Indian Vedic selected-time chart",
    selectedGraha: "Selected planetary body",
    retrograde: "Retrograde",
    rasiPosition: "Zodiac-sign position",
    nakshatra: "Lunar mansion",
    pada: "Quarter",
    bhava: "House",
    longitudinalMotion: "Longitudinal motion",
    direct: "Direct",
    stationary: "Stationary",
    motionValue: "{motion} · {speed}°/day",
    showBhavaDetails: "Show house details",
    selectedBhava: "Selected house",
    bhavaHeading: "House {house}",
    emptyBhava: "No planetary bodies occupy this house in the selected chart.",
    exploreBhava: "Explore a house",
    exploreHelp:
      "Select any house to see its zodiac sign and resident planetary bodies. Planetary-body selections are shared with the celestial view.",
  },
  hi: {
    rasiChart: "राशि कुंडली",
    natalMap: "जन्मकालीन पूर्ण-राशि भाव मानचित्र",
    simulatedMap: "अनुकरणित पूर्ण-राशि भाव मानचित्र",
    styleAria: "वैदिक कुंडली शैली",
    north: "उत्तर भारतीय",
    south: "दक्षिण भारतीय",
    northNatalAria: "इंटरैक्टिव उत्तर भारतीय वैदिक जन्म कुंडली",
    northSimulatedAria:
      "इंटरैक्टिव उत्तर भारतीय वैदिक चयनित-समय कुंडली",
    southNatalAria: "इंटरैक्टिव दक्षिण भारतीय वैदिक जन्म कुंडली",
    southSimulatedAria:
      "इंटरैक्टिव दक्षिण भारतीय वैदिक चयनित-समय कुंडली",
    selectedGraha: "चयनित ग्रह",
    retrograde: "वक्री",
    rasiPosition: "राशि स्थिति",
    nakshatra: "नक्षत्र",
    pada: "पाद",
    bhava: "भाव",
    longitudinalMotion: "देशांतर गति",
    direct: "मार्गी",
    stationary: "स्थिर",
    motionValue: "{motion} · {speed}°/दिन",
    showBhavaDetails: "भाव का विवरण दिखाएँ",
    selectedBhava: "चयनित भाव",
    bhavaHeading: "भाव {house}",
    emptyBhava: "चयनित कुंडली में इस भाव में कोई ग्रह नहीं है।",
    exploreBhava: "भाव देखें",
    exploreHelp:
      "उसकी राशि और स्थित ग्रह देखने के लिए कोई भाव चुनें। ग्रह चयन खगोलीय दृश्य के साथ साझा होता है।",
  },
  mr: {
    rasiChart: "राशी कुंडली",
    natalMap: "जन्मकालीन पूर्ण-राशी भाव नकाशा",
    simulatedMap: "अनुकरणित पूर्ण-राशी भाव नकाशा",
    styleAria: "वैदिक कुंडली शैली",
    north: "उत्तर भारतीय",
    south: "दक्षिण भारतीय",
    northNatalAria: "परस्परसंवादी उत्तर भारतीय वैदिक जन्मकुंडली",
    northSimulatedAria:
      "परस्परसंवादी उत्तर भारतीय वैदिक निवडलेल्या-वेळेची कुंडली",
    southNatalAria: "परस्परसंवादी दक्षिण भारतीय वैदिक जन्मकुंडली",
    southSimulatedAria:
      "परस्परसंवादी दक्षिण भारतीय वैदिक निवडलेल्या-वेळेची कुंडली",
    selectedGraha: "निवडलेला ग्रह",
    retrograde: "वक्री",
    rasiPosition: "राशीतील स्थान",
    nakshatra: "नक्षत्र",
    pada: "पाद",
    bhava: "भाव",
    longitudinalMotion: "रेखांश गती",
    direct: "मार्गी",
    stationary: "स्थिर",
    motionValue: "{motion} · {speed}°/दिवस",
    showBhavaDetails: "भावाचा तपशील दाखवा",
    selectedBhava: "निवडलेला भाव",
    bhavaHeading: "भाव {house}",
    emptyBhava: "निवडलेल्या कुंडलीत या भावात कोणताही ग्रह नाही.",
    exploreBhava: "भाव पाहा",
    exploreHelp:
      "त्याची राशी आणि त्यातील ग्रह पाहण्यासाठी भाव निवडा. ग्रहाची निवड खगोलीय दृश्यातही लागू होते.",
  },
  de: {
    rasiChart: "Tierkreisdiagramm",
    natalMap: "Geburtskarte mit Ganzzeichen-Häusern",
    simulatedMap: "Simulierte Karte mit Ganzzeichen-Häusern",
    styleAria: "Stil des vedischen Geburtshoroskops",
    north: "Nordindisch",
    south: "Südindisch",
    northNatalAria: "Interaktive nordindische vedische Geburtskundali",
    northSimulatedAria:
      "Interaktives nordindisches vedisches Geburtshoroskop für den ausgewählten Zeitpunkt",
    southNatalAria: "Interaktives südindisches vedisches Geburtshoroskop",
    southSimulatedAria:
      "Interaktives südindisches vedisches Geburtshoroskop für den ausgewählten Zeitpunkt",
    selectedGraha: "Ausgewählter Himmelskörper",
    retrograde: "Rückläufig",
    rasiPosition: "Position im Tierkreiszeichen",
    nakshatra: "Mondstation",
    pada: "Viertel",
    bhava: "Haus",
    longitudinalMotion: "Längsbewegung",
    direct: "Direktläufig",
    stationary: "Stationär",
    motionValue: "{motion} · {speed}°/Tag",
    showBhavaDetails: "Hausdetails anzeigen",
    selectedBhava: "Ausgewähltes Haus",
    bhavaHeading: "Haus {house}",
    emptyBhava:
      "Im ausgewählten Geburtshoroskop befindet sich kein Himmelskörper in diesem Haus.",
    exploreBhava: "Haus erkunden",
    exploreHelp:
      "Wähle ein Haus aus, um sein Tierkreiszeichen und die darin befindlichen Himmelskörper zu sehen. Die Auswahl des Himmelskörpers wird mit der Himmelsansicht geteilt.",
  },
});

const DIVISION_MESSAGES = defineMessages({
  en: {
    chartTypeAria: "Chart type",
    d1: "Birth chart (D1)",
    d9: "Ninth-division chart (D9)",
    d9Sign: "Ninth-division sign",
    vargottama: "Same sign in D1 and D9",
    d9Help:
      "Each sign is split into nine parts of 3°20′, and this chart places every body by the part it occupies. Shown for study; the readings and scores still use the birth chart.",
    d9SelectedTime: "Drawn for the selected time, not the birth moment.",
  },
  hi: {
    chartTypeAria: "कुंडली का प्रकार",
    d1: "जन्म कुंडली (D1)",
    d9: "नवांश कुंडली (D9)",
    d9Sign: "नवांश राशि",
    vargottama: "वर्गोत्तम (D1 और D9 में एक ही राशि)",
    d9Help:
      "हर राशि 3°20′ के नौ भागों में बँटी है; यह कुंडली हर ग्रह को उसके भाग के अनुसार रखती है। यह अध्ययन के लिए है; व्याख्याएँ और अंक जन्म कुंडली पर ही आधारित हैं।",
    d9SelectedTime: "यह जन्म क्षण की नहीं, चयनित समय की कुंडली है।",
  },
  mr: {
    chartTypeAria: "कुंडलीचा प्रकार",
    d1: "जन्मकुंडली (D1)",
    d9: "नवांश कुंडली (D9)",
    d9Sign: "नवांश राशी",
    vargottama: "वर्गोत्तम (D1 आणि D9 मध्ये एकच राशी)",
    d9Help:
      "प्रत्येक राशी 3°20′ च्या नऊ भागांत विभागली आहे; ही कुंडली प्रत्येक ग्रह ज्या भागात आहे त्यानुसार ठेवते. ही अभ्यासासाठी आहे; विवेचन आणि गुण जन्मकुंडलीवरच आधारित आहेत.",
    d9SelectedTime: "ही जन्मक्षणाची नाही, तर निवडलेल्या वेळेची कुंडली आहे.",
  },
  de: {
    chartTypeAria: "Horoskoptyp",
    d1: "Geburtshoroskop (D1)",
    d9: "Neuntes Teilhoroskop (D9)",
    d9Sign: "Zeichen im neunten Teilhoroskop",
    vargottama: "Gleiches Zeichen in D1 und D9",
    d9Help:
      "Jedes Zeichen ist in neun Teile zu 3°20′ geteilt; dieses Horoskop ordnet jeden Himmelskörper nach dem Teil ein, in dem er steht. Zum Lernen gezeigt; Deutungen und Punktwerte beruhen weiter auf dem Geburtshoroskop.",
    d9SelectedTime:
      "Gezeichnet für den ausgewählten Zeitpunkt, nicht für den Geburtsmoment.",
  },
});

/**
 * Panel widths at which the 400-unit chart is drawn small enough that its
 * labels need enlarging: under 360 px an 8-unit label lands near 6 px, and
 * under 300 px it drops below 5 px.
 */
const COMPACT_CHART_WIDTH_PX = 360;
const TIGHT_CHART_WIDTH_PX = 300;

function chartDensity(width: number | null): ChartDensity {
  if (width === null) return "comfortable";
  if (width < TIGHT_CHART_WIDTH_PX) return "tight";
  if (width < COMPACT_CHART_WIDTH_PX) return "compact";
  return "comfortable";
}

function formatChartNumber(
  value: number,
  locale: AppLocale,
  fractionDigits: number,
): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export interface ChartWorkspaceProps {
  chart: VedicChart;
  isNatalMoment: boolean;
  selectedHouse: HouseNumber | null;
  selectedPlanetId: GrahaId | null;
  onSelectHouse(house: HouseNumber): void;
  onSelectPlanet(planetId: GrahaId | null): void;
}

export default function ChartWorkspace({
  chart,
  isNatalMoment,
  selectedHouse,
  selectedPlanetId,
  onSelectHouse,
  onSelectPlanet,
}: ChartWorkspaceProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(WORKSPACE_MESSAGES);
  const dt = useScopedTranslations(DIVISION_MESSAGES);
  const [style, setStyle] = useState<VedicChartStyle>("north");
  const [division, setDivision] = useState<ChartDivision>(1);
  // The app-wide house selection means birth-chart houses, so a house chosen
  // on the D9 chart is kept here and never reported upwards.
  const [d9House, setD9House] = useState<HouseNumber | null>(null);
  const d9Chart = useMemo(() => calculateNavamsaChart(chart), [chart]);
  const chartPanelRef = useRef<HTMLDivElement>(null);
  const chartPanelWidth = useContainerWidth(chartPanelRef);
  const density = chartDensity(chartPanelWidth);
  const isD9 = division === 9;
  const shownChart = isD9 ? d9Chart : chart;
  const activePlanet = selectedPlanetId
    ? shownChart.planets.find((planet) => planet.id === selectedPlanetId) ??
      null
    : null;
  // In D9 the highlighted house follows the chosen body, as in D1, where the
  // app selects a body's house together with the body.
  const shownHouse = isD9 ? activePlanet?.house ?? d9House : selectedHouse;
  const activeHouse = shownHouse
    ? shownChart.houses.find((house) => house.number === shownHouse) ?? null
    : null;
  const activePlanetIsVargottama =
    isD9 && activePlanet !== null
      ? isVargottama(activePlanet.siderealLongitudeDeg)
      : false;

  function selectDivision(next: ChartDivision) {
    // Pressing the segment that is already active changes nothing, so it must
    // not drop the chosen house either.
    if (next === division) return;
    setDivision(next);
    setD9House(null);
  }

  function selectD9House(house: HouseNumber) {
    setD9House(house);
    // Same as the app-wide handler: choosing a house puts the planet aside.
    onSelectPlanet(null);
  }

  const selectHouse = isD9 ? selectD9House : onSelectHouse;

  return (
    <section
      aria-labelledby="vedic-chart-title"
      // Below 400 px the page gutters cost more than the rounded card is
      // worth: going edge to edge returns ~32 px to the chart itself.
      className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0e1b]/90 shadow-2xl shadow-black/20 max-[399px]:-mx-4 max-[399px]:rounded-none max-[399px]:border-x-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <MapPinned aria-hidden="true" className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
              {t("rasiChart")}
            </span>
          </div>
          <h2 id="vedic-chart-title" className="mt-1 text-lg font-semibold text-white">
            {isD9
              ? dt("d9")
              : isNatalMoment
                ? t("natalMap")
                : t("simulatedMap")}
          </h2>
          {isD9 && !isNatalMoment ? (
            // The D1 heading says "Simulated" for a time-navigator instant; the
            // D9 heading is fixed text, so this line carries the same cue.
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {dt("d9SelectedTime")}
            </p>
          ) : null}
        </div>

        {/* The North/South group must stay the first role="group" of the card. */}
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t("styleAria")}
            className="flex rounded-xl border border-white/10 bg-black/20 p-1"
          >
            <button
              type="button"
              onClick={() => setStyle("north")}
              aria-pressed={style === "north"}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                style === "north"
                  ? "bg-violet-400/20 text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              <Diamond aria-hidden="true" className="size-3.5" />
              {t("north")}
            </button>
            <button
              type="button"
              onClick={() => setStyle("south")}
              aria-pressed={style === "south"}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                style === "south"
                  ? "bg-violet-400/20 text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              <Grid2X2 aria-hidden="true" className="size-3.5" />
              {t("south")}
            </button>
          </div>

          {/*
            The labels are long ("Ninth-division chart (D9)"). Two equal grid
            columns make the group as wide as twice the longer label, so on a
            roomy screen neither wraps; on a 320 px phone the group may take a
            line of its own and the labels wrap inside their buttons.
          */}
          <div
            role="group"
            aria-label={dt("chartTypeAria")}
            className="grid max-w-full grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1"
          >
            <button
              type="button"
              onClick={() => selectDivision(1)}
              aria-pressed={division === 1}
              className={`inline-flex min-h-10 min-w-0 items-center justify-center break-words rounded-lg px-3 py-2 text-center text-xs font-medium leading-4 transition ${
                division === 1
                  ? "bg-violet-400/20 text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {dt("d1")}
            </button>
            <button
              type="button"
              data-testid="chart-division-d9"
              onClick={() => selectDivision(9)}
              aria-pressed={division === 9}
              className={`inline-flex min-h-10 min-w-0 items-center justify-center break-words rounded-lg px-3 py-2 text-center text-xs font-medium leading-4 transition ${
                division === 9
                  ? "bg-violet-400/20 text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {dt("d9")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-2.5 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="min-w-0">
          <div
            ref={chartPanelRef}
            className="mx-auto w-full max-w-[650px] rounded-2xl border border-white/[0.07] bg-[#080a15]/70 p-1.5 sm:p-5"
          >
            {style === "north" ? (
              <NorthIndianChart
                chart={shownChart}
                density={density}
                division={division}
                locale={locale}
                selectedHouse={shownHouse}
                selectedPlanetId={selectedPlanetId}
                onSelectHouse={selectHouse}
                onSelectPlanet={onSelectPlanet}
                ariaLabel={
                  isD9
                    ? dt("d9")
                    : isNatalMoment
                      ? t("northNatalAria")
                      : t("northSimulatedAria")
                }
              />
            ) : (
              <SouthIndianChart
                chart={shownChart}
                density={density}
                division={division}
                locale={locale}
                selectedHouse={shownHouse}
                selectedPlanetId={selectedPlanetId}
                onSelectHouse={selectHouse}
                onSelectPlanet={onSelectPlanet}
                ariaLabel={
                  isD9
                    ? dt("d9")
                    : isNatalMoment
                      ? t("southNatalAria")
                      : t("southSimulatedAria")
                }
              />
            )}
          </div>
          {isD9 ? (
            <p className="mx-auto mt-3 max-w-[650px] px-1 text-xs leading-5 text-slate-400">
              {dt("d9Help")}
            </p>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          {activePlanet ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300/80">
                {t("selectedGraha")}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xl font-semibold text-white">
                  {getLocalizedGrahaName(activePlanet.id, locale)}
                </p>
                {activePlanet.retrograde ? (
                  <span className="rounded-full border border-rose-300/15 bg-rose-300/[0.07] px-2 py-1 text-[11px] text-rose-700 dark:text-rose-200">
                    {t("retrograde")}
                  </span>
                ) : null}
              </div>
              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <dt className="text-slate-600">
                    {isD9 ? dt("d9Sign") : t("rasiPosition")}
                  </dt>
                  <dd className="mt-1 text-slate-200">
                    {getLocalizedRasiName(activePlanet.sign.name, locale)} ·{" "}
                    {formatChartNumber(
                      activePlanet.sign.degreeDeg,
                      locale,
                      2,
                    )}
                    °
                    {activePlanetIsVargottama ? (
                      <span className="mt-1.5 block w-fit max-w-full rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2 py-1 text-[11px] leading-4 text-emerald-800 dark:text-emerald-200">
                        {dt("vargottama")}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">
                    {/* The lunar mansion is the birth-chart one in D9 too. */}
                    {isD9 ? `${t("nakshatra")} (D1)` : t("nakshatra")}
                  </dt>
                  <dd className="mt-1 text-slate-200">
                    {getLocalizedNakshatraName(
                      activePlanet.nakshatra.name,
                      locale,
                    )}{" "}
                    · {t("pada")} {activePlanet.nakshatra.pada}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">{t("bhava")}</dt>
                  <dd className="mt-1 text-slate-200">
                    {t("bhava")} {activePlanet.house}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">
                    {t("longitudinalMotion")}
                  </dt>
                  <dd className="mt-1 text-slate-200">
                    {t("motionValue", {
                      motion:
                        activePlanet.motion === "direct"
                          ? t("direct")
                          : activePlanet.motion === "retrograde"
                            ? t("retrograde")
                            : t("stationary"),
                      speed: formatChartNumber(
                        activePlanet.speedDegPerDay,
                        locale,
                        3,
                      ),
                    })}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  // In D1 the app keeps the body's house selected; D9 keeps
                  // its own, so hand it the body's D9 house first.
                  if (isD9) setD9House(activePlanet.house);
                  onSelectPlanet(null);
                }}
                className="mt-5 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                {t("showBhavaDetails")}
              </button>
            </>
          ) : activeHouse ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300/75">
                {t("selectedBhava")}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {t("bhavaHeading", { house: activeHouse.number })}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {getLocalizedRasiName(activeHouse.sign.name, locale)}
                {/* A D9 sign has no start longitude worth quoting. */}
                {isD9 ? null : (
                  <>
                    {" "}
                    ·{" "}
                    {formatChartNumber(
                      activeHouse.siderealStartLongitudeDeg,
                      locale,
                      0,
                    )}
                    °
                  </>
                )}
              </p>
              <div className="mt-4 space-y-2">
                {activeHouse.planets.length > 0 ? (
                  activeHouse.planets.map((planetId) => {
                    const planet = shownChart.planets.find(
                      (item) => item.id === planetId,
                    );
                    if (!planet) return null;
                    return (
                      <button
                        key={planet.id}
                        type="button"
                        onClick={() => onSelectPlanet(planet.id)}
                        aria-pressed={selectedPlanetId === planet.id}
                        className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                          selectedPlanetId === planet.id
                            ? "border-violet-300/30 bg-violet-400/10 text-white"
                            : "border-white/[0.07] bg-black/10 text-slate-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-medium">
                          {getLocalizedGrahaName(planet.id, locale)}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {formatChartNumber(
                            planet.sign.degreeDeg,
                            locale,
                            2,
                          )}
                          ° ·{" "}
                          {getLocalizedNakshatraName(
                            planet.nakshatra.name,
                            locale,
                          )}
                          {isD9 ? " (D1)" : ""}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs leading-5 text-slate-500">
                    {t("emptyBhava")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-32 flex-col justify-center">
              <p className="text-sm font-medium text-slate-200">
                {t("exploreBhava")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("exploreHelp")}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
