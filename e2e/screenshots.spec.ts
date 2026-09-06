import { test } from "@playwright/test";

import { generateChart, sections } from "./helpers";

/**
 * Not assertions: these capture what each region looks like at phone width
 * so a reviewer can eyeball chart legibility and HUD placement from the CI
 * artifact without a device.
 *
 * Ordering matters: a full-page capture in Chromium switches the page's
 * touch emulation off for good (pointer becomes "fine", maxTouchPoints 0),
 * which hides the cosmos touch overlay. Full-page shots therefore come last,
 * and the landing page gets its own test with a fresh page.
 */
test("capture the landing page", async ({ page }, testInfo) => {
  const dir = `e2e-artifacts/screens/${testInfo.project.name}`;
  await page.goto("/");
  await page.screenshot({ path: `${dir}/00-landing.png`, fullPage: true });
});

test("capture the generated chart page", async ({ page }, testInfo) => {
  // A full-page capture of a long page with a WebGL canvas is slow in
  // software rendering; give this test triple the usual budget.
  test.slow();
  const dir = `e2e-artifacts/screens/${testInfo.project.name}`;

  await generateChart(page);

  let index = 1;
  for (const [name, locator] of Object.entries(sections(page))) {
    await locator.scrollIntoViewIfNeeded();
    await locator.screenshot({
      path: `${dir}/${String(index).padStart(2, "0")}-${name}.png`,
    });
    index += 1;
  }

  // Both chart styles, since the South chart uses a different compact scale.
  const chart = sections(page).chart;
  await chart.getByRole("group").getByRole("button").nth(1).click();
  await chart.screenshot({
    path: `${dir}/${String(index).padStart(2, "0")}-chart-south.png`,
  });
  index += 1;

  await page.screenshot({
    path: `${dir}/${String(index).padStart(2, "0")}-generated-full.png`,
    fullPage: true,
  });
});
