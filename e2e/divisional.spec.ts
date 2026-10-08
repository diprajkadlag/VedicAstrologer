import { expect, test, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow, generateChart, sections } from "./helpers";

/** Key the app stores its language under; see AppPreferencesProvider. */
const LOCALE_KEY = "jyotish-observatory-locale";

/**
 * The standard chart (Test Person, 15 May 1990 10:30 IST, Pune) in the
 * ninth-division chart: Saturn is in Capricorn in D1 and in D9, so it is the
 * one body here that gets the badge; the Sun moves from Taurus to Capricorn.
 * D9 house 4 (Libra) is empty, so clicking its middle cannot hit a planet.
 */
const SATURN = /^Saturn,/;
const SUN = /^Sun,/;
const EMPTY_D9_HOUSE = /^House 4,/;

/** Everything the switch shows, per language, as written in the task. */
const LANGUAGES = [
  {
    locale: "en",
    d1: "Birth chart (D1)",
    d9: "Ninth-division chart (D9)",
    column: "D9",
    vargottama: "Same sign in D1 and D9",
  },
  {
    locale: "hi",
    d1: "जन्म कुंडली (D1)",
    d9: "नवांश कुंडली (D9)",
    column: "नवांश",
    vargottama: "वर्गोत्तम (D1 और D9 में एक ही राशि)",
  },
  {
    locale: "mr",
    d1: "जन्मकुंडली (D1)",
    d9: "नवांश कुंडली (D9)",
    column: "नवांश",
    vargottama: "वर्गोत्तम (D1 आणि D9 मध्ये एकच राशी)",
  },
  {
    locale: "de",
    d1: "Geburtshoroskop (D1)",
    d9: "Neuntes Teilhoroskop (D9)",
    column: "D9",
    vargottama: "Gleiches Zeichen in D1 und D9",
  },
] as const;

/** Switches the app language without reloading, the way the language menu does. */
async function setLanguage(page: Page, locale: string): Promise<void> {
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
      window.dispatchEvent(new Event("app-preferences-change"));
    },
    [LOCALE_KEY, locale],
  );
}

