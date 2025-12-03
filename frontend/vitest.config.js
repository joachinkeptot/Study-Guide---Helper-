import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.js"],
    include: ["src/**/*.{test,spec}.{js,ts}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/tests/", "*.config.js", ".svelte-kit/"],
    },
  },
  resolve: {
    alias: {
      $lib: resolve("./src/lib"),
      $stores: resolve("./src/stores"),
      $app: resolve("./node_modules/@sveltejs/kit/src/runtime/app"),
    },
  },
});
