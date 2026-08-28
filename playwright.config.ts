import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./site/tests",
  // CPU-throttled responsiveness measurements need an uncontended renderer.
  // Running them beside axe scans or another throttled Chromium makes TBT a
  // measurement of the test host scheduler rather than the production page.
  workers: 1,
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    command: "npm run build:site && npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
