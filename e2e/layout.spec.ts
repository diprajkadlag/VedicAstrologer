import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, generateChart, sections } from "./helpers";

test.describe("phone layout", () => {
  test("landing page fits the viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#birth-data")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("inputs do not trigger zoom on touch devices", async ({ page }) => {
    await page.goto("/");
    // iOS Safari zooms into any focused field rendered below 16 px. The
    // Chromium emulation cannot reproduce the zoom itself, so check the
    // rule that prevents it: every text-entry control is at least 16 px.
    const small = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          'input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), select, textarea',
        ),
      )
        .filter((element) => element.getBoundingClientRect().height > 0)
        .map((element) => ({
          id: element.id || element.getAttribute("aria-label") || element.tagName,
          fontSize: parseFloat(getComputedStyle(element).fontSize),
        }))
        .filter((entry) => entry.fontSize < 16),
    );
    expect(small, "fields below 16px would zoom on iOS").toEqual([]);
  });

  test("generated chart page fits the viewport and shows every section", async ({
    page,
  }) => {
    await generateChart(page);
    await expectNoHorizontalOverflow(page);

    for (const [name, locator] of Object.entries(sections(page))) {
      await locator.scrollIntoViewIfNeeded();
      await expect(locator, `${name} section`).toBeVisible();
    }

    // The cosmos either mounted WebGL or showed its recovery view; both are
    // acceptable in a headless browser, a blank panel is not.
    const cosmos = page.locator("#cosmos");
    await expect(
      cosmos.locator("canvas, [data-cosmos-ui] [role='alert'], [data-cosmos-ui] h3").first(),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test("time navigator keeps its reset control on phones", async ({ page }) => {
    await generateChart(page);
    const reset = page.getByTestId("time-return-birth");
    await reset.scrollIntoViewIfNeeded();
    await expect(reset).toBeVisible();
    await expect(reset).toBeDisabled();

    await page.getByRole("button", { name: /forward/i }).first().click();
    await expect(reset).toBeEnabled();
    await reset.click();
    await expect(reset).toBeDisabled();
  });

  test("analysis tabs scroll horizontally without widening the page", async ({
    page,
  }) => {
    await generateChart(page);
    const panel = page.getByTestId("interpretation-panel");
    await panel.scrollIntoViewIfNeeded();
    const tabs = panel.getByRole("tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThan(3);
    await tabs.nth(count - 1).click();
    await expect(tabs.nth(count - 1)).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
  });
});
