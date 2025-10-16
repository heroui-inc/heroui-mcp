import {defineWorkersConfig} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    env: {
      NODE_ENV: "test",
    },
    poolOptions: {
      workers: {
        wrangler: {configPath: "./wrangler.toml"},
      },
    },
  },
});
