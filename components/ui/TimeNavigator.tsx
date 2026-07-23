"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import {
  defineMessages,
  INTL_LOCALES,
  type TranslationValues,
} from "@/lib/i18n";

const messages = defineMessages({
  en: {
    day: "Day",
    month: "Month",
    year: "Year",
    decade: "Decade",
    birthMoment: "Birth moment",
    before: "before",
    after: "after",
    hoursFromBirth: "{value} hours {direction} birth",
    daysFromBirth: "{value} days {direction} birth",
    yearsFromBirth: "{value} years {direction} birth",
    title: "Celestial time navigator",
    backward: "Move backward {minutes} minutes",
    forward: "Move forward {minutes} minutes",
    pause: "Pause time simulation",
    play: "Play time simulation",
    slider: "Simulated time relative to birth",
    returnBirth: "Return to birth moment",
    birth: "Birth",
    past: "Past",
    future: "Future",
  },
  hi: {
    day: "दिन",
    month: "माह",
    year: "वर्ष",
    decade: "दशक",
    birthMoment: "जन्म क्षण",
    before: "जन्म से पहले",
    after: "जन्म के बाद",
    hoursFromBirth: "{direction} {value} घंटे",
    daysFromBirth: "{direction} {value} दिन",
    yearsFromBirth: "{direction} {value} वर्ष",
    title: "खगोलीय काल संचालक",
    backward: "{minutes} मिनट पीछे जाएँ",
    forward: "{minutes} मिनट आगे जाएँ",
    pause: "समय अनुकरण रोकें",
    play: "समय अनुकरण चलाएँ",
    slider: "जन्म के सापेक्ष अनुकृत समय",
    returnBirth: "जन्म क्षण पर लौटें",
    birth: "जन्म",
    past: "अतीत",
    future: "भविष्य",
  },
  mr: {
    day: "दिवस",
    month: "महिना",
    year: "वर्ष",
    decade: "दशक",
    birthMoment: "जन्म क्षण",
    before: "जन्माआधी",
    after: "जन्मानंतर",
    hoursFromBirth: "{direction} {value} तास",
    daysFromBirth: "{direction} {value} दिवस",
    yearsFromBirth: "{direction} {value} वर्षे",
    title: "खगोलीय कालसंचालक",
    backward: "{minutes} मिनिटे मागे जा",
    forward: "{minutes} मिनिटे पुढे जा",
    pause: "काल-अनुकरण थांबवा",
    play: "काल-अनुकरण सुरू करा",
    slider: "जन्माच्या सापेक्ष अनुकृत वेळ",
    returnBirth: "जन्मक्षणावर परत जा",
    birth: "जन्म",
    past: "भूतकाळ",
    future: "भविष्य",
  },
});

export interface TimeNavigatorProps {
  birthInstant: Date;
  selectedInstant: Date;
  timeZone: string;
  onChange(instant: Date): void;
}

const WINDOWS = [
  { days: 1, labelKey: "day", stepMinutes: 5 },
  { days: 30, labelKey: "month", stepMinutes: 60 },
  { days: 365, labelKey: "year", stepMinutes: 360 },
  { days: 3650, labelKey: "decade", stepMinutes: 1440 },
] as const;

const MINUTE_MS = 60_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function offsetLabel(
  offsetMinutes: number,
  intlLocale: string,
  t: (key: keyof typeof messages.en, values?: TranslationValues) => string,
): string {
  if (offsetMinutes === 0) return t("birthMoment");
  const direction = offsetMinutes > 0 ? t("after") : t("before");
  const totalMinutes = Math.abs(offsetMinutes);
  if (totalMinutes < 24 * 60) {
    const hours = totalMinutes / 60;
    return t("hoursFromBirth", {
      value: hours.toLocaleString(intlLocale, { maximumFractionDigits: 1 }),
      direction,
    });
  }
  const days = totalMinutes / (24 * 60);
  if (days < 730) {
    return t("daysFromBirth", {
      value: days.toLocaleString(intlLocale, { maximumFractionDigits: 1 }),
      direction,
    });
  }
  const years = days / 365.2425;
  return t("yearsFromBirth", {
    value: years.toLocaleString(intlLocale, { maximumFractionDigits: 2 }),
    direction,
  });
}

