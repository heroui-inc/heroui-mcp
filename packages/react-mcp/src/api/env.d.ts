/**
 * Test environment types for cloudflare:test module
 */

import type {Env} from "./types";

declare module "cloudflare:test" {
  // ProvidedEnv controls the type of `import("cloudflare:test").env`
  interface ProvidedEnv extends Env {
    // Add any test-specific bindings here if needed
  }
}
