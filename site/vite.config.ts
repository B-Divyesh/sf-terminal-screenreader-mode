import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "../dist/site"),
    emptyOutDir: true,
    manifest: true,
    target: "es2022",
    sourcemap: true,
  },
});