export default function TimeNavigator({
  birthInstant,
  selectedInstant,
  timeZone,
  onChange,
}: TimeNavigatorProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(messages);
  const [windowDays, setWindowDays] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const windowConfig = WINDOWS.find((entry) => entry.days === windowDays) ?? WINDOWS[1];
  const maxOffsetMinutes = windowDays * 24 * 60;
  const offsetMinutes = Math.round(
    (selectedInstant.getTime() - birthInstant.getTime()) / MINUTE_MS,
  );

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(INTL_LOCALES[locale], {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone,
      }),
    [locale, timeZone],
  );
  const selectedOffsetLabel = offsetLabel(
    offsetMinutes,
    INTL_LOCALES[locale],
    t,
  );

  function setOffset(nextOffsetMinutes: number) {
    const bounded = clamp(nextOffsetMinutes, -maxOffsetMinutes, maxOffsetMinutes);
    onChange(new Date(birthInstant.getTime() + bounded * MINUTE_MS));
  }

  function changeWindow(nextDays: number) {
    setWindowDays(nextDays);
    const nextLimit = nextDays * 24 * 60;
    if (Math.abs(offsetMinutes) > nextLimit) {
      onChange(
        new Date(
          birthInstant.getTime() +
            clamp(offsetMinutes, -nextLimit, nextLimit) * MINUTE_MS,
        ),
      );
    }
  }

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      const currentOffset = Math.round(
        (selectedInstant.getTime() - birthInstant.getTime()) / MINUTE_MS,
      );
      const nextOffset = currentOffset + windowConfig.stepMinutes;
      if (nextOffset > maxOffsetMinutes) {
        setIsPlaying(false);
        return;
      }
      onChange(new Date(birthInstant.getTime() + nextOffset * MINUTE_MS));
    }, 450);

    return () => window.clearInterval(timer);
  }, [
    birthInstant,
    isPlaying,
    maxOffsetMinutes,
    onChange,
    selectedInstant,
    windowConfig.stepMinutes,
  ]);

  return (
    <section
      aria-labelledby="time-navigator-title"
      className="rounded-2xl border border-white/10 bg-[#0d1020]/90 p-4 shadow-xl shadow-black/20 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-700 dark:text-violet-200">
            <CalendarClock aria-hidden="true" className="size-4" />
          </div>
          <div>
            <h2 id="time-navigator-title" className="text-sm font-semibold text-white">
              {t("title")}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {formatter.format(selectedInstant)} · {timeZone}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200/80">
              {selectedOffsetLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
          {WINDOWS.map((entry) => (
            <button
              key={entry.days}
              type="button"
              onClick={() => changeWindow(entry.days)}
              aria-pressed={windowDays === entry.days}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                windowDays === entry.days
                  ? "bg-violet-400/20 text-violet-800 dark:text-violet-100"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              ± {t(entry.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setOffset(offsetMinutes - windowConfig.stepMinutes)}
          aria-label={t("backward", {
            minutes: windowConfig.stepMinutes.toLocaleString(
              INTL_LOCALES[locale],
            ),
          })}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <SkipBack aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsPlaying((playing) => !playing)}
          aria-label={isPlaying ? t("pause") : t("play")}
          aria-pressed={isPlaying}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400"
        >
          {isPlaying ? (
            <Pause aria-hidden="true" className="size-4" />
          ) : (
            <Play aria-hidden="true" className="ml-0.5 size-4" />
          )}
        </button>

        <input
          type="range"
          min={-maxOffsetMinutes}
          max={maxOffsetMinutes}
          step={windowConfig.stepMinutes}
          value={clamp(offsetMinutes, -maxOffsetMinutes, maxOffsetMinutes)}
          onChange={(event) => setOffset(Number(event.target.value))}
          aria-label={t("slider")}
          aria-valuetext={selectedOffsetLabel}
          className="time-slider min-w-0 flex-1"
        />

        <button
          type="button"
          onClick={() => setOffset(offsetMinutes + windowConfig.stepMinutes)}
          aria-label={t("forward", {
            minutes: windowConfig.stepMinutes.toLocaleString(
              INTL_LOCALES[locale],
            ),
          })}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <SkipForward aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChange(new Date(birthInstant));
          }}
          disabled={offsetMinutes === 0}
          aria-label={t("returnBirth")}
          className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-35 sm:inline-flex"
        >
          <RotateCcw aria-hidden="true" className="size-3.5" />
          {t("birth")}
        </button>
      </div>

      <div className="mt-2 flex justify-between pl-[5.25rem] text-[10px] uppercase tracking-wider text-slate-600 sm:pl-[6.25rem] sm:pr-20">
        <span>{t("past")}</span>
        <span>{t("birth")}</span>
        <span>{t("future")}</span>
      </div>
    </section>
  );
}
