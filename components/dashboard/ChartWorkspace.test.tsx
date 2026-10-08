import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppPreferencesProvider } from "../providers/AppPreferencesProvider";
import { calculateVedicChart } from "../../lib/astro/ephemeris";

import ChartWorkspace from "./ChartWorkspace";

const chart = calculateVedicChart({
  instant: new Date("1990-05-15T05:00:00Z"),
  latitude: 18.5204,
  longitude: 73.8567,
});

function render(): string {
  return renderToStaticMarkup(
    <AppPreferencesProvider>
      <ChartWorkspace
        chart={chart}
        isNatalMoment
        selectedHouse={1}
        selectedPlanetId={null}
        onSelectHouse={() => undefined}
        onSelectPlanet={() => undefined}
      />
    </AppPreferencesProvider>,
  );
}

describe("ChartWorkspace chart-type switch", () => {
  const markup = render();

  it("puts the North/South group first, then the D1/D9 group, then the chart", () => {
    const style = markup.indexOf('aria-label="Vedic chart style"');
    const type = markup.indexOf('aria-label="Chart type"');
    const chartSvg = markup.indexOf('viewBox="0 0 400 400"');

    expect(style).toBeGreaterThan(-1);
    expect(type).toBeGreaterThan(style);
    expect(chartSvg).toBeGreaterThan(type);

    // e2e specs reach "South Indian" as the second button of the first
    // role="group", so the style group must open the first one.
    const groupLabels = Array.from(
      markup.matchAll(/role="group" aria-label="([^"]*)"/g),
      (match) => match[1],
    );
    expect(groupLabels).toEqual(["Vedic chart style", "Chart type"]);
    const firstGroup = markup.indexOf('role="group"');
    expect(markup.slice(firstGroup, firstGroup + 60)).toContain(
      'aria-label="Vedic chart style"',
    );
  });

  it("starts on the birth chart with D9 one click away", () => {
    expect(markup).toMatch(
      /<button[^>]*aria-pressed="true"[^>]*>Birth chart \(D1\)<\/button>/,
    );
    expect(markup).toMatch(
      /<button[^>]*data-testid="chart-division-d9"[^>]*aria-pressed="false"[^>]*>Ninth-division chart \(D9\)<\/button>/,
    );
  });

  it("keeps the D1 heading, labels and side panel until D9 is chosen", () => {
    expect(markup).toContain("Natal whole-sign house map");
    expect(markup).toContain("Interactive North Indian Vedic birth chart");
    expect(markup).not.toContain("Each sign is split into nine parts");
    expect(markup).not.toContain("Same sign in D1 and D9");
    expect(markup).toContain("House 1");
  });

  it("gives both switch buttons the 40 px minimum height", () => {
    const buttons = markup.match(/<button[^>]*>/g) ?? [];
    const switchButtons = buttons.filter(
      (button) =>
        button.includes("aria-pressed") && !button.includes("text-left"),
    );
    expect(switchButtons).toHaveLength(4);
    for (const button of switchButtons) expect(button).toContain("min-h-10");
  });
});
