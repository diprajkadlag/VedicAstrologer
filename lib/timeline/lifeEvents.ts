/**
 * Life events for the timeline: milestones and targets the reader adds, so
 * the chart can be compared with dates that matter to them.
 *
 * By default events live only in memory, like the birth data. Only when the
 * reader turns on "keep on this device" are they written to localStorage,
 * under a key derived from the birth data so another chart in the same
 * browser does not see them. Nothing is uploaded. Every storage access is
 * guarded, because storage can be missing or blocked.
 */

export const LIFE_EVENT_CATEGORIES = [
  "education",
  "career",
  "relationship",
  "family",
  "health",
  "move",
  "other",
] as const;

export type LifeEventCategory = (typeof LIFE_EVENT_CATEGORIES)[number];

export interface LifeEvent {
  readonly id: string;
  readonly label: string;
  /** Absolute instant in milliseconds (local noon of the chosen date). */
  readonly ms: number;
  readonly category: LifeEventCategory;
}

export const LIFE_EVENT_LABEL_MAX = 80;
export const LIFE_EVENT_LIMIT = 200;
const STORAGE_PREFIX = "jyotish-life-events:";
const STORAGE_VERSION = 1;

/** Trims, collapses whitespace and removes control characters. */
export function sanitizeLifeEventLabel(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIFE_EVENT_LABEL_MAX);
}

export function isLifeEventCategory(value: unknown): value is LifeEventCategory {
  return typeof value === "string" && (LIFE_EVENT_CATEGORIES as readonly string[]).includes(value);
}

export function createLifeEvent(
  label: string,
  ms: number,
  category: LifeEventCategory,
  id: string,
): LifeEvent | null {
  const clean = sanitizeLifeEventLabel(label);
  if (!clean || !Number.isFinite(ms) || !isLifeEventCategory(category)) return null;
  return { id, label: clean, ms, category };
}

export function sortLifeEvents(events: readonly LifeEvent[]): LifeEvent[] {
  return [...events].sort((a, b) => a.ms - b.ms || a.label.localeCompare(b.label));
}

/**
 * Case- and accent-insensitive search over labels and category names. The
 * category names are passed in localized, so a reader can type "Beruf".
 */
export function searchLifeEvents(
  events: readonly LifeEvent[],
  query: string,
  categoryNames: Readonly<Record<LifeEventCategory, string>>,
): LifeEvent[] {
  // Latin accents only, so "e" also finds "é". Devanagari vowel signs are
  // part of the word and stay.
  const fold = (value: string) =>
    value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();
  const needle = fold(query.trim());
  if (!needle) return sortLifeEvents(events);
  return sortLifeEvents(
    events.filter(
      (event) =>
        fold(event.label).includes(needle) || fold(categoryNames[event.category]).includes(needle),
    ),
  );
}

/**
 * FNV-1a over the birth instant and rounded coordinates. It only separates
 * charts in one browser's storage; it is not a privacy measure, and it needs
 * no secure context (unlike crypto.subtle).
 */
export function lifeEventStorageKey(birthMs: number, latitude: number, longitude: number): string {
  const text = `${Math.round(birthMs / 60_000)}|${latitude.toFixed(3)}|${longitude.toFixed(3)}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${STORAGE_PREFIX}${hash.toString(16).padStart(8, "0")}`;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function parseStored(raw: string | null): LifeEvent[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as { version?: unknown }).version !== STORAGE_VERSION ||
      !Array.isArray((parsed as { events?: unknown }).events)
    ) {
      return null;
    }
    const events: LifeEvent[] = [];
    for (const entry of (parsed as { events: unknown[] }).events.slice(0, LIFE_EVENT_LIMIT)) {
      if (!entry || typeof entry !== "object") continue;
      const candidate = entry as Record<string, unknown>;
      const event =
        typeof candidate.id === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.ms === "number"
          ? createLifeEvent(candidate.label, candidate.ms, candidate.category as LifeEventCategory, candidate.id)
          : null;
      if (event) events.push(event);
    }
    return events;
  } catch {
    return null;
  }
}

/** Events saved for this chart, or null when nothing is saved or storage fails. */
export function loadSavedLifeEvents(key: string): LifeEvent[] | null {
  try {
    return parseStored(storage()?.getItem(key) ?? null);
  } catch {
    return null;
  }
}

/** Returns false when the browser refused to store the events. */
export function saveLifeEvents(key: string, events: readonly LifeEvent[]): boolean {
  try {
    const target = storage();
    if (!target) return false;
    target.setItem(
      key,
      JSON.stringify({ version: STORAGE_VERSION, events: events.slice(0, LIFE_EVENT_LIMIT) }),
    );
    return true;
  } catch {
    return false;
  }
}

export function forgetSavedLifeEvents(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    // Nothing to do: the events were never readable either.
  }
}
