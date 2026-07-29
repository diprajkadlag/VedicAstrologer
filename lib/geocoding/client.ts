/**
 * One entry point the UI calls, whichever way the app was built.
 *
 * A Node deployment (`next dev`, `next start`, a container) has the
 * /api/geocode route and uses it: the proxy can set a User-Agent, cache
 * upstream responses across visitors, and keep the timezone table on the
 * server. The statically exported build for GitHub Pages has no server at all,
 * so the browser talks to Nominatim itself.
 *
 * The choice is made at build time, not by probing at runtime — a fallback
 * that tries the route first would cost every Pages visitor a failed request
 * before every search.
 */

import { GeocodeServiceError } from "./shared";
import type {
  GeocodeErrorResponse,
  PlaceSearchResponse,
  PlaceSearchResult,
} from "./types";

/** Set by the Pages build; see next.config.ts. */
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

async function searchViaRoute(
  query: string,
  signal: AbortSignal,
): Promise<PlaceSearchResult[]> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
    signal,
  });

  let payload: PlaceSearchResponse | GeocodeErrorResponse;
  try {
    payload = (await response.json()) as PlaceSearchResponse | GeocodeErrorResponse;
  } catch {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service returned an invalid response.",
    );
  }

  if (!response.ok) {
    throw new GeocodeServiceError(
      response.status === 429 ? "rate-limited" : "network",
      "error" in payload ? payload.error.message : "Place search failed.",
    );
  }

  if (!("results" in payload)) {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service returned an invalid response.",
    );
  }

  return payload.results;
}

export async function searchPlaces(
  query: string,
  signal: AbortSignal,
): Promise<PlaceSearchResult[]> {
  if (!IS_STATIC_EXPORT) {
    return searchViaRoute(query, signal);
  }

  // Imported on demand so the timezone table is fetched only by builds that
  // actually need it, and never sits in the bundle of a server deployment.
  const { searchPlacesInBrowser } = await import("./browser");
  return searchPlacesInBrowser(query, { signal });
}
