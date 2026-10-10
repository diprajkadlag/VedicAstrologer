import { devices, expect, test, type Locator, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow, generateChart, undersizedTargets } from "./helpers";

/**
 * The life timeline on phone viewports: it calculates in a Web Worker, fits
 * the screen, shares its instant with the time slider, explains what a tap
 * hits, zooms with a pinch, and never traps vertical page scrolling. One test
 * at desktop width checks the docked inspector.
 */

async function readyTimeline(page: Page): Promise<Locator> {
  const timeline = page.getByTestId("life-timeline");
  await timeline.scrollIntoViewIfNeeded();
  // "ready" is only set after the worker (or its fallback) delivered every body.
  await expect(page.locator('[data-testid=timeline-status][data-status="ready"]')).toHaveCount(1, {
    timeout: 45_000,
  });
  return timeline;
}

/** The plot is taller than a phone screen: bring its top edge into view first. */
async function plotBox(page: Page) {
  // The page scrolls smoothly; measure only after an instant jump.
  await page
    .getByTestId("timeline-plot")
    .evaluate((plot) => plot.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
  const box = await page.getByTestId("timeline-plot").boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

test.describe("life timeline", () => {
  test("calculates every body and fits the phone", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);

    const drawnLines = await timeline
      .locator("[data-testid=timeline-plot] path[data-series]")
      .evaluateAll((paths) => paths.filter((path) => (path.getAttribute("d") ?? "").length > 40).length);
    expect(drawnLines, "slow bodies draw long-range lines").toBeGreaterThanOrEqual(4);
    await expect(timeline.getByTestId("timeline-dasha-stack").locator("li")).toHaveCount(3);
    await expect(timeline.getByTestId("timeline-birth-time-note")).toContainText("5-minute");
    await expectNoHorizontalOverflow(page);
  });

  test("switches between years, months and days", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const plot = timeline.getByTestId("timeline-plot");
    await expect(plot).toHaveAttribute("data-zoom-level", "macro");

    await timeline.getByTestId("timeline-zoom-meso").click();
    await expect(plot).toHaveAttribute("data-zoom-level", "meso");

    await timeline.getByTestId("timeline-zoom-micro").click();
    await expect(plot).toHaveAttribute("data-zoom-level", "micro");
    // The subtle period appears only at day zoom.
    await expect(timeline.getByTestId("timeline-dasha-stack").locator("li")).toHaveCount(4);

    await timeline.getByTestId("timeline-zoom-out").click();
    await timeline.getByTestId("timeline-zoom-out").click();
    await timeline.getByTestId("timeline-zoom-out").click();
    await expect(plot).not.toHaveAttribute("data-zoom-level", "micro");
    await expectNoHorizontalOverflow(page);
  });

  test("shares its date with the time slider in both directions", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const returnBirth = page.getByTestId("time-return-birth");
    await expect(returnBirth).toBeDisabled();

    // The keyboard path of the scrubber: End moves to the last date in view.
    const range = timeline.getByTestId("timeline-range");
    await range.focus();
    await page.keyboard.press("End");

    // The 3D view and charts now show another instant than the birth moment.
    await expect(returnBirth).toBeEnabled();

    await returnBirth.click();
    await expect(timeline.getByTestId("timeline-card-date")).toContainText("1990");
  });

  test("scrubs by dragging the playhead", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const before = await timeline.getByTestId("timeline-card-date").textContent();
    const box = await plotBox(page);
    const handle = await timeline.getByTestId("timeline-scrubber").boundingBox();
    expect(handle).not.toBeNull();
    const startX = handle!.x + handle!.width / 2;
    const y = handle!.y + 40;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(Math.max(box.x + 40, startX - 90), y, { steps: 6 });
    await page.mouse.up();
    await expect(timeline.getByTestId("timeline-card-date")).not.toHaveText(before ?? "");
  });

  test("opens the inspector for a period and closes it again", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    await timeline.getByTestId("timeline-dasha-stack").locator("button").first().click();
    const inspector = page.getByTestId("timeline-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector.locator("h2")).not.toBeEmpty();
    await inspector.getByRole("button", { name: /close/i }).click();
    await expect(inspector).toBeHidden();
  });

  test("a tap on the major-period row explains that period", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const box = await plotBox(page);
    const label = timeline.locator("[data-testid=timeline-plot] text", { hasText: /^P1$/ });
    const labelBox = await label.boundingBox();
    expect(labelBox).not.toBeNull();
    // Away from the centre, where the playhead handle always scrubs.
    await page.mouse.click(box.x + box.width * 0.3, labelBox!.y + labelBox!.height / 2);
    const inspector = page.getByTestId("timeline-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector.locator("h2")).toContainText("Major period");
  });

  test("a two-finger pinch zooms in", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const plot = timeline.getByTestId("timeline-plot");
    await expect(plot).toHaveAttribute("data-zoom-level", "macro");
    const box = await plotBox(page);
    const y = box.y + box.height * 0.45;
    const center = box.x + box.width / 2;

    await plot.evaluate(
      (svg, { center, y }) => {
        const fire = (type: string, pointerId: number, x: number) =>
          svg.dispatchEvent(
            new PointerEvent(type, {
              pointerId,
              pointerType: "touch",
              clientX: x,
              clientY: y,
              isPrimary: pointerId === 1,
              bubbles: true,
              cancelable: true,
            }),
          );
        fire("pointerdown", 1, center - 10);
        fire("pointerdown", 2, center + 10);
        for (let step = 1; step <= 10; step += 1) {
          fire("pointermove", 1, center - 10 - step * 12);
          fire("pointermove", 2, center + 10 + step * 12);
        }
        fire("pointerup", 1, center - 130);
        fire("pointerup", 2, center + 130);
      },
      { center, y },
    );
    await expect(plot).not.toHaveAttribute("data-zoom-level", "macro");
  });

  test("a vertical swipe on the plot still scrolls the page", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "uses the Chrome DevTools touch input");
    await generateChart(page);
    await readyTimeline(page);
    const box = await plotBox(page);
    // Start in the planet pane, away from the playhead handle and the axis strip.
    const x = box.x + box.width * 0.3;
    const startY = Math.min(box.y + box.height * 0.45, (page.viewportSize()?.height ?? 600) - 60);
    const before = await page.evaluate(() => window.scrollY);

    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: startY }],
    });
    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: startY - step * 25 }],
      });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50);
  });

  test("life events: add, jump, forget on reload, keep when asked", async ({ page }) => {
    await generateChart(page);
    let timeline = await readyTimeline(page);
    await timeline.getByTestId("timeline-event-label").fill("New job");
    await timeline.getByTestId("timeline-event-date").fill("2015-06-01");
    await timeline.getByTestId("timeline-event-add").click();
    const list = timeline.getByTestId("timeline-event-list");
    await expect(list).toContainText("New job");

    await list.getByRole("button", { name: /show on timeline/i }).click();
    await expect(timeline.getByTestId("timeline-card-date")).toContainText("2015");

    // Memory only by default: a new page knows nothing.
    await generateChart(page);
    timeline = await readyTimeline(page);
    await expect(timeline.getByTestId("timeline-event-list")).toHaveCount(0);

    await timeline.getByTestId("timeline-event-label").fill("Graduation");
    await timeline.getByTestId("timeline-event-date").fill("2012-04-30");
    await timeline.getByTestId("timeline-event-add").click();
    await timeline.getByTestId("timeline-event-keep").check();

    await generateChart(page);
    timeline = await readyTimeline(page);
    await expect(timeline.getByTestId("timeline-event-list")).toContainText("Graduation");
    await expect(timeline.getByTestId("timeline-event-keep")).toBeChecked();
  });

  test("controls meet the touch-target floors", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const problems = await undersizedTargets(page, 24, "#life-timeline");
    expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);
    const toolbar = await timeline.getByTestId("timeline-toolbar").locator("button").evaluateAll((buttons) =>
      buttons
        .map((button) => button.getBoundingClientRect())
        .filter((rect) => rect.width < 40 || rect.height < 40)
        .map((rect) => `${Math.round(rect.width)}x${Math.round(rect.height)}`),
    );
    expect(toolbar).toEqual([]);
  });

  test("the cursor and the shared instant agree after a fast scrub", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const box = await plotBox(page);
    const handle = await timeline.getByTestId("timeline-scrubber").boundingBox();
    expect(handle).not.toBeNull();
    for (const distance of [160, -120, 90]) {
      const startX = Math.min(box.x + box.width - 50, Math.max(box.x + 50, handle!.x + handle!.width / 2));
      const y = handle!.y + 60;
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(Math.min(box.x + box.width - 40, Math.max(box.x + 40, startX - distance)), y, { steps: 40 });
      await page.mouse.up();
      await expect
        .poll(async () => {
          const [cursor, selected] = await Promise.all([
            timeline.getAttribute("data-cursor-ms"),
            timeline.getAttribute("data-selected-ms"),
          ]);
          return cursor === selected;
        })
        .toBe(true);
    }
  });

  test("follows the time navigator back to a date the timeline set before", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    await timeline.getByTestId("timeline-birth").click();
    await expect(timeline.getByTestId("timeline-card-date")).toContainText("1990");

    const navigator = page.locator('section[aria-labelledby="time-navigator-title"]');
    await navigator.getByRole("button", { name: /century/i }).click();
    const forward = navigator.locator('button[aria-label^="Move forward"]');
    // Three one-week steps from the birth moment.
    for (let step = 0; step < 3; step += 1) await forward.click();
    await expect(timeline.getByTestId("timeline-card-date")).toContainText("Jun 1990");
    await page.getByTestId("time-return-birth").click();
    await expect(timeline.getByTestId("timeline-card-date")).toContainText("15 May 1990");
    await expect
      .poll(async () => (await timeline.getAttribute("data-cursor-ms")) === (await timeline.getAttribute("data-selected-ms")))
      .toBe(true);
  });

  test("a cancelled scrub does not stop the cursor from following the navigator", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const box = await plotBox(page);
    const handle = await timeline.getByTestId("timeline-scrubber").boundingBox();
    expect(handle).not.toBeNull();
    const x = handle!.x + handle!.width / 2;
    const y = handle!.y + 60;
    await timeline.getByTestId("timeline-plot").evaluate(
      (svg, { x, y, box }) => {
        const scrubber = svg.querySelector("[data-testid=timeline-scrubber]")!;
        const fire = (target: Element, type: string, clientX: number) =>
          target.dispatchEvent(
            new PointerEvent(type, { pointerId: 7, pointerType: "touch", clientX, clientY: y, isPrimary: true, bubbles: true }),
          );
        fire(scrubber, "pointerdown", x);
        fire(svg, "pointermove", Math.max(box.x + 30, x - 30));
        fire(svg, "pointermove", Math.max(box.x + 30, x - 60));
        fire(svg, "pointercancel", Math.max(box.x + 30, x - 60));
      },
      { x, y, box },
    );
    const navigator = page.locator('section[aria-labelledby="time-navigator-title"]');
    await navigator.locator('button[aria-label^="Move forward"]').click();
    await expect
      .poll(async () => (await timeline.getAttribute("data-cursor-ms")) === (await timeline.getAttribute("data-selected-ms")))
      .toBe(true);
  });

  test("two fingers that never moved do not leave a stuck pinch", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const plot = timeline.getByTestId("timeline-plot");
    const box = await plotBox(page);
    const minBefore = await timeline.getByTestId("timeline-range").getAttribute("min");
    await plot.evaluate(
      (svg, { x, y }) => {
        const fire = (type: string, pointerId: number, clientX: number) =>
          svg.dispatchEvent(
            new PointerEvent(type, { pointerId, pointerType: "touch", clientX, clientY: y, isPrimary: pointerId === 1, bubbles: true }),
          );
        fire("pointerdown", 1, x);
        fire("pointerdown", 2, x + 60);
        fire("pointerup", 2, x + 60);
        for (let step = 1; step <= 8; step += 1) fire("pointermove", 1, x - step * 10);
        fire("pointerup", 1, x - 80);
      },
      { x: box.x + box.width * 0.6, y: box.y + box.height * 0.45 },
    );
    await expect(plot).toHaveAttribute("data-gesture", "idle");
    await expect.poll(() => timeline.getByTestId("timeline-range").getAttribute("min")).not.toBe(minBefore);
  });

  test("a second finger during a scrub does not move the cursor", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const plot = timeline.getByTestId("timeline-plot");
    const box = await plotBox(page);
    const handle = await timeline.getByTestId("timeline-scrubber").boundingBox();
    expect(handle).not.toBeNull();
    const startMs = Number(await timeline.getAttribute("data-cursor-ms"));
    const geometry = {
      x: handle!.x + handle!.width / 2,
      y: handle!.y + 60,
      left: Math.max(box.x + 30, handle!.x - 60),
      far: box.x + box.width - 30,
    };
    const fire = (steps: [string, number, number, boolean][]) =>
      plot.evaluate(
        (svg, { steps, y }) => {
          const scrubber = svg.querySelector("[data-testid=timeline-scrubber]")!;
          for (const [type, pointerId, clientX, onScrubber] of steps) {
            (onScrubber ? scrubber : svg).dispatchEvent(
              new PointerEvent(type, { pointerId, pointerType: "touch", clientX, clientY: y, isPrimary: pointerId === 1, bubbles: true }),
            );
          }
        },
        { steps, y: geometry.y },
      );
    const settled = () =>
      page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));

    // The first finger scrubs to the left; a second finger lands on the right and lifts first.
    await fire([
      ["pointerdown", 1, geometry.x, true],
      ["pointermove", 1, geometry.x - 30, false],
      ["pointermove", 1, geometry.left, false],
      ["pointerdown", 2, geometry.far, false],
      ["pointermove", 2, geometry.far - 10, false],
      ["pointerup", 2, geometry.far - 10, false],
    ]);
    await settled();
    expect(Number(await timeline.getAttribute("data-cursor-ms"))).toBeLessThan(startMs);

    await fire([["pointerup", 1, geometry.left, false]]);
    await expect(plot).toHaveAttribute("data-gesture", "idle");
    expect(Number(await timeline.getAttribute("data-cursor-ms"))).toBeLessThan(startMs);
    await expect
      .poll(async () => (await timeline.getAttribute("data-cursor-ms")) === (await timeline.getAttribute("data-selected-ms")))
      .toBe(true);
  });

  test("a vertical swipe that starts on the playhead scrolls the page", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "uses the Chrome DevTools touch input");
    await generateChart(page);
    const timeline = await readyTimeline(page);
    await plotBox(page);
    const handle = await timeline.getByTestId("timeline-scrubber").boundingBox();
    expect(handle).not.toBeNull();
    const x = handle!.x + handle!.width / 2;
    const startY = Math.min(handle!.y + 200, (page.viewportSize()?.height ?? 600) - 60);
    const before = await page.evaluate(() => window.scrollY);
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - step * 25 }] });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50);
  });

  test("the table view lists changes without widening the page", async ({ page }) => {
    await generateChart(page);
    const timeline = await readyTimeline(page);
    await timeline.getByTestId("timeline-table-toggle").click();
    const table = timeline.getByTestId("timeline-table");
    await expect(table).toBeVisible();
    await expect(table.locator("tbody tr").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await table.locator("tbody tr button").first().click();
    await expect(page.getByTestId("timeline-inspector")).toBeVisible();
  });

  test("Hindi labels fit at phone width", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("jyotish-observatory-locale", "hi");
    });
    await generateChart(page);
    const timeline = await readyTimeline(page);
    await expect(timeline.locator("#life-timeline-title")).toContainText("समयरेखा");
    await timeline.getByTestId("timeline-zoom-micro").click();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("life timeline on a wide screen", () => {
  // From 1024 px the inspector docks beside the plot; the phone projects never see it.
  test.use({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent: devices["Desktop Chrome"].userAgent,
  });

  test("the docked inspector covers no control and leaves Escape to dialogs and fields", async ({ page }) => {
    test.skip(test.info().project.name !== "pixel-7", "one desktop run is enough");
    await generateChart(page);
    const timeline = await readyTimeline(page);
    const opener = timeline.getByTestId("timeline-dasha-stack").locator("button").first();
    await opener.click();
    const inspector = page.getByTestId("timeline-inspector");
    await expect(inspector).toBeVisible();
    expect(await inspector.evaluate((element) => element.tagName)).toBe("SECTION");
    await expect(page.locator("#timeline-inspector-title")).toBeFocused();

    const panel = (await inspector.boundingBox())!;
    const toolbar = (await timeline.getByTestId("timeline-toolbar").boundingBox())!;
    const apart =
      panel.x >= toolbar.x + toolbar.width ||
      panel.x + panel.width <= toolbar.x ||
      panel.y >= toolbar.y + toolbar.height ||
      panel.y + panel.height <= toolbar.y;
    expect(apart).toBe(true);

    // Escape in a modal dialog closes only that dialog.
    await timeline.getByTestId("timeline-layers").click();
    const layers = page.locator('dialog[aria-labelledby="timeline-layers-title"]');
    await expect(layers).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(layers).toBeHidden();
    await expect(inspector).toBeVisible();

    // Escape in a date field belongs to the field.
    await timeline.getByTestId("timeline-event-date").focus();
    await page.keyboard.press("Escape");
    await expect(inspector).toBeVisible();

    // Escape from the page closes the panel and gives focus back to the opener.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Escape");
    await expect(inspector).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
