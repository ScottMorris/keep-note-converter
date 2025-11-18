import { defineConfig } from "vitest/config";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: [path.join(__dirname, "vitest.setup.ts")],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
});
