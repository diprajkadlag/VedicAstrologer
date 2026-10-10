import { describe, expect, it } from "vitest";

import {
  DEFAULT_SPAN_MS,
  MIN_SPAN_MS,
  YEAR_MS,
  chooseTickUnit,
  clampWindow,
  computeLayout,
  laneGeometry,
  largestChanges,
  longitudeToY,
  panWindow,
  planetGeometry,
  revealInstant,
  spanLabelFor,
  spanOf,
  timeTicks,
  timeToX,
  windowAround,
  xToTime,
  zoomLevelForSpan,
  zoomWindow,
  type TimeWindow,
} from "./geometry";
import { DAY_MS, motionSegments, type PlanetTimeline } from "./planetTimeline";

const BIRTH = Date.parse("1990-06-15T04:30:00Z");
const RANGE: TimeWindow = { startMs: BIRTH, endMs: BIRTH + 100 * YEAR_MS };
const LAYOUT_320 = computeLayout(320, { ribbonRows: 2, showStrength: false, laneCount: 4 });

function syntheticTimeline(values: number[], retrogradeFrom?: number): PlanetTimeline {
  const startMs = Date.parse("2020-01-01T00:00:00Z");
  const unwrapped = Float64Array.from(values);
  const endMs = startMs + (values.length - 1) * DAY_MS;
  const events =
    retrogradeFrom === undefined
      ? []
      : [
          {
            kind: "station" as const,
            id: "mars" as const,
            ms: startMs + retrogradeFrom * DAY_MS,
            turns: "retrograde" as const,
            longitudeDeg: values[retrogradeFrom] % 360,
          },
        ];
  return {
    id: "mars",
    startMs,
    endMs,
    series: { startMs, stepMs: DAY_MS, unwrapped },
    initialSign: Math.floor((values[0] % 360) / 30),
    initialRetrograde: false,
    events,
    computeMs: 0,
  };
}

describe("zoom rules", () => {
  it("maps spans to the three levels at 60 days and 18 months", () => {
    expect(zoomLevelForSpan(DEFAULT_SPAN_MS.macro)).toBe("macro");
    expect(zoomLevelForSpan(DEFAULT_SPAN_MS.meso)).toBe("meso");
    expect(zoomLevelForSpan(DEFAULT_SPAN_MS.micro)).toBe("micro");
    expect(zoomLevelForSpan(60 * DAY_MS)).toBe("meso");
    expect(zoomLevelForSpan(60 * DAY_MS - 1)).toBe("micro");
    expect(zoomLevelForSpan(1.5 * YEAR_MS)).toBe("macro");
  });

  it("keeps windows inside the life range and above the minimum span", () => {
    const early = clampWindow(BIRTH - 5 * YEAR_MS, 10 * YEAR_MS, RANGE);
    expect(early.startMs).toBe(BIRTH);
    expect(spanOf(early)).toBe(10 * YEAR_MS);
    const late = clampWindow(RANGE.endMs, 10 * YEAR_MS, RANGE);
    expect(late.endMs).toBe(RANGE.endMs);
    expect(spanOf(clampWindow(BIRTH, DAY_MS, RANGE))).toBe(MIN_SPAN_MS);
    expect(spanOf(clampWindow(BIRTH, 500 * YEAR_MS, RANGE))).toBe(spanOf(RANGE));
  });

  it("zooms around an anchor that keeps its screen position", () => {
    const window = windowAround(BIRTH + 30 * YEAR_MS, 12 * YEAR_MS, RANGE);
    const anchor = window.startMs + spanOf(window) * 0.25;
    const zoomed = zoomWindow(window, 0.5, anchor, RANGE);
    expect(spanOf(zoomed)).toBeCloseTo(6 * YEAR_MS, -3);
    expect((anchor - zoomed.startMs) / spanOf(zoomed)).toBeCloseTo(0.25, 9);
  });

  it("pans and reveals within the range", () => {
    const window = windowAround(BIRTH + 50 * YEAR_MS, 12 * YEAR_MS, RANGE);
    expect(panWindow(window, -1000 * YEAR_MS, RANGE).startMs).toBe(BIRTH);
    const target = window.endMs + 3 * YEAR_MS;
    const revealed = revealInstant(window, target, RANGE);
    expect(target).toBeLessThan(revealed.endMs);
    expect(target).toBeGreaterThan(revealed.startMs);
    expect(revealInstant(window, BIRTH + 50 * YEAR_MS, RANGE)).toBe(window);
  });
});

