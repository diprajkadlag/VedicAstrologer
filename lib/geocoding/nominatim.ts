/**
 * Server-side geocoding: the Nominatim proxy behind /api/geocode.
 *
 * Node only — it uses `geo-tz` for the timezone lookup and sets a User-Agent,
 * neither of which a browser allows. The statically exported build uses
 * ./browser.ts instead; both share ./shared.ts, so validation and the shape of
 * a result cannot drift between them.
 */

import { find as findTimeZonesFromCoordinates } from "geo-tz/all";

import {
  GEOCODE_ATTRIBUTION,
  GEOCODE_ERROR_CACHE_CONTROL,
  GEOCODE_SUCCESS_CACHE_CONTROL,
  GeocodeQueryError,
  GeocodeServiceError,
  buildNominatimSearchUrl,
  normalizeGeocodeQuery,
  normalizeNominatimResults as normalizeWithFinder,
  sharedUpstreamGate,
  type FetchImplementation,
  type NominatimClientOptions,
  type NominatimClient,
  type TimeZoneFinder,
} from "./shared";
import type {
  GeocodeErrorCode,
  GeocodeErrorResponse,
  PlaceSearchResponse,
  PlaceSearchResult,
} from "./types";

export * from "./shared";

const DEFAULT_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_USER_AGENT = "VedicAstrologer/0.1";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_REVALIDATE_SECONDS = 7 * 24 * 60 * 60;
const MAX_RESPONSE_CHARACTERS = 500_000;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate: number;
  };
};

export interface GeocodeHandlerOptions extends NominatimClientOptions {
  client?: NominatimClient;
}

/**
 * On the server the timezone finder defaults to geo-tz, so callers — and the
 * existing tests — can omit it. ./shared.ts requires it explicitly.
 */
export function normalizeNominatimResults(
  payload: unknown,
  findTimeZones: TimeZoneFinder = findTimeZonesFromCoordinates,
): PlaceSearchResult[] {
  return normalizeWithFinder(payload, findTimeZones);
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function retryAfterSeconds(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 60) : 2;
}

async function parseUpstreamPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service returned an invalid response.",
    );
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_RESPONSE_CHARACTERS
  ) {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service response was too large.",
    );
  }

  const body = await response.text();
  if (body.length > MAX_RESPONSE_CHARACTERS) {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service response was too large.",
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service returned invalid JSON.",
    );
  }
}

export function createNominatimClient(
  options: NominatimClientOptions = {},
): NominatimClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const findTimeZones = options.findTimeZones ?? findTimeZonesFromCoordinates;
  const gate = options.gate ?? sharedUpstreamGate;
  const searchUrl = options.searchUrl ?? DEFAULT_SEARCH_URL;
  const userAgent = options.userAgent?.trim() || DEFAULT_USER_AGENT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const revalidateSeconds =
    options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS;
  const inFlight = new Map<string, Promise<PlaceSearchResult[]>>();

  return {
    search(query: string): Promise<PlaceSearchResult[]> {
      const requestUrl = buildNominatimSearchUrl(query, searchUrl);
      const requestKey = requestUrl.href;
      const existing = inFlight.get(requestKey);
      if (existing) {
        return existing;
      }

      const request = gate
        .run(async () => {
          const init: NextFetchInit = {
            headers: {
              Accept: "application/json",
              "User-Agent": userAgent,
            },
            next: { revalidate: revalidateSeconds },
            signal: AbortSignal.timeout(timeoutMs),
          };

          let response: Response;
          try {
            response = await fetchImpl(requestUrl, init);
          } catch (error) {
            if (isTimeoutError(error)) {
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
              retryAfterSeconds(response.headers.get("retry-after")),
            );
          }

          if (!response.ok) {
            throw new GeocodeServiceError(
              "invalid-response",
              "The geocoding service returned an error.",
            );
          }

          try {
            const payload = await parseUpstreamPayload(response);
            return normalizeWithFinder(payload, findTimeZones);
          } catch (error) {
            if (error instanceof GeocodeServiceError) {
              throw error;
            }
            if (isTimeoutError(error)) {
              throw new GeocodeServiceError(
                "timeout",
                "The geocoding service took too long to respond.",
              );
            }

            throw new GeocodeServiceError(
              "invalid-response",
              "The geocoding service returned an invalid response.",
            );
          }
        })
        .finally(() => {
          inFlight.delete(requestKey);
        });

      inFlight.set(requestKey, request);
      return request;
    },
  };
}

function jsonResponse(
  body: PlaceSearchResponse | GeocodeErrorResponse,
  status: number,
  additionalHeaders?: HeadersInit,
): Response {
  const headers = new Headers(additionalHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(
  status: number,
  code: GeocodeErrorCode,
  message: string,
  retryAfter?: number,
): Response {
  const headers = new Headers({
    "Cache-Control": GEOCODE_ERROR_CACHE_CONTROL,
  });
  if (retryAfter !== undefined) {
    headers.set("Retry-After", String(retryAfter));
  }

  return jsonResponse({ error: { code, message } }, status, headers);
}

function serviceErrorResponse(error: GeocodeServiceError): Response {
  switch (error.kind) {
    case "busy":
      return errorResponse(
        429,
        "GEOCODER_BUSY",
        "Place search is busy. Please try again shortly.",
        error.retryAfterSeconds ?? 2,
      );
    case "configuration":
      return errorResponse(
        503,
        "GEOCODER_NOT_CONFIGURED",
        "Place search is not configured.",
      );
    case "rate-limited":
      return errorResponse(
        429,
        "GEOCODER_RATE_LIMITED",
        "Place search is temporarily rate limited.",
        error.retryAfterSeconds ?? 2,
      );
    case "timeout":
      return errorResponse(
        504,
        "GEOCODER_TIMEOUT",
        "Place search timed out. Please try again.",
      );
    case "network":
      return errorResponse(
        503,
        "GEOCODER_UNAVAILABLE",
        "Place search is temporarily unavailable.",
      );
    case "invalid-response":
      return errorResponse(
        502,
        "INVALID_GEOCODER_RESPONSE",
        "Place search returned an invalid response.",
      );
  }
}

export function createGeocodeHandler(
  options: GeocodeHandlerOptions = {},
): (request: Request) => Promise<Response> {
  let client = options.client;

  return async (request: Request): Promise<Response> => {
    let query: string;

    try {
      const requestUrl = new URL(request.url);
      if (requestUrl.searchParams.getAll("q").length !== 1) {
        throw new GeocodeQueryError("Provide exactly one place name.");
      }
      query = normalizeGeocodeQuery(requestUrl.searchParams.get("q"));
    } catch (error) {
      const message =
        error instanceof GeocodeQueryError
          ? error.message
          : "The place search request is invalid.";
      return errorResponse(400, "INVALID_QUERY", message);
    }

    try {
      client ??= createNominatimClient(options);
      const results = await client.search(query);
      return jsonResponse(
        { query, results, attribution: GEOCODE_ATTRIBUTION },
        200,
        { "Cache-Control": GEOCODE_SUCCESS_CACHE_CONTROL },
      );
    } catch (error) {
      if (error instanceof GeocodeServiceError) {
        return serviceErrorResponse(error);
      }

      return errorResponse(
        502,
        "INVALID_GEOCODER_RESPONSE",
        "Place search returned an invalid response.",
      );
    }
  };
}
