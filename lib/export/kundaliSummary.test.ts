import { describe, expect, it } from "vitest";

import { calculateVedicChart, type VedicChart } from "../astro/ephemeris";
import { APP_LOCALES } from "../i18n";

import {
  buildKundaliPdfFilename,
  buildKundaliSummary,
  type KundaliPdfRequest,
} from "./kundaliSummary";

const birthInstant = new Date("1996-11-09T20:15:00.000Z");
const chart = calculateVedicChart({
  instant: birthInstant,
  latitude: 18.5204,
  longitude: 73.8567,
});
const request: KundaliPdfRequest = {
  person: {
    fullName: "Asha Deshmukh",
    gender: "female",
  },
  birth: {
    instant: birthInstant,
    localDate: "1996-11-10",
    localTime: "01:45:00",
    timeZone: "Asia/Kolkata",
    utcOffset: "+05:30",
    precision: "second",
  },
  location: {
    label: "Pune, Maharashtra, India",
    latitude: 18.5204,
    longitude: 73.8567,
  },
};

describe("buildKundaliSummary", () => {
  it.each(APP_LOCALES)(
    "builds a complete, explicitly localized %s report",
    (locale) => {
      const summary = buildKundaliSummary({
        chart,
        request,
        asOf: new Date("2026-07-29T12:00:00.000Z"),
        locale,
      });

      expect(summary.locale).toBe(locale);
      expect(summary.core).toHaveLength(3);
      expect(summary.core.map((item) => item.id)).toEqual([
        "lagna",
        "sun",
        "moon",
      ]);
      expect(summary.grahas).toHaveLength(9);
      expect(summary.bhavas).toHaveLength(12);
      expect(summary.bhavas.map((item) => item.number)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      expect(summary.dashas.mahadasha.lord).toBeTruthy();
      expect(summary.dashas.antardasha.lord).toBeTruthy();
      expect(summary.method).toHaveLength(4);
      expect(summary.limitations).toHaveLength(7);
      expect(summary.audit.checksPerformed).toBeGreaterThan(50);
      expect(summary.audit.warningCount).toBe(0);

      const serialized = JSON.stringify(summary);
      expect(serialized).not.toContain("undefined");
      expect(serialized).not.toContain("⟦DE-ÜBERSETZUNG-FEHLT⟧");
    },
  );

  it("preserves Sanskrit terminology in German instead of English zodiac names", () => {
    const summary = buildKundaliSummary({
      chart,
      request,
      asOf: new Date("2026-07-29T12:00:00.000Z"),
      locale: "de",
    });

    expect(summary.copy.coreAnchors).toBe("Zentrale Geburtsfaktoren");
    expect(summary.core[0].label).toBe("Lagna");
    expect(summary.core[0].rasi).not.toMatch(
      /Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/,
    );
    expect(summary.copy.mahadasha).toBe("Mahadasha");
    expect(summary.copy.antardasha).toBe("Antardasha");
  });

  it("blocks export when the chart fails its structural consistency audit", () => {
    const invalidChart = {
      ...chart,
      houses: chart.houses.slice(0, 11),
    } as VedicChart;

    expect(() =>
      buildKundaliSummary({
        chart: invalidChart,
        request,
        asOf: new Date("2026-07-29T12:00:00.000Z"),
        locale: "en",
      }),
    ).toThrow(/export blocked/i);
  });
});

describe("buildKundaliPdfFilename", () => {
  it("removes unsafe filesystem characters and keeps locale/date metadata", () => {
    expect(
      buildKundaliPdfFilename(
        '  Asha <Deshmukh>:"Chart"  ',
        "1996-11-10",
        "de",
      ),
    ).toBe("Asha-DeshmukhChart-kundali-1996-11-10-de.pdf");
  });

  it("uses privacy-safe generic fallbacks for empty or invalid fields", () => {
    expect(buildKundaliPdfFilename("   ", "10/11/1996", "mr")).toBe(
      "kundali-kundali-natal-mr.pdf",
    );
  });
});
