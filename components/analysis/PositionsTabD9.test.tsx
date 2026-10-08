import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import InterpretationPanel from "./InterpretationPanel";
import { AppPreferencesProvider } from "../providers/AppPreferencesProvider";
import {
  RASIS,
  calculateVedicChart,
  type GrahaId,
} from "../../lib/astro/ephemeris";

const birthInstant = new Date("1990-05-15T05:00:00Z");
const chart = calculateVedicChart({
  instant: birthInstant,
  latitude: 18.5204,
  longitude: 73.8567,
});

const markup = renderToStaticMarkup(
  <AppPreferencesProvider>
    <InterpretationPanel
      chart={chart}
      request={{
        person: { fullName: "Test Person" },
        birth: {
          instant: birthInstant,
          localDate: "1990-05-15",
          localTime: "10:30:00",
          timeZone: "Asia/Kolkata",
          utcOffset: "+05:30",
        },
        location: { label: "Pune" },
      }}
      asOf={new Date("2026-10-08T12:00:00.000Z")}
      initialTab="positions"
    />
  </AppPreferencesProvider>,
);

function text(fragment: string): string {
  return fragment
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const table = markup.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
const headers = Array.from(
  table.matchAll(/<th[\s\S]*?<\/th>/g),
  (match) => text(match[0]),
);
const rows = Array.from(
  (table.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "").matchAll(
    /<tr[\s\S]*?<\/tr>/g,
  ),
  (match) => match[0],
);

// D9 sign index by body, from the known-answer table (0 = Aries).
const D9_SIGN: Readonly<Record<GrahaId, number>> = {
  sun: 9,
  moon: 8,
  mercury: 4,
  venus: 8,
  mars: 1,
  jupiter: 10,
  saturn: 9,
  rahu: 2,
  ketu: 8,
};
const VARGOTTAMA: readonly GrahaId[] = ["moon", "saturn"];

describe("positions table D9 column", () => {
  it("adds a D9 column right after the degree", () => {
    const degree = headers.findIndex((header) => /degree/i.test(header));
    expect(degree).toBeGreaterThan(-1);
    expect(headers[degree + 1]).toBe("D9");
    expect(headers).toHaveLength(8);
  });

  it("shows each body's D9 sign in that column", () => {
    const column = headers.indexOf("D9");
    expect(rows).toHaveLength(9);

    chart.planets.forEach((planet, index) => {
      const cells = Array.from(
        rows[index].matchAll(/<td[\s\S]*?<\/td>/g),
        (match) => match[0],
      );
      expect(cells).toHaveLength(headers.length);
      expect(text(cells[column]), planet.id).toContain(
        RASIS[D9_SIGN[planet.id]],
      );
    });
  });

  it("marks only the vargottama bodies, with the badge text as the name", () => {
    const column = headers.indexOf("D9");
    const marked = chart.planets
      .filter((_, index) => {
        const cells = Array.from(
          rows[index].matchAll(/<td[\s\S]*?<\/td>/g),
          (match) => match[0],
        );
        return cells[column].includes('role="img"');
      })
      .map((planet) => planet.id);

    expect(marked).toEqual(VARGOTTAMA);
    const marks = markup.match(/<span[^>]*role="img"[^>]*>/g) ?? [];
    expect(marks).toHaveLength(VARGOTTAMA.length);
    for (const mark of marks) {
      expect(mark).toContain('aria-label="Same sign in D1 and D9"');
      expect(mark).toContain('title="Same sign in D1 and D9"');
    }
  });

  it("explains the mark in a visible line, since a tooltip never shows on a phone", () => {
    const paragraphs = Array.from(
      markup.matchAll(/<p[^>]*>[\s\S]*?<\/p>/g),
      (match) => text(match[0]),
    );
    expect(paragraphs).toContain("=Same sign in D1 and D9");
    // The legend's own glyph is decoration; only the table marks are named.
    expect(markup.match(/<span[^>]*role="img"[^>]*>/g)).toHaveLength(2);
  });

  it("leaves the existing columns in place", () => {
    expect(headers).toEqual([
      "Body",
      "Zodiac sign",
      "Degree",
      "D9",
      "Lunar mansion",
      "Lord",
      "House",
      "Motion",
    ]);
  });
});
