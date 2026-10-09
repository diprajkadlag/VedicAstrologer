import { afterEach, describe, expect, it } from "vitest";

import {
  LIFE_EVENT_LABEL_MAX,
  createLifeEvent,
  forgetSavedLifeEvents,
  lifeEventStorageKey,
  loadSavedLifeEvents,
  sanitizeLifeEventLabel,
  saveLifeEvents,
  searchLifeEvents,
  type LifeEventCategory,
} from "./lifeEvents";

const NAMES: Record<LifeEventCategory, string> = {
  education: "Bildung",
  career: "Beruf",
  relationship: "Beziehung",
  family: "Familie",
  health: "Gesundheit",
  move: "Umzug",
  other: "Sonstiges",
};

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const globalWithWindow = globalThis as unknown as { window?: unknown };

afterEach(() => {
  delete globalWithWindow.window;
});

describe("life event labels", () => {
  it("trims, collapses whitespace, removes control characters and caps the length", () => {
    expect(sanitizeLifeEventLabel("  New\u0007   job\n ")).toBe("New job");
    expect(sanitizeLifeEventLabel("x".repeat(200))).toHaveLength(LIFE_EVENT_LABEL_MAX);
  });

  it("rejects empty labels, bad instants and unknown categories", () => {
    expect(createLifeEvent("   ", 0, "career", "a")).toBeNull();
    expect(createLifeEvent("Job", Number.NaN, "career", "a")).toBeNull();
    expect(createLifeEvent("Job", 0, "lottery" as LifeEventCategory, "a")).toBeNull();
    expect(createLifeEvent("Job", 0, "career", "a")).toEqual({
      id: "a",
      label: "Job",
      ms: 0,
      category: "career",
    });
  });
});

describe("searchLifeEvents", () => {
  const events = [
    createLifeEvent("Umzug nach Köln", 300, "move", "1")!,
    createLifeEvent("Abitur", 100, "education", "2")!,
    createLifeEvent("Neue Stelle", 200, "career", "3")!,
  ];

  it("sorts by date when the query is empty", () => {
    expect(searchLifeEvents(events, "  ", NAMES).map((event) => event.id)).toEqual(["2", "3", "1"]);
  });

  it("ignores case and Latin accents, and matches localized category names", () => {
    expect(searchLifeEvents(events, "KOLN", NAMES).map((event) => event.id)).toEqual(["1"]);
    expect(searchLifeEvents(events, "beruf", NAMES).map((event) => event.id)).toEqual(["3"]);
    expect(searchLifeEvents(events, "zzz", NAMES)).toEqual([]);
  });
});

describe("device storage", () => {
  it("derives a stable key that differs between charts", () => {
    const key = lifeEventStorageKey(Date.parse("1990-06-15T04:30:00Z"), 18.5204, 73.8567);
    expect(key).toBe(lifeEventStorageKey(Date.parse("1990-06-15T04:30:20Z"), 18.52041, 73.85669));
    expect(key).not.toBe(lifeEventStorageKey(Date.parse("1990-06-15T04:31:00Z"), 18.5204, 73.8567));
    expect(key).toMatch(/^jyotish-life-events:[0-9a-f]{8}$/);
  });

  it("round-trips events and drops malformed entries", () => {
    const store = new MemoryStorage();
    globalWithWindow.window = { localStorage: store };
    const key = "jyotish-life-events:test";
    const events = [createLifeEvent("Abitur", 100, "education", "2")!];
    expect(saveLifeEvents(key, events)).toBe(true);
    expect(loadSavedLifeEvents(key)).toEqual(events);

    store.setItem(
      key,
      JSON.stringify({
        version: 1,
        events: [{ id: "x", label: "", ms: 1, category: "career" }, events[0], 42],
      }),
    );
    expect(loadSavedLifeEvents(key)).toEqual(events);
    store.setItem(key, "{not json");
    expect(loadSavedLifeEvents(key)).toBeNull();
    forgetSavedLifeEvents(key);
    expect(loadSavedLifeEvents(key)).toBeNull();
  });

  it("reports failure instead of throwing when storage is blocked", () => {
    globalWithWindow.window = {
      get localStorage(): Storage {
        throw new Error("SecurityError");
      },
    };
    expect(saveLifeEvents("k", [])).toBe(false);
    expect(loadSavedLifeEvents("k")).toBeNull();
    expect(() => forgetSavedLifeEvents("k")).not.toThrow();
  });
});
