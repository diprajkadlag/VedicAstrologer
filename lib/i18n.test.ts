import { describe, expect, it } from "vitest";

import {
  DEFAULT_APP_LOCALE,
  defineMessages,
  formatMessage,
  isAppLocale,
  isAppTheme,
  resolveAppLocale,
} from "./i18n";

describe("app internationalization primitives", () => {
  it("defaults first-time visitors to English and preserves valid choices", () => {
    expect(DEFAULT_APP_LOCALE).toBe("en");
    expect(resolveAppLocale(null, null)).toBe("en");
    expect(resolveAppLocale("unsupported", "unsupported")).toBe("en");
    expect(resolveAppLocale("de", "en")).toBe("de");
    expect(resolveAppLocale(null, "mr")).toBe("mr");
  });

  it("recognizes only supported persisted preferences", () => {
    expect(["en", "hi", "mr", "de"].every(isAppLocale)).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
    expect(["dark", "light"].every(isAppTheme)).toBe(true);
    expect(isAppTheme("system")).toBe(false);
  });

  it("interpolates known values and leaves unknown tokens visible", () => {
    expect(
      formatMessage("{name}: Bhava {house}; {unknown}", {
        name: "Surya",
        house: 10,
      }),
    ).toBe("Surya: Bhava 10; {unknown}");
  });

  it("keeps scoped dictionaries aligned across all four languages", () => {
    const dictionary = defineMessages({
      en: { title: "Title", body: "Body" },
      hi: { title: "शीर्षक", body: "विवरण" },
      mr: { title: "शीर्षक", body: "मजकूर" },
      de: { title: "Titel", body: "Inhalt" },
    });

    const expected = ["body", "title"];
    expect(Object.keys(dictionary.en).sort()).toEqual(expected);
    expect(Object.keys(dictionary.hi).sort()).toEqual(expected);
    expect(Object.keys(dictionary.mr).sort()).toEqual(expected);
    expect(Object.keys(dictionary.de).sort()).toEqual(expected);
  });
});
