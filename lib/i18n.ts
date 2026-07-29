export const APP_LOCALES = ["en", "hi", "mr", "de"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const APP_THEMES = ["dark", "light"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export type TranslationValues = Readonly<
  Record<string, string | number | boolean>
>;

type MessageRecord = Readonly<Record<string, string>>;

export type LocalizedMessages<Key extends string> = Readonly<
  Record<AppLocale, Readonly<Record<Key, string>>>
>;

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === "string" && APP_THEMES.includes(value as AppTheme);
}

/**
 * Defines a scoped, type-safe dictionary. Every supported language must
 * implement every key declared by the English source dictionary.
 */
export function defineMessages<const English extends MessageRecord>(
  messages: Readonly<{
    en: English;
    hi: Readonly<Record<keyof English, string>>;
    mr: Readonly<Record<keyof English, string>>;
    de: Readonly<Record<keyof English, string>>;
  }>,
): LocalizedMessages<Extract<keyof English, string>> {
  return messages;
}

export function formatMessage(
  template: string,
  values?: TranslationValues,
): string {
  if (!values) return template;

  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
  );
}

export const INTL_LOCALES: Readonly<Record<AppLocale, string>> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  de: "de-DE",
};
