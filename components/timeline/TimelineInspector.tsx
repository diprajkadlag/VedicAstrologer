"use client";

import { useEffect, useRef, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { isAshtakavargaPlanet, type Ashtakavarga } from "@/lib/astro/ashtakavarga";
import { dashaSynthesis } from "@/lib/astro/dashaText";
import { GRAHA_EDUCATION, readLocalized } from "@/lib/astro/education";
import {
  calculateLongitudeSpeed,
  calculateSiderealLongitude,
} from "@/lib/astro/ephemeris";
import type { AppLocale } from "@/lib/i18n";
import { dashaStackAt, spanLengthDays, type DashaClock } from "@/lib/timeline/dashaLevels";
import { bandsAt, houseFrom, type TransitBand } from "@/lib/timeline/gocharaBands";
import {
  LIFE_CURVE_IDS,
  reasonDifference,
  type CurveReason,
  type CurveValue,
  type LifeCurveId,
} from "@/lib/timeline/lifeCurves";
import { segmentAt, signIndexOfLongitude, type MotionSegment } from "@/lib/timeline/planetTimeline";

import { CurveBreakdown, bandWord } from "./OnThisDateCard";
import {
  bandName,
  bandText,
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
import type { InspectTarget } from "./types";

const subscribeToNothing = () => () => undefined;

const INPUTS_WITHOUT_ESCAPE = new Set(["button", "checkbox", "image", "radio", "range", "reset", "submit"]);

/** Text fields, date pickers and selects use Escape themselves. */
function handlesEscapeItself(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }
  return target instanceof HTMLInputElement && !INPUTS_WITHOUT_ESCAPE.has(target.type);
}

export interface TimelineInspectorProps {
  /**
   * "sheet": a modal bottom sheet for phones and tablets. "panel": a docked
   * section in the card column at 1024 px and wider, so it covers no control
   * and keeps the page's Tab order.
   */
  readonly variant: "sheet" | "panel";
  readonly target: InspectTarget | null;
  readonly locale: AppLocale;
  readonly t: TimelineTranslate;
  readonly timeZone: string;
  readonly clock: DashaClock;
  readonly moonSign: number;
  readonly lagnaSign: number;
  readonly ashtakavarga: Ashtakavarga;
  readonly segments: Readonly<Partial<Record<string, readonly MotionSegment[]>>>;
  readonly bands: readonly TransitBand[];
  curvesAt(ms: number): Readonly<Record<LifeCurveId, CurveValue>> | null;
  onClose(): void;
  onGoTo(ms: number): void;
}

/** Which curve rules a band stands for, so the inspector can name the lanes it moves. */
function reasonMatchesBand(reason: CurveReason, band: TransitBand): boolean {
  switch (band.id) {
    case "sade-sati-rising":
    case "sade-sati-peak":
    case "sade-sati-setting":
      return reason.kind === "sade-sati";
    case "ashtama-shani":
      return reason.kind === "ashtama-shani";
    case "kantaka-shani":
      return reason.kind === "kantaka-shani";
    case "rahu-friction":
      return reason.planet === "rahu" && (reason.kind === "rahu-friction" || reason.kind === "node-over-moon");
    case "ketu-over-moon":
      return reason.planet === "ketu" && reason.kind === "node-over-moon";
    case "rahu-over-lagna":
    case "ketu-over-lagna":
      return reason.kind === "nodes-on-axis";
    case "mars-retrograde":
    case "venus-retrograde":
    case "mercury-retrograde":
      return reason.kind === "retrograde" && reason.planet === band.planet;
    case "jupiter-favourable":
      return reason.planet === "jupiter" && (reason.kind === "gochara-good" || reason.kind === "gochara-vedha");
  }
}

function durationText(days: number, t: TimelineTranslate, locale: AppLocale): string {
  if (days >= 730) return t("durationYears", { value: formatNumber(days / 365.25, locale, 1) });
  if (days >= 2) return t("durationDays", { value: formatNumber(days, locale, days < 20 ? 1 : 0) });
  return t("durationHours", { value: formatNumber(days * 24, locale, 1) });
}

export default function TimelineInspector({
  variant,
  target,
  locale,
  t,
  timeZone,
  clock,
  moonSign,
  lagnaSign,
  ashtakavarga,
  segments,
  bands,
  curvesAt,
  onClose,
  onGoTo,
}: TimelineInspectorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const isClient = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  // Sheet: open and close the modal dialog with the target.
  useEffect(() => {
    if (variant !== "sheet") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (target && !dialog.open) {
      returnFocusRef.current = document.activeElement;
      dialog.showModal();
    } else if (!target && dialog.open) {
      dialog.close();
    }
  }, [target, variant]);

  // Sheet: the page behind a modal sheet must not scroll.
  useEffect(() => {
    if (variant !== "sheet" || !target) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [target, variant]);

  useEffect(() => {
    if (variant !== "sheet") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      const previous = returnFocusRef.current;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, variant]);

  // Panel: focus its heading for each new target, close on Escape from the
  // page (not from a dialog or a field that uses Escape itself), and give
  // focus back when it closes.
  useEffect(() => {
    if (variant !== "panel" || !target) return;
    if (!returnFocusRef.current) returnFocusRef.current = document.activeElement;
    panelHeadingRef.current?.focus();
  }, [target, variant]);

  useEffect(() => {
    if (variant !== "panel") return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // Escape that closes a dialog, a date picker or a list, or clears a
      // search field, belongs to that control and leaves the panel open.
      if (document.querySelector("dialog[open]") || handlesEscapeItself(event.target)) return;
      onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, variant]);

  useEffect(() => {
    if (variant !== "panel") return;
    return () => {
      const previous = returnFocusRef.current;
      returnFocusRef.current = null;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [variant]);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  const houses = (signIndex: number) =>
    t("housesDetail", {
      lagnaHouse: houseFrom(signIndex, lagnaSign),
      moonHouse: houseFrom(signIndex, moonSign),
    });

  let title = t("inspectorTitle");
  let body: ReactNode = null;
  let range: { startMs: number; endMs: number } | null = null;

  if (target?.kind === "dasha") {
    const span = target.span;
    title = t("dashaInspectorTitle", { level: levelName(span.level, t), lord: planetName(span.lord, locale) });
    range = { startMs: span.startMs, endMs: span.endMs };
    const profile = GRAHA_EDUCATION[span.lord];
    const parent = span.path.length > 1 ? span.path[span.path.length - 2] : null;
    const pairing = parent ? dashaSynthesis(parent, span.lord, locale) : null;
    body = (
      <>
        <p className="text-xs text-[var(--muted)]">{durationText(spanLengthDays(span), t, locale)}</p>
        <p className="text-sm leading-6 text-[var(--foreground)]">
          <strong>{t("signifiesLabel")}:</strong> {readLocalized(profile.signifies, locale)}
        </p>
        {pairing ? <p className="text-sm leading-6 text-[var(--muted)]">{pairing.summary}</p> : null}
        <p className="text-xs leading-5 text-emerald-700 dark:text-emerald-300/80">
          <strong>{t("constructiveLabel")}:</strong> {pairing?.constructive ?? readLocalized(profile.constructive, locale)}
        </p>
        <p className="text-xs leading-5 text-rose-700 dark:text-rose-300/80">
          <strong>{t("cautionLabel")}:</strong> {pairing?.caution ?? readLocalized(profile.caution, locale)}
        </p>
        <p className="text-xs leading-5 text-[var(--muted)]">
          <strong>{t("reflectionLabel")}:</strong> {pairing?.inquiry ?? readLocalized(profile.inquiry, locale)}
        </p>
      </>
    );
  } else if (target?.kind === "band") {
    const band = target.band;
    title = bandName(band, t, locale);
    range = { startMs: band.startMs, endMs: band.endMs };
    const middle = (band.startMs + band.endMs) / 2;
    const curves = curvesAt(Math.min(Math.max(middle, band.startMs), band.endMs - 1));
    const affected = curves
      ? LIFE_CURVE_IDS.flatMap((curve) =>
          curves[curve].reasons
            .filter((reason) => reasonMatchesBand(reason, band))
            .map((reason) => ({ curve, reason })),
        )
      : [];
    body = (
      <>
        <p className="inline-flex rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
          {t(`basis_${band.basis}` as TimelineMessageKey)}
        </p>
        <p className="text-sm leading-6 text-[var(--foreground)]">{bandText(band, t, locale)}</p>
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("lanesAffected")}</h3>
          {affected.length > 0 ? (
            <ul className="mt-1.5 space-y-1 text-xs">
              {affected.map(({ curve, reason }) => (
                <li key={`${curve}-${reason.ruleId}`} className="flex justify-between gap-3">
                  <span className="text-[var(--foreground)]">{curveName(curve, t)}</span>
                  <span className="font-semibold tabular-nums text-[var(--accent)]">{formatSigned(reason.contribution, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--muted)]">{t("noLanesAffected")}</p>
          )}
        </section>
        <p className="text-[11px] leading-5 text-[var(--muted)]">{t("bandsNote")}</p>
      </>
    );
  } else if (target?.kind === "planet" || target?.kind === "station" || target?.kind === "ingress") {
    const instant = new Date(target.ms);
    const sign = signIndexOfLongitude(calculateSiderealLongitude(target.planet, instant));
    const retrograde = calculateLongitudeSpeed(target.planet, new Date(target.ms + 60 * 60_000)) < 0;
    const segment = segments[target.planet] ? segmentAt(segments[target.planet]!, target.ms) : undefined;
    const bindus = isAshtakavargaPlanet(target.planet) ? ashtakavarga.bhinna[target.planet][sign] : null;
    title =
      target.kind === "station"
        ? t("stationTitle", {
            planet: planetName(target.planet, locale),
            direction: target.turns === "retrograde" ? t("turnsRetrograde") : t("turnsDirect"),
          })
        : t("planetInspectorTitle", { planet: planetName(target.planet, locale), sign: signName(sign, locale) });
    if (segment) range = { startMs: segment.startMs, endMs: segment.endMs };
    body = (
      <>
        <p className="text-xs text-[var(--muted)]">{formatDate(target.ms, timeZone, locale, true)}</p>
        <p className="text-sm leading-6 text-[var(--foreground)]">
          {signName(sign, locale)} · {retrograde ? t("turnsRetrograde") : t("turnsDirect")}
        </p>
        <p className="text-sm leading-6 text-[var(--foreground)]">{houses(sign)}</p>
        {bindus !== null ? (
          <p className="text-xs leading-5 text-[var(--muted)]">
            {t("bavLine", { bindus, planet: planetName(target.planet, locale) })}
          </p>
        ) : null}
        <p className="text-xs leading-5 text-[var(--muted)]">
          <strong>{t("signifiesLabel")}:</strong> {readLocalized(GRAHA_EDUCATION[target.planet].signifies, locale)}
        </p>
      </>
    );
  } else if (target?.kind === "curve") {
    const curves = curvesAt(target.ms);
    title = t("curveInspectorTitle", { curve: curveName(target.curve, t), date: formatDate(target.ms, timeZone, locale) });
    body = curves ? (
      <CurveBreakdown curve={target.curve} value={curves[target.curve]} t={t} locale={locale} />
    ) : (
      <p className="text-xs text-[var(--muted)]">{t("curvesLoading")}</p>
    );
  } else if (target?.kind === "change") {
    const before = curvesAt(target.ms - 1)?.[target.curve];
    const after = curvesAt(target.ms + 1)?.[target.curve];
    const delta = before && after ? after.value - before.value : 0;
    title = t("changeTitle", { curve: curveName(target.curve, t), delta: formatSigned(delta, locale) });
    const difference = before && after ? reasonDifference(before.reasons, after.reasons) : null;
    body = (
      <>
        <p className="text-xs text-[var(--muted)]">{formatDate(target.ms, timeZone, locale, true)}</p>
        {before && after ? (
          <p className="text-sm text-[var(--foreground)]">
            {bandWord(before.value, t)} {formatNumber(before.value, locale)} → {bandWord(after.value, t)}{" "}
            {formatNumber(after.value, locale)}
          </p>
        ) : null}
        {difference ? (
          <ul className="space-y-1.5 text-xs">
            {difference.added.map((reason) => (
              <li key={`add-${reason.ruleId}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2">
                <span className="font-semibold text-[var(--band-expansion-text)]">{t("changeAdded")}</span>
                <span className="text-[var(--foreground)]">{reasonText(reason, t, locale)}</span>
                <span className="font-semibold tabular-nums text-[var(--accent)]">{formatSigned(reason.contribution, locale)}</span>
              </li>
            ))}
            {difference.removed.map((reason) => (
              <li key={`remove-${reason.ruleId}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2">
                <span className="font-semibold text-[var(--band-friction-text)]">{t("changeRemoved")}</span>
                <span className="text-[var(--muted)] line-through decoration-1">{reasonText(reason, t, locale)}</span>
                <span className="font-semibold tabular-nums text-[var(--muted)]">{formatSigned(reason.contribution, locale)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-[11px] leading-5 text-[var(--muted)]">{t("lanesCaption")}</p>
      </>
    );
  } else if (target?.kind === "event") {
    const event = target.event;
    const stack = dashaStackAt(clock, event.ms);
    const active = bandsAt(bands, event.ms);
    title = event.label;
    body = (
      <>
        <p className="text-xs text-[var(--muted)]">
          {t("eventInspectorTitle")} · {t(`category_${event.category}` as TimelineMessageKey)} · {formatDate(event.ms, timeZone, locale)}
        </p>
        <ul className="space-y-1 text-xs">
          {stack.slice(0, 3).map((periodSpan) => (
            <li key={periodSpan.level} className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">{levelName(periodSpan.level, t)}</span>
              <span className="font-semibold text-[var(--foreground)]">{planetName(periodSpan.lord, locale)}</span>
            </li>
          ))}
        </ul>
        {active.length > 0 ? (
          <p className="text-xs text-[var(--foreground)]">
            {t("synthesisPatterns", { patterns: active.map((band) => bandName(band, t, locale)).join(", ") })}
          </p>
        ) : (
          <p className="text-xs text-[var(--muted)]">{t("noBands")}</p>
        )}
      </>
    );
    range = { startMs: event.ms, endMs: event.ms };
  }

  const details = (
    <>
      {range && range.endMs > range.startMs ? (
        <p className="text-xs tabular-nums text-[var(--muted)]">
          {t("periodRange", {
            start: formatDate(range.startMs, timeZone, locale),
            end: formatDate(range.endMs, timeZone, locale),
          })}
        </p>
      ) : null}
      <div className="space-y-3">{body}</div>
      {range ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => onGoTo(range!.startMs)}
            className="min-h-10 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
          >
            {range.endMs > range.startMs ? t("goToStart") : t("jump")}
          </button>
          {range.endMs > range.startMs ? (
            <button
              type="button"
              onClick={() => onGoTo(Math.max(range!.startMs, range!.endMs - 1))}
              className="min-h-10 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              {t("goToEnd")}
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="border-t border-[var(--border)] pt-3 text-[11px] leading-5 text-[var(--muted)]">{t("footer")}</p>
    </>
  );

  if (variant === "panel") {
    if (!target) return null;
    return (
      <section
        aria-labelledby="timeline-inspector-title"
        data-testid="timeline-inspector"
        className="relative space-y-3 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] p-4"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
        <h2
          id="timeline-inspector-title"
          ref={panelHeadingRef}
          tabIndex={-1}
          className="pr-12 text-base font-semibold text-[var(--foreground)] outline-none"
        >
          {title}
        </h2>
        {details}
      </section>
    );
  }

  if (!isClient) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="timeline-inspector-title"
      data-testid="timeline-inspector"
      onClick={closeFromBackdrop}
      className="fixed inset-x-0 bottom-0 top-auto z-50 m-0 max-h-[72dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[24px] border border-[var(--border)] bg-[var(--surface)] p-0 text-left text-[var(--foreground)] shadow-2xl shadow-black/30 backdrop:bg-black/50 dark:bg-[#0d1020]"
    >
      <article className="relative space-y-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-[var(--border)]" />
        <form method="dialog" className="absolute right-3 top-3">
          <button
            type="submit"
            aria-label={t("close")}
            className="grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </form>
        <h2 id="timeline-inspector-title" className="pr-14 text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        {details}
      </article>
    </dialog>,
    document.body,
  );
}
