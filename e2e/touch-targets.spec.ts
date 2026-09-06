import { expect, test } from "@playwright/test";

import { generateChart, sections, undersizedTargets } from "./helpers";

/** WCAG 2.5.8 floor for any control. */
const MINIMUM_PX = 24;
/** Comfortable thumb size for the controls people use most. */
const CRITICAL_PX = 40;

/** Controls on the generated page; the generate button is checked on the landing page. */
const CRITICAL_SELECTORS = [
  "[data-testid=time-return-birth]",
  "[data-testid=download-pdf]",
  "[data-testid=edit-birth]",
  // Transport buttons (step, play, return); the ± window pills are secondary.
  'section[aria-labelledby="time-navigator-title"] button[aria-label]',
  'section[aria-labelledby="vedic-chart-title"] [role="group"] button',
  '#cosmos [role="toolbar"] button',
  '[data-testid=interpretation-panel] [role="tab"]',
];

interface Measured {
  selector: string;
  index: number;
  width: number;
  height: number;
}

test.describe("touch targets", () => {
  test("birth form controls meet the minimum size", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("manual-coordinates").locator("summary").click();
    const problems = await undersizedTargets(page, MINIMUM_PX, "#birth-data");
    expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);

    const generate = await page.getByTestId("generate-chart").boundingBox();
    expect(generate?.height ?? 0).toBeGreaterThanOrEqual(CRITICAL_PX);
  });

  test("generated page controls meet the minimum size", async ({ page }) => {
    await generateChart(page);
    for (const locator of Object.values(sections(page))) {
      await locator.scrollIntoViewIfNeeded();
    }
    const problems = await undersizedTargets(page, MINIMUM_PX, "main");
    expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);
  });

  test("primary controls are comfortably tappable", async ({ page }) => {
    await generateChart(page);

    // The planet toolbar mounts only after the WebGL probe succeeds, and the
    // probe can lose to a headless GPU. Wait for the cosmos to settle either
    // way, then require the toolbar only when a canvas is actually there.
    const cosmos = page.locator("#cosmos");
    await cosmos
      .locator('canvas, [role="toolbar"], [role="alert"], h3')
      .first()
      .waitFor();
    const hasCanvas = (await cosmos.locator("canvas").count()) > 0;
    if (hasCanvas) {
      await cosmos.locator('[role="toolbar"] button').first().waitFor();
    }
    const selectors = CRITICAL_SELECTORS.filter(
      (selector) => hasCanvas || !selector.startsWith("#cosmos"),
    );

    // Measured in the page: getBoundingClientRect does not need the element
    // scrolled into view, and controls inside horizontal scrollers keep
    // their size wherever the strip is scrolled to.
    const measured = await page.evaluate((selectors) => {
      const rows: Measured[] = [];
      for (const selector of selectors) {
        document
          .querySelectorAll<HTMLElement>(selector)
          .forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            rows.push({
              selector,
              index,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          });
      }
      return rows;
    }, selectors);

    for (const selector of selectors) {
      const rendered = measured.filter(
        (row) => row.selector === selector && row.width > 0 && row.height > 0,
      );
      expect(rendered.length, `${selector} should be rendered`).toBeGreaterThan(0);
    }

    const tooSmall = measured
      .filter((row) => row.width > 0 && row.height > 0)
      .filter((row) => row.width < CRITICAL_PX || row.height < CRITICAL_PX)
      .map((row) => `${row.selector}[${row.index}] ${row.width}x${row.height}`);
    expect(tooSmall, tooSmall.join("\n")).toEqual([]);
  });
});
