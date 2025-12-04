import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Using Vercel adapter for deployment
    adapter: adapter({
      runtime: "nodejs20.x",
      regions: ["iad1"], // US East
      split: false,
    }),
    alias: {
      $stores: "src/stores",
      $lib: "src/lib",
    },
  },

  // Suppress warnings about unknown props (like 'params' from SvelteKit internal routing)
  onwarn: (warning, handler) => {
    if (warning.code === "a11y-missing-attribute") return;
    if (warning.message.includes("unknown prop")) return;
    handler(warning);
  },
};

export default config;
