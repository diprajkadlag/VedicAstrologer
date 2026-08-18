import { describe, expect, it } from "vitest";

import { APP_LOCALES } from "../i18n";
import { GRAHA_IDS } from "./ephemeris";
import {
  BHAVA_EDUCATION,
  EDUCATION_TERMS,
  GRAHA_EDUCATION,
  LOCALIZED_ANALYSIS_LIMITATIONS,
  buildGrahaInBhavaReading,
  getEducationForAstroTerm,
  getEducationTerm,
  getGenericNakshatraReading,
} from "./education";
import { ASTRO_TERM_IDS } from "./glossary";

const OBSOLETE_EN_DE_PRIMARY_TERMS =
  /\b(?:Lagna|Rasi|Bhava|Graha|Nakshatra|Pada|Mahadasha|Antardasha|Gochara|Dasha|Surya|Chandra|Mesha|Meena|Shukra|Mangala|Guru|Shani|Budha|Kundali|Jyotish|Rahu|Ketu|Ayanamsha|Ayanamsa|Shadbala|Varga|Drishti|Yuti|Navamsha)\b/i;

const CONDITIONAL_LANGUAGE: Readonly<Record<(typeof APP_LOCALES)[number], RegExp>> = {
  en: /\b(?:if|can|may|consider|rather than)\b/iu,
  hi: /(?:यदि|सक|देखिए|विचार|बजाय)/u,
  mr: /(?:जर|शक|पाहा|विचार|ऐवजी)/u,
  de: /\b(?:wenn|falls|kann|können|prüfen|statt)\b/iu,
};

const CAUTION_BOUNDARY_LANGUAGE: Readonly<
  Record<(typeof APP_LOCALES)[number], RegExp>
> = {
  en: /\b(?:do not|does not|cannot|never|rather than|instead of|fixed trait)\b/iu,
  hi: /(?:न मानें|न निकालें|नहीं|न करें|न कर सकती)/u,
  mr: /(?:न मानता|न मानता|न काढता|नाही|नका|करू शकत नाही)/u,
  de: /\b(?:nicht|statt|weder|niemals|keine|keinen)\b/iu,
};

const HARD_DETERMINISTIC_CLAIMS: Readonly<
  Record<(typeof APP_LOCALES)[number], RegExp>
> = {
  en: /\byou (?:will|are destined|are guaranteed|must inevitably)\b/iu,
  hi: /आप (?:निश्चित रूप से|अवश्य|हमेशा) (?:होंगे|हैं|करेंगे)/u,
  mr: /तुम्ही (?:नक्कीच|अटळपणे|नेहमी) (?:असाल|आहात|कराल)/u,
  de: /\bSie (?:werden sicher|sind zwangsläufig|müssen unausweichlich)\b/iu,
};

function sentenceCount(value: string): number {
  return value.match(/[.!?।](?:\s|$)/gu)?.length ?? 0;
}

