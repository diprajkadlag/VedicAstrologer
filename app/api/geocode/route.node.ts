import { createGeocodeHandler } from "@/lib/geocoding/nominatim";

export const runtime = "nodejs";

export const GET = createGeocodeHandler({
  searchUrl: process.env.NOMINATIM_SEARCH_URL,
  userAgent: process.env.NOMINATIM_USER_AGENT,
});
