import {defineWorkersConfig} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/dist-api/**",
        "**/*.test.ts",
        "**/*.config.{ts,js,mjs}",
        "**/scripts/**",
      ],
      include: ["src/**/*.ts"],
    },
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.toml",
          environment: "test",
        },
      },
    },
  },
});
