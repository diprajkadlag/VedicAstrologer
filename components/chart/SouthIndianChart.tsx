"use client";

import { useId, type KeyboardEvent } from "react";

import {
  getLocalizedGrahaName,
  getLocalizedRasiName,
} from "../../lib/astro/localizedNames";
import { defineMessages, formatMessage } from "../../lib/i18n";

import { ChartPlanetMark } from "./ChartPlanetMark";
import {
  describeHouse,
  getChartRasiAbbreviation,
  getHouse,
  getHouseForSign,
  getPlanet,
  getPlanetsForHouse,
  PLANET_PRESENTATION,
  SOUTH_INDIAN_SIGN_CELLS,
} from "./chart-utils";
import type { VedicChartRendererProps } from "./types";

const SOUTH_CHART_MESSAGES = defineMessages({
  en: {
    ariaLabel: "South Indian Vedic birth chart",
    description:
      "Twelve fixed Rasis around a four by four South Indian grid. The Lagna marks Bhava one. Select a Rasi-Bhava cell or graha for details.",
    rasi: "RĀŚI",
    lahiri: "D1 · LĀHIRI",
    chartTitle: "South Indian chart",
    selectedGraha: "{glyph} {planet} · {rasi}",
    selectedBhava: "Bhava {house} · {rasi}",
    lagnaSummary: "Lagna · {rasi}",
    signsFixed: "Rasis fixed · Bhavas from Lagna",
    bhavaShort: "B",
    lagnaShort: "LAGNA",
    figcaption:
      "South Indian chart. Rasis are fixed; the Lagna Rasi begins Bhava one.",
  },
  hi: {
    ariaLabel: "दक्षिण भारतीय वैदिक जन्म कुंडली",
    description:
      "चार गुणा चार दक्षिण भारतीय ग्रिड के चारों ओर बारह स्थिर राशियाँ। लग्न पहले भाव को दर्शाता है। विवरण के लिए राशि-भाव कक्ष या ग्रह चुनें।",
    rasi: "राशि",
    lahiri: "D1 · लाहिरी",
    chartTitle: "दक्षिण भारतीय कुंडली",
    selectedGraha: "{glyph} {planet} · {rasi}",
    selectedBhava: "भाव {house} · {rasi}",
    lagnaSummary: "लग्न · {rasi}",
    signsFixed: "राशियाँ स्थिर · लग्न से भाव",
    bhavaShort: "भा",
    lagnaShort: "लग्न",
    figcaption:
      "दक्षिण भारतीय कुंडली। राशियाँ स्थिर हैं; लग्न राशि से पहला भाव आरंभ होता है।",
  },
  mr: {
    ariaLabel: "दक्षिण भारतीय वैदिक जन्मकुंडली",
    description:
      "चार गुणिले चार दक्षिण भारतीय जाळीभोवती बारा स्थिर राशी. लग्न पहिला भाव दर्शवते. तपशीलासाठी राशी-भाव कक्ष किंवा ग्रह निवडा.",
    rasi: "राशी",
    lahiri: "D1 · लाहिरी",
    chartTitle: "दक्षिण भारतीय कुंडली",
    selectedGraha: "{glyph} {planet} · {rasi}",
    selectedBhava: "भाव {house} · {rasi}",
    lagnaSummary: "लग्न · {rasi}",
    signsFixed: "राशी स्थिर · लग्नापासून भाव",
    bhavaShort: "भा",
    lagnaShort: "लग्न",
    figcaption:
      "दक्षिण भारतीय कुंडली. राशी स्थिर असतात; लग्न राशीपासून पहिला भाव सुरू होतो.",
  },
  de: {
    ariaLabel: "Südindische vedische Geburtskundali",
    description:
      "Zwölf feste Rāśis um ein südindisches Vier-mal-vier-Raster. Das Lagna kennzeichnet Bhava eins. Wähle eine Rāśi-Bhava-Zelle oder ein Graha aus, um Details anzuzeigen.",
    rasi: "RĀŚI",
    lahiri: "D1 · LĀHIRI",
    chartTitle: "Südindische Kundali",
    selectedGraha: "{glyph} {planet} · {rasi}",
    selectedBhava: "Bhava {house} · {rasi}",
    lagnaSummary: "Lagna · {rasi}",
    signsFixed: "Rāśis fest · Bhavas ab Lagna",
    bhavaShort: "B",
    lagnaShort: "LAGNA",
    figcaption:
      "Südindische Kundali. Die Rāśis sind fest angeordnet; mit der Lagna-Rāśi beginnt Bhava eins.",
  },
});

