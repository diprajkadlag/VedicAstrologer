"use client";

import { useState } from "react";
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
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import { defineMessages, INTL_LOCALES, type AppLocale } from "@/lib/i18n";

export type VedicChartStyle = "north" | "south";

const WORKSPACE_MESSAGES = defineMessages({
  en: {
    rasiChart: "Rasi chart",
    natalMap: "Natal whole-sign Bhava map",
    simulatedMap: "Simulated whole-sign Bhava map",
    styleAria: "Vedic chart style",
    north: "North Indian",
    south: "South Indian",
    northNatalAria: "Interactive North Indian Vedic birth chart",
    northSimulatedAria:
      "Interactive North Indian Vedic selected-time chart",
    southNatalAria: "Interactive South Indian Vedic birth chart",
    southSimulatedAria:
      "Interactive South Indian Vedic selected-time chart",
    selectedGraha: "Selected graha",
    retrograde: "Retrograde",
    rasiPosition: "Rasi position",
    nakshatra: "Nakshatra",
    pada: "Pada",
    bhava: "Bhava",
    longitudinalMotion: "Longitudinal motion",
    direct: "Direct",
    stationary: "Stationary",
    motionValue: "{motion} · {speed}°/day",
    showBhavaDetails: "Show Bhava details",
    selectedBhava: "Selected Bhava",
    bhavaHeading: "Bhava {house}",
    emptyBhava: "No grahas occupy this Bhava in the selected chart.",
    exploreBhava: "Explore a Bhava",
    exploreHelp:
      "Select any Bhava to see its Rasi and resident grahas. Graha selections are shared with the celestial view.",
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
    rasiChart: "Rāśi-Kundali",
    natalMap: "Geburtskarte mit Ganzzeichen-Bhavas",
    simulatedMap: "Simulierte Karte mit Ganzzeichen-Bhavas",
    styleAria: "Stil der vedischen Kundali",
    north: "Nordindisch",
    south: "Südindisch",
    northNatalAria: "Interaktive nordindische vedische Geburtskundali",
    northSimulatedAria:
      "Interaktive nordindische vedische Kundali für den ausgewählten Zeitpunkt",
    southNatalAria: "Interaktive südindische vedische Geburtskundali",
    southSimulatedAria:
      "Interaktive südindische vedische Kundali für den ausgewählten Zeitpunkt",
    selectedGraha: "Ausgewähltes Graha",
    retrograde: "Rückläufig",
    rasiPosition: "Position in der Rāśi",
    nakshatra: "Nakshatra",
    pada: "Pada",
    bhava: "Bhava",
    longitudinalMotion: "Längsbewegung",
    direct: "Direktläufig",
    stationary: "Stationär",
    motionValue: "{motion} · {speed}°/Tag",
    showBhavaDetails: "Bhava-Details anzeigen",
    selectedBhava: "Ausgewähltes Bhava",
    bhavaHeading: "Bhava {house}",
    emptyBhava:
      "In der ausgewählten Kundali befindet sich kein Graha in diesem Bhava.",
    exploreBhava: "Bhava erkunden",
    exploreHelp:
      "Wähle ein Bhava aus, um seine Rāśi und die darin befindlichen Grahas zu sehen. Die Graha-Auswahl wird mit der Himmelsansicht geteilt.",
  },
});

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
  const [style, setStyle] = useState<VedicChartStyle>("north");
  const activeHouse = selectedHouse
    ? chart.houses.find((house) => house.number === selectedHouse) ?? null
    : null;
  const activePlanet = selectedPlanetId
    ? chart.planets.find((planet) => planet.id === selectedPlanetId) ?? null
    : null;

  return (
    <section
      aria-labelledby="vedic-chart-title"
      className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0e1b]/90 shadow-2xl shadow-black/20"
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
            {isNatalMoment ? t("natalMap") : t("simulatedMap")}
          </h2>
        </div>

        <div
          role="group"
          aria-label={t("styleAria")}
          className="flex rounded-xl border border-white/10 bg-black/20 p-1"
        >
          <button
            type="button"
            onClick={() => setStyle("north")}
            aria-pressed={style === "north"}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
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
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
              style === "south"
                ? "bg-violet-400/20 text-white"
                : "text-slate-500 hover:text-slate-200"
            }`}
          >
            <Grid2X2 aria-hidden="true" className="size-3.5" />
            {t("south")}
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="mx-auto w-full max-w-[650px] rounded-2xl border border-white/[0.07] bg-[#080a15]/70 p-3 sm:p-5">
          {style === "north" ? (
            <NorthIndianChart
              chart={chart}
              locale={locale}
              selectedHouse={selectedHouse}
              selectedPlanetId={selectedPlanetId}
              onSelectHouse={onSelectHouse}
              onSelectPlanet={onSelectPlanet}
              ariaLabel={
                isNatalMoment
                  ? t("northNatalAria")
                  : t("northSimulatedAria")
              }
            />
          ) : (
            <SouthIndianChart
              chart={chart}
              locale={locale}
              selectedHouse={selectedHouse}
              selectedPlanetId={selectedPlanetId}
              onSelectHouse={onSelectHouse}
              onSelectPlanet={onSelectPlanet}
              ariaLabel={
                isNatalMoment
                  ? t("southNatalAria")
                  : t("southSimulatedAria")
              }
            />
          )}
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
                  <span className="rounded-full border border-rose-300/15 bg-rose-300/[0.07] px-2 py-1 text-[10px] text-rose-700 dark:text-rose-200">
                    {t("retrograde")}
                  </span>
                ) : null}
              </div>
              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <dt className="text-slate-600">{t("rasiPosition")}</dt>
                  <dd className="mt-1 text-slate-200">
                    {getLocalizedRasiName(activePlanet.sign.name, locale)} ·{" "}
                    {formatChartNumber(
                      activePlanet.sign.degreeDeg,
                      locale,
                      2,
                    )}
                    °
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">{t("nakshatra")}</dt>
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
                onClick={() => onSelectPlanet(null)}
                className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
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
                {getLocalizedRasiName(activeHouse.sign.name, locale)} ·{" "}
                {formatChartNumber(
                  activeHouse.siderealStartLongitudeDeg,
                  locale,
                  0,
                )}
                °
              </p>
              <div className="mt-4 space-y-2">
                {activeHouse.planets.length > 0 ? (
                  activeHouse.planets.map((planetId) => {
                    const planet = chart.planets.find((item) => item.id === planetId);
                    if (!planet) return null;
                    return (
                      <button
                        key={planet.id}
                        type="button"
                        onClick={() => onSelectPlanet(planet.id)}
                        aria-pressed={selectedPlanetId === planet.id}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
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
