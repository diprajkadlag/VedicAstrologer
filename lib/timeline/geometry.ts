import { Temporal } from "temporal-polyfill";

import {
  DAY_MS,
  interpolateUnwrapped,
  segmentAt,
  type MotionSegment,
  type PlanetTimeline,
} from "./planetTimeline";

/**
 * Pure geometry for the life timeline: the time window and its zoom rules,
 * the pixel layout for three widths, calendar ticks, and SVG path strings.
 * No React and no DOM, so every rule here is unit-tested.
 */

export type ZoomLevel = "macro" | "meso" | "micro";

export const YEAR_MS = 365.25 * DAY_MS;
export const MIN_SPAN_MS = 5 * DAY_MS;
/** A window of 18 months or more is the years view. */
export const MACRO_MIN_SPAN_MS = 1.5 * YEAR_MS;
/** A window of 60 days or more (and under 18 months) is the months view. */
export const MESO_MIN_SPAN_MS = 60 * DAY_MS;

export const DEFAULT_SPAN_MS: Readonly<Record<ZoomLevel, number>> = {
  macro: 12 * YEAR_MS,
  meso: 0.5 * YEAR_MS,
  micro: 21 * DAY_MS,
};

export function zoomLevelForSpan(spanMs: number): ZoomLevel {
  if (spanMs >= MACRO_MIN_SPAN_MS) return "macro";
  if (spanMs >= MESO_MIN_SPAN_MS) return "meso";
  return "micro";
}

export interface TimeWindow {
  readonly startMs: number;
  readonly endMs: number;
}

