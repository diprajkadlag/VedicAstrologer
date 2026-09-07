import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import InterpretationPanel, {
  TwelveHouseSummary,
} from "./InterpretationPanel";
import { AppPreferencesProvider } from "../providers/AppPreferencesProvider";
import { BHAVA_EDUCATION } from "../../lib/astro/education";
import { calculateVedicChart } from "../../lib/astro/ephemeris";

const birthInstant = new Date("1996-11-09T20:15:00.000Z");
const chart = calculateVedicChart({
  instant: birthInstant,
  latitude: 18.5204,
  longitude: 73.8567,
});

function visibleText(markup: string): string {
  return markup
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

function jsxComponentOrder(filename: string): string[] {
  const sourceText = readFileSync(filename, "utf8");
  const sourceFile = ts.createSourceFile(
    filename,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const components: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      components.push(node.tagName.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return components;
}

describe("TwelveHouseSummary", () => {
  it("renders all twelve houses in order without disclosure controls", () => {
    const markup = renderToStaticMarkup(
      <AppPreferencesProvider>
        <TwelveHouseSummary chart={chart} />
      </AppPreferencesProvider>,
    );
    const houseNumbers = Array.from(
      markup.matchAll(/data-house-number="(\d+)"/g),
      (match) => Number(match[1]),
    );

    expect(houseNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(markup).not.toMatch(/<details\b|<summary\b|aria-expanded=/i);
  });

  it("shows the short constructive and caution guidance, not the long form", () => {
    const text = visibleText(
      renderToStaticMarkup(
        <AppPreferencesProvider>
          <TwelveHouseSummary chart={chart} />
        </AppPreferencesProvider>,
      ),
    );

    expect(text).toContain("Constructive expression");
    expect(text).toContain("Watch for");
    for (const education of Object.values(BHAVA_EDUCATION)) {
      expect(text).toContain(education.constructive.en);
      expect(text).toContain(education.caution.en);
      // The card is deliberately scannable: the long-form guidance belongs
      // to the downloadable report, not to twelve cards on one page.
      expect(text).not.toContain(education.constructiveDetail.en);
      expect(text).not.toContain(education.cautionDetail.en);
    }
  });

  it("places the single summary last, after the tools and the analysis panel", () => {
    const components = jsxComponentOrder(
      resolve(process.cwd(), "components", "VedicAstrologyApp.tsx"),
    );
    const summaries = components
      .map((name, index) => ({ name, index }))
      .filter(({ name }) => name === "TwelveHouseSummary");
    const navigatorIndex = components.indexOf("TimeNavigator");
    const sphereIndex = components.indexOf("CelestialSphere");
    const panelIndex = components.indexOf("InterpretationPanel");

    expect(summaries).toHaveLength(1);
    expect(navigatorIndex).toBeLessThan(sphereIndex);
    expect(summaries[0].index).toBeGreaterThan(sphereIndex);
    expect(summaries[0].index).toBeGreaterThan(panelIndex);
  });

  it("does not expose a second Houses tab in the analysis dashboard", () => {
    const markup = renderToStaticMarkup(
      <AppPreferencesProvider>
        <InterpretationPanel
          chart={chart}
          request={{
            person: { fullName: "Asha Deshmukh" },
            birth: {
              instant: birthInstant,
              localDate: "1996-11-10",
              localTime: "01:45:00",
              timeZone: "Asia/Kolkata",
              utcOffset: "+05:30",
            },
            location: { label: "Pune, Maharashtra, India" },
          }}
          asOf={new Date("2026-07-29T12:00:00.000Z")}
        />
      </AppPreferencesProvider>,
    );
    const tabs = markup.match(/<button[^>]*role="tab"[\s\S]*?<\/button>/g) ?? [];

    expect(tabs).toHaveLength(8);
    expect(tabs.join(" ")).not.toMatch(/-houses-tab\b|>\s*Houses\s*</i);
  });
});
