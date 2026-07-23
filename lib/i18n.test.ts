import { describe, expect, it } from "vitest";

import {
  defineMessages,
  formatMessage,
  isAppLocale,
  isAppTheme,
} from "./i18n";

describe("app internationalization primitives", () => {
  it("recognizes only supported persisted preferences", () => {
    expect(["en", "hi", "mr"].every(isAppLocale)).toBe(true);
    expect(isAppLocale("de")).toBe(false);
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

  it("keeps scoped dictionaries aligned across all three languages", () => {
    const dictionary = defineMessages({
      en: { title: "Title", body: "Body" },
      hi: { title: "शीर्षक", body: "विवरण" },
      mr: { title: "शीर्षक", body: "मजकूर" },
    });

    const expected = ["body", "title"];
    expect(Object.keys(dictionary.en).sort()).toEqual(expected);
    expect(Object.keys(dictionary.hi).sort()).toEqual(expected);
    expect(Object.keys(dictionary.mr).sort()).toEqual(expected);
  });
});