export function spanOf(window: TimeWindow): number {
  return window.endMs - window.startMs;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Keeps a window inside the life range and between the minimum span and the
 * whole range. The span is fixed first, then the position.
 */
export function clampWindow(startMs: number, spanMs: number, range: TimeWindow): TimeWindow {
  const span = clampNumber(spanMs, Math.min(MIN_SPAN_MS, spanOf(range)), spanOf(range));
  const start = clampNumber(startMs, range.startMs, range.endMs - span);
  return { startMs: start, endMs: start + span };
}

export function windowAround(centerMs: number, spanMs: number, range: TimeWindow): TimeWindow {
  return clampWindow(centerMs - spanMs / 2, spanMs, range);
}

/** factor below 1 zooms in. The anchor instant keeps its screen position. */
export function zoomWindow(
  window: TimeWindow,
  factor: number,
  anchorMs: number,
  range: TimeWindow,
): TimeWindow {
  const span = clampNumber(spanOf(window) * factor, Math.min(MIN_SPAN_MS, spanOf(range)), spanOf(range));
  const ratio = clampNumber((anchorMs - window.startMs) / spanOf(window), 0, 1);
  return clampWindow(anchorMs - ratio * span, span, range);
}

export function panWindow(window: TimeWindow, deltaMs: number, range: TimeWindow): TimeWindow {
  return clampWindow(window.startMs + deltaMs, spanOf(window), range);
}

/** Moves the window only as far as needed to show the instant with a margin. */
export function revealInstant(window: TimeWindow, ms: number, range: TimeWindow): TimeWindow {
  const margin = spanOf(window) * 0.1;
  if (ms < window.startMs + margin) return panWindow(window, ms - margin - window.startMs, range);
  if (ms > window.endMs - margin) return panWindow(window, ms + margin - window.endMs, range);
  return window;
}

/* ------------------------------------------------------------------ layout */

export type TimelineDensity = "phone" | "wide" | "desktop";

export interface TimelineLayout {
  readonly width: number;
  readonly density: TimelineDensity;
  readonly plotLeft: number;
  readonly plotWidth: number;
  readonly plotRight: number;
  readonly fontSize: number;
  readonly axisTop: number;
  readonly axisHeight: number;
  readonly minimapTop: number;
  readonly minimapHeight: number;
  /** Row of life-event flags; zero height when there are none. */
  readonly eventsTop: number;
  readonly eventsHeight: number;
  readonly ribbonTop: number;
  readonly ribbonRowHeight: number;
  readonly ribbonRows: number;
  readonly bandsTop: number;
  readonly bandRowHeight: number;
  readonly paneTop: number;
  readonly houseBandHeight: number;
  readonly paneHeight: number;
  readonly strengthTop: number;
  readonly strengthHeight: number;
  readonly lanesTop: number;
  /** Height of the title row above each lane's plot area. */
  readonly laneTitleHeight: number;
  readonly laneHeight: number;
  readonly laneGap: number;
  readonly laneCount: number;
  readonly height: number;
}

const DENSITY_METRICS: Readonly<
  Record<
    TimelineDensity,
    {
      left: number;
      right: number;
      houseBand: number;
      font: number;
      ribbonRow: number;
      lane: number;
    }
  >
> = {
  phone: { left: 28, right: 36, houseBand: 20, font: 10, ribbonRow: 18, lane: 48 },
  wide: { left: 40, right: 40, houseBand: 24, font: 11, ribbonRow: 20, lane: 52 },
  desktop: { left: 72, right: 72, houseBand: 30, font: 12, ribbonRow: 22, lane: 64 },
};

export function densityForWidth(width: number): TimelineDensity {
  if (width < 360) return "phone";
  if (width < 1024) return "wide";
  return "desktop";
}

export interface LayoutOptions {
  readonly ribbonRows: number;
  readonly showStrength: boolean;
  readonly laneCount: number;
  readonly showEvents?: boolean;
  /** Friction and expansion rows; shown unless set to false. */
  readonly showBands?: boolean;
}

const AXIS_HEIGHT = 22;
const MINIMAP_HEIGHT = 14;
const BAND_ROW_HEIGHT = 10;
const STRENGTH_HEIGHT = 12;
const EVENTS_HEIGHT = 14;
const GAP = 6;

export function computeLayout(width: number, options: LayoutOptions): TimelineLayout {
  const safeWidth = Math.max(240, Math.round(width));
  const density = densityForWidth(safeWidth);
  const metrics = DENSITY_METRICS[density];
  const plotLeft = metrics.left;
  const plotRight = safeWidth - metrics.right;

  const axisTop = 0;
  const minimapTop = axisTop + AXIS_HEIGHT + 4;
  const eventsTop = minimapTop + MINIMAP_HEIGHT + GAP;
  const eventsHeight = options.showEvents ? EVENTS_HEIGHT : 0;
  const ribbonTop = eventsTop + eventsHeight + (options.showEvents ? 4 : 0);
  const ribbonRows = clampNumber(Math.round(options.ribbonRows), 0, 4);
  const bandsTop = ribbonTop + ribbonRows * metrics.ribbonRow + (ribbonRows > 0 ? GAP : 0);
  const bandRows = options.showBands === false ? 0 : 2;
  const paneTop = bandsTop + bandRows * BAND_ROW_HEIGHT + (bandRows > 0 ? GAP : 0);
  const paneHeight = 12 * metrics.houseBand;
  const strengthTop = paneTop + paneHeight + (options.showStrength ? 4 : 0);
  const strengthHeight = options.showStrength ? STRENGTH_HEIGHT : 0;
  const lanesTop = strengthTop + strengthHeight + GAP + 4;
  const laneCount = clampNumber(Math.round(options.laneCount), 0, 4);
  const laneGap = 6;
  const laneTitleHeight = metrics.font + 6;
  const lanesHeight =
    laneCount > 0 ? laneCount * (laneTitleHeight + metrics.lane) + (laneCount - 1) * laneGap : 0;

  return {
    width: safeWidth,
    density,
    plotLeft,
    plotWidth: plotRight - plotLeft,
    plotRight,
    fontSize: metrics.font,
    axisTop,
    axisHeight: AXIS_HEIGHT,
    minimapTop,
    minimapHeight: MINIMAP_HEIGHT,
    eventsTop,
    eventsHeight,
    ribbonTop,
    ribbonRowHeight: metrics.ribbonRow,
    ribbonRows,
    bandsTop,
    bandRowHeight: bandRows > 0 ? BAND_ROW_HEIGHT : 0,
    paneTop,
    houseBandHeight: metrics.houseBand,
    paneHeight,
    strengthTop,
    strengthHeight,
    lanesTop,
    laneTitleHeight,
    laneHeight: metrics.lane,
    laneGap,
    laneCount,
    height: lanesTop + lanesHeight + GAP,
  };
}

export function timeToX(ms: number, window: TimeWindow, layout: TimelineLayout): number {
  return layout.plotLeft + ((ms - window.startMs) / spanOf(window)) * layout.plotWidth;
}

export function xToTime(x: number, window: TimeWindow, layout: TimelineLayout): number {
  return window.startMs + ((x - layout.plotLeft) / layout.plotWidth) * spanOf(window);
}

export function msPerPixel(window: TimeWindow, layout: TimelineLayout): number {
  return spanOf(window) / layout.plotWidth;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/* ------------------------------------------------------------------- ticks */

type TickUnit = { readonly kind: "day" | "month" | "year"; readonly step: number };

const TICK_UNITS: readonly TickUnit[] = [
  { kind: "day", step: 1 },
  { kind: "day", step: 2 },
  { kind: "day", step: 7 },
  { kind: "day", step: 14 },
  { kind: "month", step: 1 },
  { kind: "month", step: 2 },
  { kind: "month", step: 3 },
  { kind: "month", step: 6 },
  { kind: "year", step: 1 },
  { kind: "year", step: 2 },
  { kind: "year", step: 5 },
  { kind: "year", step: 10 },
  { kind: "year", step: 20 },
  { kind: "year", step: 25 },
];

const APPROXIMATE_UNIT_MS = { day: DAY_MS, month: YEAR_MS / 12, year: YEAR_MS } as const;
const MIN_LABEL_SPACING_PX = { day: 46, month: 54, year: 40 } as const;

export interface Tick {
  readonly ms: number;
  readonly x: number;
  readonly label: string;
}

export function chooseTickUnit(window: TimeWindow, layout: TimelineLayout): TickUnit {
  const perPixel = msPerPixel(window, layout);
  return (
    TICK_UNITS.find(
      (unit) =>
        (APPROXIMATE_UNIT_MS[unit.kind] * unit.step) / perPixel >= MIN_LABEL_SPACING_PX[unit.kind],
    ) ?? TICK_UNITS[TICK_UNITS.length - 1]
  );
}

function firstTick(start: Temporal.ZonedDateTime, unit: TickUnit): Temporal.ZonedDateTime {
  if (unit.kind === "year") {
    const year = Math.floor(start.year / unit.step) * unit.step;
    return Temporal.ZonedDateTime.from({ timeZone: start.timeZoneId, year, month: 1, day: 1 });
  }
  if (unit.kind === "month") {
    const monthIndex = Math.floor((start.month - 1) / unit.step) * unit.step;
    return Temporal.ZonedDateTime.from({
      timeZone: start.timeZoneId,
      year: start.year,
      month: monthIndex + 1,
      day: 1,
    });
  }
  const day = start.startOfDay();
  if (unit.step === 1) return day;
  // Align multi-day steps to a fixed epoch so ticks do not jump while panning.
  const epochDay = Math.floor(day.toPlainDate().since("1970-01-01").total({ unit: "days" }));
  return day.subtract({ days: ((epochDay % unit.step) + unit.step) % unit.step });
}

function addUnit(value: Temporal.ZonedDateTime, unit: TickUnit): Temporal.ZonedDateTime {
  if (unit.kind === "year") return value.add({ years: unit.step });
  if (unit.kind === "month") return value.add({ months: unit.step });
  return value.add({ days: unit.step });
}

export function timeTicks(
  window: TimeWindow,
  layout: TimelineLayout,
  timeZone: string,
  intlLocale: string,
): Tick[] {
  const unit = chooseTickUnit(window, layout);
  const options: Intl.DateTimeFormatOptions =
    unit.kind === "year"
      ? { year: "numeric", timeZone }
      : unit.kind === "month"
        ? { month: "short", year: "2-digit", timeZone }
        : { day: "numeric", month: "short", timeZone };
  const formatter = new Intl.DateTimeFormat(intlLocale, options);
  const start = Temporal.Instant.fromEpochMilliseconds(Math.floor(window.startMs)).toZonedDateTimeISO(
    timeZone,
  );

  const ticks: Tick[] = [];
  let cursor = firstTick(start, unit);
  for (let guard = 0; guard < 200; guard += 1) {
    const ms = cursor.epochMilliseconds;
    if (ms > window.endMs) break;
    if (ms >= window.startMs) {
      ticks.push({ ms, x: round1(timeToX(ms, window, layout)), label: formatter.format(new Date(ms)) });
    }
    cursor = addUnit(cursor, unit);
  }
  return ticks;
}

/* ------------------------------------------------------------ planet lines */

export interface PlanetGeometry {
  /** Path of the direct-motion parts. */
  readonly direct: string;
  /** Path of the retrograde parts (drawn dashed). */
  readonly retrograde: string;
  /** Where the line leaves the window on the right, for its direct label. */
  readonly end: { readonly x: number; readonly y: number } | null;
  readonly stations: readonly { readonly x: number; readonly y: number; readonly ms: number }[];
}

export interface PaneMapping {
  /** Sign index (0 = Aries) that fills the lowest band, house 1. */
  readonly houseOneSign: number;
  readonly paneTop: number;
  readonly paneHeight: number;
}

/** Height in the pane for a sidereal longitude: house 1 at the bottom. */
export function longitudeToY(longitudeDeg: number, pane: PaneMapping): number {
  const relative = (((longitudeDeg - pane.houseOneSign * 30) % 360) + 360) % 360;
  return pane.paneTop + pane.paneHeight - (relative / 360) * pane.paneHeight;
}

interface LinePoint {
  ms: number;
  x: number;
  relative: number;
}

/**
 * Builds the line of one graha. Samples are one per 1.5 px plus every station
 * inside the window, so the change between solid and dashed lands exactly on
 * the station. Where the longitude passes the top or bottom of the pane (a
 * full turn of the zodiac) the line ends at that edge and resumes at the
 * opposite edge instead of drawing a vertical jump.
 */
export function planetGeometry(
  timeline: PlanetTimeline,
  segments: readonly MotionSegment[],
  window: TimeWindow,
  layout: TimelineLayout,
  pane: PaneMapping,
): PlanetGeometry {
  const fromMs = Math.max(window.startMs, timeline.startMs);
  const toMs = Math.min(window.endMs, timeline.endMs);
  if (!(toMs > fromMs)) return { direct: "", retrograde: "", end: null, stations: [] };

  const pixelSpan = ((toMs - fromMs) / spanOf(window)) * layout.plotWidth;
  const count = Math.max(2, Math.ceil(pixelSpan / 1.5) + 1);
  const times: number[] = [];
  for (let index = 0; index < count; index += 1) {
    times.push(fromMs + ((toMs - fromMs) * index) / (count - 1));
  }
  const stationEvents = timeline.events.filter(
    (event) => event.kind === "station" && event.ms > fromMs && event.ms < toMs,
  );
  for (const station of stationEvents) times.push(station.ms);
  times.sort((a, b) => a - b);

  const base = pane.houseOneSign * 30;
  const points: LinePoint[] = times.map((ms) => ({
    ms,
    x: timeToX(ms, window, layout),
    relative: interpolateUnwrapped(timeline.series, ms) - base,
  }));

  const top = pane.paneTop;
  const bottom = pane.paneTop + pane.paneHeight;
  const yOf = (relative: number) => {
    const inTurn = ((relative % 360) + 360) % 360;
    return bottom - (inTurn / 360) * pane.paneHeight;
  };

  const parts = { direct: [] as string[], retrograde: [] as string[] };
  let currentStyle: "direct" | "retrograde" | null = null;

  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    if (b.ms - a.ms <= 0) continue;
    const middle = segmentAt(segments, (a.ms + b.ms) / 2);
    const style = middle?.retrograde ? "retrograde" : "direct";
    const target = parts[style];
    const turnA = Math.floor(a.relative / 360);
    const turnB = Math.floor(b.relative / 360);

    if (style !== currentStyle) {
      target.push(`M${round1(a.x)} ${round1(yOf(a.relative))}`);
      currentStyle = style;
    }

    if (turnA === turnB) {
      target.push(`L${round1(b.x)} ${round1(yOf(b.relative))}`);
      continue;
    }

    // One full turn between two samples: leave through one edge and enter
    // through the other at the interpolated crossing instant.
    const rising = turnB > turnA;
    const boundary = (rising ? turnB : turnA) * 360;
    const fraction = (boundary - a.relative) / (b.relative - a.relative);
    const crossingX = round1(a.x + (b.x - a.x) * fraction);
    target.push(`L${crossingX} ${round1(rising ? top : bottom)}`);
    target.push(`M${crossingX} ${round1(rising ? bottom : top)}`);
    target.push(`L${round1(b.x)} ${round1(yOf(b.relative))}`);
  }

  const last = points[points.length - 1];
  return {
    direct: parts.direct.join(""),
    retrograde: parts.retrograde.join(""),
    end: toMs >= window.endMs - spanOf(window) * 0.001
      ? { x: round1(last.x), y: round1(yOf(last.relative)) }
      : null,
    stations: stationEvents.map((station) => {
      const relative = interpolateUnwrapped(timeline.series, station.ms) - base;
      return {
        ms: station.ms,
        x: round1(timeToX(station.ms, window, layout)),
        y: round1(yOf(relative)),
      };
    }),
  };
}

/**
 * The finest scale at which a graha's line is still meaningful. Beyond it a
 * line would alias into zigzags, so the legend asks the reader to zoom in.
 */
export const MAX_MS_PER_PIXEL: Readonly<Record<PlanetTimeline["id"], number>> = {
  moon: 0.25 * DAY_MS,
  mercury: 3 * DAY_MS,
  venus: 4 * DAY_MS,
  sun: 6 * DAY_MS,
  mars: 6 * DAY_MS,
  jupiter: Number.POSITIVE_INFINITY,
  saturn: Number.POSITIVE_INFINITY,
  rahu: Number.POSITIVE_INFINITY,
  ketu: Number.POSITIVE_INFINITY,
};

/* ---------------------------------------------------------- step functions */

export interface StepPoint {
  readonly startMs: number;
  readonly endMs: number;
  /** 0 to 100. */
  readonly value: number;
}

export interface LaneGeometry {
  readonly line: string;
  readonly fillAbove: string;
  readonly fillBelow: string;
  readonly baselineY: number;
}

/** A step line for one 0-100 lane, with the fills between line and the 50 baseline. */
export function laneGeometry(
  steps: readonly StepPoint[],
  window: TimeWindow,
  layout: TimelineLayout,
  laneTop: number,
): LaneGeometry {
  const yOf = (value: number) =>
    round1(laneTop + (1 - clampNumber(value, 0, 100) / 100) * layout.laneHeight);
  const baselineY = yOf(50);
  const line: string[] = [];
  const above: string[] = [];
  const below: string[] = [];

  for (const step of steps) {
    const fromMs = Math.max(step.startMs, window.startMs);
    const toMs = Math.min(step.endMs, window.endMs);
    if (!(toMs > fromMs)) continue;
    const x0 = round1(timeToX(fromMs, window, layout));
    const x1 = round1(timeToX(toMs, window, layout));
    const y = yOf(step.value);
    line.push(line.length === 0 ? `M${x0} ${y}H${x1}` : `V${y}H${x1}`);
    if (step.value > 50) above.push(`M${x0} ${baselineY}V${y}H${x1}V${baselineY}Z`);
    if (step.value < 50) below.push(`M${x0} ${baselineY}V${y}H${x1}V${baselineY}Z`);
  }

  return { line: line.join(""), fillAbove: above.join(""), fillBelow: below.join(""), baselineY };
}

export interface StepChange {
  readonly ms: number;
  readonly x: number;
  readonly delta: number;
}

/**
 * The largest changes in view, at most one per minSpacingPx, ranked by size.
 * Each becomes a tappable marker that explains the change.
 */
export function largestChanges(
  steps: readonly StepPoint[],
  window: TimeWindow,
  layout: TimelineLayout,
  minSpacingPx = 60,
): StepChange[] {
  const changes: StepChange[] = [];
  for (let index = 1; index < steps.length; index += 1) {
    const ms = steps[index].startMs;
    if (ms <= window.startMs || ms >= window.endMs) continue;
    const delta = steps[index].value - steps[index - 1].value;
    if (delta === 0) continue;
    changes.push({ ms, x: round1(timeToX(ms, window, layout)), delta });
  }
  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.ms - b.ms);
  const kept: StepChange[] = [];
  for (const change of changes) {
    if (kept.every((other) => Math.abs(other.x - change.x) >= minSpacingPx)) kept.push(change);
  }
  return kept.sort((a, b) => a.ms - b.ms);
}

/* ---------------------------------------------------------------- spans */

export interface SpanBox {
  readonly x0: number;
  readonly x1: number;
}

/** A span clipped to the window, in pixels, or null when it is not visible. */
export function spanBox(
  startMs: number,
  endMs: number,
  window: TimeWindow,
  layout: TimelineLayout,
): SpanBox | null {
  const fromMs = Math.max(startMs, window.startMs);
  const toMs = Math.min(endMs, window.endMs);
  if (!(toMs > fromMs)) return null;
  return {
    x0: round1(timeToX(fromMs, window, layout)),
    x1: round1(timeToX(toMs, window, layout)),
  };
}

export type SpanLabel = "full" | "short" | "none";

export function spanLabelFor(widthPx: number): SpanLabel {
  if (widthPx >= 80) return "full";
  if (widthPx >= 22) return "short";
  return "none";
}
