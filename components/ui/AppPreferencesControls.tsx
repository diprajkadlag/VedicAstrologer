"use client";

import { Languages, Moon, Sun } from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import { defineMessages, type AppLocale } from "@/lib/i18n";

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
  },
});

const localeLabels: Readonly<Record<AppLocale, keyof typeof messages.en>> = {
  en: "english",
  hi: "hindi",
  mr: "marathi",
  de: "german",
};

export default function AppPreferencesControls() {
  const { locale, setLocale, theme, toggleTheme } = useAppPreferences();
  const t = useScopedTranslations(messages);

  return (
    <div
      aria-label={t("preferences")}
      className="flex flex-wrap items-center gap-2"
    >
      <label className="relative inline-flex items-center">
        <Languages
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-4 text-violet-700 dark:text-violet-300"
        />
        <span className="sr-only">{t("language")}</span>
        <select
          aria-label={t("language")}
          value={locale}
          onChange={(event) => setLocale(event.target.value as AppLocale)}
          className="min-h-10 appearance-none rounded-xl border border-white/10 bg-white/[0.055] py-2 pl-9 pr-8 text-xs font-medium text-slate-200 outline-none transition hover:bg-white/10 focus:border-violet-600/50 dark:focus:border-violet-300/50"
        >
          {(Object.keys(localeLabels) as AppLocale[]).map((option) => (
            <option key={option} value={option}>
              {t(localeLabels[option])}
            </option>
          ))}
        </select>
      </label>

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
