import { expect, test } from "@playwright/test";

import { generateChart } from "./helpers";

/**
 * The chart is a 400-unit viewBox scaled into whatever width the panel has,
 * so its label sizes are a function of that width. These numbers are what
 * the density tiers exist to hold up; if a padding change shrinks the panel,
 * this fails before anyone has to squint at a screenshot.
 */
const MINIMUM_LABEL_PX = 7;

async function measureChart(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const svg = Array.from(
      document.querySelectorAll<SVGSVGElement>(
        'section[aria-labelledby="vedic-chart-title"] svg',
      ),
    ).find((element) => element.getAttribute("viewBox") === "0 0 400 400");
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    const unit = box.width / 400;
    const labels = Array.from(svg.querySelectorAll<SVGTextElement>("text")).map(
      (text) => Number(text.getAttribute("font-size")) * unit,
    );
    const marks = Array.from(
      svg.querySelectorAll<SVGGElement>('g[role="button"]'),
    ).map((mark) => {
      const rect = mark.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    return {
      chartWidth: box.width,
      smallestLabel: Math.min(...labels),
      markCount: marks.length,
      smallestMarkWidth: Math.min(...marks.map((m) => m.width)),
      smallestMarkHeight: Math.min(...marks.map((m) => m.height)),
    };
  });
}

for (const style of ["north", "south"] as const) {
  test(`${style} chart stays legible at phone width`, async ({ page }) => {
    await generateChart(page);
    const chart = page.locator('section[aria-labelledby="vedic-chart-title"]');
    await chart.scrollIntoViewIfNeeded();
    if (style === "south") {
      await chart.getByRole("group").getByRole("button").nth(1).click();
    }

    const measured = await measureChart(page);
    expect(measured, "chart svg should render").not.toBeNull();
    if (!measured) return;

    expect(
      measured.smallestLabel,
      `smallest label is ${measured.smallestLabel.toFixed(1)}px in a ${measured.chartWidth.toFixed(0)}px chart`,
    ).toBeGreaterThanOrEqual(MINIMUM_LABEL_PX);

    // Every planet must be present and tappable. A twelve-house diagram
    // cannot give each mark 24 px on a phone, so this is a floor, not WCAG.
    expect(measured.markCount).toBeGreaterThanOrEqual(9);
    expect(measured.smallestMarkWidth).toBeGreaterThanOrEqual(24);
    expect(measured.smallestMarkHeight).toBeGreaterThanOrEqual(14);
  });
}

test("south chart labels do not overlap each other", async ({ page }) => {
  await generateChart(page);
  const chart = page.locator('section[aria-labelledby="vedic-chart-title"]');
  await chart.scrollIntoViewIfNeeded();
  await chart.getByRole("group").getByRole("button").nth(1).click();

  const overlaps = await page.evaluate(() => {
    const svg = Array.from(
      document.querySelectorAll<SVGSVGElement>(
        'section[aria-labelledby="vedic-chart-title"] svg',
      ),
    ).find((element) => element.getAttribute("viewBox") === "0 0 400 400");
    if (!svg) return ["no svg"];
    const labels = Array.from(svg.querySelectorAll<SVGTextElement>("text")).map(
      (text) => ({ text: text.textContent ?? "", box: text.getBoundingClientRect() }),
    );
    const found: string[] = [];
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i].box;
        const b = labels[j].box;
        const intersects =
          a.left < b.right - 1 &&
          a.right > b.left + 1 &&
          a.top < b.bottom - 1 &&
          a.bottom > b.top + 1;
        if (intersects) found.push(`"${labels[i].text}" / "${labels[j].text}"`);
      }
    }
    return found;
  });

  expect(overlaps, overlaps.join("; ")).toEqual([]);
});

test("chart marks never spill outside the diagram", async ({ page }) => {
  await generateChart(page);
  const chart = page.locator('section[aria-labelledby="vedic-chart-title"]');
  await chart.scrollIntoViewIfNeeded();

  const spills = await page.evaluate(() => {
    const svg = Array.from(
      document.querySelectorAll<SVGSVGElement>(
        'section[aria-labelledby="vedic-chart-title"] svg',
      ),
    ).find((element) => element.getAttribute("viewBox") === "0 0 400 400");
    if (!svg) return ["no svg"];
    const frame = svg.getBoundingClientRect();
    return Array.from(svg.querySelectorAll<SVGGElement>('g[role="button"]'))
      .filter((mark) => {
        const box = mark.getBoundingClientRect();
        return (
          box.left < frame.left - 1 ||
          box.right > frame.right + 1 ||
          box.top < frame.top - 1 ||
          box.bottom > frame.bottom + 1
        );
      })
      .map((mark) => mark.getAttribute("aria-label") ?? "unnamed");
  });

  expect(spills, spills.join(", ")).toEqual([]);
});
