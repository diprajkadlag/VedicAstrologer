import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildKundaliSummary } from "../export/kundaliSummary";
import { APP_LOCALES, type AppLocale } from "../i18n";

import { ANALYSIS_LIMITATIONS } from "./analysisAudit";
import { LOCALIZED_ANALYSIS_LIMITATIONS, getEducationTerm } from "./education";
import { calculateVedicChart } from "./ephemeris";
import { ASTRO_GLOSSARY } from "./glossary";

/**
 * The app shows the ninth-division chart for study only. These pin what every
 * text that used to say divisional charts are not calculated now says, so the
 * wording cannot drift from what the code does.
 */

/** "Shown for study only", in each language. */
const STUDY_ONLY: Readonly<Record<AppLocale, RegExp>> = {
  en: /study only/,
  hi: /केवल अध्ययन के लिए/,
  mr: /फक्त अभ्यासासाठी/,
  de: /nur zum Lernen/,
};

/** What it is kept out of: readings, scores, AI context and the PDF report. */
const KEPT_OUT_OF: Readonly<Record<AppLocale, readonly RegExp[]>> = {
  en: [/readings/, /scores/, /AI context/, /PDF report/],
  hi: [/व्याख्याओं/, /अंकों/, /AI (?:सन्दर्भ|संदर्भ)/, /PDF रिपोर्ट/],
  mr: [/विवेचन/, /गुण/, /AI संदर्भ/, /PDF अहवाल/],
  de: [/Deutungen/, /Punktwerte/, /KI-Kontext/, /PDF-Bericht/],
};

/** The other divisional charts, still not calculated. */
const OTHER_DIVISIONS_LISTED_AS_MISSING: Readonly<Record<AppLocale, RegExp>> = {
  en: /divisional charts other than the ninth-division chart/,
  hi: /नवांश के अलावा अन्य वर्ग/,
  mr: /नवांश वगळता इतर वर्ग/,
  de: /andere Teilhoroskope als das neunte/,
};

function expectStudyOnly(text: string, locale: AppLocale, label: string) {
  expect(text, `${label} (${locale}) says study only`).toMatch(
    STUDY_ONLY[locale],
  );
  for (const marker of KEPT_OUT_OF[locale]) {
    expect(text, `${label} (${locale}) names ${marker}`).toMatch(marker);
  }
}

const chart = calculateVedicChart({
  instant: new Date("1990-05-15T05:00:00Z"),
  latitude: 18.5204,
  longitude: 73.8567,
});

describe("honesty texts about the ninth-division chart", () => {
  it.each(APP_LOCALES)("the limits list says it in %s", (locale) => {
    const text = LOCALIZED_ANALYSIS_LIMITATIONS["feature-scope"][locale];
    expectStudyOnly(text, locale, "feature-scope");
    expect(text).toMatch(OTHER_DIVISIONS_LISTED_AS_MISSING[locale]);
  });

  it.each(APP_LOCALES)("the Guide entries say it in %s", (locale) => {
    expectStudyOnly(getEducationTerm("pada").detail[locale], locale, "pada");
    expectStudyOnly(getEducationTerm("varga").detail[locale], locale, "varga");
  });

  it("marks the divisional-chart entry as partly calculated", () => {
    expect(getEducationTerm("varga").calculationStatus).toBe(
      "partly-calculated",
    );
  });

  it.each(APP_LOCALES)("the PDF limits say it in %s", (locale) => {
    const { limitations } = buildKundaliSummary({
      chart,
      request: {
        person: { fullName: "Test Person" },
        birth: {
          instant: new Date(chart.instant),
          localDate: "1990-05-15",
          localTime: "10:30:00",
          timeZone: "Asia/Kolkata",
          utcOffset: "+05:30",
        },
        location: { label: "Pune" },
      },
      asOf: new Date("2026-10-08T12:00:00.000Z"),
      locale,
    });
    const text = limitations.join(" ");
    expectStudyOnly(text, locale, "PDF limits");
    expect(text).toMatch(OTHER_DIVISIONS_LISTED_AS_MISSING[locale]);
  });

  it("the English-only audit statement and glossary entry say it", () => {
    const scope = ANALYSIS_LIMITATIONS.find(
      (limitation) => limitation.id === "feature-scope",
    );
    expect(scope).toBeDefined();
    expectStudyOnly(scope?.statement ?? "", "en", "audit feature-scope");
    expect(scope?.statement).toMatch(
      /varga charts other than the ninth-division chart/,
    );
    expectStudyOnly(ASTRO_GLOSSARY.pada.detailed, "en", "glossary pada");
  });

  describe("the Methodology tab", () => {
    // Its copy is not exported, so take each language's "not calculated"
    // paragraph out of the source and check that paragraph alone: a marker in
    // one language must not be able to satisfy another.
    const source = readFileSync(
      resolve(process.cwd(), "components", "analysis", "MethodologyTab.tsx"),
      "utf8",
    );
    const omitted = Array.from(
      source.matchAll(/\bomitted:\s*"((?:[^"\\]|\\.)*)"/g),
      (match) => match[1],
    );

    it("keeps one paragraph per language, in the order of the languages", () => {
      expect(omitted).toHaveLength(APP_LOCALES.length);
      expect(omitted[0]).toMatch(/^Sixfold strength/);
      expect(omitted[3]).toMatch(/^Sechsfache Stärkebewertung/);
    });

    it.each(APP_LOCALES)("says it in %s", (locale) => {
      const text = omitted[APP_LOCALES.indexOf(locale)];
      expectStudyOnly(text, locale, "Methodology");
      expect(text).toMatch(OTHER_DIVISIONS_LISTED_AS_MISSING[locale]);
    });
  });
});