test("the ninth-division chart works in both chart styles", async ({
  page,
}, testInfo) => {
  const dir = `e2e-artifacts/screens/${testInfo.project.name}`;
  await generateChart(page);

  const chart = sections(page).chart;
  const heading = chart.locator("#vedic-chart-title");
  const panel = chart.locator("aside");
  const d9Button = page.getByTestId("chart-division-d9");
  const badge = chart.getByText("Same sign in D1 and D9");
  // The first group is North/South, so these are its two buttons.
  const north = chart.getByRole("group").getByRole("button").nth(0);
  const south = chart.getByRole("group").getByRole("button").nth(1);

  await chart.scrollIntoViewIfNeeded();
  await expect(heading).toHaveText("Natal whole-sign house map");
  await expect(d9Button).toHaveAttribute("aria-pressed", "false");
  await expect(panel.getByText("House 1", { exact: true })).toBeVisible();

  // D9 opens on its own heading and help line, with no house chosen yet.
  await d9Button.click();
  await expect(d9Button).toHaveAttribute("aria-pressed", "true");
  await expect(heading).toHaveText("Ninth-division chart (D9)");
  await expect(
    chart.getByText("Each sign is split into nine parts of 3°20′"),
  ).toBeVisible();
  await expect(panel.getByText("Explore a house")).toBeVisible();

  // A house chosen in D9 stays in the card: the birth-chart house is untouched.
  await chart.getByRole("button", { name: EMPTY_D9_HOUSE }).click();
  await expect(panel.getByText("House 4", { exact: true })).toBeVisible();
  await expect(panel.getByText("Libra")).toBeVisible();
  await chart.getByRole("button", { name: "Birth chart (D1)", exact: true }).click();
  await expect(heading).toHaveText("Natal whole-sign house map");
  await expect(panel.getByText("House 1", { exact: true })).toBeVisible();
  await expect(chart.getByText("Each sign is split into nine parts")).toHaveCount(0);
  await d9Button.click();
  await expect(panel.getByText("Explore a house")).toBeVisible();

  // Only a body in the same sign in D1 and D9 gets the badge.
  await chart.getByRole("button", { name: SUN }).click();
  await expect(panel.getByText("Sun", { exact: true })).toBeVisible();
  await expect(panel.getByText("Ninth-division sign")).toBeVisible();
  await expect(badge).toHaveCount(0);

  await chart.getByRole("button", { name: SATURN }).click();
  await expect(panel.getByText("Saturn", { exact: true })).toBeVisible();
  await expect(panel.getByText("Capricorn")).toBeVisible();
  await expect(badge).toBeVisible();

  await expectNoHorizontalOverflow(page);
  // The pointer rests on the last mark clicked and would tint the house under
  // it; house fills also fade over 150 ms. Settle both so the picture is clean.
  await page.mouse.move(1, 1);
  await chart.screenshot({
    path: `${dir}/chart-d9-north.png`,
    animations: "disabled",
  });

  // South Indian, still in D9, still with Saturn chosen.
  await south.click();
  await expect(heading).toHaveText("Ninth-division chart (D9)");
  await expect(d9Button).toHaveAttribute("aria-pressed", "true");
  await expect(badge).toBeVisible();
  const captions = (await chart.locator("svg text").allTextContents()).filter(
    (text) => text.includes("LĀHIRI"),
  );
  // The centre caption is dropped on the denser layouts; where it is drawn
  // it must say D9, never D1.
  expect(captions.every((text) => text === "D9 · LĀHIRI"), captions.join()).toBe(
    true,
  );
  await expectNoHorizontalOverflow(page);
  await page.mouse.move(1, 1);
  await chart.screenshot({
    path: `${dir}/chart-d9-south.png`,
    animations: "disabled",
  });

  // And back: the style switch works from D9, and D1 comes back unchanged.
  await north.click();
  await expect(heading).toHaveText("Ninth-division chart (D9)");
  await chart.getByRole("button", { name: "Birth chart (D1)", exact: true }).click();
  await expect(heading).toHaveText("Natal whole-sign house map");
  await expect(badge).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("the switch, badge and table column fit at phone width in every language", async ({
  page,
}) => {
  await generateChart(page);

  const chart = sections(page).chart;
  const analysis = sections(page).analysis;
  const heading = chart.locator("#vedic-chart-title");
  const d9Button = page.getByTestId("chart-division-d9");
  const d1Button = d9Button.locator("xpath=preceding-sibling::button");

  await analysis.getByRole("tab", { name: "Positions" }).click();
  await chart.scrollIntoViewIfNeeded();
  await d9Button.click();
  await chart.getByRole("button", { name: SATURN }).click();

  for (const language of LANGUAGES) {
    await setLanguage(page, language.locale);
    await expect(heading).toHaveText(language.d9);
    await expect(d1Button).toHaveText(language.d1);
    await expect(d9Button).toHaveText(language.d9);
    await expect(chart.getByText(language.vargottama)).toBeVisible();

    // Long labels wrap inside their buttons; they stay thumb-sized.
    for (const button of [d1Button, d9Button]) {
      const box = await button.boundingBox();
      expect(box?.width ?? 0, `${language.locale} width`).toBeGreaterThanOrEqual(39.5);
      expect(box?.height ?? 0, `${language.locale} height`).toBeGreaterThanOrEqual(39.5);
    }

    // The positions table: a D9 column, and a named mark on Moon and Saturn.
    const columnHeader = analysis.locator("thead th").nth(3);
    await expect(columnHeader).toHaveText(language.column);
    const marks = analysis.locator('tbody [role="img"]');
    await expect(marks).toHaveCount(2);
    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute("aria-label", language.vargottama);
      await expect(mark).toHaveAttribute("title", language.vargottama);
    }

    await expectNoHorizontalOverflow(page);
  }
});
