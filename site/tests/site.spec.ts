import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

for (const route of ["/", "/demo", "/privacy", "/terms", "/missing-page", "/404.html"]) {
  test(`${route} has one accessible page heading and no serious axe issues`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("route navigation updates title, URL, and heading focus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Demo", exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page).toHaveTitle("Demo — Terminal Screenreader Mode");
  await expect(page.locator("h1")).toBeFocused();
  await page.goBack();
  await expect(page).toHaveTitle("Terminal Screenreader Mode — Stable CLI output");
});

test("mobile layout stays inside a 390 pixel viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile project only");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
});

test("content remains usable at 200 percent text size", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile project only");
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
  const viewportOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(viewportOverflow).toBeLessThanOrEqual(1);
});

test("desktop first screen keeps the action and facts in view", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop project only");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const target of [
    page.locator(".hero-summary"),
    page.getByRole("link", { name: "Try it with sample data" }),
    page.locator(".facts"),
  ]) {
    expect((await target.boundingBox())!.y + (await target.boundingBox())!.height).toBeLessThanOrEqual(900);
  }
});

test("all visible interactive targets meet the 44 pixel minimum", async ({ page }) => {
  await page.goto("/");
  const undersized = await page.locator("a, button, [tabindex]:not([tabindex='-1'])").evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && (rect.width < 44 || rect.height < 44);
    })
    .map((element) => ({ text: (element.textContent || "").trim(), rect: element.getBoundingClientRect().toJSON() })));
  expect(undersized).toEqual([]);
});

test("production assets stay inside the stated budgets", async () => {
  const manifest = JSON.parse(readFileSync(resolve("dist/site/.vite/manifest.json"), "utf8"));
  const entry = manifest["index.html"];
  expect(statSync(resolve("dist/site", entry.file)).size).toBeLessThan(200 * 1024);
  for (const css of entry.css ?? []) expect(statSync(resolve("dist/site", css)).size).toBeLessThan(50 * 1024);
  expect(statSync(resolve("dist/site/assets/signal-recovery-640.webp")).size).toBeLessThan(300 * 1024);
});

test("mobile rendering stays inside Lighthouse-class responsiveness budgets", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "one Chromium performance project only");
  await page.setViewportSize({ width: 390, height: 844 });
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    const measurements = { blockingTime: 0, lcp: 0, cls: 0 };
    (window as typeof window & { __renderMetrics: typeof measurements }).__renderMetrics = measurements;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) measurements.blockingTime += Math.max(0, entry.duration - 50);
    }).observe({ type: "longtask", buffered: true });
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      measurements.lcp = entries.at(-1)?.startTime ?? measurements.lcp;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
        if (!entry.hadRecentInput) measurements.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  for (let run = 1; run <= 3; run += 1) {
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(1_500);
    const metrics = await page.evaluate(() => (window as typeof window & {
      __renderMetrics: { blockingTime: number; lcp: number; cls: number };
    }).__renderMetrics);
    expect(metrics.lcp, `run ${run} LCP`).toBeLessThan(2_500);
    expect(metrics.blockingTime, `run ${run} total blocking time`).toBeLessThan(300);
    expect(metrics.cls, `run ${run} cumulative layout shift`).toBeLessThan(0.1);
  }
});

test("static deployment includes routes and security policy", async () => {
  const config = JSON.parse(readFileSync(resolve("dist/site/staticwebapp.config.json"), "utf8"));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides["404"].rewrite).toBe("/404.html");
  expect(config.routes).toEqual(expect.arrayContaining([
    expect.objectContaining({ route: "/demo", rewrite: "/demo/index.html" }),
    expect.objectContaining({ route: "/assets/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } }),
  ]));
  expect(config.globalHeaders["Content-Security-Policy"]).toContain("script-src 'self'");
  const worker = readFileSync(resolve("dist/site/sw.js"), "utf8");
  expect(worker).toContain('const CACHE = "tsrm-site-v3"');
  expect(worker).toContain("caches.delete(key)");
  for (const file of ["index.html", "demo/index.html", "privacy/index.html", "terms/index.html", "404.html", "robots.txt", "sitemap.xml"]) expect(statSync(resolve("dist/site", file)).isFile()).toBe(true);
});
