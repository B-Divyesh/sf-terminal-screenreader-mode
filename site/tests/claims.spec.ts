import { expect, test } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const binary = resolve("target/release/tsrm");

test("@claim:stable-rewrites emits only stable lines", async () => {
  const output = execFileSync(binary, ["demo", "--no-timestamps"], { encoding: "utf8" });
  expect(output).toContain("heading | Build results");
  expect(output).toContain("text    | 18 checks passed");
  expect(output).not.toContain("Resolving 2 of 18");
  expect(output).not.toContain("Resolving 11 of 18");
  expect(output.trim().split("\n")).toHaveLength(6);
});

function monitorNetworkCalls(root: string): { library: string; log: string } {
  const source = join(root, "network-monitor.c");
  const library = join(root, "network-monitor.so");
  const log = join(root, "network.log");
  writeFileSync(source, `
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/syscall.h>
#include <unistd.h>
static void note(const char *name) { const char *path = getenv("TSRM_NETWORK_LOG"); if (!path) return; long fd = syscall(SYS_openat, -100, path, 0101, 0600); if (fd >= 0) { syscall(SYS_write, fd, name, __builtin_strlen(name)); syscall(SYS_write, fd, "\\n", 1); syscall(SYS_close, fd); } }
int socket(int d, int t, int p) { static int (*real)(int,int,int); if (!real) real = dlsym(RTLD_NEXT, "socket"); note("socket"); return real(d,t,p); }
int connect(int s, const struct sockaddr *a, socklen_t l) { static int (*real)(int,const struct sockaddr *,socklen_t); if (!real) real = dlsym(RTLD_NEXT, "connect"); note("connect"); return real(s,a,l); }
ssize_t sendto(int s, const void *b, size_t n, int f, const struct sockaddr *a, socklen_t l) { static ssize_t (*real)(int,const void *,size_t,int,const struct sockaddr *,socklen_t); if (!real) real = dlsym(RTLD_NEXT, "sendto"); note("sendto"); return real(s,b,n,f,a,l); }
`);
  const compile = spawnSync("cc", ["-shared", "-fPIC", source, "-ldl", "-o", library], { encoding: "utf8" });
  expect(compile.status, compile.stderr).toBe(0);
  writeFileSync(log, "");
  return { library, log };
}

function isolatedEnvironment(root: string, library?: string, log?: string): NodeJS.ProcessEnv {
  const home = join(root, "home");
  const temp = join(root, "temp");
  mkdirSync(home);
  mkdirSync(temp);
  return {
    ...process.env,
    HOME: home,
    TMPDIR: temp,
    XDG_CACHE_HOME: join(home, ".cache"),
    XDG_CONFIG_HOME: join(home, ".config"),
    ...(library ? { LD_PRELOAD: library, TSRM_NETWORK_LOG: log } : {}),
  };
}

test("@claim:local-default makes no default file, browser storage, or network request", async ({ page, context }) => {
  const root = mkdtempSync(join(tmpdir(), "tsrm-claim-"));
  const work = join(root, "work");
  mkdirSync(work);
  const { library, log } = monitorNetworkCalls(root);
  const env = isolatedEnvironment(root, library, log);
  const result = spawnSync(binary, ["normalize", "--no-timestamps"], { cwd: work, env, input: "Done\n", encoding: "utf8" });
  expect(result.status).toBe(0);
  expect(readdirSync(work)).toEqual([]);
  expect(readdirSync(env.HOME!)).toEqual([]);
  expect(readdirSync(env.TMPDIR!)).toEqual([]);
  expect(readFileSync(log, "utf8")).toBe("");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(await context.cookies()).toEqual([]);
  expect(await page.locator("form").count()).toBe(0);
  expect(await page.locator("script[src]").evaluateAll((scripts) => scripts.every((script) => new URL((script as HTMLScriptElement).src).origin === location.origin))).toBe(true);
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
  const invalid = spawnSync(binary, ["normalize", "--no-timestamps"], { input: Buffer.from([0x66, 0x80, 0x0a]), encoding: "utf8" });
  expect(invalid.status).toBe(0);
  expect(invalid.stdout).toContain("f�");
});

