// Declares the bindings the tests touch. The repo does not check in a
// generated worker-configuration.d.ts, so `Cloudflare.Env` is augmented here.
// Keep this file import-free so it stays a global declaration.
declare namespace Cloudflare {
  interface Env {
    R2: import("@cloudflare/workers-types").R2Bucket;
  }
}
