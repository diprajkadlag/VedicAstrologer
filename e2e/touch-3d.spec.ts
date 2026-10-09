import { expect, test } from "@playwright/test";

import { generateChart } from "./helpers";

/**
 * On a touch device the cosmos starts locked so a swipe scrolls the page
 * instead of rotating the sphere. This checks the opt-in round trip.
 */
test("cosmos asks for a tap before capturing touch", async ({ page }) => {
  await generateChart(page);
  const cosmos = page.locator("#cosmos");
  await cosmos.scrollIntoViewIfNeeded();

  // The WebGL probe runs after mount and can be slow on a busy machine; wait
  // for its result before deciding that this browser has no WebGL.
  const canvas = cosmos.locator("canvas");
  const hasCanvas = await canvas
    .first()
    .waitFor({ state: "attached", timeout: 15_000 })
    .then(
      () => true,
      () => false,
    );
  if (!hasCanvas) {
    test.skip(true, "WebGL is unavailable in this browser; overlay not rendered");
  }

  const overlay = page.getByTestId("cosmos-touch-overlay");
  await expect(overlay).toBeVisible();
  await expect(page.getByTestId("cosmos-touch-lock")).toHaveCount(0);

  await overlay.tap();
  await expect(overlay).toHaveCount(0);

  const lock = page.getByTestId("cosmos-touch-lock");
  await expect(lock).toBeVisible();
  await lock.tap();
  await expect(overlay).toBeVisible();
});

test("cosmos panel is shorter than the phone viewport", async ({ page }) => {
  await generateChart(page);
  const cosmos = page.locator("#cosmos [data-cosmos-ui]");
  const box = await cosmos.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  expect(
    box.height,
    "a section taller than the screen traps one-finger scrolling",
  ).toBeLessThan(viewport.height);
});
