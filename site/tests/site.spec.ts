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

test("static deployment includes routes and security policy", async () => {
  const config = JSON.parse(readFileSync(resolve("dist/site/staticwebapp.config.json"), "utf8"));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides["404"].rewrite).toBe("/404.html");
  expect(config.routes).toEqual(expect.arrayContaining([
    expect.objectContaining({ route: "/demo", rewrite: "/demo/index.html" }),
    expect.objectContaining({ route: "/assets/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } }),
  ]));
  expect(config.globalHeaders["Content-Security-Policy"]).toContain("script-src 'self'");
  for (const file of ["index.html", "demo/index.html", "privacy/index.html", "terms/index.html", "404.html", "robots.txt", "sitemap.xml"]) expect(statSync(resolve("dist/site", file)).isFile()).toBe(true);
});