describe("layout", () => {
  it("uses the reviewed sizes at 320, 390 and desktop widths", () => {
    expect(LAYOUT_320.density).toBe("phone");
    expect(LAYOUT_320.plotWidth).toBe(256);
    expect(LAYOUT_320.paneHeight).toBe(240);
    const wide = computeLayout(390, { ribbonRows: 2, showStrength: true, laneCount: 4 });
    expect(wide.density).toBe("wide");
    expect(wide.plotWidth).toBe(310);
    expect(wide.paneHeight).toBe(288);
    expect(wide.strengthHeight).toBe(12);
    const desktop = computeLayout(1100, { ribbonRows: 4, showStrength: false, laneCount: 4 });
    expect(desktop.density).toBe("desktop");
    expect(desktop.paneHeight).toBe(360);
    expect(desktop.lanesTop).toBeGreaterThan(desktop.paneTop + desktop.paneHeight);
    expect(desktop.height).toBeGreaterThan(desktop.lanesTop + 4 * desktop.laneHeight);
  });

  it("converts between time and x in both directions", () => {
    const window = windowAround(BIRTH + 10 * YEAR_MS, 12 * YEAR_MS, RANGE);
    const ms = window.startMs + spanOf(window) * 0.37;
    expect(xToTime(timeToX(ms, window, LAYOUT_320), window, LAYOUT_320)).toBeCloseTo(ms, -1);
    expect(timeToX(window.startMs, window, LAYOUT_320)).toBe(LAYOUT_320.plotLeft);
    expect(timeToX(window.endMs, window, LAYOUT_320)).toBe(LAYOUT_320.plotRight);
  });
});

describe("calendar ticks", () => {
  it("chooses years, months or days by the space per label", () => {
    expect(chooseTickUnit(windowAround(BIRTH + 50 * YEAR_MS, 100 * YEAR_MS, RANGE), LAYOUT_320)).toEqual({
      kind: "year",
      step: 20,
    });
    expect(chooseTickUnit(windowAround(BIRTH + 30 * YEAR_MS, DEFAULT_SPAN_MS.meso, RANGE), LAYOUT_320).kind).toBe(
      "month",
    );
    expect(chooseTickUnit(windowAround(BIRTH + 30 * YEAR_MS, DEFAULT_SPAN_MS.micro, RANGE), LAYOUT_320).kind).toBe(
      "day",
    );
  });

  it("places year ticks on 1 January in the birth time zone", () => {
    const window: TimeWindow = {
      startMs: Date.parse("2019-06-01T00:00:00Z"),
      endMs: Date.parse("2031-06-01T00:00:00Z"),
    };
    const ticks = timeTicks(window, LAYOUT_320, "Asia/Kolkata", "en-IN");
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    for (const tick of ticks) {
      const local = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date(tick.ms));
      expect(local).toBe("01-01, 00");
      expect(tick.x).toBeGreaterThanOrEqual(LAYOUT_320.plotLeft);
      expect(tick.x).toBeLessThanOrEqual(LAYOUT_320.plotRight);
    }
  });

  it("keeps labelled ticks at least 40 px apart", () => {
    const window = windowAround(BIRTH + 30 * YEAR_MS, DEFAULT_SPAN_MS.micro, RANGE);
    const ticks = timeTicks(window, LAYOUT_320, "Europe/Berlin", "de-DE");
    for (let index = 1; index < ticks.length; index += 1) {
      expect(ticks[index].x - ticks[index - 1].x).toBeGreaterThanOrEqual(40);
    }
  });
});

