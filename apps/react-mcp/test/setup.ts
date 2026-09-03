import {env} from "cloudflare:test";
import {beforeAll} from "vitest";

import {LLMS_TXT, R2_FIXTURES} from "./fixtures";

const LLMS_TXT_URL = "https://heroui.com/llms.txt";

beforeAll(async () => {
  await Promise.all(
    Object.entries(R2_FIXTURES).map(([key, value]) =>
      env.R2.put(key, JSON.stringify(value), {
        httpMetadata: {contentType: "application/json"},
      }),
    ),
  );

  // Only llms.txt is served from the fixture; every other request still goes
  // out to the docs site. `cloudflare:test` no longer exports `fetchMock`, so
  // the global is patched directly.
  const originalFetch = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);

    if (url === LLMS_TXT_URL) {
      return Promise.resolve(
        new Response(LLMS_TXT, {status: 200, headers: {"content-type": "text/plain"}}),
      );
    }

    return originalFetch(input, init);
  }) as typeof globalThis.fetch;
});
