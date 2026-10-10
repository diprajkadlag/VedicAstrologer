"use client";

import { useMemo } from "react";
import { CalendarDays, ChevronDown, Sparkles } from "lucide-react";

import { dashaSynthesis } from "@/lib/astro/dashaText";
import {
  GRAHA_IDS,
  calculateLongitudeSpeed,
  calculateSiderealLongitude,
  type GrahaId,
} from "@/lib/astro/ephemeris";
import type { AppLocale } from "@/lib/i18n";
import { dashaStackAt, type DashaClock } from "@/lib/timeline/dashaLevels";
import { YEAR_MS, type ZoomLevel } from "@/lib/timeline/geometry";
import { houseFrom, type TransitBand } from "@/lib/timeline/gocharaBands";
import {
  LIFE_CURVE_BASELINE,
  LIFE_CURVE_IDS,
  curveBand,
  type CurveReason,
  type CurveValue,
  type LifeCurveId,
} from "@/lib/timeline/lifeCurves";
import { signIndexOfLongitude } from "@/lib/timeline/planetTimeline";

import {
  bandName,
  curveName,
  formatDate,
  formatNumber,
  formatSigned,
  levelName,
  planetName,
  reasonText,
  signName,
  type TimelineTranslate,
} from "./timelineText";
import type { TimelineMessageKey } from "./timelineMessages";
import { GRAHA_COLOR_VARS, type InspectTarget } from "./types";

export interface OnThisDateCardProps {
  readonly cursorMs: number;
  readonly birthMs: number;
  readonly timeZone: string;
  readonly locale: AppLocale;
  readonly t: TimelineTranslate;
  readonly zoom: ZoomLevel;
  readonly clock: DashaClock;
  readonly moonSign: number;
  readonly lagnaSign: number;
  readonly curves: Readonly<Record<LifeCurveId, CurveValue>> | null;
  readonly activeBands: readonly TransitBand[];
  readonly uncertaintyMinutes: number;
  readonly shiftDays: number;
  readonly mansionEdge: { readonly earlier: number; readonly later: number };
  onInspect(target: InspectTarget): void;
}

/** Below this, a slightly different birth time starts another major period. */
const MANSION_EDGE_WARNING_MINUTES = 30;

export function bandWord(value: number, t: TimelineTranslate): string {
  return t(`band_${curveBand(value)}` as TimelineMessageKey);
}

/** The strongest contribution by size, for the one-line summary. */
function mainReason(reasons: readonly CurveReason[]): CurveReason | null {
  return [...reasons].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0] ?? null;
}