test("@claim:semantic-labels labels headings and errors", async () => {
  const result = spawnSync(binary, ["normalize", "--no-timestamps"], { input: "## Results\nError: build failed\n", encoding: "utf8" });
  expect(result.stdout).toContain("heading | Results");
  expect(result.stdout).toContain("error   | Error: build failed");
});

test("@claim:output-file saves the printed transcript when requested", async () => {
  const work = mkdtempSync(join(tmpdir(), "tsrm-output-"));
  const path = join(work, "build.transcript");
  const result = spawnSync(binary, ["normalize", "--no-timestamps", "--output", path], { input: "Done\n", encoding: "utf8" });
  expect(result.status).toBe(0);
  expect(readFileSync(path, "utf8")).toBe(result.stdout);
});

test("@claim:earcons-off keeps sounds opt-in", async () => {
  const quiet = spawnSync(binary, ["normalize", "--no-timestamps"], { input: "## Results\n", encoding: "utf8" });
  const audible = spawnSync(binary, ["normalize", "--no-timestamps", "--earcons"], { input: "## Results\n", encoding: "utf8" });
  expect(quiet.stdout).not.toContain("\u0007");
  expect(audible.stdout.startsWith("\u0007")).toBe(true);
});

test("@claim:timestamped adds UTC time by default", async () => {
  const result = spawnSync(binary, ["normalize"], { input: "Done\n", encoding: "utf8" });
  expect(result.stdout).toMatch(/^\d{2}:\d{2}:\d{2}Z \| text\s+\| Done$/m);
});

test("@claim:demo-sandbox writes only one transcript in its temporary demo directory", async () => {
  const root = mkdtempSync(join(tmpdir(), "tsrm-demo-claim-"));
  const work = join(root, "work");
  mkdirSync(work);
  const env = isolatedEnvironment(root);
  const result = spawnSync(binary, ["demo", "--no-timestamps"], { cwd: work, env, encoding: "utf8" });
  expect(result.status).toBe(0);
  const path = result.stderr.trim().replace("Demo transcript: ", "");
  expect(path.startsWith(`${env.TMPDIR}/tsrm-demo-`)).toBe(true);
  expect(readFileSync(path, "utf8")).toBe(result.stdout);
  expect(readdirSync(work)).toEqual([]);
  expect(readdirSync(env.HOME!)).toEqual([]);
  expect(readdirSync(env.TMPDIR!)).toEqual([path.split("/").at(-2)!]);
  expect(readdirSync(path.slice(0, path.lastIndexOf("/")))).toEqual(["transcript.txt"]);
});

test("@claim:mit-free ships the MIT license", async () => {
  const license = readFileSync(resolve("LICENSE"), "utf8");
  expect(license).toContain("MIT License");
  expect(license).toContain("Permission is hereby granted, free of charge");
});

test("@claim:offline-docs reloads the demo without a network", async ({ page, context }) => {
  await page.goto("/demo");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const entries = await caches.open(keys[0]).then((cache) => cache.keys());
    return entries.map((entry) => new URL(entry.url).pathname);
  });
  expect(cached.some((path) => /^\/assets\/index-.*\.js$/.test(path))).toBe(true);
  expect(cached.some((path) => /^\/assets\/index-.*\.css$/.test(path))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Your command output stays with you" })).toBeVisible();
});

test("@claim:rust-version declares the documented Rust 1.85 minimum", async () => {
  const manifest = readFileSync(resolve("Cargo.toml"), "utf8");
  expect(manifest).toMatch(/^rust-version = "1\.85"$/m);
  expect(readFileSync(resolve("README.md"), "utf8")).toContain("Rust 1.85 or newer");
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
