"use client";

import { memo, useCallback, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Baby,
  CalendarRange,
  ChartSpline,
  ChevronLeft,
  ChevronRight,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  Table2,
  X,
} from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import { useContainerWidth } from "@/components/ui/useContainerWidth";
import { calculateAshtakavarga, isAshtakavargaPlanet } from "@/lib/astro/ashtakavarga";
import type { GrahaId, VedicChart } from "@/lib/astro/ephemeris";
import {
  boundaryShiftDays,
  createDashaClock,
  dashaSpansInRange,
  dashaStackAt,
  minutesToMansionEdge,
  type DashaLevel,
} from "@/lib/timeline/dashaLevels";
import {
  DEFAULT_SPAN_MS,
  MAX_MS_PER_PIXEL,
  YEAR_MS,
  computeLayout,
  largestChanges,
  panWindow,
  revealInstant,
  spanOf,
  windowAround,
  zoomLevelForSpan,
  zoomWindow,
  type TimeWindow,
  type ZoomLevel,
} from "@/lib/timeline/geometry";
import {
  bandVisibleAt,
  bandsAt,
  houseFrom,
  transitBands,
} from "@/lib/timeline/gocharaBands";
import {
  LIFE_CURVE_IDS,
  ZOOM_DASHA_LEVEL,
  ZOOM_PLANETS,
  createNatalCurveContext,
  lifeCurveSteps,
  lifeCurvesAt,
  type LifeCurveId,
} from "@/lib/timeline/lifeCurves";
import {
  forgetSavedLifeEvents,
  lifeEventStorageKey,
  loadSavedLifeEvents,
  saveLifeEvents,
  sortLifeEvents,
  type LifeEvent,
} from "@/lib/timeline/lifeEvents";
import {
  DAY_MS,
  computeMoonWindow,
  motionSegments,
  type MotionSegment,
  type PlanetTimeline,
} from "@/lib/timeline/planetTimeline";

import LifeEventsPanel from "./LifeEventsPanel";
import OnThisDateCard from "./OnThisDateCard";
import TimelineInspector from "./TimelineInspector";
import TimelinePlotView from "./TimelinePlot";
import { TIMELINE_MESSAGES } from "./timelineMessages";
import {
  bandName,
  curveName,
  formatDate,
  formatSigned,
  levelName,
  planetName,
  signName,
  type TimelineTranslate,
} from "./timelineText";
import { GRAHA_COLOR_VARS, LEGEND_ORDER, type InspectTarget } from "./types";
import { useMoonWindow, useTimelineData } from "./useTimelineData";

/** The timeline runs from birth to this many years after it. */
export const LIFE_SPAN_YEARS = 100;
const UNCERTAINTY_OPTIONS = [1, 5, 15] as const;
const TABLE_ROW_LIMIT = 200;
/** While scrubbing, the 3D view and charts follow at most this often. */
const PUSH_INTERVAL_MS = 100;

/** The plot re-renders for every cursor move; memo keeps its heavy layers. */
const TimelinePlot = memo(TimelinePlotView);

