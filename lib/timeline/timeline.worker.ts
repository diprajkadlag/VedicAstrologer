import { computePlanetTimeline } from "./planetTimeline";
import {
  TIMELINE_WORKER_MARKER,
  type TimelineWorkerRequest,
  type TimelineWorkerResponse,
} from "./workerProtocol";

/**
 * Worker entry for the life timeline. It only forwards to the pure
 * calculation in planetTimeline.ts, which Vitest covers; this file is not
 * imported by tests because `self` is not a worker scope in Node.
 *
 * The DOM `Worker` type has the two members used here (onmessage and
 * postMessage with a transfer list), and it avoids adding the webworker lib,
 * which conflicts with the DOM lib in this project.
 */
const scope = self as unknown as Worker;

function post(response: TimelineWorkerResponse, transfer: Transferable[] = []): void {
  scope.postMessage(response, transfer);
}

scope.onmessage = (event: MessageEvent<TimelineWorkerRequest>) => {
  const request = event.data;
  if (!request || request.type !== "compute") return;

  for (const id of request.ids) {
    try {
      const timeline = computePlanetTimeline(id, request.startMs, request.endMs);
      // The longitude table moves to the page without a copy.
      post({ type: "planet", requestId: request.requestId, timeline }, [
        timeline.series.unwrapped.buffer,
      ]);
    } catch (error) {
      post({
        type: "error",
        requestId: request.requestId,
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  post({ type: "done", requestId: request.requestId });
};

// Kept in the bundle on purpose; see TIMELINE_WORKER_MARKER.
(scope as unknown as { timelineWorkerMarker: string }).timelineWorkerMarker =
  TIMELINE_WORKER_MARKER;
