/**
 * Geocoding logic that is free of any platform assumption.
 *
 * Split out of nominatim.ts so the browser client can reuse the validation and
 * normalisation without dragging in `geo-tz`, which reads its data from disk
 * and cannot be bundled for a browser. The one thing that genuinely differs
 * between the two — how a latitude and longitude become a timezone — is passed
 * in rather than imported, which is why `findTimeZones` has no default here.
 */

import type {
  GeocodeErrorCode,
  GeocodeErrorResponse,
  PlaceSearchResponse,
  PlaceSearchResult,
} from "./types";

const DEFAULT_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_USER_AGENT = "VedicAstrologer/0.1";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_REVALIDATE_SECONDS = 7 * 24 * 60 * 60;
const MAX_RESULTS = 5;
const MAX_RESPONSE_CHARACTERS = 500_000;
const MIN_QUERY_CHARACTERS = 3;
const MAX_QUERY_CHARACTERS = 120;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

export const GEOCODE_ATTRIBUTION = {
  label: "© OpenStreetMap contributors",
  href: "https://www.openstreetmap.org/copyright",
} as const;

export const GEOCODE_SUCCESS_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";
export const GEOCODE_ERROR_CACHE_CONTROL = "no-store";

export type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type TimeZoneFinder = (latitude: number, longitude: number) => string[];

type NextFetchInit = RequestInit & {
  next?: {
    revalidate: number;
  };
};

export interface UpstreamRequestGate {
  run<T>(operation: () => Promise<T>): Promise<T>;
}

export interface NominatimClient {
  search(query: string): Promise<PlaceSearchResult[]>;
}

export interface NominatimClientOptions {
  fetchImpl?: FetchImplementation;
  findTimeZones?: TimeZoneFinder;
  gate?: UpstreamRequestGate;
  revalidateSeconds?: number;
  searchUrl?: string;
  timeoutMs?: number;
  userAgent?: string;
}

export interface GeocodeHandlerOptions extends NominatimClientOptions {
  client?: NominatimClient;
}

interface NominatimAddress {
  city?: unknown;
  country?: unknown;
  country_code?: unknown;
  county?: unknown;
  hamlet?: unknown;
  municipality?: unknown;
  state?: unknown;
  town?: unknown;
  village?: unknown;
}

export type GeocodeServiceErrorKind =
  | "busy"
  | "configuration"
  | "invalid-response"
  | "network"
  | "rate-limited"
  | "timeout";

export class GeocodeServiceError extends Error {
  readonly kind: GeocodeServiceErrorKind;
  readonly retryAfterSeconds?: number;

  constructor(
    kind: GeocodeServiceErrorKind,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "GeocodeServiceError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class GeocodeQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodeQueryError";
  }
}

export function normalizeGeocodeQuery(value: string | null): string {
  if (value === null) {
    throw new GeocodeQueryError("Enter a place name to search.");
  }

  if (CONTROL_CHARACTERS.test(value)) {
    throw new GeocodeQueryError("The place name contains invalid characters.");
  }

  const normalized = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  const characterCount = Array.from(normalized).length;

  if (characterCount < MIN_QUERY_CHARACTERS) {
    throw new GeocodeQueryError(
      `Enter at least ${MIN_QUERY_CHARACTERS} characters.`,
    );
  }

  if (characterCount > MAX_QUERY_CHARACTERS) {
    throw new GeocodeQueryError(
      `Use no more than ${MAX_QUERY_CHARACTERS} characters.`,
    );
  }

  return normalized;
}

export function buildNominatimSearchUrl(
  query: string,
  configuredUrl = DEFAULT_SEARCH_URL,
): URL {
  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new GeocodeServiceError(
      "configuration",
      "The geocoding service URL is invalid.",
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new GeocodeServiceError(
      "configuration",
      "The geocoding service URL must use HTTP or HTTPS.",
    );
  }

  if (url.username || url.password) {
    throw new GeocodeServiceError(
      "configuration",
      "The geocoding service URL must not contain credentials.",
    );
  }

  url.search = "";
  url.hash = "";
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");
  url.searchParams.set("limit", String(MAX_RESULTS));

  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedText(value: unknown, maximumCharacters = 300): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const withoutControls = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");

  if (!withoutControls) {
    return null;
  }

  return Array.from(withoutControls).slice(0, maximumCharacters).join("");
}

