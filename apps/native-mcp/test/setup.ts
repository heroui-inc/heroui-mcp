import {env} from "cloudflare:test";
import {beforeAll} from "vitest";

import {R2_FIXTURES} from "./fixtures";

beforeAll(async () => {
  await Promise.all(
    Object.entries(R2_FIXTURES).map(([key, value]) =>
      env.R2.put(key, JSON.stringify(value), {
        httpMetadata: {contentType: "application/json"},
      }),
    ),
  );
});
