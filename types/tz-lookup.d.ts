/**
 * tz-lookup ships plain JavaScript with no types. One function, one shape:
 * latitude and longitude in, an IANA zone name out. It throws for coordinates
 * that have no zone (open ocean), which the caller handles.
 */
declare module "tz-lookup" {
  export default function tzLookup(latitude: number, longitude: number): string;
}