function subscribeToWideScreen(onChange: () => void): () => void {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True at 1024 px and wider, where the inspector docks beside the plot. */
function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribeToWideScreen,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

interface LayerState {
  readonly hidden: readonly GrahaId[];
  readonly ribbon: boolean;
  readonly bands: boolean;
  readonly curves: readonly LifeCurveId[];
  readonly events: boolean;
  readonly natal: boolean;
  readonly sarva: boolean;
  readonly houseReference: "lagna" | "moon";
  readonly uncertainty: (typeof UNCERTAINTY_OPTIONS)[number];
}

const DEFAULT_LAYERS: LayerState = {
  hidden: [],
  ribbon: true,
  bands: true,
  curves: LIFE_CURVE_IDS,
  events: true,
  natal: true,
  sarva: false,
  houseReference: "lagna",
  uncertainty: 5,
};

export interface LifeTimelineProps {
  readonly natalChart: VedicChart;
  readonly birthInstant: Date;
  readonly timeZone: string;
  /** "Now", refreshed by the page; the timeline opens here. */
  readonly todayInstant: Date;
  /** The instant shown by the 3D view and the charts. */
  readonly selectedInstant: Date;
  /** Who set selectedInstant last; the timeline ignores its own echoes. */
  readonly selectionSource: "timeline" | "other";
  /**
   * The number of the change request that set selectedInstant. Every request
   * gets a larger number than the one before.
   */
  readonly selectionRevision: number;
  /** Asks for a new shared instant and returns the number of the request. */
  onSelectInstant(instant: Date, source: "timeline"): number;
}

interface ChangeRow {
  readonly key: string;
  readonly ms: number;
  readonly text: string;
  readonly houses: string;
  readonly target: InspectTarget;
}

function ToolbarButton({
  label,
  onClick,
  children,
  pressed,
  testId,
  showLabel = false,
  popup = false,
}: {
  label: string;
  onClick(): void;
  children: ReactNode;
  pressed?: boolean;
  testId?: string;
  showLabel?: boolean;
  popup?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      aria-haspopup={popup ? "dialog" : undefined}
      title={label}
      data-testid={testId}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition ${
        pressed
          ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]"
          : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
      }`}
    >
      {children}
      {showLabel ? <span className="hidden sm:inline">{label}</span> : null}
    </button>
  );
}

function LayersDialog({
  open,
  layers,
  onChange,
  onClose,
  t,
  locale,
}: {
  open: boolean;
  layers: LayerState;
  onChange(next: LayerState): void;
  onClose(): void;
  t: TimelineTranslate;
  locale: ReturnType<typeof useAppPreferences>["locale"];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const setDialog = useCallback(
    (dialog: HTMLDialogElement | null) => {
      dialogRef.current = dialog;
      if (!dialog) return;
      if (open && !dialog.open) dialog.showModal();
      if (!open && dialog.open) dialog.close();
    },
    [open],
  );

  const toggle = <K extends keyof LayerState>(key: K, value: LayerState[K]) => onChange({ ...layers, [key]: value });
  const checkbox = (label: string, checked: boolean, onToggle: (next: boolean) => void, key: string) => (
    <label key={key} className="flex min-h-10 items-center gap-2 text-sm text-[var(--foreground)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(event.target.checked)}
        className="size-5 shrink-0 accent-[var(--accent)]"
      />
      {label}
    </label>
  );

  return (
    <dialog
      ref={setDialog}
      aria-labelledby="timeline-layers-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto max-h-[min(86dvh,720px)] w-[min(94vw,32rem)] overflow-y-auto rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/50 dark:bg-[#0d1020]"
    >
      <div className="relative space-y-4 p-5">
        <form method="dialog" className="absolute right-3 top-3">
          <button
            type="submit"
            aria-label={t("close")}
            className="grid size-11 place-items-center rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </form>
        <h2 id="timeline-layers-title" className="pr-14 text-lg font-semibold">
          {t("layersTitle")}
        </h2>

        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("layerBodies")}</legend>
          <div className="grid grid-cols-2 gap-x-3">
            {LEGEND_ORDER.map((id) =>
              checkbox(
                planetName(id, locale),
                !layers.hidden.includes(id),
                (visible) =>
                  toggle(
                    "hidden",
                    visible ? layers.hidden.filter((entry) => entry !== id) : [...layers.hidden, id],
                  ),
                `body-${id}`,
              ),
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("layerCurves")}</legend>
          {LIFE_CURVE_IDS.map((curve) =>
            checkbox(
              t(`curve_${curve}`),
              layers.curves.includes(curve),
              (visible) =>
                toggle(
                  "curves",
                  visible
                    ? LIFE_CURVE_IDS.filter((entry) => entry === curve || layers.curves.includes(entry))
                    : layers.curves.filter((entry) => entry !== curve),
                ),
              `curve-${curve}`,
            ),
          )}
        </fieldset>

        <fieldset className="space-y-1">
          {checkbox(t("layerRibbon"), layers.ribbon, (value) => toggle("ribbon", value), "ribbon")}
          {checkbox(t("layerBands"), layers.bands, (value) => toggle("bands", value), "bands")}
          {checkbox(t("layerEvents"), layers.events, (value) => toggle("events", value), "events")}
          {checkbox(t("layerNatal"), layers.natal, (value) => toggle("natal", value), "natal")}
          {checkbox(t("layerSarva"), layers.sarva, (value) => toggle("sarva", value), "sarva")}
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("houseReference")}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(["lagna", "moon"] as const).map((reference) => (
              <label key={reference} className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="timeline-house-reference"
                  checked={layers.houseReference === reference}
                  onChange={() => toggle("houseReference", reference)}
                  className="size-5 accent-[var(--accent)]"
                />
                {reference === "lagna" ? t("fromAscendant") : t("fromMoon")}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("uncertainty")}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {UNCERTAINTY_OPTIONS.map((minutes) => (
              <label key={minutes} className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="timeline-uncertainty"
                  checked={layers.uncertainty === minutes}
                  onChange={() => toggle("uncertainty", minutes)}
                  className="size-5 accent-[var(--accent)]"
                />
                {t("minutesOption", { minutes })}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </dialog>
  );
}

export default function LifeTimeline({
  natalChart,
  birthInstant,
  timeZone,
  todayInstant,
  selectedInstant,
  selectionSource,
  selectionRevision,
  onSelectInstant,
}: LifeTimelineProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(TIMELINE_MESSAGES);
  const birthMs = birthInstant.getTime();
  const range = useMemo<TimeWindow>(
    () => ({ startMs: birthMs, endMs: birthMs + LIFE_SPAN_YEARS * YEAR_MS }),
    [birthMs],
  );
  // Periods and segments are half-open, so the last instant that still
  // belongs to the range is one millisecond before its end. The cursor holds
  // whole milliseconds, like the Date that shares it with the page; a scrub
  // on a fractional device pixel ratio would else leave a fraction behind.
  const clampToRange = useCallback(
    (ms: number) => Math.min(range.endMs - 1, Math.max(range.startMs, Math.round(ms))),
    [range],
  );

  /* ---------------------------------------------------------- natal anchors */
  const natalMoon = natalChart.planets.find((planet) => planet.id === "moon")!;
  const moonSign = natalMoon.sign.index;
  const lagnaSign = natalChart.ascendant.sign.index;
  const clock = useMemo(
    () => createDashaClock(birthInstant, natalMoon.siderealLongitudeDeg),
    [birthInstant, natalMoon.siderealLongitudeDeg],
  );
  const ashtakavarga = useMemo(() => calculateAshtakavarga(natalChart), [natalChart]);
  const natalCurves = useMemo(
    () => createNatalCurveContext(natalChart, ashtakavarga, clock),
    [natalChart, ashtakavarga, clock],
  );

  /* -------------------------------------------------------- long-range data */
  const data = useTimelineData(range.startMs, range.endMs);
  const baseSegments = useMemo(() => {
    const result: Partial<Record<GrahaId, MotionSegment[]>> = {};
    for (const [id, timeline] of Object.entries(data.planets) as [GrahaId, PlanetTimeline][]) {
      result[id] = motionSegments(timeline);
    }
    return result;
  }, [data.planets]);
  const bands = useMemo(
    () => transitBands({ moonSign, lagnaSign, segments: baseSegments }),
    [moonSign, lagnaSign, baseSegments],
  );

  /* --------------------------------------------------------- view and cursor */
  const [view, setView] = useState<TimeWindow>(() =>
    windowAround(clampToRange(todayInstant.getTime()), DEFAULT_SPAN_MS.macro, range),
  );
  const [cursorMs, setCursorMs] = useState(() => clampToRange(todayInstant.getTime()));
  const selectedMs = selectedInstant.getTime();
  const [link, setLink] = useState({ seenRevision: selectionRevision, dragging: false, ownRevision: 0 });
  const lastPushRef = useRef(0);

  // The 3D view and charts share one instant with this timeline. Every commit
  // carries its source and the number of its request, so the cursor follows
  // another control's change (even to an equal value) and never its own
  // echo. A change requested before the timeline's latest request is also
  // ignored: that newer request replaces it, whatever order they commit in.
  if (link.seenRevision !== selectionRevision) {
    setLink({ ...link, seenRevision: selectionRevision });
    if (selectionSource !== "timeline" && !link.dragging && selectionRevision > link.ownRevision) {
      const ms = clampToRange(selectedMs);
      setCursorMs(ms);
      setView(revealInstant(view, ms, range));
    }
  }

  /** Returns the number of the request, or null when the throttle skipped it. */
  const push = useCallback(
    (ms: number, force: boolean): number | null => {
      const now = performance.now();
      if (!force && now - lastPushRef.current < PUSH_INTERVAL_MS) return null;
      lastPushRef.current = now;
      return onSelectInstant(new Date(ms), "timeline");
    },
    [onSelectInstant],
  );

  const moveCursor = useCallback(
    (ms: number, phase: "move" | "end") => {
      const clamped = clampToRange(ms);
      setCursorMs(clamped);
      const dragging = phase === "move";
      const revision = push(clamped, !dragging);
      setLink((current) =>
        current.dragging === dragging && revision === null
          ? current
          : { ...current, dragging, ownRevision: revision ?? current.ownRevision },
      );
    },
    [clampToRange, push, setCursorMs, setLink],
  );

  const goTo = useCallback(
    (ms: number) => {
      const clamped = clampToRange(ms);
      moveCursor(clamped, "end");
      setView((current) =>
        clamped < current.startMs || clamped > current.endMs
          ? windowAround(clamped, spanOf(current), range)
          : current,
      );
    },
    [clampToRange, moveCursor, range, setView],
  );

  const zoom: ZoomLevel = zoomLevelForSpan(spanOf(view));
  const span = spanOf(view);
  const focusMs = cursorMs >= view.startMs && cursorMs <= view.endMs ? cursorMs : (view.startMs + view.endMs) / 2;

  /* ------------------------------------------------------------------ layers */
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [layersOpen, setLayersOpen] = useState(false);
  const [tableView, setTableView] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<GrahaId | null>(null);
  const [inspect, setInspect] = useState<InspectTarget | null>(null);
  const wideScreen = useWideScreen();

  const moon = useMoonWindow(zoom === "micro", view.startMs, view.endMs, range.startMs, range.endMs);
  const planets = useMemo(
    () => (moon ? { ...data.planets, moon } : data.planets),
    [data.planets, moon],
  );
  const segments = useMemo(
    () => (moon ? { ...baseSegments, moon: motionSegments(moon) } : baseSegments),
    [baseSegments, moon],
  );

  const plotHostRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useContainerWidth(plotHostRef);
  // The plot host is hidden in the table view and measures 0 there; keep the
  // last real width so resolution rules do not change behind the table.
  const [plotWidth, setPlotWidth] = useState(320);
  if (measuredWidth !== null && measuredWidth > 0 && measuredWidth !== plotWidth) {
    setPlotWidth(measuredWidth);
  }
  const approximateLayout = computeLayout(plotWidth, { ribbonRows: 2, showStrength: false, laneCount: 4 });
  const perPixel = span / approximateLayout.plotWidth;

  const zoomBodies = ZOOM_PLANETS[zoom];
  // A string key keeps the array identity stable while the set is unchanged,
  // so the plot's memoized layers survive every cursor move.
  const visibleKey = LEGEND_ORDER.filter(
    (id) =>
      zoomBodies.includes(id) &&
      !layers.hidden.includes(id) &&
      planets[id] !== undefined &&
      perPixel <= MAX_MS_PER_PIXEL[id],
  ).join(",");
  const visiblePlanets = useMemo(
    () => (visibleKey ? (visibleKey.split(",") as GrahaId[]) : []),
    [visibleKey],
  );
  const missingBodies = zoomBodies.filter((id) => !layers.hidden.includes(id) && planets[id] === undefined);

  /* ------------------------------------------------------------------ curves */
  const curvesReady = zoomBodies.every((id) => planets[id] !== undefined);
  const curveSteps = useMemo(() => {
    if (!curvesReady) return null;
    let fromMs = Math.max(range.startMs, view.startMs - span);
    let toMs = Math.min(range.endMs, view.endMs + span);
    // At day zoom the curves need the Moon: draw them only where its window
    // reaches, rather than show values without its rules.
    if (zoom === "micro" && moon) {
      fromMs = Math.max(fromMs, moon.startMs);
      toMs = Math.min(toMs, moon.endMs);
    }
    return lifeCurveSteps(natalCurves, segments, zoom, fromMs, toMs);
  }, [curvesReady, natalCurves, segments, zoom, range, view.startMs, view.endMs, span, moon]);
  const curvesAt = useCallback(
    (ms: number) => {
      if (!curvesReady) return null;
      if (zoom === "micro" && moon && (ms < moon.startMs || ms >= moon.endMs)) {
        // The cursor or an inspected instant can lie outside the drawn
        // window; give it its own small Moon window instead of no Moon.
        const local = computeMoonWindow(
          Math.max(range.startMs, ms - 2 * DAY_MS),
          Math.min(range.endMs, ms + 2 * DAY_MS),
        );
        return lifeCurvesAt(natalCurves, { ...segments, moon: motionSegments(local) }, zoom, ms);
      }
      return lifeCurvesAt(natalCurves, segments, zoom, ms);
    },
    [curvesReady, natalCurves, segments, zoom, moon, range],
  );
  const cursorCurves = useMemo(() => curvesAt(cursorMs), [curvesAt, cursorMs]);
  const activeBands = useMemo(
    () => bandsAt(bands, cursorMs).filter((band) => bandVisibleAt(band, zoom)),
    [bands, cursorMs, zoom],
  );

  /* ------------------------------------------------------- birth-time notes */
  const shiftDays = boundaryShiftDays(natalMoon.speedDegPerDay, clock.birthLordYears, layers.uncertainty);
  const mansionEdge = useMemo(
    () => minutesToMansionEdge(clock, natalMoon.speedDegPerDay),
    [clock, natalMoon.speedDegPerDay],
  );

  /* ------------------------------------------------------------ life events */
  const storageKey = lifeEventStorageKey(
    birthMs,
    natalChart.location.latitude,
    natalChart.location.longitude,
  );
  const [eventsState, setEventsState] = useState(() => {
    const saved = loadSavedLifeEvents(storageKey);
    return { events: saved ?? ([] as LifeEvent[]), keep: saved !== null, failed: false };
  });

  const updateEvents = (events: LifeEvent[]) => {
    const sorted = sortLifeEvents(events);
    const failed = eventsState.keep ? !saveLifeEvents(storageKey, sorted) : false;
    setEventsState({ events: sorted, keep: eventsState.keep && !failed, failed });
  };

  const setKeep = (keep: boolean) => {
    if (keep) {
      const saved = saveLifeEvents(storageKey, eventsState.events);
      setEventsState({ ...eventsState, keep: saved, failed: !saved });
    } else {
      forgetSavedLifeEvents(storageKey);
      setEventsState({ ...eventsState, keep: false, failed: false });
    }
  };

  /* -------------------------------------------------------------- table view */
  const rows = useMemo<ChangeRow[]>(() => {
    if (!tableView) return [];
    const result: ChangeRow[] = [];
    const inView = (ms: number) => ms >= view.startMs && ms <= view.endMs;
    // Every body of this zoom level, even one too fast to draw at this width.
    const tableBodies = LEGEND_ORDER.filter((id) => zoomBodies.includes(id) && !layers.hidden.includes(id));
    for (const id of tableBodies) {
      const timeline = planets[id];
      if (!timeline) continue;
      for (const event of timeline.events) {
        if (!inView(event.ms)) continue;
        if (event.kind === "ingress") {
          result.push({
            key: `${id}-ingress-${event.ms}`,
            ms: event.ms,
            text: t("changeIngress", { planet: planetName(id, locale), sign: signName(event.toSign, locale) }),
            houses: t("housesShort", {
              lagnaHouse: houseFrom(event.toSign, lagnaSign),
              moonHouse: houseFrom(event.toSign, moonSign),
            }),
            target: { kind: "ingress", planet: id, ms: event.ms + 60_000, toSign: event.toSign },
          });
        } else {
          result.push({
            key: `${id}-station-${event.ms}`,
            ms: event.ms,
            text: t("changeStation", {
              planet: planetName(id, locale),
              direction: event.turns === "retrograde" ? t("turnsRetrograde") : t("turnsDirect"),
            }),
            houses: "",
            target: { kind: "station", planet: id, ms: event.ms, turns: event.turns },
          });
        }
      }
    }
    for (let level = 1; level <= ZOOM_DASHA_LEVEL[zoom]; level += 1) {
      for (const periodSpan of dashaSpansInRange(clock, level as DashaLevel, view.startMs, view.endMs)) {
        if (!inView(periodSpan.startMs)) continue;
        result.push({
          key: `dasha-${level}-${periodSpan.startMs}`,
          ms: periodSpan.startMs,
          text: t("changeDasha", { level: levelName(periodSpan.level, t), lord: planetName(periodSpan.lord, locale) }),
          houses: "",
          target: { kind: "dasha", span: periodSpan },
        });
      }
    }
    for (const band of bands) {
      if (!bandVisibleAt(band, zoom) || !inView(band.startMs)) continue;
      result.push({
        key: `band-${band.id}-${band.startMs}`,
        ms: band.startMs,
        text: t("changeBand", { band: bandName(band, t, locale) }),
        houses: "",
        target: { kind: "band", band },
      });
    }
    // The same curve changes that the plot marks, so they have a keyboard path.
    if (curveSteps) {
      const changeLayout = computeLayout(plotWidth, { ribbonRows: 2, showStrength: false, laneCount: 4 });
      for (const curve of layers.curves) {
        for (const change of largestChanges(curveSteps[curve], view, changeLayout, 60)) {
          result.push({
            key: `change-${curve}-${change.ms}`,
            ms: change.ms,
            text: t("changeTitle", { curve: curveName(curve, t), delta: formatSigned(change.delta, locale) }),
            houses: "",
            target: { kind: "change", curve, ms: change.ms },
          });
        }
      }
    }
    return result.sort((a, b) => a.ms - b.ms);
  }, [tableView, view, zoomBodies, layers.hidden, layers.curves, planets, t, locale, lagnaSign, moonSign, zoom, clock, bands, curveSteps, plotWidth]);

  /* ---------------------------------------------------------------- controls */
  const setZoomLevel = (level: ZoomLevel) => setView(windowAround(focusMs, DEFAULT_SPAN_MS[level], range));
  const zoomBy = (factor: number) => setView(zoomWindow(view, factor, focusMs, range));
  const panBy = (fraction: number) => setView(panWindow(view, fraction * span, range));

  const stack = dashaStackAt(clock, cursorMs);
  const scrubberText = t("scrubberValue", {
    date: formatDate(cursorMs, timeZone, locale),
    major: stack[0] ? planetName(stack[0].lord, locale) : "",
    minor: stack[1] ? planetName(stack[1].lord, locale) : "",
  });
  const sliderStep = Math.max(60_000, Math.round(span / 2000 / 60_000) * 60_000);
  const loadedCount = Object.keys(data.planets).length;

  const strength = useMemo(
    () =>
      selectedPlanet && isAshtakavargaPlanet(selectedPlanet) && visiblePlanets.includes(selectedPlanet)
        ? { planet: selectedPlanet, bindus: ashtakavarga.bhinna[selectedPlanet] }
        : null,
    [selectedPlanet, visiblePlanets, ashtakavarga],
  );
  const natalLines = useMemo(
    () =>
      layers.natal
        ? [
            { longitudeDeg: natalMoon.siderealLongitudeDeg, label: "moon" },
            { longitudeDeg: natalChart.ascendant.siderealLongitudeDeg, label: "lagna" },
          ]
        : [],
    [layers.natal, natalMoon.siderealLongitudeDeg, natalChart.ascendant.siderealLongitudeDeg],
  );

  const summary = t("plotSummary", {
    start: formatDate(view.startMs, timeZone, locale),
    end: formatDate(view.endMs, timeZone, locale),
    date: formatDate(cursorMs, timeZone, locale),
    count: visiblePlanets.length,
  });

  const laneInputs = zoom === "macro" ? t("laneInputsMacro") : zoom === "meso" ? t("laneInputsMeso") : t("laneInputsMicro");

  return (
    <section
      id="life-timeline"
      aria-labelledby="life-timeline-title"
      data-testid="life-timeline"
      data-cursor-ms={cursorMs}
      data-selected-ms={selectedMs}
      className="scroll-mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl shadow-black/10 max-[399px]:-mx-4 max-[399px]:rounded-none max-[399px]:border-x-0 sm:p-6"
    >
      <header>
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <CalendarRange aria-hidden="true" className="size-4" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">{t("eyebrow")}</span>
        </div>
        <h2 id="life-timeline-title" className="mt-1 text-xl font-semibold text-[var(--foreground)]">
          {t("title")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">{t("intro")}</p>
        <p
          role="status"
          aria-live="polite"
          data-testid="timeline-status"
          data-status={data.status}
          className="mt-1 text-xs text-[var(--muted)]"
        >
          {data.status === "ready"
            ? t("statusReady")
            : data.status === "error"
              ? t("statusError", { planets: data.failed.map((id) => planetName(id, locale)).join(", ") })
              : t("statusComputing", { done: loadedCount, total: 8 })}
        </p>
      </header>

      <div role="group" aria-label={t("eyebrow")} data-testid="timeline-toolbar" className="mt-4 flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label={t("zoomGroup")} className="flex gap-0.5 rounded-xl border border-[var(--border)] p-0.5">
          {(["macro", "meso", "micro"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoomLevel(level)}
              aria-pressed={zoom === level}
              data-testid={`timeline-zoom-${level}`}
              className={`min-h-10 min-w-10 rounded-lg px-2 text-xs font-medium transition sm:px-2.5 ${
                zoom === level
                  ? "bg-[var(--surface-muted)] text-[var(--foreground)] ring-1 ring-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {level === "macro" ? t("zoomYears") : level === "meso" ? t("zoomMonths") : t("zoomDays")}
            </button>
          ))}
        </div>
        <ToolbarButton label={t("zoomOut")} onClick={() => zoomBy(2)} testId="timeline-zoom-out">
          <Minus aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t("zoomIn")} onClick={() => zoomBy(0.5)} testId="timeline-zoom-in">
          <Plus aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t("panEarlier")} onClick={() => panBy(-0.5)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t("panLater")} onClick={() => panBy(0.5)}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t("today")} onClick={() => goTo(todayInstant.getTime())} showLabel testId="timeline-today">
          <LocateFixed aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t("birth")} onClick={() => goTo(range.startMs)} showLabel testId="timeline-birth">
          <Baby aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t("layers")} onClick={() => setLayersOpen(true)} showLabel popup testId="timeline-layers">
          <Layers aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={tableView ? t("chartView") : t("tableView")}
          onClick={() => setTableView((value) => !value)}
          pressed={tableView}
          showLabel
          testId="timeline-table-toggle"
        >
          {tableView ? <ChartSpline aria-hidden="true" className="size-4" /> : <Table2 aria-hidden="true" className="size-4" />}
        </ToolbarButton>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={view.startMs}
          max={view.endMs}
          step={sliderStep}
          value={Math.min(view.endMs, Math.max(view.startMs, cursorMs))}
          onChange={(event) => moveCursor(Number(event.target.value), "end")}
          aria-label={t("scrubber")}
          aria-valuetext={scrubberText}
          data-testid="timeline-range"
          className="time-slider block min-w-0 flex-1"
        />
        {/* The range already announces the date; this copy is visual only. */}
        <span aria-hidden="true" className="shrink-0 text-xs font-medium tabular-nums text-[var(--foreground)]">
          {formatDate(cursorMs, timeZone, locale)}
        </span>
      </div>

      {/*
        Phones: plot, card, legend in source order. Desktop: the card fills the
        right column across both rows, and any extra height goes to the second
        row, so the legend stays directly under the plot.
      */}
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:items-start [&>*]:min-w-0">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div ref={plotHostRef} className={`-mx-4 sm:mx-0 ${tableView ? "hidden" : ""}`}>
            <TimelinePlot
              width={plotWidth}
              range={range}
              view={view}
              zoom={zoom}
              cursorMs={cursorMs}
              timeZone={timeZone}
              locale={locale}
              t={t}
              summary={summary}
              planets={planets}
              segments={segments}
              visiblePlanets={visiblePlanets}
              selectedPlanet={selectedPlanet}
              houseOneSign={layers.houseReference === "moon" ? moonSign : lagnaSign}
              natalLines={natalLines}
              clock={clock}
              showRibbon={layers.ribbon}
              fuzzDays={shiftDays}
              bands={bands}
              showBands={layers.bands}
              curveSteps={curveSteps}
              visibleCurves={layers.curves}
              events={eventsState.events}
              showEvents={layers.events}
              strength={strength}
              sarva={layers.sarva ? ashtakavarga.sarva : null}
              onViewChange={setView}
              onCursorChange={moveCursor}
              onInspect={setInspect}
            />
          </div>

          {tableView ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)]" data-testid="timeline-table">
              <div className="scroll-x-fade relative overflow-x-auto">
                <table className="w-full min-w-[30rem] text-left text-xs">
                  <caption className="px-3 py-2 text-left text-[var(--muted)]">
                    {t("tableCaption", {
                      start: formatDate(view.startMs, timeZone, locale),
                      end: formatDate(view.endMs, timeZone, locale),
                    })}
                  </caption>
                  <thead className="bg-[var(--surface-soft)] text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t("columnDate")}</th>
                      <th className="px-3 py-2 font-medium">{t("columnChange")}</th>
                      <th className="px-3 py-2 font-medium" title={t("housesHeaderHint")}>
                        {t("columnHouses")}
                      </th>
                      <th className="px-3 py-2 font-medium" aria-label={t("inspect")} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {rows.slice(0, TABLE_ROW_LIMIT).map((row) => (
                      <tr key={row.key}>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums text-[var(--muted)]">
                          {formatDate(row.ms, timeZone, locale)}
                        </td>
                        <td className="px-3 py-2 text-[var(--foreground)]">{row.text}</td>
                        <td className="px-3 py-2 tabular-nums text-[var(--muted)]">{row.houses}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setInspect(row.target)}
                            aria-label={t("tableInspectAria", { change: row.text })}
                            className="min-h-10 rounded-lg border border-[var(--border)] px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                          >
                            {t("inspect")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 ? <p className="px-3 py-3 text-xs text-[var(--muted)]">{t("tableEmpty")}</p> : null}
              {rows.length > TABLE_ROW_LIMIT ? (
                <p className="px-3 py-3 text-xs text-[var(--muted)]">{t("tableLimit", { count: TABLE_ROW_LIMIT })}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {wideScreen && inspect ? (
            <TimelineInspector
              variant="panel"
              target={inspect}
              locale={locale}
              t={t}
              timeZone={timeZone}
              clock={clock}
              moonSign={moonSign}
              lagnaSign={lagnaSign}
              ashtakavarga={ashtakavarga}
              segments={segments}
              bands={bands}
              curvesAt={curvesAt}
              onClose={() => setInspect(null)}
              onGoTo={(ms) => {
                setInspect(null);
                goTo(ms);
              }}
            />
          ) : null}
          <OnThisDateCard
            cursorMs={cursorMs}
            birthMs={birthMs}
            timeZone={timeZone}
            locale={locale}
            t={t}
            zoom={zoom}
            clock={clock}
            moonSign={moonSign}
            lagnaSign={lagnaSign}
            curves={cursorCurves}
            activeBands={activeBands}
            uncertaintyMinutes={layers.uncertainty}
            shiftDays={shiftDays}
            mansionEdge={mansionEdge}
            onInspect={setInspect}
          />
        </div>

        {!tableView ? (
          <div className="min-w-0 space-y-2 lg:col-start-1 lg:row-start-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t("legendTitle")}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {LEGEND_ORDER.filter((id) => visiblePlanets.includes(id)).map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanet((current) => (current === id ? null : id))}
                      aria-pressed={selectedPlanet === id}
                      title={t("selectBody", { planet: planetName(id, locale) })}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs transition ${
                        selectedPlanet === id
                          ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                          : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: GRAHA_COLOR_VARS[id] }} />
                      {planetName(id, locale)}
                    </button>
                  </li>
                ))}
              </ul>
              {LEGEND_ORDER.some((id) => !zoomBodies.includes(id)) ? (
                <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                  {t("otherBodies", {
                    planets: LEGEND_ORDER.filter((id) => !zoomBodies.includes(id))
                      .map((id) => planetName(id, locale))
                      .join(", "),
                  })}
                </p>
              ) : null}
            </div>
            {missingBodies.length > 0 ? (
              <p className="text-[11px] text-[var(--muted)]">
                {t("calculating", { planets: missingBodies.map((id) => planetName(id, locale)).join(", ") })}
              </p>
            ) : null}
            {selectedPlanet !== null ? (
              <p className="text-[11px] leading-5 text-[var(--muted)]">
                {isAshtakavargaPlanet(selectedPlanet)
                  ? t("strengthNote", { planet: planetName(selectedPlanet, locale) })
                  : t("strengthNoBindus")}
              </p>
            ) : null}
            {layers.curves.length > 0 ? (
              <p className="text-[11px] leading-5 text-[var(--muted)]" data-testid="timeline-lane-inputs">
                {t("lanesCaption")} {laneInputs}
              </p>
            ) : null}
            <details className="group rounded-xl border border-[var(--border)]">
              <summary className="flex min-h-10 cursor-pointer list-none items-center px-3 text-xs font-medium text-[var(--foreground)]">
                {t("howToRead")}
              </summary>
              <div className="space-y-1.5 border-t border-[var(--border)] px-3 py-2 text-[11px] leading-5 text-[var(--muted)]">
                <p>{t("axisCaption")}</p>
                {layers.natal ? <p>{t("natalLinesLegend")}</p> : null}
                {layers.ribbon ? <p>{t("periodRowsLegend")}</p> : null}
                {layers.bands ? <p>{t("bandsNote")}</p> : null}
                {selectedPlanet === null ? <p>{t("strengthPrompt")}</p> : null}
              </div>
            </details>
          </div>
        ) : null}

      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <LifeEventsPanel
          events={eventsState.events}
          keepOnDevice={eventsState.keep}
          storageFailed={eventsState.failed}
          rangeStartMs={range.startMs}
          rangeEndMs={range.endMs}
          defaultMs={cursorMs}
          timeZone={timeZone}
          locale={locale}
          t={t}
          onAdd={(event) => updateEvents([...eventsState.events, event])}
          onRemove={(id) => updateEvents(eventsState.events.filter((event) => event.id !== id))}
          onJump={(event) => goTo(event.ms)}
          onKeepChange={setKeep}
        />
      </div>

      <p className="mt-5 text-[11px] leading-5 text-[var(--muted)]">{t("footer")}</p>

      {!wideScreen ? (
        <TimelineInspector
          variant="sheet"
          target={inspect}
          locale={locale}
          t={t}
          timeZone={timeZone}
          clock={clock}
          moonSign={moonSign}
          lagnaSign={lagnaSign}
          ashtakavarga={ashtakavarga}
          segments={segments}
          bands={bands}
          curvesAt={curvesAt}
          onClose={() => setInspect(null)}
          onGoTo={(ms) => {
            setInspect(null);
            goTo(ms);
          }}
        />
      ) : null}
      <LayersDialog
        open={layersOpen}
        layers={layers}
        onChange={setLayers}
        onClose={() => setLayersOpen(false)}
        t={t}
        locale={locale}
      />
    </section>
  );
}