describe("multilingual Jyotish education", () => {
  it("provides all foundational terms in every locale", () => {
    expect(EDUCATION_TERMS.length).toBeGreaterThanOrEqual(20);
    for (const term of EDUCATION_TERMS) {
      expect(getEducationTerm(term.id)).toBe(term);
      for (const locale of APP_LOCALES) {
        expect(term.name[locale].trim()).not.toBe("");
        expect(term.summary[locale].length).toBeGreaterThan(20);
        expect(term.detail[locale].length).toBeGreaterThan(40);
        expect(term.readingSequence[locale].length).toBeGreaterThan(20);
      }
    }
  });

  it("bridges every existing clickable AstroTerm to localized education", () => {
    for (const id of ASTRO_TERM_IDS) {
      const term = getEducationForAstroTerm(id);
      expect(term.id).toBeTruthy();
      expect(term.name.hi).toBeTruthy();
      expect(term.name.mr).toBeTruthy();
    }
  });

  it("covers all nine grahas and twelve Bhavas in every locale", () => {
    expect(Object.keys(GRAHA_EDUCATION)).toHaveLength(9);
    expect(Object.keys(BHAVA_EDUCATION)).toHaveLength(12);

    for (const graha of GRAHA_IDS) {
      for (const locale of APP_LOCALES) {
        expect(GRAHA_EDUCATION[graha].name[locale]).toBeTruthy();
        expect(GRAHA_EDUCATION[graha].signifies[locale]).toBeTruthy();
      }
    }

    for (const profile of Object.values(BHAVA_EDUCATION)) {
      for (const locale of APP_LOCALES) {
        const constructive = profile.constructiveDetail[locale];
        const caution = profile.cautionDetail[locale];

        expect(constructive.length).toBeGreaterThan(150);
        expect(caution.length).toBeGreaterThan(170);
        expect(sentenceCount(constructive)).toBe(2);
        expect(sentenceCount(caution)).toBe(2);
        expect(constructive).toMatch(CONDITIONAL_LANGUAGE[locale]);
        expect(caution).toMatch(CONDITIONAL_LANGUAGE[locale]);
        expect(caution).toMatch(CAUTION_BOUNDARY_LANGUAGE[locale]);
        expect(`${constructive} ${caution}`).not.toMatch(
          HARD_DETERMINISTIC_CLAIMS[locale],
        );
        expect(`${constructive} ${caution}`).not.toContain(
          "DE-ÜBERSETZUNG-FEHLT",
        );

        if (locale === "hi" || locale === "mr") {
          expect(`${constructive} ${caution}`).toMatch(
            /\p{Script=Devanagari}/u,
          );
        }
      }

      expect(profile.constructiveDetail.de).not.toBe(
        profile.constructiveDetail.en,
      );
      expect(profile.cautionDetail.de).not.toBe(profile.cautionDetail.en);
    }

    for (const locale of APP_LOCALES) {
      expect(
        new Set(
          Object.values(BHAVA_EDUCATION).map(
            (profile) => profile.constructiveDetail[locale],
          ),
        ).size,
      ).toBe(12);
      expect(
        new Set(
          Object.values(BHAVA_EDUCATION).map(
            (profile) => profile.cautionDetail[locale],
          ),
        ).size,
      ).toBe(12);
    }
  });

  it("generates all 108 graha-in-Bhava readings in each language", () => {
    for (const locale of APP_LOCALES) {
      const readings = GRAHA_IDS.flatMap((graha) =>
        Array.from({ length: 12 }, (_, index) =>
          buildGrahaInBhavaReading(
            graha,
            (index + 1) as keyof typeof BHAVA_EDUCATION,
            locale,
          ),
        ),
      );

      expect(readings).toHaveLength(108);
      for (const reading of readings) {
        expect(reading.summary.length).toBeGreaterThan(80);
        expect(reading.methodNote.length).toBeGreaterThan(50);
        expect(reading.constructive.length).toBeGreaterThan(150);
        expect(reading.caution.length).toBeGreaterThan(190);
        expect(sentenceCount(reading.constructive)).toBe(2);
        expect(sentenceCount(reading.caution)).toBe(2);
        expect(reading.constructive).toMatch(CONDITIONAL_LANGUAGE[locale]);
        expect(reading.caution).toMatch(CONDITIONAL_LANGUAGE[locale]);
        expect(reading.caution).toMatch(CAUTION_BOUNDARY_LANGUAGE[locale]);
        expect(`${reading.constructive} ${reading.caution}`).not.toMatch(
          HARD_DETERMINISTIC_CLAIMS[locale],
        );
      }
    }
  });

  it("localizes every disclosed analysis limitation", () => {
    for (const limitation of Object.values(LOCALIZED_ANALYSIS_LIMITATIONS)) {
      for (const locale of APP_LOCALES) {
        expect(limitation[locale].length).toBeGreaterThan(40);
      }
    }
  });

  it("uses explicit German education prose instead of English fallback", () => {
    for (const term of EDUCATION_TERMS) {
      expect(term.summary.de).not.toBe(term.summary.en);
      expect(term.detail.de).not.toBe(term.detail.en);
      expect(term.readingSequence.de).not.toBe(term.readingSequence.en);
      expect(term.summary.de).not.toContain("ÜBERSETZUNG-FEHLT");
    }

    for (const graha of GRAHA_IDS) {
      const profile = GRAHA_EDUCATION[graha];
      expect(profile.astronomicalKind.de).not.toBe(
        profile.astronomicalKind.en,
      );
      expect(profile.signifies.de).not.toBe(profile.signifies.en);
      expect(profile.constructive.de).not.toBe(profile.constructive.en);
      expect(profile.caution.de).not.toBe(profile.caution.en);
      expect(profile.inquiry.de).not.toBe(profile.inquiry.en);
    }

    for (const profile of Object.values(BHAVA_EDUCATION)) {
      expect(profile.domain.de).not.toBe(profile.domain.en);
      expect(profile.constructive.de).not.toBe(profile.constructive.en);
      expect(profile.caution.de).not.toBe(profile.caution.en);
    }

    for (const limitation of Object.values(
      LOCALIZED_ANALYSIS_LIMITATIONS,
    )) {
      expect(limitation.de).not.toBe(limitation.en);
      expect(limitation.de).not.toContain("ÜBERSETZUNG-FEHLT");
    }
  });

  it("keeps English and German educational presentation locale-native", () => {
    for (const locale of ["en", "de"] as const) {
      const visibleText: string[] = [getGenericNakshatraReading(locale)];

      for (const term of EDUCATION_TERMS) {
        visibleText.push(
          term.name[locale],
          term.summary[locale],
          term.detail[locale],
          term.readingSequence[locale],
        );
      }

      for (const profile of Object.values(GRAHA_EDUCATION)) {
        visibleText.push(
          profile.name[locale],
          profile.astronomicalKind[locale],
          profile.signifies[locale],
          profile.constructive[locale],
          profile.caution[locale],
          profile.inquiry[locale],
        );
      }

      for (const profile of Object.values(BHAVA_EDUCATION)) {
        visibleText.push(
          profile.name[locale],
          profile.domain[locale],
          profile.constructive[locale],
          profile.caution[locale],
        );
      }

      for (const limitation of Object.values(
        LOCALIZED_ANALYSIS_LIMITATIONS,
      )) {
        visibleText.push(limitation[locale]);
      }

      for (const graha of GRAHA_IDS) {
        for (let house = 1; house <= 12; house += 1) {
          const reading = buildGrahaInBhavaReading(
            graha,
            house as keyof typeof BHAVA_EDUCATION,
            locale,
          );
          visibleText.push(
            reading.title,
            reading.summary,
            reading.constructive,
            reading.caution,
            reading.inquiry,
            reading.methodNote,
          );
        }
      }

      expect(visibleText.join(" ")).not.toMatch(
        OBSOLETE_EN_DE_PRIMARY_TERMS,
      );
    }

    expect(GRAHA_EDUCATION.rahu.name.en).toBe("North Node");
    expect(GRAHA_EDUCATION.ketu.name.en).toBe("South Node");
    expect(GRAHA_EDUCATION.rahu.name.de).toBe("Nordknoten");
    expect(GRAHA_EDUCATION.ketu.name.de).toBe("Südknoten");
  });
});
