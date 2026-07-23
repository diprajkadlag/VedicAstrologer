export interface PlaceSearchResult {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  locality: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  placeType: string | null;
  timeZones: string[];
}

export interface GeocodeAttribution {
  label: string;
  href: string;
}

export interface PlaceSearchResponse {
  query: string;
  results: PlaceSearchResult[];
  attribution: GeocodeAttribution;
}

export type GeocodeErrorCode =
  | "INVALID_QUERY"
  | "GEOCODER_BUSY"
  | "GEOCODER_NOT_CONFIGURED"
  | "GEOCODER_RATE_LIMITED"
  | "GEOCODER_TIMEOUT"
  | "GEOCODER_UNAVAILABLE"
  | "INVALID_GEOCODER_RESPONSE";

export interface GeocodeErrorResponse {
  error: {
    code: GeocodeErrorCode;
    message: string;
  };
}
