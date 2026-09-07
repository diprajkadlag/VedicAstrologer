import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Fills the birth form through the manual-coordinates path so no request
 * reaches Nominatim, then generates the chart and waits for the result.
 * The locale is English because the tests start with empty localStorage.
 */
export async function generateChart(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("#birth-data")).toBeVisible();

  await page.locator("#full-name").fill("Test Person");
  await page.locator('label:has(input[name="gender"])').first().click();
  await page.locator("#birth-date").fill("1990-05-15");
  await page.locator("#birth-time").fill("10:30");

  await page.getByTestId("manual-coordinates").locator("summary").click();
  await page.getByTestId("manual-label").fill("Pune");
  await page.getByTestId("manual-latitude").fill("18.5204");
  await page.getByTestId("manual-longitude").fill("73.8567");
  await page.getByTestId("manual-timezone").fill("Asia/Kolkata");
  await page.getByTestId("use-coordinates").click();
  await expect(page.locator("#time-zone")).toHaveValue("Asia/Kolkata");

  await page.getByTestId("generate-chart").click();
  await expect(page.locator("#observatory")).toBeVisible({ timeout: 45_000 });
  await expect(page.locator("#cosmos")).toBeVisible();
}

/** Named regions of the generated page, in document order. */
export function sections(page: Page): Record<string, Locator> {
  return {
    observatory: page.locator("#observatory"),
    "time-navigator": page.locator(
      'section[aria-labelledby="time-navigator-title"]',
    ),
    cosmos: page.locator("#cosmos"),
    chart: page.locator('section[aria-labelledby="vedic-chart-title"]'),
    analysis: page.getByTestId("interpretation-panel"),
  };
}

/**
 * The document must never be wider than the viewport on a phone.
 *
 * Two checks, because either one alone can be fooled. The document's
 * scrollWidth misses content an ancestor clips, which is how a birth form
 * pinned at 418 px stayed invisible to this suite while it was cut off on a
 * real phone. Walking the elements misses nothing but needs the exemptions
 * below for deliberate horizontal scrollers and self-clipping decoration.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const result = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    const limit = document.documentElement.clientWidth;
    const painted: string[] = [];

    document.querySelectorAll<HTMLElement>("body *").forEach((element) => {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.right <= limit + 1) return;

      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX !== "visible") return;
      }

      const id = element.id ? `#${element.id}` : "";
      const testId = element.dataset.testid
        ? `[data-testid=${element.dataset.testid}]`
        : "";
      painted.push(
        `${element.tagName.toLowerCase()}${id}${testId} reaches ${Math.round(box.right)}px "${(element.textContent ?? "").trim().slice(0, 40)}"`,
      );
    });

    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      painted,
    };
  });

  expect(
    result.scrollWidth,
    `page scrolls to ${result.scrollWidth}px in a ${result.clientWidth}px viewport`,
  ).toBeLessThanOrEqual(result.clientWidth + 1);

  expect(
    result.painted,
    `elements painted past the right edge:\n${result.painted.join("\n")}`,
  ).toEqual([]);
}

export interface TargetReport {
  selector: string;
  width: number;
  height: number;
}

/**
 * Measures every rendered interactive control on the page and returns the
 * ones smaller than the given size. Inline glossary-term triggers inside
 * prose are exempt (WCAG 2.5.8 exempts inline links in text), as are SVG
 * chart marks, which are checked by eye in the screenshots because a
 * twelve-house diagram cannot give every mark 24 CSS px on a 320 px phone.
 */
export async function undersizedTargets(
  page: Page,
  minimum: number,
  scope = "body",
): Promise<TargetReport[]> {
  return page.evaluate(
    ({ minimum, scope }) => {
      const root = document.querySelector(scope);
      if (!root) return [];
      const candidates = root.querySelectorAll<HTMLElement>(
        'button, a[href], input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"]',
      );
      const problems: { selector: string; width: number; height: number }[] = [];
      for (const element of candidates) {
        if (element.closest("svg")) continue;
        if (element.closest('[aria-haspopup="dialog"]')) continue;
        if (element.hidden || element.closest("[hidden]")) continue;
        const style = getComputedStyle(element);
        // Links that flow inside a sentence (the OpenStreetMap attribution)
        // are exempt from the target-size rule, like the glossary triggers.
        if (element.tagName === "A" && style.display === "inline") continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (style.visibility === "hidden") continue;
        if (rect.width + 0.5 >= minimum && rect.height + 0.5 >= minimum) continue;
        const id = element.id ? `#${element.id}` : "";
        const testId = element.dataset.testid ? `[data-testid=${element.dataset.testid}]` : "";
        const label =
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 40) ??
          "";
        problems.push({
          selector: `${element.tagName.toLowerCase()}${id}${testId} "${label}"`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
      return problems;
    },
    { minimum, scope },
  );
}
