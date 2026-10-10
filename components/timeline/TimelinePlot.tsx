"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import type { AshtakavargaPlanet } from "@/lib/astro/ashtakavarga";
import type { GrahaId } from "@/lib/astro/ephemeris";
import { getLocalizedGrahaAbbreviation } from "@/lib/astro/localizedNames";
import { INTL_LOCALES, type AppLocale } from "@/lib/i18n";
import {
  dashaSpansInRange,
  type DashaClock,
  type DashaLevel,
  type DashaSpan,
} from "@/lib/timeline/dashaLevels";
import {
  computeLayout,
  laneGeometry,
  largestChanges,
  longitudeToY,
  panWindow,
  planetGeometry,
  spanBox,
  spanLabelFor,
  spanOf,
  timeTicks,
  timeToX,
  windowAround,
  xToTime,
  zoomWindow,
  type TimeWindow,
  type TimelineLayout,
  type ZoomLevel,
} from "@/lib/timeline/geometry";
import { bandVisibleAt, type TransitBand } from "@/lib/timeline/gocharaBands";
import { ZOOM_DASHA_LEVEL, type CurveStep, type LifeCurveId } from "@/lib/timeline/lifeCurves";
import type { LifeEvent } from "@/lib/timeline/lifeEvents";
import {
  DAY_MS,
  interpolateUnwrapped,
  type MotionSegment,
  type PlanetTimeline,
} from "@/lib/timeline/planetTimeline";

import { planetName, type TimelineTranslate, curveName } from "./timelineText";
import { GRAHA_COLOR_VARS, type InspectTarget } from "./types";

/** Movement below this many pixels is a tap, not a drag. */
const TAP_SLOP_PX = 6;
const TAP_MAX_MS = 500;
/** While a finger moves, the real geometry is rebuilt at most this often. */
const COMMIT_INTERVAL_MS = 120;
const NO_EVENTS: readonly LifeEvent[] = [];
const SLOW_BODIES: ReadonlySet<GrahaId> = new Set<GrahaId>(["saturn", "jupiter", "rahu", "ketu"]);
const MEDIUM_BODIES: ReadonlySet<GrahaId> = new Set<GrahaId>(["sun", "mars", "venus", "mercury"]);

export interface TimelinePlotProps {
  readonly width: number;
  readonly range: TimeWindow;
  readonly view: TimeWindow;
  readonly zoom: ZoomLevel;
  readonly cursorMs: number;
  readonly timeZone: string;
  readonly locale: AppLocale;
  readonly t: TimelineTranslate;
  readonly summary: string;
  readonly planets: Readonly<Partial<Record<GrahaId, PlanetTimeline>>>;
  readonly segments: Readonly<Partial<Record<GrahaId, readonly MotionSegment[]>>>;
  readonly visiblePlanets: readonly GrahaId[];
  readonly selectedPlanet: GrahaId | null;
  readonly houseOneSign: number;
  readonly natalLines: readonly { readonly longitudeDeg: number; readonly label: string }[];
  readonly clock: DashaClock;
  readonly showRibbon: boolean;
  readonly fuzzDays: number;
  readonly bands: readonly TransitBand[];
  readonly showBands: boolean;
  readonly curveSteps: Readonly<Record<LifeCurveId, readonly CurveStep[]>> | null;
  readonly visibleCurves: readonly LifeCurveId[];
  readonly events: readonly LifeEvent[];
  readonly showEvents: boolean;
  readonly strength: { readonly planet: AshtakavargaPlanet; readonly bindus: readonly number[] } | null;
  readonly sarva: readonly number[] | null;
  onViewChange(view: TimeWindow): void;
  onCursorChange(ms: number, phase: "move" | "end"): void;
  onInspect(target: InspectTarget): void;
}

type GestureMode = "idle" | "pending" | "pan" | "pinch" | "scrub" | "minimap";

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

interface Gesture {
  mode: GestureMode;
  /** Where the first finger went down: the playhead/axis strip, the overview, or the plot. */
  zone: "scrub" | "minimap" | null;
  pointers: Map<number, PointerState>;
  base: TimeWindow;
  target: TimeWindow | null;
  startTime: number;
  startDistance: number;
  startMidX: number;
  lastCommit: number;
}

