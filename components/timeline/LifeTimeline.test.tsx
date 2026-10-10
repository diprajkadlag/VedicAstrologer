import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppPreferencesProvider } from "../providers/AppPreferencesProvider";
import { calculateVedicChart } from "../../lib/astro/ephemeris";
import { APP_LOCALES } from "../../lib/i18n";
import { TRANSIT_BAND_IDS } from "../../lib/timeline/gocharaBands";
import { CURVE_REASON_KINDS, LIFE_CURVE_IDS } from "../../lib/timeline/lifeCurves";
import { LIFE_EVENT_CATEGORIES } from "../../lib/timeline/lifeEvents";
import LifeTimeline from "./LifeTimeline";
import { TIMELINE_MESSAGES } from "./timelineMessages";

const birthInstant = new Date("1990-05-15T05:00:00.000Z");
const chart = calculateVedicChart({ instant: birthInstant, latitude: 18.5204, longitude: 73.8567 });

function visibleText(markup: string): string {
  return markup
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

function render(): string {
  return renderToStaticMarkup(
    <AppPreferencesProvider>
      <LifeTimeline
        natalChart={chart}
        birthInstant={birthInstant}
        timeZone="Asia/Kolkata"
        todayInstant={new Date("2026-10-09T06:00:00.000Z")}
        selectedInstant={birthInstant}
        selectionSource="other"
        selectionRevision={0}
        onSelectInstant={() => 0}
      />
    </AppPreferencesProvider>,
  );
}

describe("LifeTimeline", () => {
  it("renders the section, the card for today and the honesty notes before any calculation", () => {
    const markup = render();
    const text = visibleText(markup);

    expect(markup).toContain('id="life-timeline"');
    expect(markup).toContain('data-status="computing"');
    expect(text).toContain("Your life timeline");
    expect(text).toContain("09 Oct 2026");
    expect(text).toContain("Major period");
    expect(text).toMatch(/a 5-minute difference moves every boundary by about \d/);
    expect(text).toContain("say nothing about your actual health or mental state");
    expect(text).toContain("not for medical, legal, financial, safety or mental-health decisions");
    // Three period levels outside the day view.
    expect(markup.match(/data-testid="timeline-dasha-stack"[\s\S]*?<\/ul>/)?.[0].match(/<li/g)).toHaveLength(3);
  });

  it("uses plain words, not Sanskrit generic terms, in every English and German message", () => {
    for (const locale of ["en", "de"] as const) {
      for (const [key, value] of Object.entries(TIMELINE_MESSAGES[locale] as Record<string, string>)) {
        expect(value, `${locale} ${key}`).not.toMatch(
          // Substring match for compounds such as "Sarvashtakavarga".
          /ashtakavarga|\b(?:Vedha|Gochara|Mahadasha|Antardasha|Pratyantardasha|Sookshma|Shadbala|Lagna|Graha|Rasi|Rashi|Bhava|Kantaka|Ashtama|Bindu)\b/i,
        );
      }
    }
  });

  it("keeps the English interface locale-native", () => {
    const text = visibleText(render());
    expect(text).not.toMatch(
      /\b(?:Mahadasha|Antardasha|Pratyantardasha|Gochara|Shani|Rahu|Ketu|Shadbala|Lagna|Graha|Chandrashtama)\b/,
    );
  });

  it("has a sentence for every rule kind, band, curve and event category in every language", () => {
    for (const locale of APP_LOCALES) {
      const messages = TIMELINE_MESSAGES[locale] as Record<string, string>;
      for (const kind of CURVE_REASON_KINDS) {
        expect(messages[`reason_${kind.replaceAll("-", "_")}`], `${locale} reason ${kind}`).toBeTruthy();
      }
      for (const id of TRANSIT_BAND_IDS) {
        const key = id.replaceAll("-", "_");
        expect(messages[`bandName_${key}`], `${locale} band ${id}`).toBeTruthy();
        expect(messages[`bandText_${key}`], `${locale} band text ${id}`).toBeTruthy();
      }
      for (const curve of LIFE_CURVE_IDS) {
        expect(messages[`curve_${curve}`], `${locale} curve ${curve}`).toBeTruthy();
      }
      for (const category of LIFE_EVENT_CATEGORIES) {
        expect(messages[`category_${category}`], `${locale} category ${category}`).toBeTruthy();
      }
    }
  });

  it("uses the same placeholders in every translation", () => {
    const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const english = TIMELINE_MESSAGES.en as Record<string, string>;
    for (const locale of APP_LOCALES) {
      const messages = TIMELINE_MESSAGES[locale] as Record<string, string>;
      for (const [key, value] of Object.entries(english)) {
        expect(placeholders(messages[key]), `${locale}.${key}`).toEqual(placeholders(value));
      }
    }
  });
});
