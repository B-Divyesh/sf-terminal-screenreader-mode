import { expect, test } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const binary = resolve("target/release/tsrm");

test("@claim:stable-rewrites emits only stable lines", async () => {
  const output = execFileSync(binary, ["demo", "--no-timestamps"], { encoding: "utf8" });
  expect(output).toContain("heading | Build results");
  expect(output).toContain("text    | 18 checks passed");
  expect(output).not.toContain("Resolving 2 of 18");
  expect(output).not.toContain("Resolving 11 of 18");
});

test("@claim:local-default makes no default file or browser storage", async ({ page }) => {
  const work = mkdtempSync(join(tmpdir(), "tsrm-claim-"));
  const result = spawnSync(binary, ["normalize", "--no-timestamps"], { cwd: work, input: "Done\n", encoding: "utf8" });
  expect(result.status).toBe(0);
  expect(readdirSync(work)).toEqual([]);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173")).toBe(true);
});

test("@claim:ansi-links strips controls and exposes links", async () => {
  const output = execFileSync(binary, ["demo", "--no-timestamps"], { encoding: "utf8" });
  expect(output).not.toContain("\u001b[");
  expect(output).toContain("link    | https://example.test/build/42");
});

test("@claim:json-lines emits parseable records", async () => {
  const result = spawnSync(binary, ["normalize", "--json", "--no-timestamps"], { input: "## Result\n", encoding: "utf8" });
  expect(JSON.parse(result.stdout)).toEqual({ kind: "heading", text: "Result" });
});

test("@claim:exit-code returns the wrapped status", async () => {
  const result = spawnSync(binary, ["run", "--no-timestamps", "--", "sh", "-c", "exit 7"], { encoding: "utf8" });
  expect(result.status).toBe(7);
});

test("@claim:unicode-safe keeps Unicode output", async () => {
  const result = spawnSync(binary, ["normalize", "--no-timestamps"], { input: "完成 ✓\n", encoding: "utf8" });
  expect(result.stdout).toContain("完成 ✓");
});

test("@claim:timestamped adds UTC time by default", async () => {
  const result = spawnSync(binary, ["normalize"], { input: "Done\n", encoding: "utf8" });
  expect(result.stdout).toMatch(/^\d{2}:\d{2}:\d{2}Z \| text\s+\| Done$/m);
});

test("@claim:demo-sandbox writes only to a temporary demo directory", async () => {
  const result = spawnSync(binary, ["demo", "--no-timestamps"], { encoding: "utf8" });
  const path = result.stderr.trim().replace("Demo transcript: ", "");
  expect(path.startsWith(tmpdir())).toBe(true);
  expect(readFileSync(path, "utf8")).toBe(result.stdout);
});

test("@claim:mit-free ships the MIT license", async () => {
  const license = readFileSync(resolve("LICENSE"), "utf8");
  expect(license).toContain("MIT License");
  expect(license).toContain("Permission is hereby granted, free of charge");
});

test("@claim:offline-docs reloads the demo without a network", async ({ page, context }) => {
  await page.goto("/demo");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Your command output stays with you" })).toBeVisible();
});

test("@claim:keyboard-recording operates the sample with Enter", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Clear output" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".terminal-line.is-visible")).toHaveCount(0);
  await page.getByRole("button", { name: "Play recording" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".terminal-line.is-visible")).toHaveCount(1);
});
