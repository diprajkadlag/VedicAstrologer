"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import type { GrahaPosition } from "@/lib/astro/ephemeris";
import { getLocalizedGrahaName } from "../../lib/astro/localizedNames";
import { defineMessages, type AppLocale } from "../../lib/i18n";

import {
  describePlanet,
  PLANET_PRESENTATION,
} from "./chart-utils";

const MARK_MESSAGES = defineMessages({
  en: { retrogradeShort: "R" },
  hi: { retrogradeShort: "व" },
  mr: { retrogradeShort: "व" },
  de: { retrogradeShort: "R" },
});

interface ChartPlanetMarkProps {
  planet: GrahaPosition;
  x: number;
  y: number;
  selected: boolean;
  onSelect?: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
  locale?: AppLocale;
}

export function ChartPlanetMark({
  planet,
  x,
  y,
  selected,
  onSelect,
  width = 30,
  height = 13,
  fontSize = 8.2,
  locale = "en",
}: ChartPlanetMarkProps) {
  const presentation = PLANET_PRESENTATION[planet.id];
  const label = describePlanet(planet, locale);
  const shortName =
    locale === "en"
      ? presentation.abbreviation
      : getLocalizedGrahaName(planet.id, locale);

  function selectFromMouse(event: MouseEvent<SVGGElement>) {
    event.stopPropagation();
    onSelect?.();
  }

  function selectFromKeyboard(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.();
  }

  return (
    <g
      aria-label={label}
      aria-pressed={onSelect ? selected : undefined}
      className="group outline-none"
      onClick={onSelect ? selectFromMouse : undefined}
      onKeyDown={onSelect ? selectFromKeyboard : undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      transform={`translate(${x - width / 2} ${y - height / 2})`}
    >
      <title>{label}</title>
      <rect
        className="transition-[fill,stroke] group-hover:stroke-white/50 group-focus:stroke-amber-200"
        fill={selected ? `${presentation.color}2b` : "rgba(3, 7, 18, 0.58)"}
        height={height}
        rx={height / 2}
        stroke={selected ? presentation.color : "rgba(255,255,255,0.14)"}
        strokeWidth={selected ? 1.35 : 0.6}
        vectorEffect="non-scaling-stroke"
        width={width}
      />
      <text
        aria-hidden="true"
        dominantBaseline="middle"
        fill={presentation.color}
        fontSize={locale === "en" ? fontSize : Math.min(fontSize, 7.4)}
        fontWeight="650"
        textAnchor="middle"
        x={width / 2}
        y={height / 2 + 0.25}
      >
        {presentation.glyph} {shortName}
        {planet.retrograde
          ? ` ${MARK_MESSAGES[locale].retrogradeShort}`
          : ""}
      </text>
    </g>
  );
}
