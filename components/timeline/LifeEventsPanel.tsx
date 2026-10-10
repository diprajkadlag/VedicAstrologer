"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Flag, Plus, Search, Trash2 } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import {
  LIFE_EVENT_CATEGORIES,
  LIFE_EVENT_LABEL_MAX,
  createLifeEvent,
  searchLifeEvents,
  type LifeEvent,
  type LifeEventCategory,
} from "@/lib/timeline/lifeEvents";

import { dateInputValue, eventInstantFromDateInput, formatDate, type TimelineTranslate } from "./timelineText";
import type { TimelineMessageKey } from "./timelineMessages";

export interface LifeEventsPanelProps {
  readonly events: readonly LifeEvent[];
  readonly keepOnDevice: boolean;
  readonly storageFailed: boolean;
  readonly rangeStartMs: number;
  readonly rangeEndMs: number;
  readonly defaultMs: number;
  readonly timeZone: string;
  readonly locale: AppLocale;
  readonly t: TimelineTranslate;
  onAdd(event: LifeEvent): void;
  onRemove(id: string): void;
  onJump(event: LifeEvent): void;
  onKeepChange(keep: boolean): void;
}

let nextEventNumber = 0;

function newEventId(): string {
  nextEventNumber += 1;
  return `event-${Date.now().toString(36)}-${nextEventNumber}`;
}

export default function LifeEventsPanel({
  events,
  keepOnDevice,
  storageFailed,
  rangeStartMs,
  rangeEndMs,
  defaultMs,
  timeZone,
  locale,
  t,
  onAdd,
  onRemove,
  onJump,
  onKeepChange,
}: LifeEventsPanelProps) {
  const idBase = useId().replaceAll(":", "");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(() => dateInputValue(defaultMs, timeZone));
  const [category, setCategory] = useState<LifeEventCategory>("career");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const categoryNames = useMemo(
    () =>
      Object.fromEntries(
        LIFE_EVENT_CATEGORIES.map((entry) => [entry, t(`category_${entry}` as TimelineMessageKey)]),
      ) as Record<LifeEventCategory, string>,
    [t],
  );
  const visible = useMemo(() => searchLifeEvents(events, query, categoryNames), [events, query, categoryNames]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ms = eventInstantFromDateInput(date, timeZone, rangeStartMs, rangeEndMs);
    if (ms === "outside") {
      setError(t("eventOutOfRange"));
      return;
    }
    const created = ms === null ? null : createLifeEvent(label, ms, category, newEventId());
    if (!created) {
      setError(t("eventInvalid"));
      return;
    }
    setError(null);
    setLabel("");
    onAdd(created);
  }

  const inputClass =
    "min-h-10 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]";

  return (
    <section aria-labelledby={`${idBase}-title`} className="space-y-4" data-testid="timeline-events">
      <div>
        <h3 id={`${idBase}-title`} className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Flag aria-hidden="true" className="size-4 text-[var(--accent)]" />
          {t("eventsTitle")}
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t("eventsIntro")}</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end [&>*]:min-w-0">
        <label className="grid gap-1 text-xs text-[var(--muted)]">
          {t("eventLabel")}
          <input
            type="text"
            value={label}
            maxLength={LIFE_EVENT_LABEL_MAX}
            onChange={(event) => setLabel(event.target.value)}
            className={inputClass}
            data-testid="timeline-event-label"
          />
        </label>
        <label className="grid gap-1 text-xs text-[var(--muted)]">
          {t("eventDate")}
          <input
            type="date"
            value={date}
            min={dateInputValue(rangeStartMs, timeZone)}
            max={dateInputValue(rangeEndMs - 1, timeZone)}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
            data-testid="timeline-event-date"
          />
        </label>
        <label className="grid gap-1 text-xs text-[var(--muted)]">
          {t("eventCategory")}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as LifeEventCategory)}
            className={inputClass}
          >
            {LIFE_EVENT_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>
                {categoryNames[entry]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          data-testid="timeline-event-add"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#ffffff] transition hover:opacity-90"
        >
          <Plus aria-hidden="true" className="size-4" />
          {t("addEvent")}
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-xs text-[var(--band-friction-text)]">
          {error}
        </p>
      ) : null}

      <label className="flex min-h-10 items-start gap-2 text-xs text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={keepOnDevice}
          onChange={(event) => onKeepChange(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
          data-testid="timeline-event-keep"
        />
        <span>
          <span className="font-medium">{t("keepOnDevice")}</span>
          <span className="mt-0.5 block text-[11px] leading-5 text-[var(--muted)]">{t("eventsPrivacy")}</span>
        </span>
      </label>
      {storageFailed ? <p className="text-xs text-[var(--band-friction-text)]">{t("storageFailed")}</p> : null}

      {events.length > 0 ? (
        <label className="relative block">
          <span className="sr-only">{t("searchEvents")}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            placeholder={t("searchEvents")}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClass} pl-9`}
            data-testid="timeline-event-search"
          />
        </label>
      ) : null}

      {events.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">{t("noEvents")}</p>
      ) : visible.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">{t("noMatches")}</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]" data-testid="timeline-event-list">
          {visible.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className="block break-words text-sm font-medium text-[var(--foreground)]">{event.label}</span>
                <span className="block text-[11px] text-[var(--muted)]">
                  {formatDate(event.ms, timeZone, locale)} · {categoryNames[event.category]}
                </span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => onJump(event)}
                  className="min-h-10 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                >
                  {t("jump")}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(event.id)}
                  aria-label={t("removeEvent", { label: event.label })}
                  className="grid size-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:text-[var(--band-friction-text)]"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
