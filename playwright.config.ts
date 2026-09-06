import { defineConfig, devices } from "@playwright/test";

/**
 * Browser-level checks for the phone layout.
 *
 * The suite runs against the production Node build on the same port the
 * launcher uses. All three projects are Chromium: the iPhone descriptor
 * defaults to WebKit, but the WebKit download is large and the checks here
 * are about layout and touch targets, which Chromium's mobile emulation
 * covers. Real iOS Safari behaviour (zoom on focus, share-sheet downloads)
 * is still verified by hand on a device.
 */
const PORT = 3737;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e-artifacts/results",
  // Every test generates a chart and mounts a software-rendered WebGL scene,
  // so a handful of parallel pages already saturates a laptop; more workers
  // only turn into timeouts.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "e2e-artifacts/report" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      // Software WebGL so the cosmos can mount in headless Chromium. Tests
      // must still pass when it does not; they accept the fallback view.
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    {
      name: "iphone-se",
      use: { ...devices["iPhone SE"], browserName: "chromium" },
    },
    {
      name: "narrow-320",
      use: {
        ...devices["iPhone SE"],
        browserName: "chromium",
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: "pixel-7",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
