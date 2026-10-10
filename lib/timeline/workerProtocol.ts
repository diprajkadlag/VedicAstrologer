import type { GrahaId } from "../astro/ephemeris";
import type { PlanetTimeline } from "./planetTimeline";

/** Messages between the life-timeline worker and the page. */

export interface TimelineWorkerRequest {
  readonly type: "compute";
  /** Replies with another id belong to an older chart and are ignored. */
  readonly requestId: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly ids: readonly GrahaId[];
}

export type TimelineWorkerResponse =
  | {
      readonly type: "planet";
      readonly requestId: number;
      readonly timeline: PlanetTimeline;
    }
  | { readonly type: "done"; readonly requestId: number }
  | {
      readonly type: "error";
      readonly requestId: number;
      readonly id: GrahaId | null;
      readonly message: string;
    };

/**
 * A marker string that the worker bundle carries. The Pages workflow can grep
 * the static export for it to prove that the worker chunk was emitted.
 */
export const TIMELINE_WORKER_MARKER = "vedic-life-timeline-worker-v1";
