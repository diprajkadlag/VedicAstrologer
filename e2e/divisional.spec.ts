import { expect, test, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow, generateChart, sections } from "./helpers";

/** Key the app stores its language under; see AppPreferencesProvider. */
const LOCALE_KEY = "jyotish-observatory-locale";

/**
 * The standard chart (Test Person, 15 May 1990 10:30 IST, Pune) in the
 * ninth-division chart: Saturn is in Capricorn in D1 and in D9, so it is the
 * one body here that gets the badge; the Sun moves from Taurus to Capricorn,
 * and both sit in D9 house 7. D9 house 4 (Libra) is empty, so clicking its
 * middle cannot hit a planet.
 */
const SATURN = /^Saturn,/;
const SUN = /^Sun,/;

/** Everything the switch shows, per language, as written in the task. */
const LANGUAGES = [
  {
    locale: "en",
    d1: "Birth chart (D1)",
    d9: "Ninth-division chart (D9)",
    column: "D9",
    vargottama: "Same sign in D1 and D9",
    selectedTime: "Drawn for the selected time, not the birth moment.",
  },
  {
    locale: "hi",
    d1: "जन्म कुंडली (D1)",
    d9: "नवांश कुंडली (D9)",
    column: "नवांश",
    vargottama: "वर्गोत्तम (D1 और D9 में एक ही राशि)",
    selectedTime: "यह जन्म क्षण की नहीं, चयनित समय की कुंडली है।",
  },
  {
    locale: "mr",
    d1: "जन्मकुंडली (D1)",
    d9: "नवांश कुंडली (D9)",
    column: "नवांश",
    vargottama: "वर्गोत्तम (D1 आणि D9 मध्ये एकच राशी)",
    selectedTime: "ही जन्मक्षणाची नाही, तर निवडलेल्या वेळेची कुंडली आहे.",
  },
  {
    locale: "de",
    d1: "Geburtshoroskop (D1)",
    d9: "Neuntes Teilhoroskop (D9)",
    column: "D9",
    vargottama: "Gleiches Zeichen in D1 und D9",
    selectedTime:
      "Gezeichnet für den ausgewählten Zeitpunkt, nicht für den Geburtsmoment.",
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

/** Moves the time navigator one step off the birth moment. */
async function stepAwayFromBirth(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^Move forward/ }).click();
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
  const d1Button = chart.getByRole("button", {
    name: "Birth chart (D1)",
    exact: true,
  });
  const badge = chart.getByText("Same sign in D1 and D9");
  const house7 = chart.getByRole("button", { name: /^House 7,/ });
  // The first group is North/South, so these are its two buttons.
  const north = chart.getByRole("group").getByRole("button").nth(0);
  const south = chart.getByRole("group").getByRole("button").nth(1);

  await chart.scrollIntoViewIfNeeded();
  await expect(heading).toHaveText("Natal whole-sign house map");
  await expect(d9Button).toHaveAttribute("aria-pressed", "false");

  // D9 opens on its own heading and help line.
  await d9Button.click();
  await expect(d9Button).toHaveAttribute("aria-pressed", "true");
  await expect(heading).toHaveText("Ninth-division chart (D9)");
  await expect(
    chart.getByText("Each sign is split into nine parts of 3°20′"),
  ).toBeVisible();

  // Only a body in the same sign in D1 and D9 gets the badge.
  await chart.getByRole("button", { name: SUN }).click();
  await expect(panel.getByText("Sun", { exact: true })).toBeVisible();
  await expect(panel.getByText("Ninth-division sign")).toBeVisible();
  await expect(badge).toHaveCount(0);

  await chart.getByRole("button", { name: SATURN }).click();
  await expect(panel.getByText("Saturn", { exact: true })).toBeVisible();
  await expect(panel.getByText("Capricorn")).toBeVisible();
  await expect(badge).toBeVisible();
  // As in D1, the chosen body's house is the highlighted one.
  await expect(house7).toHaveAttribute("aria-pressed", "true");

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
  await expect(house7).toHaveAttribute("aria-pressed", "true");
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
  await d1Button.click();
  await expect(heading).toHaveText("Natal whole-sign house map");
  await expect(badge).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("D9 selections stay in the card, follow the chosen body and say when the time is not birth", async ({
  page,
}) => {
  await generateChart(page);

  const chart = sections(page).chart;
  const heading = chart.locator("#vedic-chart-title");
  const panel = chart.locator("aside");
  const d9Button = page.getByTestId("chart-division-d9");
  const d1Button = chart.getByRole("button", {
    name: "Birth chart (D1)",
    exact: true,
  });
  const house = (number: number) =>
    chart.getByRole("button", { name: new RegExp(`^House ${number},`) });
  const selectedTime = chart.getByText(
    "Drawn for the selected time, not the birth moment.",
  );

  await chart.scrollIntoViewIfNeeded();
  await d9Button.click();
  await expect(panel.getByText("Explore a house")).toBeVisible();

  // A house chosen in D9 stays in the card: the birth-chart house is untouched.
  await house(4).click();
  await expect(panel.getByText("House 4", { exact: true })).toBeVisible();
  await expect(panel.getByText("Libra")).toBeVisible();
  // Pressing the segment that is already active keeps the choice.
  await d9Button.click();
  await expect(panel.getByText("House 4", { exact: true })).toBeVisible();
  // Changing to D1 and back drops it; D1 still has its own house 1.
  await d1Button.click();
  await expect(heading).toHaveText("Natal whole-sign house map");
  await expect(panel.getByText("House 1", { exact: true })).toBeVisible();
  await expect(chart.getByText("Each sign is split into nine parts")).toHaveCount(0);
  await d9Button.click();
  await expect(panel.getByText("Explore a house")).toBeVisible();

  // Choosing a body highlights its D9 house, labels the birth-chart lunar
  // mansion as such, and "Show house details" lands on that house.
  await chart.getByRole("button", { name: SATURN }).click();
  await expect(house(7)).toHaveAttribute("aria-pressed", "true");
  await expect(panel.getByText("Lunar mansion (D1)")).toBeVisible();
  await panel.getByRole("button", { name: "Show house details" }).click();
  await expect(panel.getByText("House 7", { exact: true })).toBeVisible();
  await expect(panel.getByText("Capricorn")).toBeVisible();
  await expect(panel.getByText("Krittika (D1)")).toBeVisible();

  // Off the birth moment the D1 heading says "Simulated"; D9 says it too.
  await expect(selectedTime).toHaveCount(0);
  await stepAwayFromBirth(page);
  await expect(selectedTime).toBeVisible();
  await d1Button.click();
  await expect(heading).toHaveText("Simulated whole-sign house map");
  await expect(selectedTime).toHaveCount(0);
  await d9Button.click();
  await expect(selectedTime).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId("time-return-birth").click();
  await expect(selectedTime).toHaveCount(0);
});

test("the switch, badge, cue and table column fit at phone width in every language", async ({
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
  await stepAwayFromBirth(page);
  await chart.getByRole("button", { name: SATURN }).click();

  for (const language of LANGUAGES) {
    await setLanguage(page, language.locale);
    await expect(heading).toHaveText(language.d9);
    await expect(d1Button).toHaveText(language.d1);
    await expect(d9Button).toHaveText(language.d9);
    await expect(chart.getByText(language.vargottama)).toBeVisible();
    await expect(chart.getByText(language.selectedTime)).toBeVisible();

    // Long labels wrap inside their buttons; they stay thumb-sized.
    for (const button of [d1Button, d9Button]) {
      const box = await button.boundingBox();
      expect(box?.width ?? 0, `${language.locale} width`).toBeGreaterThanOrEqual(39.5);
      expect(box?.height ?? 0, `${language.locale} height`).toBeGreaterThanOrEqual(39.5);
    }

    // The positions table: a D9 column, a named mark on Moon and Saturn, and
    // a visible line saying what the mark means.
    const columnHeader = analysis.locator("thead th").nth(3);
    await expect(columnHeader).toHaveText(language.column);
    const marks = analysis.locator('tbody [role="img"]');
    await expect(marks).toHaveCount(2);
    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute("aria-label", language.vargottama);
      await expect(mark).toHaveAttribute("title", language.vargottama);
    }
    await expect(analysis.getByText(language.vargottama)).toBeVisible();

    await expectNoHorizontalOverflow(page);
  }
});