function activateCell(
  event: KeyboardEvent<SVGRectElement>,
  onActivate: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onActivate();
}

function southPlanetSlots(
  x: number,
  y: number,
  count: number,
): { x: number; y: number }[] {
  const columns = 2;
  const gapX = 43;

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const itemInRow = index % columns;
    const itemsBeforeRow = row * columns;
    const itemsInRow = Math.min(columns, count - itemsBeforeRow);
    const rowWidth = (itemsInRow - 1) * gapX;

    return {
      x: x + 50 - rowWidth / 2 + itemInRow * gapX,
      y: y + 45 + row * 12,
    };
  });
}

export function SouthIndianChart({
  chart,
  selectedHouse = null,
  selectedPlanetId = null,
  onSelectHouse,
  onSelectPlanet,
  className = "",
  ariaLabel,
  locale = "en",
}: VedicChartRendererProps) {
  const messages = SOUTH_CHART_MESSAGES[locale];
  const t = (
    key: keyof typeof messages,
    values?: Readonly<Record<string, string | number | boolean>>,
  ) => formatMessage(messages[key], values);
  const titleId = useId();
  const descriptionId = useId();
  const selectedPlanet = getPlanet(chart, selectedPlanetId);
  const selectedHouseData = selectedHouse
    ? getHouse(chart, selectedHouse)
    : undefined;

  return (
    <figure className={`m-0 w-full ${className}`}>
      <svg
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        viewBox="0 0 400 400"
      >
        <title id={titleId}>{ariaLabel ?? t("ariaLabel")}</title>
        <desc id={descriptionId}>{t("description")}</desc>

        <rect
          fill="rgba(4, 7, 18, 0.66)"
          height="400"
          rx="7"
          stroke="rgba(253, 230, 138, 0.58)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          width="400"
        />

        {SOUTH_INDIAN_SIGN_CELLS.map((cell) => {
          const x = cell.column * 100;
          const y = cell.row * 100;
          const house = getHouseForSign(chart, cell.signIndex);
          const planets = getPlanetsForHouse(chart, house.number);
          const selected = selectedHouse === house.number;
          const label = describeHouse(house, planets, locale);

          return (
            <rect
              aria-label={label}
              aria-pressed={onSelectHouse ? selected : undefined}
              className={`outline-none transition-[fill,stroke] focus:stroke-amber-200 ${
                selected
                  ? "fill-violet-400/15 stroke-amber-300"
                  : "fill-white/[0.02] stroke-violet-200/30 hover:fill-violet-400/10 hover:stroke-violet-200/60"
              }`}
              height="100"
              key={`cell-${cell.signIndex}`}
              onClick={
                onSelectHouse
                  ? () => onSelectHouse(house.number)
                  : undefined
              }
              onKeyDown={
                onSelectHouse
                  ? (event) =>
                      activateCell(event, () => onSelectHouse(house.number))
                  : undefined
              }
              role={onSelectHouse ? "button" : undefined}
              strokeWidth={selected ? 2 : 0.8}
              tabIndex={onSelectHouse ? 0 : undefined}
              vectorEffect="non-scaling-stroke"
              width="100"
              x={x}
              y={y}
            />
          );
        })}

        <rect
          fill="rgba(10, 12, 28, 0.84)"
          height="200"
          stroke="rgba(196, 181, 253, 0.28)"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
          width="200"
          x="100"
          y="100"
        />
        <circle
          cx="200"
          cy="172"
          fill="none"
          r="28"
          stroke="rgba(251, 191, 36, 0.2)"
          strokeWidth="0.8"
        />
        <circle
          cx="200"
          cy="172"
          fill="rgba(167, 139, 250, 0.07)"
          r="20"
          stroke="rgba(196, 181, 253, 0.22)"
          strokeWidth="0.6"
        />
        <text
          aria-hidden="true"
          fill="#fde68a"
          fontSize="8"
          fontWeight="750"
          letterSpacing="1.7"
          textAnchor="middle"
          x="200"
          y="169"
        >
          {t("rasi")}
        </text>
        <text
          aria-hidden="true"
          fill="#c4b5fd"
          fontSize="6.5"
          letterSpacing="1.25"
          textAnchor="middle"
          x="200"
          y="180"
        >
          {t("lahiri")}
        </text>
        <text
          aria-hidden="true"
          fill="#f8fafc"
          fontSize="12"
          fontWeight="650"
          textAnchor="middle"
          x="200"
          y="221"
        >
          {t("chartTitle")}
        </text>
        <text
          aria-hidden="true"
          fill="#94a3b8"
          fontSize="8.5"
          textAnchor="middle"
          x="200"
          y="239"
        >
          {selectedPlanet
            ? t("selectedGraha", {
                glyph: PLANET_PRESENTATION[selectedPlanet.id].glyph,
                planet: getLocalizedGrahaName(selectedPlanet.id, locale),
                rasi: getLocalizedRasiName(
                  selectedPlanet.sign.name,
                  locale,
                ),
              })
            : selectedHouseData
              ? t("selectedBhava", {
                  house: selectedHouseData.number,
                  rasi: getLocalizedRasiName(
                    selectedHouseData.sign.name,
                    locale,
                  ),
                })
              : t("lagnaSummary", {
                  rasi: getLocalizedRasiName(
                    chart.ascendant.sign.name,
                    locale,
                  ),
                })}
        </text>
        <text
          aria-hidden="true"
          fill="#64748b"
          fontSize="7.5"
          textAnchor="middle"
          x="200"
          y="255"
        >
          {t("signsFixed")}
        </text>

        {SOUTH_INDIAN_SIGN_CELLS.map((cell) => {
          const x = cell.column * 100;
          const y = cell.row * 100;
          const house = getHouseForSign(chart, cell.signIndex);
          const isAscendant = house.number === 1;

          return (
            <g
              aria-hidden="true"
              key={`label-${cell.signIndex}`}
              pointerEvents="none"
            >
              <text
                fill="#c4b5fd"
                fontSize="9"
                fontWeight="650"
                x={x + 7}
                y={y + 15}
              >
                {getChartRasiAbbreviation(
                  cell.signIndex,
                  house.sign.name,
                  locale,
                )}{" "}
                {cell.signIndex + 1}
              </text>
              <text
                fill={selectedHouse === house.number ? "#fde68a" : "#94a3b8"}
                fontSize="8"
                fontWeight="650"
                textAnchor="end"
                x={x + 93}
                y={y + 15}
              >
                {t("bhavaShort")}
                {house.number}
              </text>
              {isAscendant ? (
                <text
                  fill="#fcd34d"
                  fontSize="7.2"
                  fontWeight="750"
                  letterSpacing="1"
                  x={x + 7}
                  y={y + 29}
                >
                  {t("lagnaShort")}
                </text>
              ) : null}
            </g>
          );
        })}

        {SOUTH_INDIAN_SIGN_CELLS.flatMap((cell) => {
          const x = cell.column * 100;
          const y = cell.row * 100;
          const house = getHouseForSign(chart, cell.signIndex);
          const planets = getPlanetsForHouse(chart, house.number);
          const slots = southPlanetSlots(x, y, planets.length);

          return planets.map((planet, index) => (
            <ChartPlanetMark
              fontSize={8.4}
              height={11}
              key={planet.id}
              onSelect={
                onSelectPlanet
                  ? () => onSelectPlanet(planet.id)
                  : undefined
              }
              planet={planet}
              locale={locale}
              selected={selectedPlanetId === planet.id}
              width={39}
              x={slots[index].x}
              y={slots[index].y}
            />
          ));
        })}
      </svg>
      <figcaption className="sr-only">{t("figcaption")}</figcaption>
    </figure>
  );
}

export type { VedicChartRendererProps } from "./types";
export default SouthIndianChart;
