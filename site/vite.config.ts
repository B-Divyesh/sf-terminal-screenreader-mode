import { defineConfig } from "vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const outDir = resolve(__dirname, "../dist/site");

function offlineShellPlugin() {
  return {
    name: "tsrm-offline-shell",
    closeBundle() {
      const indexPath = join(outDir, "index.html");
      const index = readFileSync(indexPath, "utf8");
      const assetPaths = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?]+)[^"]*"/g)].map((match) => match[1]);
      const core = [
        "/",
        "/demo",
        "/privacy",
        "/terms",
        "/favicon.svg",
        "/404.html",
        "/404.css",
        "/assets/signal-recovery-640.webp",
        "/assets/signal-recovery.webp",
        ...assetPaths,
      ];
      const uniqueCore = [...new Set(core)];
      const workerTemplate = readFileSync(resolve(__dirname, "public/sw.js"), "utf8");
      const worker = workerTemplate
        .replace('const CACHE = "tsrm-site-dev-v4";', 'const CACHE = "tsrm-site-v4";')
        .replace('const CORE = ["/", "/demo", "/privacy", "/terms", "/favicon.svg"];', `const CORE = ${JSON.stringify(uniqueCore)};`);
      writeFileSync(join(outDir, "sw.js"), worker);

      const titles: Record<string, string> = {
        demo: "Demo — Terminal Screenreader Mode",
        privacy: "Privacy — Terminal Screenreader Mode",
        terms: "Terms — Terminal Screenreader Mode",
      };
      for (const route of Object.keys(titles)) {
        const routeIndex = join(outDir, route, "index.html");
        mkdirSync(dirname(routeIndex), { recursive: true });
        const routeHtml = index
          .replace(/<title>[^<]+<\/title>/, `<title>${titles[route]}</title>`)
          .replace('href="https://terminal-screenreader-mode.sociobot.in/"', `href="https://terminal-screenreader-mode.sociobot.in/${route}"`);
        writeFileSync(routeIndex, routeHtml);
      }
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir,
    emptyOutDir: true,
    manifest: true,
    target: "es2022",
    sourcemap: true,
  },
  plugins: [offlineShellPlugin()],
});