describe("planet lines", () => {
  const pane = { houseOneSign: 0, paneTop: 100, paneHeight: 240 };

  it("puts house 1 at the bottom and wraps at the top", () => {
    expect(longitudeToY(0, pane)).toBe(340);
    expect(longitudeToY(180, pane)).toBe(220);
    expect(longitudeToY(359.999, pane)).toBeCloseTo(100, 2);
    expect(longitudeToY(30, { ...pane, houseOneSign: 1 })).toBe(340);
  });

  it("breaks the line at each full turn instead of drawing a jump", () => {
    // 0 to 720 degrees over 60 days: two full turns.
    const values = Array.from({ length: 61 }, (_, day) => day * 12);
    const timeline = syntheticTimeline(values);
    const window: TimeWindow = { startMs: timeline.startMs, endMs: timeline.endMs };
    const geometry = planetGeometry(timeline, motionSegments(timeline), window, LAYOUT_320, pane);
    expect(geometry.retrograde).toBe("");
    // One initial move plus a resume at each of the two wraps.
    expect(geometry.direct.match(/M/g)).toHaveLength(3);
    expect(geometry.direct).toContain(" 100M");
    expect(geometry.end).not.toBeNull();
  });

  it("switches to the retrograde path exactly at a station", () => {
    const values = Array.from({ length: 41 }, (_, day) => (day <= 20 ? 100 + day : 120 - (day - 20) * 0.5));
    const timeline = syntheticTimeline(values, 20);
    const window: TimeWindow = { startMs: timeline.startMs, endMs: timeline.endMs };
    const geometry = planetGeometry(timeline, motionSegments(timeline), window, LAYOUT_320, pane);
    expect(geometry.direct.length).toBeGreaterThan(0);
    expect(geometry.retrograde.length).toBeGreaterThan(0);
    expect(geometry.stations).toHaveLength(1);
    const stationX = timeToX(timeline.startMs + 20 * DAY_MS, window, LAYOUT_320);
    expect(geometry.retrograde.startsWith(`M${Math.round(stationX * 10) / 10} `)).toBe(true);
  });

  it("draws nothing outside the table's range", () => {
    const timeline = syntheticTimeline([10, 11, 12]);
    const window: TimeWindow = { startMs: timeline.endMs + DAY_MS, endMs: timeline.endMs + 10 * DAY_MS };
    expect(planetGeometry(timeline, motionSegments(timeline), window, LAYOUT_320, pane)).toEqual({
      direct: "",
      retrograde: "",
      end: null,
      stations: [],
    });
  });
});

describe("lanes", () => {
  const window: TimeWindow = { startMs: 0, endMs: 100 * DAY_MS };
  const steps = [
    { startMs: 0, endMs: 30 * DAY_MS, value: 50 },
    { startMs: 30 * DAY_MS, endMs: 60 * DAY_MS, value: 70 },
    { startMs: 60 * DAY_MS, endMs: 100 * DAY_MS, value: 35 },
  ];

  it("draws a step line with fills on the correct side of 50", () => {
    const geometry = laneGeometry(steps, window, LAYOUT_320, 500);
    expect(geometry.line.startsWith("M")).toBe(true);
    expect(geometry.line.match(/V/g)).toHaveLength(2);
    expect(geometry.fillAbove).not.toBe("");
    expect(geometry.fillBelow).not.toBe("");
    expect(geometry.baselineY).toBe(500 + LAYOUT_320.laneHeight / 2);
  });

  it("ranks visible changes by size with a minimum spacing", () => {
    const changes = largestChanges(steps, window, LAYOUT_320, 60);
    expect(changes.map((change) => change.delta)).toEqual([20, -35]);
    expect(largestChanges(steps, window, LAYOUT_320, 1000)).toHaveLength(1);
    expect(largestChanges(steps, window, LAYOUT_320, 1000)[0].delta).toBe(-35);
  });

  it("labels spans by their width", () => {
    expect(spanLabelFor(90)).toBe("full");
    expect(spanLabelFor(30)).toBe("short");
    expect(spanLabelFor(10)).toBe("none");
  });
});