function idleGesture(view: TimeWindow): Gesture {
  return {
    mode: "idle",
    zone: null,
    pointers: new Map(),
    base: view,
    target: null,
    startTime: 0,
    startDistance: 1,
    startMidX: 0,
    lastCommit: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The affine map, in screen x, from the rendered window to a target window. */
function transformFor(rendered: TimeWindow, target: TimeWindow, layout: TimelineLayout): string {
  const scale = spanOf(rendered) / spanOf(target);
  const offset =
    layout.plotLeft +
    ((rendered.startMs - target.startMs) / spanOf(target)) * layout.plotWidth -
    scale * layout.plotLeft;
  return `matrix(${scale} 0 0 1 ${offset} 0)`;
}

function pointerPoint(svg: SVGSVGElement, event: { clientX: number; clientY: number }) {
  const box = svg.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

const LANE_FILL_ABOVE = "var(--band-expansion)";
const LANE_FILL_BELOW = "var(--band-friction)";

export default function TimelinePlot(props: TimelinePlotProps) {
  const {
    width,
    range,
    view,
    zoom,
    cursorMs,
    timeZone,
    locale,
    t,
    summary,
    planets,
    segments,
    visiblePlanets,
    selectedPlanet,
    houseOneSign,
    natalLines,
    clock,
    showRibbon,
    fuzzDays,
    bands,
    showBands,
    curveSteps,
    visibleCurves,
    events,
    showEvents,
    strength,
    sarva,
    onViewChange,
    onCursorChange,
    onInspect,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);
  const gestureRef = useRef<Gesture>(idleGesture(view));
  const renderedViewRef = useRef<TimeWindow>(view);
  const idBase = useId().replaceAll(":", "");
  const clipId = `timeline-clip-${idBase}`;
  const hatchId = `timeline-hatch-${idBase}`;

  const ribbonLevels = showRibbon ? ZOOM_DASHA_LEVEL[zoom] : 0;
  const eventsInRange = showEvents ? events : NO_EVENTS;
  const layout = useMemo(
    () =>
      computeLayout(width, {
        ribbonRows: ribbonLevels,
        showStrength: strength !== null,
        laneCount: visibleCurves.length,
        showEvents: eventsInRange.length > 0,
        showBands,
      }),
    [width, ribbonLevels, strength, visibleCurves.length, eventsInRange.length, showBands],
  );

  // Geometry covers one window to each side, so a drag reveals drawn content
  // before the next rebuild; the clip path hides everything outside the plot.
  const span = spanOf(view);
  const renderWindow = useMemo<TimeWindow>(
    () => ({ startMs: view.startMs - span, endMs: view.endMs + span }),
    [view.startMs, view.endMs, span],
  );
  const renderLayout = useMemo<TimelineLayout>(
    () => ({
      ...layout,
      plotLeft: layout.plotLeft - layout.plotWidth,
      plotWidth: layout.plotWidth * 3,
      plotRight: layout.plotRight + layout.plotWidth,
    }),
    [layout],
  );
  const pane = useMemo(
    () => ({ houseOneSign, paneTop: layout.paneTop, paneHeight: layout.paneHeight }),
    [houseOneSign, layout.paneTop, layout.paneHeight],
  );
  const intlLocale = INTL_LOCALES[locale];
  const strokeWidth = layout.density === "desktop" ? 2 : 1.5;
  const hitRadius = layout.density === "desktop" ? 12 : 16;

  const ribbon = useMemo(() => {
    const rows: { level: DashaLevel; spans: DashaSpan[] }[] = [];
    for (let level = 1; level <= ribbonLevels; level += 1) {
      rows.push({
        level: level as DashaLevel,
        spans: dashaSpansInRange(clock, level as DashaLevel, renderWindow.startMs, renderWindow.endMs),
      });
    }
    return rows;
  }, [clock, ribbonLevels, renderWindow]);

  const visibleBands = useMemo(
    () =>
      showBands
        ? bands.filter(
            (band) =>
              bandVisibleAt(band, zoom) && band.endMs > renderWindow.startMs && band.startMs < renderWindow.endMs,
          )
        : [],
    [bands, showBands, zoom, renderWindow],
  );

  const laneTops = useMemo(
    () =>
      visibleCurves.map(
        (_, index) =>
          layout.lanesTop +
          index * (layout.laneTitleHeight + layout.laneHeight + layout.laneGap) +
          layout.laneTitleHeight,
      ),
    [visibleCurves, layout],
  );

  /* ------------------------------------------------ heavy, cursor-free layers */
  const content = useMemo(() => {
    const ticks = timeTicks(renderWindow, renderLayout, timeZone, intlLocale);
    const nodes: ReactNode[] = [];

    for (const tick of ticks) {
      nodes.push(
        <line
          key={`grid-${tick.ms}`}
          x1={tick.x}
          x2={tick.x}
          y1={layout.axisHeight - 4}
          y2={layout.height}
          style={{ stroke: "var(--timeline-grid)" }}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />,
      );
      // A label that would be cut at a plot edge is left out; the grid line stays.
      const labelWidth = tick.label.length * (layout.fontSize + 1) * 0.62;
      if (tick.x + 3 >= layout.plotLeft && tick.x + 3 + labelWidth <= layout.plotRight) {
        nodes.push(
          <text
            key={`tick-${tick.ms}`}
            x={tick.x + 3}
            y={layout.axisTop + layout.fontSize + 4}
            className="tl-label"
            style={{ fill: "var(--muted)", fontSize: layout.fontSize + 1 }}
          >
            {tick.label}
          </text>,
        );
      }
    }

    // Planetary period rows with birth-time haze at each boundary.
    const pxPerDay = renderLayout.plotWidth / (spanOf(renderWindow) / DAY_MS);
    const fuzzHalf = fuzzDays * pxPerDay;
    ribbon.forEach((row, rowIndex) => {
      const y = layout.ribbonTop + rowIndex * layout.ribbonRowHeight;
      const height = layout.ribbonRowHeight - 2;
      for (const periodSpan of row.spans) {
        const box = spanBox(periodSpan.startMs, periodSpan.endMs, renderWindow, renderLayout);
        if (!box) continue;
        const widthPx = Math.max(0, box.x1 - box.x0 - 2);
        // A period that began before the visible window keeps its label at
        // the window's left edge instead of in the hidden overscan.
        const labelX = Math.max(box.x0, layout.plotLeft);
        const label = spanLabelFor(Math.max(0, Math.min(box.x1, layout.plotRight) - labelX - 2));
        nodes.push(
          <g key={`ribbon-${row.level}-${periodSpan.startMs}`}>
            <rect
              x={box.x0 + 1}
              y={y}
              width={widthPx}
              height={height}
              rx={3}
              style={{
                fill: GRAHA_COLOR_VARS[periodSpan.lord],
                fillOpacity: "var(--dasha-segment-opacity)",
              }}
            />
            {label !== "none" ? (
              <text
                x={labelX + 4}
                y={y + height / 2 + layout.fontSize / 2 - 1}
                className="tl-label"
                style={{ fill: "var(--foreground)", fontSize: layout.fontSize }}
              >
                {label === "full"
                  ? planetName(periodSpan.lord, locale)
                  : getLocalizedGrahaAbbreviation(periodSpan.lord, locale)}
              </text>
            ) : null}
          </g>,
        );
        if (fuzzHalf >= 1 && periodSpan.startMs > range.startMs) {
          nodes.push(
            <rect
              key={`fuzz-${row.level}-${periodSpan.startMs}`}
              x={box.x0 - fuzzHalf}
              y={y}
              width={fuzzHalf * 2}
              height={height}
              style={{ fill: "var(--foreground)", fillOpacity: 0.1 }}
            />,
          );
        }
      }
    });

    // Friction row on top, expansion row below.
    for (const band of visibleBands) {
      const box = spanBox(band.startMs, band.endMs, renderWindow, renderLayout);
      if (!box) continue;
      const y = layout.bandsTop + (band.tone === "friction" ? 0 : layout.bandRowHeight);
      const color = band.tone === "friction" ? "var(--band-friction)" : "var(--band-expansion)";
      nodes.push(
        <g key={`band-${band.id}-${band.startMs}`}>
          <rect
            x={box.x0}
            y={y + 1}
            width={Math.max(1, box.x1 - box.x0)}
            height={layout.bandRowHeight - 2}
            style={{ fill: color, fillOpacity: band.tone === "friction" ? 0.3 : 0.35 }}
          />
          {band.tone === "friction" ? (
            <rect
              x={box.x0}
              y={y + 1}
              width={Math.max(1, box.x1 - box.x0)}
              height={layout.bandRowHeight - 2}
              fill={`url(#${hatchId})`}
            />
          ) : null}
        </g>,
      );
    }

    // Ashtakavarga points of the transited sign, for the selected body.
    if (strength) {
      // Stations split segments without changing the sign; merge them so each
      // stay in a sign is one block with one number.
      const stays: { startMs: number; endMs: number; signIndex: number }[] = [];
      for (const segment of segments[strength.planet] ?? []) {
        const last = stays.at(-1);
        if (last && last.signIndex === segment.signIndex && last.endMs === segment.startMs) last.endMs = segment.endMs;
        else stays.push({ startMs: segment.startMs, endMs: segment.endMs, signIndex: segment.signIndex });
      }
      for (const segment of stays) {
        const box = spanBox(segment.startMs, segment.endMs, renderWindow, renderLayout);
        if (!box) continue;
        const bindus = strength.bindus[segment.signIndex];
        const widthPx = Math.max(1, box.x1 - box.x0);
        nodes.push(
          <g key={`strength-${segment.startMs}`}>
            <rect
              x={box.x0}
              y={layout.strengthTop}
              width={widthPx}
              height={layout.strengthHeight}
              style={{ fill: "var(--accent)", fillOpacity: 0.06 + (bindus / 8) * 0.4 }}
            />
            {widthPx >= 16 ? (
              <text
                x={box.x0 + widthPx / 2}
                y={layout.strengthTop + layout.strengthHeight - 2}
                textAnchor="middle"
                className="tl-label"
                style={{ fill: "var(--foreground)", fontSize: layout.fontSize - 1 }}
              >
                {bindus}
              </text>
            ) : null}
          </g>,
        );
      }
    }

    // Planet lines: other zoom tiers are dimmed so this level's bodies lead.
    for (const id of visiblePlanets) {
      const timeline = planets[id];
      const planetSegments = segments[id];
      if (!timeline || !planetSegments) continue;
      const geometry = planetGeometry(timeline, planetSegments, renderWindow, renderLayout, pane);
      const selected = selectedPlanet === id;
      const tierDim =
        selected || zoom === "macro"
          ? 1
          : zoom === "meso"
            ? SLOW_BODIES.has(id)
              ? 0.55
              : 1
            : SLOW_BODIES.has(id) || MEDIUM_BODIES.has(id)
              ? 0.45
              : 1;
      const width = selected ? 3 : strokeWidth;
      const color = GRAHA_COLOR_VARS[id];
      const nodeDash = id === "rahu" || id === "ketu" ? "8 4" : "4 3";
      nodes.push(
        <g key={`planet-${id}`} opacity={tierDim} data-series={id}>
          {selected ? (
            <>
              <path d={geometry.direct} fill="none" style={{ stroke: "var(--background)" }} strokeWidth={width + 3} vectorEffect="non-scaling-stroke" />
              <path d={geometry.retrograde} fill="none" style={{ stroke: "var(--background)" }} strokeWidth={width + 3} vectorEffect="non-scaling-stroke" />
            </>
          ) : null}
          <path
            d={geometry.direct}
            fill="none"
            data-series={id}
            style={{ stroke: color }}
            strokeWidth={width}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={geometry.retrograde}
            fill="none"
            data-series={id}
            style={{ stroke: color }}
            strokeWidth={width}
            strokeDasharray={nodeDash}
            vectorEffect="non-scaling-stroke"
          />
          {geometry.stations.map((station) => (
            <circle
              key={station.ms}
              cx={station.x}
              cy={station.y}
              r={3}
              style={{ stroke: color, fill: "var(--background)" }}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>,
      );
    }

    // Theme curves: step lines, fills on each side of the 50 baseline.
    if (curveSteps) {
      visibleCurves.forEach((curve, index) => {
        const top = laneTops[index];
        const geometry = laneGeometry(curveSteps[curve], renderWindow, renderLayout, top);
        nodes.push(
          <g key={`lane-${curve}`}>
            <path d={geometry.fillAbove} style={{ fill: LANE_FILL_ABOVE, fillOpacity: 0.16 }} />
            <path d={geometry.fillBelow} style={{ fill: LANE_FILL_BELOW, fillOpacity: 0.16 }} />
            <path d={geometry.fillBelow} fill={`url(#${hatchId})`} opacity={0.5} />
            <path
              d={geometry.line}
              fill="none"
              style={{ stroke: "var(--foreground)" }}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>,
        );
      });
    }

    for (const event of eventsInRange) {
      if (event.ms < renderWindow.startMs || event.ms > renderWindow.endMs) continue;
      const x = timeToX(event.ms, renderWindow, renderLayout);
      const top = layout.eventsTop;
      nodes.push(
        <g key={`event-${event.id}`}>
          <line
            x1={x}
            x2={x}
            y1={top}
            y2={layout.height}
            style={{ stroke: "var(--accent)" }}
            strokeOpacity={0.35}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M${x} ${top}l6 3.5l-6 3.5z`}
            style={{ fill: "var(--accent)" }}
          />
          <line
            x1={x}
            x2={x}
            y1={top}
            y2={top + layout.eventsHeight}
            style={{ stroke: "var(--accent)" }}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </g>,
      );
    }

    return nodes;
  }, [
    renderWindow,
    renderLayout,
    timeZone,
    intlLocale,
    layout,
    fuzzDays,
    ribbon,
    range.startMs,
    locale,
    visibleBands,
    hatchId,
    strength,
    segments,
    visiblePlanets,
    planets,
    pane,
    selectedPlanet,
    zoom,
    strokeWidth,
    curveSteps,
    visibleCurves,
    laneTops,
    eventsInRange,
  ]);

  /* ------------------------------------------------- static, time-free layers */
  const staticLayers = useMemo(() => {
    const nodes: ReactNode[] = [];
    const houseLabel = (house: number) => (layout.density === "desktop" ? t("houseNumber", { house }) : String(house));
    for (let house = 1; house <= 12; house += 1) {
      const y = layout.paneTop + layout.paneHeight - house * layout.houseBandHeight;
      nodes.push(
        <rect
          key={`house-${house}`}
          x={layout.plotLeft}
          y={y}
          width={layout.plotWidth}
          height={layout.houseBandHeight}
          style={{
            fill: sarva ? "var(--accent)" : "var(--surface-muted)",
            fillOpacity: sarva
              ? clamp((sarva[(houseOneSign + house - 1) % 12] - 18) / 22, 0, 1) * 0.22 + 0.02
              : house % 2 === 0
                ? 0.55
                : 0,
          }}
        />,
        <text
          key={`house-label-${house}`}
          x={layout.plotLeft - 4}
          y={y + layout.houseBandHeight / 2 + layout.fontSize / 2 - 1}
          textAnchor="end"
          style={{ fill: "var(--muted)", fontSize: layout.fontSize }}
        >
          {houseLabel(house)}
        </text>,
      );
    }
    for (const line of natalLines) {
      const y = longitudeToY(line.longitudeDeg, pane);
      nodes.push(
        <line
          key={`natal-${line.label}`}
          x1={layout.plotLeft}
          x2={layout.plotRight}
          y1={y}
          y2={y}
          style={{ stroke: "var(--muted)" }}
          strokeDasharray="2 3"
          strokeWidth={1}
        />,
      );
    }
    for (let level = 1; level <= ribbonLevels; level += 1) {
      const y = layout.ribbonTop + (level - 1) * layout.ribbonRowHeight;
      nodes.push(
        <text
          key={`level-${level}`}
          x={layout.plotLeft - 4}
          y={y + layout.ribbonRowHeight / 2 + layout.fontSize / 2 - 2}
          textAnchor="end"
          style={{ fill: "var(--muted)", fontSize: layout.fontSize }}
        >
          {t(`levelShort${level}` as "levelShort1")}
        </text>,
      );
    }
    if (layout.bandRowHeight > 0) {
      nodes.push(
        <rect key="friction-key" x={layout.plotLeft - 10} y={layout.bandsTop + 2} width={6} height={layout.bandRowHeight - 4} style={{ fill: "var(--band-friction)" }} />,
        <rect key="expansion-key" x={layout.plotLeft - 10} y={layout.bandsTop + layout.bandRowHeight + 2} width={6} height={layout.bandRowHeight - 4} style={{ fill: "var(--band-expansion)" }} />,
      );
    }
    visibleCurves.forEach((curve, index) => {
      const top = laneTops[index];
      nodes.push(
        <g key={`lane-frame-${curve}`}>
          <rect
            x={layout.plotLeft}
            y={top}
            width={layout.plotWidth}
            height={layout.laneHeight}
            style={{ fill: "none", stroke: "var(--border)" }}
          />
          <line
            x1={layout.plotLeft}
            x2={layout.plotRight}
            y1={top + layout.laneHeight / 2}
            y2={top + layout.laneHeight / 2}
            style={{ stroke: "var(--muted)" }}
            strokeOpacity={0.5}
            strokeDasharray="1 3"
          />
          <text x={layout.plotLeft} y={top - 4} style={{ fill: "var(--foreground)", fontSize: layout.fontSize, fontWeight: 600 }}>
            {curveName(curve, t)}
            <tspan style={{ fill: "var(--muted)", fontWeight: 400 }}>{` · ${t("symbolicTrend")}`}</tspan>
          </text>
          <text x={layout.plotLeft - 4} y={top + layout.laneHeight / 2 + layout.fontSize / 2 - 1} textAnchor="end" style={{ fill: "var(--muted)", fontSize: layout.fontSize - 1 }}>
            50
          </text>
        </g>,
      );
    });
    return nodes;
  }, [layout, t, sarva, houseOneSign, natalLines, pane, ribbonLevels, visibleCurves, laneTops]);

  /* -------------------------------------------- right-gutter direct labels */
  const endLabels = useMemo(() => {
    const labels = visiblePlanets
      .map((id) => {
        const timeline = planets[id];
        if (!timeline || view.endMs > timeline.endMs || view.endMs < timeline.startMs) return null;
        return { id, y: longitudeToY(interpolateUnwrapped(timeline.series, view.endMs), pane) };
      })
      .filter((entry): entry is { id: GrahaId; y: number } => entry !== null)
      .sort((a, b) => a.y - b.y);
    const gap = layout.fontSize + 1;
    for (let index = 1; index < labels.length; index += 1) {
      labels[index].y = Math.max(labels[index].y, labels[index - 1].y + gap);
    }
    const overflow = labels.length > 0 ? labels[labels.length - 1].y - (layout.paneTop + layout.paneHeight) : 0;
    if (overflow > 0) for (const label of labels) label.y -= overflow;
    return labels;
  }, [visiblePlanets, planets, view.endMs, pane, layout]);

  /* ------------------------------------------------------- lane change marks */
  const laneChanges = useMemo(() => {
    if (!curveSteps) return [];
    return visibleCurves.map((curve, index) => ({
      curve,
      top: laneTops[index],
      changes: largestChanges(curveSteps[curve], view, layout, 60),
    }));
  }, [curveSteps, visibleCurves, laneTops, view, layout]);

  const minimap = useMemo(() => {
    const total = spanOf(range);
    const toX = (ms: number) => layout.plotLeft + ((ms - range.startMs) / total) * layout.plotWidth;
    const majors = dashaSpansInRange(clock, 1, range.startMs, range.endMs);
    return {
      blocks: majors.map((major) => ({
        lord: major.lord,
        x0: Math.max(layout.plotLeft, toX(major.startMs)),
        x1: Math.min(layout.plotRight, toX(major.endMs)),
      })),
      window: { x0: toX(view.startMs), x1: toX(view.endMs) },
      toX,
    };
  }, [range, layout, clock, view]);

  /* ------------------------------------------------------------- gestures */

  // After each render, the rendered window is the committed view; an active
  // gesture keeps its target through a transform relative to it.
  useLayoutEffect(() => {
    renderedViewRef.current = view;
    const gesture = gestureRef.current;
    const group = contentRef.current;
    if (!group) return;
    if ((gesture.mode === "pan" || gesture.mode === "pinch") && gesture.target) {
      group.setAttribute("transform", transformFor(view, gesture.target, layout));
    } else {
      group.removeAttribute("transform");
    }
  }, [view, layout]);

  function applyTarget(target: TimeWindow, now: number) {
    const gesture = gestureRef.current;
    gesture.target = target;
    contentRef.current?.setAttribute("transform", transformFor(renderedViewRef.current, target, layout));
    if (now - gesture.lastCommit >= COMMIT_INTERVAL_MS) {
      gesture.lastCommit = now;
      onViewChange(target);
    }
  }

  function setGestureAttribute(mode: GestureMode) {
    svgRef.current?.setAttribute("data-gesture", mode);
  }

  function clampedCursor(ms: number): number {
    return clamp(ms, range.startMs, range.endMs);
  }

  function minimapTime(x: number): number {
    return range.startMs + clamp((x - layout.plotLeft) / layout.plotWidth, 0, 1) * spanOf(range);
  }

  function scrubTo(x: number, phase: "move" | "end") {
    onCursorChange(clampedCursor(xToTime(clamp(x, layout.plotLeft, layout.plotRight), view, layout)), phase);
  }

  function minimapTo(x: number, phase: "move" | "end") {
    const ms = minimapTime(x);
    onViewChange(windowAround(ms, spanOf(view), range));
    onCursorChange(ms, phase);
  }

  function hitTest(x: number, y: number): InspectTarget | null {
    if (x < layout.plotLeft || x > layout.plotRight) return null;
    const ms = xToTime(x, view, layout);

    if (layout.eventsHeight > 0 && y >= layout.eventsTop - 4 && y <= layout.eventsTop + layout.eventsHeight + 4) {
      const nearest = eventsInRange
        .map((event) => ({ event, distance: Math.abs(timeToX(event.ms, view, layout) - x) }))
        .filter((entry) => entry.distance <= hitRadius)
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest) return { kind: "event", event: nearest.event };
    }

    const ribbonBottom = layout.ribbonTop + ribbon.length * layout.ribbonRowHeight;
    if (y >= layout.ribbonTop && y < ribbonBottom) {
      const row = ribbon[Math.floor((y - layout.ribbonTop) / layout.ribbonRowHeight)];
      const found = row?.spans.find((candidate) => ms >= candidate.startMs && ms < candidate.endMs);
      if (found) return { kind: "dasha", span: found };
    }

    if (layout.bandRowHeight > 0 && y >= layout.bandsTop && y < layout.bandsTop + 2 * layout.bandRowHeight) {
      const tone = y < layout.bandsTop + layout.bandRowHeight ? "friction" : "expansion";
      const tolerance = (hitRadius / layout.plotWidth) * spanOf(view);
      const found = visibleBands
        .filter((band) => band.tone === tone && ms >= band.startMs - tolerance && ms < band.endMs + tolerance)
        .sort((a, b) => a.endMs - a.startMs - (b.endMs - b.startMs))[0];
      if (found) return { kind: "band", band: found };
    }

    if (y >= layout.paneTop - hitRadius / 2 && y <= layout.paneTop + layout.paneHeight + hitRadius / 2) {
      let best: { target: InspectTarget; distance: number } | null = null;
      for (const id of visiblePlanets) {
        const timeline = planets[id];
        if (!timeline || ms < timeline.startMs || ms > timeline.endMs) continue;
        for (const event of timeline.events) {
          if (event.kind !== "station") continue;
          const sx = timeToX(event.ms, view, layout);
          if (Math.abs(sx - x) > hitRadius) continue;
          const sy = longitudeToY(event.longitudeDeg, pane);
          const distance = Math.hypot(sx - x, sy - y);
          if (distance <= hitRadius && (!best || distance < best.distance)) {
            best = { target: { kind: "station", planet: id, ms: event.ms, turns: event.turns }, distance };
          }
        }
        const lineY = longitudeToY(interpolateUnwrapped(timeline.series, ms), pane);
        const distance = Math.abs(lineY - y);
        if (distance <= hitRadius && (!best || distance < best.distance)) {
          best = { target: { kind: "planet", planet: id, ms }, distance };
        }
      }
      if (best) return best.target;
    }

    if (strength && y >= layout.strengthTop && y < layout.strengthTop + layout.strengthHeight) {
      return { kind: "planet", planet: strength.planet, ms };
    }

    for (let index = 0; index < laneChanges.length; index += 1) {
      const lane = laneChanges[index];
      if (y < lane.top || y > lane.top + layout.laneHeight) continue;
      const marker = lane.changes
        .map((change) => ({ change, distance: Math.abs(change.x - x) }))
        .filter((entry) => entry.distance <= hitRadius)
        .sort((a, b) => a.distance - b.distance)[0];
      if (marker) return { kind: "change", curve: lane.curve, ms: marker.change.ms };
      return { kind: "curve", curve: lane.curve, ms };
    }
    return null;
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || (event.pointerType === "mouse" && event.button !== 0)) return;
    const gesture = gestureRef.current;
    // A scrub follows one finger and a pinch two. A further finger (or a
    // palm) is ignored until the gesture ends, so it cannot move the cursor.
    const scrubbing = gesture.mode === "scrub" || gesture.mode === "minimap";
    if (gesture.pointers.size >= 2 || (gesture.pointers.size === 1 && scrubbing)) return;
    const point = pointerPoint(svg, event);
    try {
      svg.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic events in tests cannot be captured; the gesture still works.
    }
    gesture.pointers.set(event.pointerId, { ...point, startX: point.x, startY: point.y });

    if (gesture.pointers.size === 1) {
      const zone = (event.target as Element).closest?.("[data-zone]")?.getAttribute("data-zone");
      gesture.base = renderedViewRef.current;
      gesture.target = null;
      gesture.startTime = event.timeStamp;
      gesture.lastCommit = event.timeStamp;
      // Every zone waits for horizontal intent, so a vertical swipe scrolls
      // the page wherever it starts (touch-action inside an SVG is not
      // reliable across browsers), and a tap still moves the cursor.
      gesture.zone = zone === "scrub" || zone === "minimap" ? zone : null;
      gesture.mode = "pending";
    } else if (gesture.pointers.size === 2 && (gesture.mode === "pending" || gesture.mode === "pan")) {
      const [a, b] = [...gesture.pointers.values()];
      gesture.mode = "pinch";
      gesture.base = gesture.target ?? renderedViewRef.current;
      gesture.startDistance = Math.max(8, Math.abs(a.x - b.x));
      gesture.startMidX = (a.x + b.x) / 2;
      for (const pointer of gesture.pointers.values()) {
        pointer.startX = pointer.x;
        pointer.startY = pointer.y;
      }
    }
    setGestureAttribute(gesture.mode);
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const gesture = gestureRef.current;
    const pointer = gesture.pointers.get(event.pointerId);
    if (!svg || !pointer) return;
    const point = pointerPoint(svg, event);
    pointer.x = point.x;
    pointer.y = point.y;

    if (gesture.mode === "pending" && Math.abs(pointer.x - pointer.startX) > TAP_SLOP_PX) {
      gesture.mode = gesture.zone ?? "pan";
      setGestureAttribute(gesture.mode);
    }
    if (gesture.mode === "pan") {
      const deltaMs = (-(pointer.x - pointer.startX) / layout.plotWidth) * spanOf(gesture.base);
      applyTarget(panWindow(gesture.base, deltaMs, range), event.timeStamp);
    } else if (gesture.mode === "pinch" && gesture.pointers.size >= 2) {
      const [a, b] = [...gesture.pointers.values()];
      const distance = Math.max(8, Math.abs(a.x - b.x));
      const midX = (a.x + b.x) / 2;
      const anchor = xToTime(gesture.startMidX, gesture.base, layout);
      const zoomed = zoomWindow(gesture.base, gesture.startDistance / distance, anchor, range);
      const drift = (-(midX - gesture.startMidX) / layout.plotWidth) * spanOf(zoomed);
      applyTarget(panWindow(zoomed, drift, range), event.timeStamp);
    } else if (gesture.mode === "scrub") {
      scrubTo(point.x, "move");
    } else if (gesture.mode === "minimap") {
      minimapTo(point.x, "move");
    }
  }

  function finishPointer(event: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) {
    const gesture = gestureRef.current;
    const pointer = gesture.pointers.get(event.pointerId);
    if (!pointer) return;
    gesture.pointers.delete(event.pointerId);
    const mode = gesture.mode;

    if (!cancelled && mode === "pending") {
      const moved = Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY);
      if (moved <= TAP_SLOP_PX && event.timeStamp - gesture.startTime <= TAP_MAX_MS) {
        if (gesture.zone === "minimap") minimapTo(pointer.x, "end");
        else if (gesture.zone === "scrub") scrubTo(pointer.x, "end");
        else {
          const target = hitTest(pointer.x, pointer.y);
          if (target) onInspect(target);
          else if (pointer.x >= layout.plotLeft && pointer.x <= layout.plotRight) scrubTo(pointer.x, "end");
        }
      }
    } else if (mode === "scrub") {
      // Also when the browser cancels: the drag must end, or the timeline
      // would keep ignoring the time navigator.
      scrubTo(pointer.x, "end");
    } else if (mode === "minimap") {
      minimapTo(pointer.x, "end");
    }

    if (mode === "pinch" && gesture.pointers.size === 1) {
      // One finger stays down: continue as a pan from here, even when the
      // two fingers never moved.
      const [remaining] = [...gesture.pointers.values()];
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      gesture.base = gesture.target ?? renderedViewRef.current;
      gesture.mode = "pan";
      setGestureAttribute("pan");
      return;
    }

    if ((mode === "pan" || mode === "pinch") && gesture.target) {
      if (gesture.pointers.size === 0) {
        const target = gesture.target;
        gesture.mode = "idle";
        gesture.target = null;
        onViewChange(target);
      }
    }

    if (gesture.pointers.size === 0) {
      gesture.mode = "idle";
      gesture.zone = null;
      gesture.target = null;
      setGestureAttribute("idle");
      if (cancelled) contentRef.current?.removeAttribute("transform");
    }
  }

  // Trackpad pinch arrives as ctrl+wheel; sideways scrolling pans. A plain
  // vertical wheel is left to the page, so the timeline never traps scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      const current = renderedViewRef.current;
      const box = svg.getBoundingClientRect();
      const x = event.clientX - box.left;
      if (event.ctrlKey) {
        event.preventDefault();
        const anchor = xToTime(clamp(x, layout.plotLeft, layout.plotRight), current, layout);
        onViewChange(zoomWindow(current, Math.exp(event.deltaY * 0.01), anchor, range));
      } else if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        const delta = (event.shiftKey ? event.deltaY : event.deltaX) / layout.plotWidth;
        onViewChange(panWindow(current, delta * spanOf(current), range));
      }
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [layout, onViewChange, range]);

  const cursorX = timeToX(cursorMs, view, layout);
  const cursorVisible = cursorMs >= view.startMs && cursorMs <= view.endMs;

  return (
    <svg
      ref={svgRef}
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="timeline-plot block select-none"
      role="img"
      aria-label={summary}
      data-testid="timeline-plot"
      data-gesture="idle"
      data-zoom-level={zoom}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishPointer(event, false)}
      onPointerCancel={(event) => finishPointer(event, true)}
      onLostPointerCapture={(event) => finishPointer(event, true)}
      style={{ fontFamily: "inherit" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={layout.plotLeft} y={0} width={layout.plotWidth} height={layout.height} />
        </clipPath>
        <pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} style={{ stroke: "var(--band-friction)" }} strokeWidth={1.5} strokeOpacity={0.55} />
        </pattern>
      </defs>

      {staticLayers}

      <g clipPath={`url(#${clipId})`}>
        <g ref={contentRef}>
          {content}
          {laneChanges.map((lane) =>
            lane.changes.map((change) => {
              const y = lane.top + layout.laneHeight - 6;
              return (
                <path
                  key={`change-${lane.curve}-${change.ms}`}
                  data-testid="timeline-change"
                  d={change.delta > 0 ? `M${change.x - 4} ${y}h8l-4 -6z` : `M${change.x - 4} ${y - 6}h8l-4 6z`}
                  style={{ fill: change.delta > 0 ? "var(--band-expansion)" : "var(--band-friction)" }}
                />
              );
            }),
          )}
          {cursorVisible ? (
            <g data-testid="timeline-playhead">
              <line
                x1={cursorX}
                x2={cursorX}
                y1={layout.axisHeight - 2}
                y2={layout.height}
                style={{ stroke: "var(--accent)" }}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                data-zone="scrub"
                data-testid="timeline-scrubber"
                x={cursorX - 16}
                y={layout.ribbonTop}
                width={32}
                height={layout.height - layout.ribbonTop}
                fill="transparent"
                style={{ cursor: "ew-resize" }}
              />
            </g>
          ) : null}
        </g>
      </g>

      {/* The axis strip always scrubs, so it takes every touch direction. */}
      <rect
        data-zone="scrub"
        x={layout.plotLeft}
        y={layout.axisTop}
        width={layout.plotWidth}
        height={layout.axisHeight}
        fill="transparent"
        style={{ cursor: "ew-resize" }}
      />

      <g data-zone="minimap" style={{ cursor: "pointer" }}>
        <rect
          x={layout.plotLeft}
          y={layout.minimapTop - 5}
          width={layout.plotWidth}
          height={layout.minimapHeight + 10}
          fill="transparent"
        />
        {minimap.blocks.map((block) => (
          <rect
            key={`mini-${block.x0}`}
            x={block.x0}
            y={layout.minimapTop}
            width={Math.max(0, block.x1 - block.x0 - 1)}
            height={layout.minimapHeight}
            style={{ fill: GRAHA_COLOR_VARS[block.lord], fillOpacity: 0.45 }}
          />
        ))}
        <rect
          x={minimap.window.x0}
          y={layout.minimapTop - 2}
          width={Math.max(3, minimap.window.x1 - minimap.window.x0)}
          height={layout.minimapHeight + 4}
          rx={2}
          style={{ fill: "none", stroke: "var(--accent)" }}
          strokeWidth={2}
        />
        <line
          x1={minimap.toX(cursorMs)}
          x2={minimap.toX(cursorMs)}
          y1={layout.minimapTop - 3}
          y2={layout.minimapTop + layout.minimapHeight + 3}
          style={{ stroke: "var(--foreground)" }}
          strokeWidth={1.5}
        />
      </g>

      {/* Small text stays in the ink colour for contrast; a swatch carries the series colour. */}
      {endLabels.map((label) => (
        <g key={`end-${label.id}`}>
          <line
            x1={layout.plotRight + 2}
            x2={layout.plotRight + 8}
            y1={label.y}
            y2={label.y}
            style={{ stroke: GRAHA_COLOR_VARS[label.id] }}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text
            x={layout.plotRight + 10}
            y={label.y + layout.fontSize / 2 - 1}
            style={{ fill: "var(--foreground)", fontSize: layout.fontSize, fontWeight: 700 }}
          >
            {getLocalizedGrahaAbbreviation(label.id, locale)}
          </text>
        </g>
      ))}
    </svg>
  );
}
