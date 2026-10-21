import {cloudflareTest} from "@cloudflare/vitest-plugin";
import {defineConfig} from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.toml",
        environment: "test",
      },
    }),
  ],
  test: {
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
