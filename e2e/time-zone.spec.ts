import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, generateChart } from "./helpers";

/**
 * Computed dates can follow this device's time zone. The test chart is born
 * in India (Asia/Kolkata); these browsers run elsewhere.
 */
test.describe("dates in this device's time zone", () => {
  test.use({ timezoneId: "Europe/Berlin" });

  test("the Times selector switches the navigator, the timeline and the periods tab", async ({ page }) => {
    await generateChart(page);
    const select = page.getByTestId("time-zone-select");
    await expect(select).toHaveValue("birth");
    const navigator = page.locator('section[aria-labelledby="time-navigator-title"]');
    await expect(navigator).toContainText("Asia/Kolkata");

    await select.selectOption("device");
    await expect(navigator).toContainText("Europe/Berlin");
    await expectNoHorizontalOverflow(page);
    const card = page.getByTestId("timeline-card-date");
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText("Europe/Berlin");
    const panel = page.getByTestId("interpretation-panel");
    await panel.getByRole("tab", { name: "Planetary periods" }).click();
    await expect(panel).toContainText("Europe/Berlin");
    // Both birth-record chips (chart card and analysis header) keep the birth place's zone.
    await expect(page.getByText(/^\+05:30 · Asia\/Kolkata$/)).toHaveCount(2);

    // The choice is remembered for the next chart.
    await generateChart(page);
    await expect(page.getByTestId("time-zone-select")).toHaveValue("device");
    await expect(navigator).toContainText("Europe/Berlin");
  });
});

test.describe("no choice when the clocks agree", () => {
  test.use({ timezoneId: "Asia/Calcutta" });

  test("hides the selector for an alias of the birth zone", async ({ page }) => {
    await generateChart(page);
    await expect(page.locator('section[aria-labelledby="time-navigator-title"]')).toContainText("Asia/Kolkata");
    await expect(page.getByTestId("time-zone-select")).toHaveCount(0);
  });
});
