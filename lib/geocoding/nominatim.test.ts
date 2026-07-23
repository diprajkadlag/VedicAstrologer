import { describe, expect, it, vi } from "vitest";

import {
  GEOCODE_ERROR_CACHE_CONTROL,
  GEOCODE_SUCCESS_CACHE_CONTROL,
  GeocodeServiceError,
  buildNominatimSearchUrl,
  createGeocodeHandler,
  createNominatimClient,
  createUpstreamRequestGate,
  normalizeGeocodeQuery,
  normalizeNominatimResults,
} from "./nominatim";

const BERLIN_RESULT = {
  place_id: 133769868,
  osm_type: "relation",
  osm_id: 62422,
  lat: "52.5170365",
  lon: "13.3888599",
  display_name: "Berlin, Deutschland",
  addresstype: "city",
  address: {
    city: "Berlin",
    state: "Berlin",
    country: "Deutschland",
    country_code: "de",
  },
  ignored_upstream_field: "not exposed",
};

const immediateGate = {
  run<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  },
};

function jsonUpstreamResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

async function responseBody(response: Response): Promise<unknown> {
  return JSON.parse(await response.text()) as unknown;
}

describe("geocoding query validation", () => {
  it("normalizes Unicode and whitespace", () => {
    expect(normalizeGeocodeQuery("  Be\uFF52lin   Mitte  ")).toBe(
      "Berlin Mitte",
    );
  });

  it.each([null, "", "  ", "ab", "a".repeat(121), "Ber\nlin"])(
    "rejects an invalid query: %j",
    (query) => {
      expect(() => normalizeGeocodeQuery(query)).toThrow();
    },
  );

  it("encodes the query without allowing parameter or origin injection", () => {
    const url = buildNominatimSearchUrl(
      "Berlin&limit=40&format=xml",
      "https://geocoder.example.test/search?old=value#fragment",
    );

    expect(url.origin).toBe("https://geocoder.example.test");
    expect(url.pathname).toBe("/search");
    expect(url.hash).toBe("");
    expect(url.searchParams.get("q")).toBe("Berlin&limit=40&format=xml");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("addressdetails")).toBe("1");
    expect(url.searchParams.get("layer")).toBe("address");
    expect(url.searchParams.has("old")).toBe(false);
  });
});

describe("Nominatim response normalization", () => {
  it("whitelists fields and preserves all unique timezone matches", () => {
    const results = normalizeNominatimResults([BERLIN_RESULT], () => [
      "Europe/Berlin",
      "Europe/Copenhagen",
      "Europe/Berlin",
      " ",
    ]);

    expect(results).toEqual([
      {
        id: "relation:62422",
        label: "Berlin, Deutschland",
        latitude: 52.5170365,
        longitude: 13.3888599,
        locality: "Berlin",
        region: "Berlin",
        country: "Deutschland",
        countryCode: "de",
        placeType: "city",
        timeZones: ["Europe/Berlin", "Europe/Copenhagen"],
      },
    ]);
    expect(results[0]).not.toHaveProperty("ignored_upstream_field");
  });

  it("drops malformed and duplicate rows and caps output at five", () => {
    const validRows = Array.from({ length: 7 }, (_, index) => ({
      ...BERLIN_RESULT,
      osm_id: index + 1,
      lat: String(40 + index),
    }));
    const results = normalizeNominatimResults(
      [
        null,
        { ...BERLIN_RESULT, lat: null, lon: null },
        { ...BERLIN_RESULT, lat: "", lon: "" },
        { ...BERLIN_RESULT, lat: "NaN" },
        { ...BERLIN_RESULT, lon: "181" },
        validRows[0],
        validRows[0],
        ...validRows.slice(1),
      ],
      () => ["Europe/Berlin"],
    );

    expect(results).toHaveLength(5);
    expect(new Set(results.map(({ id }) => id)).size).toBe(5);
  });

  it("rejects a non-array upstream payload", () => {
    expect(() => normalizeNominatimResults({ results: [] }, () => [])).toThrow(
      GeocodeServiceError,
    );
  });

  it("resolves IANA timezones with the bundled geo-tz/all dataset", () => {
    const [berlin] = normalizeNominatimResults([BERLIN_RESULT]);
    expect(berlin.timeZones).toContain("Europe/Berlin");
  });
});

