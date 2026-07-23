"use client";

import { useId, type KeyboardEvent } from "react";

import type { HouseNumber } from "@/lib/astro/ephemeris";
import { defineMessages } from "../../lib/i18n";

import { ChartPlanetMark } from "./ChartPlanetMark";
import {
  describeHouse,
  getChartRasiAbbreviation,
  getHouse,
  getPlanetsForHouse,
  HOUSE_NUMBERS,
} from "./chart-utils";
import type { VedicChartRendererProps } from "./types";

const NORTH_CHART_MESSAGES = defineMessages({
  en: {
    ariaLabel: "North Indian Vedic birth chart",
    description:
      "Twelve fixed Bhavas in the traditional North Indian diamond layout. Select a Bhava or graha for details.",
    lagnaShort: "LAGNA",
    figcaption:
      "North Indian chart. Bhavas are fixed; Rasis rotate from the Lagna.",
  },
  hi: {
    ariaLabel: "उत्तर भारतीय वैदिक जन्म कुंडली",
    description:
      "पारंपरिक उत्तर भारतीय हीरक विन्यास में बारह स्थिर भाव। विवरण के लिए कोई भाव या ग्रह चुनें।",
    lagnaShort: "लग्न",
    figcaption:
      "उत्तर भारतीय कुंडली। भाव स्थिर हैं; राशियाँ लग्न से घूमती हैं।",
  },
  mr: {
    ariaLabel: "उत्तर भारतीय वैदिक जन्मकुंडली",
    description:
      "पारंपरिक उत्तर भारतीय हिरक मांडणीत बारा स्थिर भाव. तपशीलासाठी भाव किंवा ग्रह निवडा.",
    lagnaShort: "लग्न",
    figcaption:
      "उत्तर भारतीय कुंडली. भाव स्थिर असतात; राशी लग्नापासून फिरतात.",
  },
});

interface PlanetLayout {
  centerX: number;
  columns: number;
  gapX: number;
  gapY: number;
  markWidth?: number;
  startY: number;
}

interface NorthHouseShape {
  labelAnchor?: "start" | "middle" | "end";
  labelX: number;
  labelY: number;
  planetLayout: PlanetLayout;
  points: string;
}

/** Fixed house geometry. Houses advance anti-clockwise from the top diamond. */
export const NORTH_INDIAN_HOUSE_SHAPES: Record<
  HouseNumber,
  NorthHouseShape
> = {
  1: {
    points: "200,0 300,100 200,200 100,100",
    labelX: 200,
    labelY: 45,
    planetLayout: {
      centerX: 200,
      startY: 74,
      columns: 3,
      gapX: 34,
      gapY: 17,
    },
  },
  2: {
    points: "0,0 200,0 100,100",
    labelX: 100,
    labelY: 82,
    planetLayout: {
      centerX: 100,
      startY: 21,
      columns: 3,
      gapX: 28,
      gapY: 17,
      markWidth: 26,
    },
  },
  3: {
    points: "0,0 100,100 0,200",
    labelX: 18,
    labelY: 156,
    planetLayout: {
      centerX: 36,
      startY: 71,
      columns: 2,
      gapX: 28,
      gapY: 14.5,
      markWidth: 26,
    },
  },
  4: {
    points: "0,200 100,100 200,200 100,300",
    labelX: 100,
    labelY: 126,
    planetLayout: {
      centerX: 100,
      startY: 160,
      columns: 2,
      gapX: 36,
      gapY: 17,
    },
  },
  5: {
    points: "0,200 100,300 0,400",
    labelX: 18,
    labelY: 245,
    planetLayout: {
      centerX: 36,
      startY: 270,
      columns: 2,
      gapX: 28,
      gapY: 14.5,
      markWidth: 26,
    },
  },
  6: {
    points: "0,400 100,300 200,400",
    labelX: 100,
    labelY: 319,
    planetLayout: {
      centerX: 100,
      startY: 348,
      columns: 3,
      gapX: 28,
      gapY: 16,
      markWidth: 26,
    },
  },
  7: {
    points: "100,300 200,200 300,300 200,400",
    labelX: 200,
    labelY: 365,
    planetLayout: {
      centerX: 200,
      startY: 294,
      columns: 3,
      gapX: 34,
      gapY: 17,
    },
  },
  8: {
    points: "200,400 300,300 400,400",
    labelX: 300,
    labelY: 319,
    planetLayout: {
      centerX: 300,
      startY: 348,
      columns: 3,
      gapX: 28,
      gapY: 16,
      markWidth: 26,
    },
  },
  9: {
    points: "300,300 400,200 400,400",
    labelAnchor: "end",
    labelX: 382,
    labelY: 245,
    planetLayout: {
      centerX: 364,
      startY: 270,
      columns: 2,
      gapX: 28,
      gapY: 14.5,
      markWidth: 26,
    },
  },
  10: {
    points: "200,200 300,100 400,200 300,300",
    labelX: 300,
    labelY: 126,
    planetLayout: {
      centerX: 300,
      startY: 160,
      columns: 2,
      gapX: 36,
      gapY: 17,
    },
  },
  11: {
    points: "300,100 400,0 400,200",
    labelAnchor: "end",
    labelX: 382,
    labelY: 156,
    planetLayout: {
      centerX: 364,
      startY: 71,
      columns: 2,
      gapX: 28,
      gapY: 14.5,
      markWidth: 26,
    },
  },
  12: {
    points: "200,0 400,0 300,100",
    labelX: 300,
    labelY: 82,
    planetLayout: {
      centerX: 300,
      startY: 21,
      columns: 3,
      gapX: 28,
      gapY: 17,
      markWidth: 26,
    },
  },
};

