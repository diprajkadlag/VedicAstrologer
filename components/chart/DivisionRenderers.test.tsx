import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { calculateNavamsaChart } from "../../lib/astro/divisional";
import { calculateVedicChart } from "../../lib/astro/ephemeris";
import { APP_LOCALES, type AppLocale } from "../../lib/i18n";

import { NorthIndianChart } from "./NorthIndianChart";
import { SouthIndianChart } from "./SouthIndianChart";
import { describeHouse, describePlanet } from "./chart-utils";
import type { ChartDensity, VedicChartRendererProps } from "./types";

const birth = calculateVedicChart({
  instant: new Date("1990-05-15T05:00:00Z"),
  latitude: 18.5204,
  longitude: 73.8567,
});
const navamsa = calculateNavamsaChart(birth);

const DENSITIES: readonly ChartDensity[] = ["comfortable", "compact", "tight"];
const RENDERERS = [
  ["North", NorthIndianChart],
  ["South", SouthIndianChart],
] as const;

/** What the South chart prints in its centre for each language, D1 then D9. */
const CENTRE_CAPTION: Readonly<Record<AppLocale, readonly [string, string]>> = {
  en: ["D1 · LĀHIRI", "D9 · LĀHIRI"],
  hi: ["D1 · लाहिरी", "D9 · लाहिरी"],
  mr: ["D1 · लाहिरी", "D9 · लाहिरी"],
  de: ["D1 · LĀHIRI", "D9 · LĀHIRI"],
};

function render(
  Renderer: (props: VedicChartRendererProps) => React.JSX.Element,
  props: VedicChartRendererProps,
): string {
  return renderToStaticMarkup(
    <Renderer
      onSelectHouse={() => undefined}
      onSelectPlanet={() => undefined}
      {...props}
    />,
  );
}

describe("South chart centre caption", () => {
  it.each(APP_LOCALES)("reads D1 by default and D9 for division 9 in %s", (locale) => {
    const [d1, d9] = CENTRE_CAPTION[locale];

    const defaults = render(SouthIndianChart, { chart: birth, locale });
    const explicitD1 = render(SouthIndianChart, {
      chart: birth,
      locale,
      division: 1,
    });
    const ninth = render(SouthIndianChart, {
      chart: navamsa,
      locale,
      division: 9,
    });

    expect(defaults).toContain(`>${d1}</text>`);
    expect(defaults).not.toContain("D9 ·");
    expect(explicitD1).toContain(`>${d1}</text>`);
    expect(ninth).toContain(`>${d9}</text>`);
    expect(ninth).not.toContain("D1 ·");
  });

  it("drops the caption on the denser layouts, in D9 as in D1", () => {
    for (const density of ["compact", "tight"] as const) {
      const markup = render(SouthIndianChart, {
        chart: navamsa,
        division: 9,
        density,
      });
      expect(markup).not.toContain("LĀHIRI");
    }
  });
});

describe.each(RENDERERS)("%s chart drawn from the D9 chart", (_, Renderer) => {
  it.each(APP_LOCALES)("describes D9 signs and houses in %s", (locale) => {
    for (const density of DENSITIES) {
      const markup = render(Renderer, {
        chart: navamsa,
        locale,
        density,
        division: 9,
      });

      for (const planet of navamsa.planets) {
        expect(markup, `${planet.id} ${density}`).toContain(
          `aria-label="${describePlanet(planet, locale)}"`,
        );
      }
      for (const house of navamsa.houses) {
        const residents = navamsa.planets.filter(
          (planet) => planet.house === house.number,
        );
        expect(markup, `house ${house.number} ${density}`).toContain(
          `aria-label="${describeHouse(house, residents, locale)}"`,
        );
      }
    }
  });

  it("differs from the birth chart where a body changes sign", () => {
    const d1 = render(Renderer, { chart: birth });
    const d9 = render(Renderer, { chart: navamsa, division: 9 });

    // The Sun is in Taurus, house 11 at birth; in D9 it is in Capricorn, house 7.
    expect(d1).toContain('aria-label="Sun, Taurus, house 11,');
    expect(d9).toContain('aria-label="Sun, Capricorn, house 7,');
    expect(d9).not.toContain('aria-label="Sun, Taurus,');
  });

  it("uses the given label as the accessible title", () => {
    const markup = render(Renderer, {
      chart: navamsa,
      division: 9,
      ariaLabel: "Ninth-division chart (D9)",
    });
    expect(markup).toMatch(/<title[^>]*>Ninth-division chart \(D9\)<\/title>/);
  });
});
