import { Temporal } from "temporal-polyfill";

import { RASIS, type GrahaId } from "@/lib/astro/ephemeris";
import {
  getLocalizedGrahaName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import { INTL_LOCALES, type AppLocale, type TranslationValues } from "@/lib/i18n";
import type { DashaLevel } from "@/lib/timeline/dashaLevels";
import type { TransitBand } from "@/lib/timeline/gocharaBands";
import type { CurveReason, LifeCurveId } from "@/lib/timeline/lifeCurves";

import type { TimelineMessageKey } from "./timelineMessages";

export type TimelineTranslate = (key: TimelineMessageKey, values?: TranslationValues) => string;

/** Message keys use underscores; rule and band ids use hyphens. */
function key(prefix: string, id: string): TimelineMessageKey {
  return `${prefix}${id.replaceAll("-", "_")}` as TimelineMessageKey;
}

export function planetName(id: GrahaId, locale: AppLocale): string {
  return getLocalizedGrahaName(id, locale);
}

export function signName(signIndex: number, locale: AppLocale): string {
  return getLocalizedRasiName(RASIS[((signIndex % 12) + 12) % 12], locale);
}

export function levelName(level: DashaLevel, t: TimelineTranslate): string {
  return t(`level${level}` as TimelineMessageKey);
}

export function curveName(curve: LifeCurveId, t: TimelineTranslate): string {
  return t(`curve_${curve}` as TimelineMessageKey);
}

export function bandName(band: Pick<TransitBand, "id" | "planet">, t: TimelineTranslate, locale: AppLocale): string {
  return t(key("bandName_", band.id), { planet: planetName(band.planet, locale) });
}

export function bandText(
  band: Pick<TransitBand, "id" | "planet" | "house">,
  t: TimelineTranslate,
  locale: AppLocale,
): string {
  return t(key("bandText_", band.id), {
    planet: planetName(band.planet, locale),
    house: band.house ?? "",
  });
}

/** One rule contribution as a sentence in the interface language. */
export function reasonText(reason: CurveReason, t: TimelineTranslate, locale: AppLocale): string {
  const values: Record<string, string | number> = {};
  if (reason.planet) values.planet = planetName(reason.planet, locale);
  if (reason.blocker) values.blocker = planetName(reason.blocker, locale);
  if (reason.house !== undefined) values.house = reason.house;
  if (reason.vedhaHouse !== undefined) values.vedhaHouse = reason.vedhaHouse;
  if (reason.bindus !== undefined) values.bindus = reason.bindus;
  if (reason.points !== undefined) values.points = reason.points;
  if (reason.phase) values.phase = t(`phase_${reason.phase}` as TimelineMessageKey);
  if (reason.level !== undefined) values.level = t(`levelLord${reason.level}` as TimelineMessageKey);
  if (reason.nature) values.nature = t(`nature_${reason.nature}` as TimelineMessageKey);
  return t(key("reason_", reason.kind), values);
}

export function formatSigned(value: number, locale: AppLocale): string {
  const absolute = new Intl.NumberFormat(INTL_LOCALES[locale], { maximumFractionDigits: 0 }).format(
    Math.abs(value),
  );
  if (value > 0) return `+${absolute}`;
  if (value < 0) return `−${absolute}`;
  return absolute;
}

export function formatNumber(value: number, locale: AppLocale, digits = 0): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(
  ms: number,
  timeZone: string,
  locale: AppLocale,
  withTime = false,
): string {
  const cacheKey = `${locale}|${timeZone}|${withTime}`;
  let formatter = dateFormatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      timeZone,
    });
    dateFormatters.set(cacheKey, formatter);
  }
  return formatter.format(new Date(ms));
}
