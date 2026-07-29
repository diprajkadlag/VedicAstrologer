/**
 * Place search from the browser, with no server of our own.
 *
 * The statically exported build (GitHub Pages) has no `/api/geocode` to call,
 * so the browser talks to Nominatim directly. Two things make that workable:
 * Nominatim serves `Access-Control-Allow-Origin: *`, and its usage policy
 * accepts a Referer in place of a User-Agent — which is the only option here,
 * because browsers forbid scripts from setting User-Agent.
 *
 * Sending requests from each visitor's own address is also kinder to the
 * service than funnelling every user of a hosted deployment through one server
 * IP, which is what the proxy route does.
 *
 * Everything after the fetch — validation, normalisation, the field mapping —
 * is the shared code the server route uses, so the two paths cannot drift.
 * Only the transport and the timezone lookup differ: `geo-tz` reads its data
 * from disk and cannot run in a browser, so this uses `tz-lookup`, which ships
 * its table as plain JavaScript.
 */

import tzLookup from "tz-lookup";

import {
  GeocodeServiceError,
  buildNominatimSearchUrl,
  createUpstreamRequestGate,
  normalizeNominatimResults,
} from "./shared";
import type { PlaceSearchResult } from "./types";

const DEFAULT_TIMEOUT_MS = 5_000;

/** One shared gate per tab, so a fast typist cannot burst the upstream. */
const browserGate = createUpstreamRequestGate();

export function findTimeZonesInBrowser(
  latitude: number,
  longitude: number,
): string[] {
  try {
    return [tzLookup(latitude, longitude)];
  } catch {
    // Open ocean and a few disputed edges have no zone. The form lets the
    // visitor type one, so an empty list is a degraded result, not a failure.
    return [];
  }
}

export interface BrowserSearchOptions {
  fetchImpl?: typeof fetch;
  findTimeZones?: (latitude: number, longitude: number) => string[];
  searchUrl?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function searchPlacesInBrowser(
  query: string,
  options: BrowserSearchOptions = {},
): Promise<PlaceSearchResult[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const findTimeZones = options.findTimeZones ?? findTimeZonesInBrowser;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildNominatimSearchUrl(query, options.searchUrl);

  return browserGate.run(async () => {
    // The caller's abort (a newer keystroke) and our own timeout are both
    // reasons to give up, so the request listens for either.
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: "application/json" },
        signal,
      });
    } catch (error) {
      // An abort from the caller is not a service failure; let it through so
      // the form can ignore it rather than showing an error for a keystroke.
      if (options.signal?.aborted) {
        throw error;
      }
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new GeocodeServiceError(
          "timeout",
          "The geocoding service took too long to respond.",
        );
      }
      throw new GeocodeServiceError(
        "network",
        "The geocoding service could not be reached.",
      );
    }

    if (response.status === 429) {
      throw new GeocodeServiceError(
        "rate-limited",
        "The geocoding service is receiving too many requests.",
      );
    }
    if (!response.ok) {
      throw new GeocodeServiceError(
        "invalid-response",
        "The geocoding service returned an error.",
      );
    }

    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      throw new GeocodeServiceError(
        "invalid-response",
        "The geocoding service returned invalid JSON.",
      );
    }

    return normalizeNominatimResults(payload, findTimeZones);
  });
}
