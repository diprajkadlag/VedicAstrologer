"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  formatMessage,
  isAppLocale,
  isAppTheme,
  type AppLocale,
  type AppTheme,
  type LocalizedMessages,
  type TranslationValues,
} from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "jyotish-observatory-locale";
const THEME_STORAGE_KEY = "jyotish-observatory-theme";

const documentCopy: Readonly<
  Record<AppLocale, Readonly<{ title: string; description: string }>>
> = {
  en: {
    title: "Jyotish Observatory",
    description:
      "Explore a Lahiri sidereal birth chart through a 3D celestial sphere, Vedic charts, and transparent Jyotish analysis.",
  },
  hi: {
    title: "ज्योतिष वेधशाला",
    description:
      "3D खगोलीय गोले, वैदिक कुण्डलियों और पारदर्शी ज्योतिष विश्लेषण से लाहिरी निरयन जन्म कुण्डली देखें।",
  },
  mr: {
    title: "ज्योतिष वेधशाळा",
    description:
      "3D खगोलीय गोल, वैदिक कुंडल्या आणि पारदर्शक ज्योतिष विश्लेषणातून लाहिरी निरयन जन्मकुंडली पाहा.",
  },
  de: {
    title: "Jyotish-Observatorium",
    description:
      "Erkunde ein siderisches Lahiri-Geburtshoroskop mit einer interaktiven 3D-Himmelssphäre, vedischen Horoskopdarstellungen und transparenter Jyotish-Analyse.",
  },
};

interface AppPreferencesValue {
  locale: AppLocale;
  theme: AppTheme;
  setLocale(locale: AppLocale): void;
  setTheme(theme: AppTheme): void;
  toggleTheme(): void;
}

const AppPreferencesContext = createContext<AppPreferencesValue | null>(null);

function applyDocumentPreferences(locale: AppLocale, theme: AppTheme) {
  const root = document.documentElement;
  root.lang = locale;
  root.dataset.locale = locale;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function subscribeToPreferences(onStoreChange: () => void) {
  const colorScheme = window.matchMedia("(prefers-color-scheme: light)");
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("app-preferences-change", onStoreChange);
  colorScheme.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("app-preferences-change", onStoreChange);
    colorScheme.removeEventListener("change", onStoreChange);
  };
}

function readPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The current document still receives the preference below. Persistence
    // can be unavailable in privacy-restricted browsing contexts.
  }
}

function getLocaleSnapshot(): AppLocale {
  const storedLocale = readPreference(LOCALE_STORAGE_KEY);
  if (isAppLocale(storedLocale)) return storedLocale;
  return isAppLocale(document.documentElement.lang)
    ? document.documentElement.lang
    : "en";
}

function getThemeSnapshot(): AppTheme {
  const storedTheme = readPreference(THEME_STORAGE_KEY);
  if (isAppTheme(storedTheme)) return storedTheme;
  const documentTheme = document.documentElement.dataset.theme;
  if (isAppTheme(documentTheme)) return documentTheme;
  return "light";
}

function getServerLocaleSnapshot(): AppLocale {
  return "en";
}

function getServerThemeSnapshot(): AppTheme {
  return "light";
}

function emitPreferenceChange() {
  window.dispatchEvent(new Event("app-preferences-change"));
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToPreferences,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );
  const theme = useSyncExternalStore(
    subscribeToPreferences,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    const copy = documentCopy[locale];
    document.title = copy.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.description);
    let themeColor = document.querySelector<HTMLMetaElement>(
      'meta[data-app-preference="theme-color"]',
    );
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      themeColor.dataset.appPreference = "theme-color";
      document.head.append(themeColor);
    }
    themeColor.content = theme === "light" ? "#f6f5f1" : "#060711";
    applyDocumentPreferences(locale, theme);
  }, [locale, theme]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    writePreference(LOCALE_STORAGE_KEY, nextLocale);
    applyDocumentPreferences(
      nextLocale,
      isAppTheme(document.documentElement.dataset.theme)
        ? document.documentElement.dataset.theme
        : "light",
    );
    emitPreferenceChange();
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    writePreference(THEME_STORAGE_KEY, nextTheme);
    applyDocumentPreferences(
      isAppLocale(document.documentElement.lang)
        ? document.documentElement.lang
        : "en",
      nextTheme,
    );
    emitPreferenceChange();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo<AppPreferencesValue>(
    () => ({ locale, theme, setLocale, setTheme, toggleTheme }),
    [locale, setLocale, setTheme, theme, toggleTheme],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesValue {
  const preferences = useContext(AppPreferencesContext);
  if (!preferences) {
    throw new Error(
      "useAppPreferences must be used inside AppPreferencesProvider.",
    );
  }
  return preferences;
}

export function useScopedTranslations<Key extends string>(
  messages: LocalizedMessages<Key>,
): (key: Key, values?: TranslationValues) => string {
  const { locale } = useAppPreferences();
  return useCallback(
    (key: Key, values?: TranslationValues) =>
      formatMessage(messages[locale]?.[key] ?? messages.en[key], values),
    [locale, messages],
  );
}