describe("Nominatim client", () => {
  it("sends only fixed parameters and identifying headers", async () => {
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        jsonUpstreamResponse([BERLIN_RESULT]),
    );
    const client = createNominatimClient({
      fetchImpl,
      findTimeZones: () => ["Europe/Berlin"],
      gate: immediateGate,
      revalidateSeconds: 1234,
      searchUrl: "https://geocoder.example.test/search",
      timeoutMs: 2500,
      userAgent: "VedicAstrologer-Test/1.0 (test@example.test)",
    });

    await client.search("Berlin");

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBeInstanceOf(URL);
    if (!(url instanceof URL)) {
      throw new Error("Expected the client to call fetch with a URL.");
    }
    expect(url.origin).toBe("https://geocoder.example.test");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "User-Agent": "VedicAstrologer-Test/1.0 (test@example.test)",
    });
    expect((init as RequestInit & { next?: unknown }).next).toEqual({
      revalidate: 1234,
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("coalesces simultaneous searches for the same normalized URL", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchImpl = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const client = createNominatimClient({
      fetchImpl,
      findTimeZones: () => ["Europe/Berlin"],
      gate: immediateGate,
    });

    const first = client.search("Berlin");
    const second = client.search("Berlin");
    resolveFetch(jsonUpstreamResponse([BERLIN_RESULT]));

    await expect(first).resolves.toEqual(await second);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it.each([
    ["non-JSON", new Response("hello", { status: 200 }), "invalid-response"],
    [
      "malformed JSON",
      new Response("{", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      "invalid-response",
    ],
    ["upstream error", jsonUpstreamResponse({}, { status: 500 }), "invalid-response"],
    [
      "upstream rate limit",
      jsonUpstreamResponse({}, { status: 429, headers: { "Retry-After": "7" } }),
      "rate-limited",
    ],
  ])("classifies %s", async (_name, upstream, expectedKind) => {
    const client = createNominatimClient({
      fetchImpl: vi.fn(async () => upstream as Response),
      findTimeZones: () => [],
      gate: immediateGate,
    });

    await expect(client.search("Berlin")).rejects.toMatchObject({
      kind: expectedKind,
    });
  });

  it.each([
    ["network failure", Object.assign(new Error("offline"), { name: "TypeError" }), "network"],
    ["timeout", Object.assign(new Error("late"), { name: "TimeoutError" }), "timeout"],
    ["abort", Object.assign(new Error("aborted"), { name: "AbortError" }), "timeout"],
  ])("classifies %s without using the network", async (_name, error, expectedKind) => {
    const client = createNominatimClient({
      fetchImpl: vi.fn(async () => {
        throw error;
      }),
      findTimeZones: () => [],
      gate: immediateGate,
    });

    await expect(client.search("Berlin")).rejects.toMatchObject({
      kind: expectedKind,
    });
  });

  it("serializes and spaces upstream operations", async () => {
    let currentTime = 1_000;
    const starts: number[] = [];
    const sleeps: number[] = [];
    const gate = createUpstreamRequestGate({
      intervalMs: 1_100,
      maxPending: 3,
      now: () => currentTime,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds);
        currentTime += milliseconds;
      },
    });

    await Promise.all([
      gate.run(async () => {
        starts.push(currentTime);
      }),
      gate.run(async () => {
        starts.push(currentTime);
      }),
      gate.run(async () => {
        starts.push(currentTime);
      }),
    ]);

    expect(starts).toEqual([1_000, 2_100, 3_200]);
    expect(sleeps).toEqual([1_100, 1_100]);
  });
});

describe("geocoding HTTP handler", () => {
  it("rejects invalid or duplicate queries without calling a client", async () => {
    const client = { search: vi.fn(async () => []) };
    const handler = createGeocodeHandler({ client });

    for (const url of [
      "http://localhost/api/geocode",
      "http://localhost/api/geocode?q=ab",
      "http://localhost/api/geocode?q=Berlin&q=Paris",
    ]) {
      const response = await handler(new Request(url));
      expect(response.status).toBe(400);
      expect(response.headers.get("Cache-Control")).toBe(
        GEOCODE_ERROR_CACHE_CONTROL,
      );
      expect(await responseBody(response)).toMatchObject({
        error: { code: "INVALID_QUERY" },
      });
    }

    expect(client.search).not.toHaveBeenCalled();
  });

  it("returns normalized successes with attribution and cache headers", async () => {
    const results = normalizeNominatimResults([BERLIN_RESULT], () => [
      "Europe/Berlin",
    ]);
    const handler = createGeocodeHandler({
      client: { search: vi.fn(async () => results) },
    });
    const response = await handler(
      new Request("http://localhost/api/geocode?q=%20Berlin%20"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      GEOCODE_SUCCESS_CACHE_CONTROL,
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await responseBody(response)).toMatchObject({
      query: "Berlin",
      results,
      attribution: {
        label: "© OpenStreetMap contributors",
        href: "https://www.openstreetmap.org/copyright",
      },
    });
  });

  it.each([
    ["busy", 429, "GEOCODER_BUSY", "2"],
    ["configuration", 503, "GEOCODER_NOT_CONFIGURED", null],
    ["rate-limited", 429, "GEOCODER_RATE_LIMITED", "6"],
    ["timeout", 504, "GEOCODER_TIMEOUT", null],
    ["network", 503, "GEOCODER_UNAVAILABLE", null],
    ["invalid-response", 502, "INVALID_GEOCODER_RESPONSE", null],
  ] as const)(
    "maps a %s service error",
    async (kind, status, code, expectedRetryAfter) => {
      const handler = createGeocodeHandler({
        client: {
          search: vi.fn(async () => {
            throw new GeocodeServiceError(
              kind,
              "private upstream detail",
              kind === "rate-limited" ? 6 : undefined,
            );
          }),
        },
      });
      const response = await handler(
        new Request("http://localhost/api/geocode?q=Berlin"),
      );

      expect(response.status).toBe(status);
      expect(response.headers.get("Cache-Control")).toBe(
        GEOCODE_ERROR_CACHE_CONTROL,
      );
      expect(response.headers.get("Retry-After")).toBe(expectedRetryAfter);
      const bodyText = await response.text();
      expect(JSON.parse(bodyText) as unknown).toMatchObject({ error: { code } });
      expect(bodyText).not.toContain("private upstream detail");
    },
  );
});
