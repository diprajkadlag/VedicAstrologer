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
      expect(summary.copy.bhavaConclusions).toBeTruthy();
      expect(summary.copy.bhavaConclusionsIntro.length).toBeGreaterThan(80);
      for (const bhava of summary.bhavas) {
        expect(bhava.rasi).toBeTruthy();
        expect(bhava.lord).toBeTruthy();
        expect(bhava.lordBhava).toBeGreaterThanOrEqual(1);
        expect(bhava.lordBhava).toBeLessThanOrEqual(12);
        expect(bhava.conclusion).toContain(bhava.rasi);
        expect(bhava.conclusion).toContain(bhava.lord);
        expect(bhava.conclusion).toContain(String(bhava.lordBhava));
        expect(bhava.conclusion.length).toBeGreaterThan(120);
        expect(bhava.significance).toBeTruthy();
        expect(bhava.chartReading).toContain(bhava.rasi);
        expect(bhava.chartReading).toContain(bhava.lord);
        expect(bhava.reflection).toBeTruthy();
        expect(bhava.conclusion).toBe(
          `${bhava.significance} ${bhava.chartReading} ${bhava.reflection}`,
        );
        expect(bhava.constructive).toBeTruthy();
        expect(bhava.caution).toBeTruthy();
      }
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

  it("uses conventional English terminology throughout the English PDF model", () => {
    const summary = buildKundaliSummary({
      chart,
      request,
      asOf: new Date("2026-07-29T12:00:00.000Z"),
      locale: "en",
    });

    expect(summary.copy.title).toBe("Birth chart summary");
    expect(summary.core.map((item) => item.label)).toEqual([
      "Ascendant",
      "Sun",
      "Moon",
    ]);
    expect(summary.core[0].rasi).toBe("Leo");
    expect(summary.grahas.find((item) => item.id === "rahu")?.graha).toBe(
      "North Node",
    );
    expect(summary.grahas.find((item) => item.id === "ketu")?.graha).toBe(
      "South Node",
    );
    expect(summary.copy.graha).toBe("Planet");
    expect(summary.copy.placement).toBe("Zodiac sign · degree");
    expect(summary.copy.nakshatraPada).toBe(
      "Lunar mansion · quarter",
    );
    expect(summary.copy.bhava).toBe("House");
    expect(summary.copy.mahadasha).toBe("Major period");
    expect(summary.copy.antardasha).toBe("Subperiod");
    expect(summary.grahas.map((item) => item.motion)).toEqual(
      expect.arrayContaining(["Direct", "Retrograde"]),
    );
    expect(summary.method.join(" ")).not.toMatch(
      /\b(?:Lagna|Rasi|Bhava|Graha|Ayanamsa|Rahu|Ketu)\b/,
    );
    expect(summary.bhavas.map((item) => item.conclusion).join(" ")).not
      .toMatch(/\b(?:Ghara|Rasi|Bhavesha|Bhava|Graha)\b/);
  });

  it("uses native German terminology and astronomical names in the German PDF model", () => {
    const summary = buildKundaliSummary({
      chart,
      request,
      asOf: new Date("2026-07-29T12:00:00.000Z"),
      locale: "de",
    });

    expect(summary.copy.coreAnchors).toBe("Zentrale Geburtsfaktoren");
    expect(summary.copy.title).toBe("Geburtshoroskop-Zusammenfassung");
    expect(summary.core.map((item) => item.label)).toEqual([
      "Aszendent",
      "Sonne",
      "Mond",
    ]);
    expect(summary.core[0].rasi).toBe("Löwe");
    expect(summary.grahas.find((item) => item.id === "sun")?.graha).toBe(
      "Sonne",
    );
    expect(summary.grahas.find((item) => item.id === "moon")?.graha).toBe(
      "Mond",
    );
    expect(summary.grahas.find((item) => item.id === "rahu")?.graha).toBe(
      "Nordknoten",
    );
    expect(summary.grahas.find((item) => item.id === "ketu")?.graha).toBe(
      "Südknoten",
    );
    expect(summary.copy.graha).toBe("Planet");
    expect(summary.copy.placement).toBe("Tierkreiszeichen · Grad");
    expect(summary.copy.nakshatraPada).toBe("Mondstation · Viertel");
    expect(summary.copy.bhava).toBe("Haus");
    expect(summary.copy.mahadasha).toBe("Hauptperiode");
    expect(summary.copy.antardasha).toBe("Unterperiode");
    expect(summary.grahas.map((item) => item.motion)).toEqual(
      expect.arrayContaining(["Direktläufig", "Rückläufig"]),
    );
    expect(summary.method.join(" ")).not.toMatch(
      /\b(?:Lagna|Rasi|Bhava|Graha|Ayanamsa|Rahu|Ketu)\b/,
    );
    expect(summary.limitations.join(" ")).not.toMatch(
      /\b(?:Lagna|Bhava|Graha|Shadbala|Varga|Drishti|Yuti|Dasha)\b/,
    );
    expect(summary.bhavas.map((item) => item.conclusion).join(" ")).not
      .toMatch(/\b(?:Ghara|Rasi|Bhavesha|Bhava|Graha)\b/);
  });

  it.each([
    ["hi", ["लग्न", "सूर्य", "चन्द्र"]],
    ["mr", ["लग्न", "सूर्य", "चंद्र"]],
  ] as const)(
    "keeps core labels in native Devanagari for %s",
    (locale, labels) => {
      const summary = buildKundaliSummary({
        chart,
        request,
        asOf: new Date("2026-07-29T12:00:00.000Z"),
        locale,
      });

      expect(summary.core.map((item) => item.label)).toEqual(labels);
    },
  );

  it("distinguishes resident emphasis from an empty house without making either predictive", () => {
    const summary = buildKundaliSummary({
      chart,
      request,
      asOf: new Date("2026-07-29T12:00:00.000Z"),
      locale: "en",
    });
    const occupied = summary.bhavas.find(
      (bhava) => bhava.occupants !== summary.copy.noOccupants,
    );
    const empty = summary.bhavas.find(
      (bhava) => bhava.occupants === summary.copy.noOccupants,
    );

    expect(occupied).toBeDefined();
    expect(occupied?.conclusion).toContain(
      "traditional roles of its resident bodies",
    );
    expect(empty).toBeDefined();
    expect(empty?.conclusion).toContain(
      "the house is not inactive",
    );
    expect(summary.copy.bhavaConclusionsIntro).toContain(
      "not measured facts or guaranteed events",
    );
  });

  it("creates exactly three readable English sentences per house and keeps them interpretive", () => {
    const summary = buildKundaliSummary({
      chart,
      request,
      asOf: new Date("2026-07-29T12:00:00.000Z"),
      locale: "en",
    });

    for (const bhava of summary.bhavas) {
      expect(bhava.conclusion.match(/[.!?](?:\s|$)/g)).toHaveLength(3);
      expect(bhava.significance).toMatch(/^House \d+ traditionally signifies /);
      expect(bhava.chartReading).toMatch(/^In this birth chart, /);
      expect(bhava.reflection).toContain(
        "neither a fixed description of the person nor a prediction",
      );
    }
  });

  it.each([
    ["hi", "निश्चित वर्णन", "भविष्यवाणी"],
    ["mr", "निश्चित वर्णन", "भाकीत"],
    ["de", "feste Beschreibung", "Vorhersage"],
  ] as const)(
    "states the non-deterministic limit inside every %s house summary",
    (locale, fixedDescription, prediction) => {
      const summary = buildKundaliSummary({
        chart,
        request,
        asOf: new Date("2026-07-29T12:00:00.000Z"),
        locale,
      });

      for (const bhava of summary.bhavas) {
        expect(bhava.reflection).toContain(fixedDescription);
        expect(bhava.reflection).toContain(prediction);
      }
    },
  );

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
    ).toBe(
      "Asha-DeshmukhChart-geburtshoroskop-1996-11-10-de.pdf",
    );
  });

  it("uses privacy-safe generic fallbacks for empty or invalid fields", () => {
    expect(buildKundaliPdfFilename("   ", "10/11/1996", "mr")).toBe(
      "जन्मकुंडली-दिनांक-अज्ञात-mr.pdf",
    );
  });
});
