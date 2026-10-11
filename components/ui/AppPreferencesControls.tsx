"use client";

import { Clock3, Languages, Moon, Sun } from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import { defineMessages, type AppLocale } from "@/lib/i18n";
import { isTimeZoneMode } from "@/lib/timeZones";

const messages = defineMessages({
  en: {
    preferences: "Display preferences",
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    german: "Deutsch",
    lightTheme: "Use light theme",
    darkTheme: "Use dark theme",
    currentLight: "Light theme",
    currentDark: "Dark theme",
    timeZone: "Time zone",
    timeZoneBirth: "Birth place",
    timeZoneDevice: "This device",
  },
  hi: {
    preferences: "प्रदर्शन प्राथमिकताएँ",
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    german: "Deutsch",
    lightTheme: "हल्की थीम अपनाएँ",
    darkTheme: "गहरी थीम अपनाएँ",
    currentLight: "हल्की थीम",
    currentDark: "गहरी थीम",
    timeZone: "समय-क्षेत्र",
    timeZoneBirth: "जन्मस्थान",
    timeZoneDevice: "यह उपकरण",
  },
  mr: {
    preferences: "दृश्य प्राधान्ये",
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    german: "Deutsch",
    lightTheme: "फिकट थीम वापरा",
    darkTheme: "गडद थीम वापरा",
    currentLight: "फिकट थीम",
    currentDark: "गडद थीम",
    timeZone: "कालविभाग",
    timeZoneBirth: "जन्मस्थळ",
    timeZoneDevice: "हे उपकरण",
  },
  de: {
    preferences: "Anzeigeeinstellungen",
    language: "Sprache",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    german: "Deutsch",
    lightTheme: "Helles Design verwenden",
    darkTheme: "Dunkles Design verwenden",
    currentLight: "Helles Design",
    currentDark: "Dunkles Design",
    timeZone: "Zeitzone",
    timeZoneBirth: "Geburtsort",
    timeZoneDevice: "Dieses Gerät",
  },
});

const localeLabels: Readonly<Record<AppLocale, keyof typeof messages.en>> = {
  en: "english",
  hi: "hindi",
  mr: "marathi",
  de: "german",
};

export function AppLanguageSelect({
  showLabel = false,
  className = "",
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { locale, setLocale } = useAppPreferences();
  const t = useScopedTranslations(messages);

  return (
    <label
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-[var(--foreground)] transition hover:border-violet-500/35 ${className}`}
    >
      <Languages
        aria-hidden="true"
        className="size-4 shrink-0 text-violet-700 dark:text-violet-300"
      />
      {showLabel ? (
        <span className="text-xs font-semibold">{t("language")}</span>
      ) : (
        <span className="sr-only">{t("language")}</span>
      )}
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as AppLocale)}
        className="min-h-9 min-w-0 bg-transparent py-1.5 text-xs font-medium text-[var(--foreground)] outline-none"
      >
        {(Object.keys(localeLabels) as AppLocale[]).map((option) => (
          <option key={option} value={option}>
            {t(localeLabels[option])}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Chooses the zone for computed dates (time navigator, life timeline, period
 * tab). The birth record and the PDF always keep the birth place's zone.
 */
export function AppTimeZoneSelect({
  birthTimeZone,
  deviceTimeZone,
}: {
  birthTimeZone: string;
  deviceTimeZone: string;
}) {
  const { timeZoneMode, setTimeZoneMode } = useAppPreferences();
  const t = useScopedTranslations(messages);

  return (
    <label className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-[var(--foreground)] transition hover:border-violet-500/35">
      <Clock3
        aria-hidden="true"
        className="size-4 shrink-0 text-violet-700 dark:text-violet-300"
      />
      <span className="text-xs font-semibold">{t("timeZone")}</span>
      <select
        aria-label={t("timeZone")}
        value={timeZoneMode}
        onChange={(event) => {
          if (isTimeZoneMode(event.target.value)) setTimeZoneMode(event.target.value);
        }}
        className="min-h-9 min-w-0 max-w-[12rem] bg-transparent py-1.5 text-xs font-medium text-[var(--foreground)] outline-none sm:max-w-none"
        data-testid="time-zone-select"
      >
        {/* The zone names stand next to every date, so the options stay short for phones. */}
        <option value="birth" title={birthTimeZone}>
          {t("timeZoneBirth")}
        </option>
        <option value="device" title={deviceTimeZone}>
          {t("timeZoneDevice")}
        </option>
      </select>
    </label>
  );
}

export default function AppPreferencesControls() {
  const { theme, toggleTheme } = useAppPreferences();
  const t = useScopedTranslations(messages);

  return (
    <div
      aria-label={t("preferences")}
      className="flex flex-wrap items-center gap-2"
    >
      <AppLanguageSelect />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("lightTheme") : t("darkTheme")}
        title={theme === "dark" ? t("lightTheme") : t("darkTheme")}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
      >
        {theme === "dark" ? (
          <Sun
            aria-hidden="true"
            className="size-4 text-amber-700 dark:text-amber-300"
          />
        ) : (
          <Moon aria-hidden="true" className="size-4 text-indigo-600" />
        )}
        <span className="hidden sm:inline">
          {theme === "dark" ? t("currentDark") : t("currentLight")}
        </span>
      </button>
    </div>
  );
}
