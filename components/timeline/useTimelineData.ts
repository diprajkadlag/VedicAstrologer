"use client";

import { useEffect, useState } from "react";

import type { GrahaId } from "@/lib/astro/ephemeris";
import {
  PLANET_COMPUTE_ORDER,
  computeMoonWindow,
  computePlanetTimeline,
  type PlanetTimeline,
} from "@/lib/timeline/planetTimeline";
import type {
  TimelineWorkerRequest,
  TimelineWorkerResponse,
} from "@/lib/timeline/workerProtocol";

export type TimelineDataStatus = "computing" | "ready" | "error";

export interface TimelineData {
  readonly planets: Readonly<Partial<Record<GrahaId, PlanetTimeline>>>;
  readonly status: TimelineDataStatus;
  /** "main-thread" only when a worker could not be created or failed. */
  readonly mode: "worker" | "main-thread";
  readonly failed: readonly GrahaId[];
}

const EMPTY: TimelineData = {
  planets: {},
  status: "computing",
  mode: "worker",
  failed: [],
};

let nextRequestId = 0;

/**
 * Calculates the long-range motion of every graha except the Moon, slow
 * bodies first, in a Web Worker. State is only set from worker messages and
 * timers, never synchronously inside the effect. A result for an older range
 * is hidden by comparing keys rather than by resetting state.
 */
export function useTimelineData(startMs: number, endMs: number): TimelineData {
  const key = `${startMs}:${endMs}`;
  const [state, setState] = useState<{ key: string; data: TimelineData }>({
    key: "",
    data: EMPTY,
  });

  useEffect(() => {
    nextRequestId += 1;
    const requestId = nextRequestId;
    const received: Partial<Record<GrahaId, PlanetTimeline>> = {};
    const failed: GrahaId[] = [];
    const timers: number[] = [];
    let cancelled = false;
    let mode: TimelineData["mode"] = "worker";
    let worker: Worker | null = null;

    const publish = (status: TimelineDataStatus) => {
      if (cancelled) return;
      setState({
        key,
        data: { planets: { ...received }, status, mode, failed: [...failed] },
      });
    };

    // Rarely used: same calculation, one graha per task so input stays responsive between bodies.
    const runOnMainThread = (ids: readonly GrahaId[]) => {
      mode = "main-thread";
      let index = 0;
      const step = () => {
        if (cancelled) return;
        const id = ids[index];
        if (id === undefined) {
          publish(failed.length > 0 ? "error" : "ready");
          return;
        }
        try {
          received[id] = computePlanetTimeline(id, startMs, endMs);
        } catch (error) {
          console.error(error);
          failed.push(id);
        }
        index += 1;
        publish("computing");
        timers.push(window.setTimeout(step, 0));
      };
      timers.push(window.setTimeout(step, 0));
    };

    try {
      // Turbopack bundles this pattern as a separate worker chunk under the
      // same base path as every other chunk, so it also works on Pages.
      worker = new Worker(
        new URL("../../lib/timeline/timeline.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch (error) {
      console.warn("Life timeline: no Web Worker, calculating on the main thread.", error);
      worker = null;
    }

    if (!worker) {
      runOnMainThread(PLANET_COMPUTE_ORDER);
    } else {
      const activeWorker = worker;
      activeWorker.onmessage = (event: MessageEvent<TimelineWorkerResponse>) => {
        const message = event.data;
        if (cancelled || message.requestId !== requestId) return;
        if (message.type === "planet") {
          received[message.timeline.id] = message.timeline;
          publish("computing");
        } else if (message.type === "error") {
          console.error(`Life timeline worker: ${message.message}`);
          if (message.id) failed.push(message.id);
        } else {
          publish(failed.length > 0 ? "error" : "ready");
        }
      };
      activeWorker.onerror = (event) => {
        event.preventDefault();
        console.warn("Life timeline worker failed; calculating on the main thread.", event.message);
        activeWorker.terminate();
        worker = null;
        runOnMainThread(PLANET_COMPUTE_ORDER.filter((id) => !received[id]));
      };
      const request: TimelineWorkerRequest = {
        type: "compute",
        requestId,
        startMs,
        endMs,
        ids: PLANET_COMPUTE_ORDER,
      };
      activeWorker.postMessage(request);
    }

    return () => {
      cancelled = true;
      worker?.terminate();
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [key, startMs, endMs]);

  return state.key === key ? state.data : EMPTY;
}

/**
 * The Moon for the visible window plus two windows on each side, on the
 * main thread (a few milliseconds). Recalculated only after the view has
 * rested for 120 ms, and only when the drawn range leaves the cached one.
 */
export function useMoonWindow(
  enabled: boolean,
  viewStartMs: number,
  viewEndMs: number,
  rangeStartMs: number,
  rangeEndMs: number,
): PlanetTimeline | null {
  const [moon, setMoon] = useState<PlanetTimeline | null>(null);
  const span = viewEndMs - viewStartMs;
  // The drawn geometry and the curves reach one window beyond each side of
  // the view; the Moon must cover all of it.
  const needStartMs = Math.max(rangeStartMs, viewStartMs - span);
  const needEndMs = Math.min(rangeEndMs, viewEndMs + span);
  const covered = moon !== null && moon.startMs <= needStartMs && moon.endMs >= needEndMs;

  useEffect(() => {
    if (!enabled || covered) return;
    const timer = window.setTimeout(() => {
      // Two windows on each side, so a short pan needs no recalculation.
      const startMs = Math.max(rangeStartMs, viewStartMs - 2 * span);
      const endMs = Math.min(rangeEndMs, viewEndMs + 2 * span);
      if (endMs <= startMs) return;
      try {
        setMoon(computeMoonWindow(startMs, endMs));
      } catch (error) {
        console.error(error);
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [enabled, covered, span, viewStartMs, viewEndMs, rangeStartMs, rangeEndMs]);

  // A stale window still draws the part it covers while the next one is calculated.
  return enabled ? moon : null;
}