function firstText(
  address: NominatimAddress,
  keys: Array<keyof NominatimAddress>,
): string | null {
  for (const key of keys) {
    const value = normalizedText(address[key], 120);
    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeCountryCode(value: unknown): string | null {
  const countryCode = normalizedText(value, 2)?.toLowerCase() ?? null;
  return countryCode && /^[a-z]{2}$/u.test(countryCode) ? countryCode : null;
}

function normalizedIdentifier(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const identifier = String(value);
  return /^[a-zA-Z0-9_-]{1,80}$/u.test(identifier) ? identifier : null;
}

function numericCoordinate(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function normalizeTimeZones(timeZones: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const timeZone of timeZones) {
    const value = normalizedText(timeZone, 100);
    if (value && !seen.has(value)) {
      seen.add(value);
      normalized.push(value);
    }
  }

  return normalized;
}

function normalizeNominatimResult(
  value: unknown,
  findTimeZones: TimeZoneFinder,
): PlaceSearchResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = normalizedText(value.display_name);
  const latitude = numericCoordinate(value.lat);
  const longitude = numericCoordinate(value.lon);

  if (
    !label ||
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const address: NominatimAddress = isRecord(value.address)
    ? value.address
    : {};
  const osmType = normalizedIdentifier(value.osm_type)?.toLowerCase() ?? null;
  const osmId = normalizedIdentifier(value.osm_id);
  const placeId = normalizedIdentifier(value.place_id);
  const id =
    osmType && osmId
      ? `${osmType}:${osmId}`
      : placeId
        ? `place:${placeId}`
        : `geo:${latitude}:${longitude}:${label}`;

  return {
    id,
    label,
    latitude,
    longitude,
    locality: firstText(address, [
      "city",
      "town",
      "village",
      "municipality",
      "hamlet",
      "county",
    ]),
    region: firstText(address, ["state", "county"]),
    country: normalizedText(address.country, 120),
    countryCode: normalizeCountryCode(address.country_code),
    placeType:
      normalizedText(value.addresstype, 80) ?? normalizedText(value.type, 80),
    timeZones: normalizeTimeZones(findTimeZones(latitude, longitude)),
  };
}

export function normalizeNominatimResults(
  payload: unknown,
  findTimeZones: TimeZoneFinder,
): PlaceSearchResult[] {
  if (!Array.isArray(payload)) {
    throw new GeocodeServiceError(
      "invalid-response",
      "The geocoding service returned an invalid response.",
    );
  }

  const results: PlaceSearchResult[] = [];
  const seen = new Set<string>();

  for (const value of payload) {
    const result = normalizeNominatimResult(value, findTimeZones);
    if (!result || seen.has(result.id)) {
      continue;
    }

    seen.add(result.id);
    results.push(result);

    if (results.length === MAX_RESULTS) {
      break;
    }
  }

  return results;
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createUpstreamRequestGate(options?: {
  intervalMs?: number;
  maxPending?: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
}): UpstreamRequestGate {
  const intervalMs = options?.intervalMs ?? 1_100;
  const maxPending = options?.maxPending ?? 4;
  const now = options?.now ?? Date.now;
  const sleep = options?.sleep ?? defaultSleep;
  let previous = Promise.resolve();
  let lastStartedAt = Number.NEGATIVE_INFINITY;
  let pending = 0;

  return {
    async run<T>(operation: () => Promise<T>): Promise<T> {
      if (pending >= maxPending) {
        throw new GeocodeServiceError(
          "busy",
          "The place search is busy. Try again shortly.",
          2,
        );
      }

      pending += 1;
      const waitForPrevious = previous;
      let release: () => void = () => undefined;
      previous = new Promise<void>((resolve) => {
        release = resolve;
      });

      try {
        await waitForPrevious;
        const remainingDelay = intervalMs - (now() - lastStartedAt);
        if (remainingDelay > 0) {
          await sleep(remainingDelay);
        }

        lastStartedAt = now();
        return await operation();
      } finally {
        pending -= 1;
        release();
      }
    },
  };
}

export const sharedUpstreamGate = createUpstreamRequestGate();