export function CurveBreakdown({
  curve,
  value,
  t,
  locale,
}: {
  curve: LifeCurveId;
  value: CurveValue;
  t: TimelineTranslate;
  locale: AppLocale;
}) {
  const total = value.reasons.reduce((sum, entry) => sum + entry.contribution, 0);
  const unbounded = LIFE_CURVE_BASELINE + total;
  return (
    <details className="group rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]" data-testid={`timeline-why-${curve}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2">
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-[var(--foreground)]">{curveName(curve, t)}</span>
          <span className="block text-[11px] text-[var(--muted)]">
            {bandWord(value.value, t)} ·{" "}
            <span aria-label={t("valueAria", { curve: curveName(curve, t), value: value.value, band: bandWord(value.value, t) })}>
              {formatNumber(value.value, locale)}/100
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--accent)]">
          {t("why")}
          <ChevronDown aria-hidden="true" className="size-4 transition group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-[var(--border)] px-3 py-3 text-xs">
        <div className="flex justify-between gap-3 text-[var(--muted)]">
          <span>{t("baseline")}</span>
          <span className="font-semibold tabular-nums text-[var(--foreground)]">{LIFE_CURVE_BASELINE}</span>
        </div>
        <ul className="mt-2 space-y-2">
          {value.reasons.map((entry) => (
            <li key={entry.ruleId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
              <span className="text-[var(--foreground)]">
                {reasonText(entry, t, locale)}
                {entry.basis !== "classical" ? (
                  <span className="ml-1 text-[10px] text-[var(--muted)]">({t(`basis_${entry.basis}` as TimelineMessageKey)})</span>
                ) : null}
              </span>
              <span className="font-semibold tabular-nums text-[var(--accent)]">
                {formatSigned(entry.contribution, locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between gap-3 border-t border-[var(--border)] pt-2">
          <span className="font-semibold text-[var(--foreground)]">{t("finalValue")}</span>
          <span className="font-semibold tabular-nums text-[var(--foreground)]">
            {formatNumber(unbounded, locale)}
            {unbounded !== value.value ? ` → ${formatNumber(value.value, locale)}` : ""}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-[var(--muted)]">{t("clampNote")}</p>
      </div>
    </details>
  );
}

export default function OnThisDateCard({
  cursorMs,
  birthMs,
  timeZone,
  locale,
  t,
  zoom,
  clock,
  moonSign,
  lagnaSign,
  curves,
  activeBands,
  uncertaintyMinutes,
  shiftDays,
  mansionEdge,
  onInspect,
}: OnThisDateCardProps) {
  const stack = useMemo(() => dashaStackAt(clock, cursorMs), [clock, cursorMs]);
  const shownLevels = zoom === "micro" ? 4 : 3;

  // Exact positions at the inspected instant; cheap, and independent of the
  // worker, so the card is right even before the long-range tables arrive.
  const bodies = useMemo(() => {
    const instant = new Date(cursorMs);
    return GRAHA_IDS.map((id: GrahaId) => {
      const sign = signIndexOfLongitude(calculateSiderealLongitude(id, instant));
      return {
        id,
        sign,
        lagnaHouse: houseFrom(sign, lagnaSign),
        moonHouse: houseFrom(sign, moonSign),
        retrograde: calculateLongitudeSpeed(id, instant) < 0,
      };
    });
  }, [cursorMs, lagnaSign, moonSign]);

  // The band marks Jupiter's favourable house by sign; at finer zoom levels
  // a body in the obstruction (Vedha) house can cancel it, and the curves say so.
  const jupiterBlocker = curves
    ? LIFE_CURVE_IDS.flatMap((curve) => curves[curve].reasons).find(
        (entry) => entry.kind === "gochara-vedha" && entry.planet === "jupiter",
      )?.blocker ?? null
    : null;

  const ageYears = (cursorMs - birthMs) / YEAR_MS;
  const major = stack[0];
  const minor = stack[1];
  const meaning = major && minor ? dashaSynthesis(major.lord, minor.lord, locale) : null;

  const synthesis: string[] = [];
  if (major && minor) {
    synthesis.push(
      t("synthesisPeriods", {
        major: planetName(major.lord, locale),
        minor: planetName(minor.lord, locale),
      }),
    );
    if (meaning) synthesis.push(meaning.summary);
  }
  if (curves) {
    const emotional = curves.emotional;
    const reason = mainReason(emotional.reasons);
    synthesis.push(
      t("synthesisEmotional", {
        band: bandWord(emotional.value, t).toLocaleLowerCase(),
        reason: reason ? reasonText(reason, t, locale) : t("synthesisNoReason"),
      }),
      t("synthesisPractical", {
        career: bandWord(curves.career.value, t).toLocaleLowerCase(),
        relationship: bandWord(curves.relationship.value, t).toLocaleLowerCase(),
      }),
    );
  }
  if (activeBands.length > 0) {
    synthesis.push(
      t("synthesisPatterns", {
        patterns: activeBands.map((band) => bandName(band, t, locale)).join(", "),
      }),
    );
  }
  if (meaning) synthesis.push(t("synthesisFocus", { focus: meaning.constructive }));

  return (
    <article
      aria-labelledby="timeline-card-title"
      data-testid="timeline-card"
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <header>
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <CalendarDays aria-hidden="true" className="size-4" />
          <h3 id="timeline-card-title" className="text-sm font-semibold text-[var(--foreground)]">
            {t("cardTitle")}
          </h3>
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]" data-testid="timeline-card-date">
          {t("cardDate", { date: formatDate(cursorMs, timeZone, locale), zone: timeZone })}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {ageYears >= 0 ? t("age", { years: formatNumber(ageYears, locale, 1) }) : t("beforeBirth")}
        </p>
      </header>

      <section aria-label={t("dashaTitle")}>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("dashaTitle")}</h4>
        <ul className="mt-2 space-y-1.5" data-testid="timeline-dasha-stack">
          {stack.slice(0, shownLevels).map((periodSpan) => (
            <li key={periodSpan.level}>
              <button
                type="button"
                onClick={() => onInspect({ kind: "dasha", span: periodSpan })}
                className="flex min-h-10 w-full items-start gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs transition hover:bg-[var(--surface-muted)]"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ background: GRAHA_COLOR_VARS[periodSpan.lord] }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block">
                    <span className="text-[var(--muted)]">{levelName(periodSpan.level, t)}</span>
                    {" · "}
                    <span className="font-semibold text-[var(--foreground)]">{planetName(periodSpan.lord, locale)}</span>
                  </span>
                  <span className="block tabular-nums text-[var(--muted)]">
                    {t("periodRange", {
                      start: formatDate(periodSpan.startMs, timeZone, locale),
                      end: formatDate(periodSpan.endMs, timeZone, locale),
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {zoom !== "micro" ? <p className="mt-1.5 text-[11px] text-[var(--muted)]">{t("zoomInForFiner")}</p> : null}
        <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]" data-testid="timeline-birth-time-note">
          {t("birthTimeNote", {
            minutes: uncertaintyMinutes,
            days: formatNumber(shiftDays, locale, shiftDays < 10 ? 1 : 0),
          })}
        </p>
        {Math.min(mansionEdge.earlier, mansionEdge.later) < MANSION_EDGE_WARNING_MINUTES ? (
          <p className="mt-1 text-[11px] font-medium leading-5 text-[var(--band-friction-text)]">
            {t("mansionEdgeNote", {
              minutes: formatNumber(Math.min(mansionEdge.earlier, mansionEdge.later), locale),
              direction: mansionEdge.earlier < mansionEdge.later ? t("earlier") : t("later"),
            })}
          </p>
        ) : null}
        {zoom === "micro" ? <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{t("sookshmaNote")}</p> : null}
      </section>

      <section aria-label={t("curvesTitle")}>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("curvesTitle")}</h4>
        {curves ? (
          <div className="mt-2 space-y-2">
            {LIFE_CURVE_IDS.map((curve) => (
              <CurveBreakdown key={curve} curve={curve} value={curves[curve]} t={t} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted)]">{t("curvesLoading")}</p>
        )}
        <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{t("healthNote")}</p>
      </section>

      <section aria-label={t("activeBandsTitle")}>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("activeBandsTitle")}</h4>
        {activeBands.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {activeBands.map((band) => (
              <li key={`${band.id}-${band.startMs}`}>
                <button
                  type="button"
                  onClick={() => onInspect({ kind: "band", band })}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ background: band.tone === "friction" ? "var(--band-friction)" : "var(--band-expansion)" }}
                  />
                  {bandName(band, t, locale)}
                  {band.id === "jupiter-favourable" && jupiterBlocker ? (
                    <span className="text-[var(--muted)]">
                      {" · "}
                      {t("bandObstructed", { blocker: planetName(jupiterBlocker, locale) })}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted)]">{t("noBands")}</p>
        )}
      </section>

      <section aria-label={t("planetsTitle")}>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("planetsTitle")}</h4>
        <table className="mt-2 w-full text-left text-xs" data-testid="timeline-bodies">
          <thead className="text-[10px] text-[var(--muted)]">
            <tr>
              <th className="py-1 pr-2 font-medium">{t("layerBodies")}</th>
              <th className="py-1 pr-2 font-medium">{t("columnSign")}</th>
              <th className="py-1 font-medium" title={t("housesHeaderHint")}>
                {t("columnHouses")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {bodies.map((body) => (
              <tr key={body.id}>
                <td className="py-0.5 pr-2">
                  <button
                    type="button"
                    onClick={() => onInspect({ kind: "planet", planet: body.id, ms: cursorMs })}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md text-left font-semibold text-[var(--foreground)] hover:underline"
                  >
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: GRAHA_COLOR_VARS[body.id] }} />
                    {planetName(body.id, locale)}
                    {body.retrograde ? (
                      <abbr title={t("retrograde")} className="font-normal text-[var(--band-friction-text)] no-underline">
                        R
                      </abbr>
                    ) : null}
                  </button>
                </td>
                <td className="py-0.5 pr-2 text-[var(--foreground)]">{signName(body.sign, locale)}</td>
                <td className="py-0.5 tabular-nums text-[var(--muted)]">
                  {t("housesShort", { lagnaHouse: body.lagnaHouse, moonHouse: body.moonHouse })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          {t("columnHouses")}: {t("housesHeaderHint")}
        </p>
      </section>

      {synthesis.length > 0 ? (
        <section aria-label={t("synthesisTitle")} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
            <Sparkles aria-hidden="true" className="size-3.5 text-[var(--accent)]" />
            {t("synthesisTitle")}
          </h4>
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]" data-testid="timeline-synthesis">
            {synthesis.join(" ")}
          </p>
        </section>
      ) : null}
    </article>
  );
}