function planetSlots(layout: PlanetLayout, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / layout.columns);
    const itemInRow = index % layout.columns;
    const itemsBeforeRow = row * layout.columns;
    const itemsInRow = Math.min(layout.columns, count - itemsBeforeRow);
    const rowWidth = (itemsInRow - 1) * layout.gapX;

    return {
      x: layout.centerX - rowWidth / 2 + itemInRow * layout.gapX,
      y: layout.startY + row * layout.gapY,
    };
  });
}

function activateHouse(
  event: KeyboardEvent<SVGPolygonElement>,
  onActivate: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onActivate();
}

export function NorthIndianChart({
  chart,
  selectedHouse = null,
  selectedPlanetId = null,
  onSelectHouse,
  onSelectPlanet,
  className = "",
  ariaLabel,
  locale = "en",
}: VedicChartRendererProps) {
  const messages = NORTH_CHART_MESSAGES[locale];
  const titleId = useId();
  const descriptionId = useId();

  return (
    <figure className={`m-0 w-full ${className}`}>
      <svg
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        viewBox="0 0 400 400"
      >
        <title id={titleId}>{ariaLabel ?? messages.ariaLabel}</title>
        <desc id={descriptionId}>{messages.description}</desc>

        <rect
          fill="rgba(4, 7, 18, 0.66)"
          height="400"
          rx="7"
          stroke="rgba(253, 230, 138, 0.58)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          width="400"
        />

        {HOUSE_NUMBERS.map((number) => {
          const shape = NORTH_INDIAN_HOUSE_SHAPES[number];
          const house = getHouse(chart, number);
          const planets = getPlanetsForHouse(chart, number);
          const selected = selectedHouse === number;
          const label = describeHouse(house, planets, locale);

          return (
            <polygon
              aria-label={label}
              aria-pressed={onSelectHouse ? selected : undefined}
              className={`outline-none transition-[fill,stroke] focus:stroke-amber-200 ${
                selected
                  ? "fill-violet-400/15 stroke-amber-300"
                  : "fill-white/[0.02] stroke-violet-200/30 hover:fill-violet-400/10 hover:stroke-violet-200/60"
              }`}
              key={number}
              onClick={
                onSelectHouse ? () => onSelectHouse(number) : undefined
              }
              onKeyDown={
                onSelectHouse
                  ? (event) =>
                      activateHouse(event, () => onSelectHouse(number))
                  : undefined
              }
              points={shape.points}
              role={onSelectHouse ? "button" : undefined}
              strokeWidth={selected ? 2 : 0.8}
              tabIndex={onSelectHouse ? 0 : undefined}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {HOUSE_NUMBERS.map((number) => {
          const shape = NORTH_INDIAN_HOUSE_SHAPES[number];
          const house = getHouse(chart, number);
          const isAscendant = number === 1;

          return (
            <g aria-hidden="true" key={`label-${number}`} pointerEvents="none">
              {isAscendant ? (
                <text
                  fill="#fcd34d"
                  fontSize="7.5"
                  fontWeight="750"
                  letterSpacing="1.2"
                  textAnchor="middle"
                  x={shape.labelX}
                  y={shape.labelY - 13}
                >
                  {messages.lagnaShort}
                </text>
              ) : null}
              <text
                fill={selectedHouse === number ? "#fde68a" : "#c4b5fd"}
                fontSize="9.2"
                fontWeight="650"
                textAnchor={shape.labelAnchor ?? "middle"}
                x={shape.labelX}
                y={shape.labelY}
              >
                {number} ·{" "}
                {getChartRasiAbbreviation(
                  house.sign.index,
                  house.sign.name,
                  locale,
                )}
              </text>
            </g>
          );
        })}

        {HOUSE_NUMBERS.flatMap((number) => {
          const shape = NORTH_INDIAN_HOUSE_SHAPES[number];
          const planets = getPlanetsForHouse(chart, number);
          const slots = planetSlots(shape.planetLayout, planets.length);

          return planets.map((planet, index) => (
            <ChartPlanetMark
              height={12}
              key={planet.id}
              onSelect={
                onSelectPlanet
                  ? () => onSelectPlanet(planet.id)
                  : undefined
              }
              planet={planet}
              locale={locale}
              selected={selectedPlanetId === planet.id}
              width={shape.planetLayout.markWidth ?? 30}
              x={slots[index].x}
              y={slots[index].y}
            />
          ));
        })}
      </svg>
      <figcaption className="sr-only">{messages.figcaption}</figcaption>
    </figure>
  );
}

export type { VedicChartRendererProps } from "./types";
export default NorthIndianChart;
