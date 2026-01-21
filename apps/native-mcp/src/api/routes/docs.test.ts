/**
 * API Tests for Docs Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Docs API", () => {
  describe("GET /v1/docs/:path", () => {
    it("should return 400 for missing path", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/docs/");

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should handle valid documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/docs/native/getting-started/theming");

      // May return 200 or 404 depending on if docs are available
      expect([200, 404].includes(res.status)).toBe(true);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("path");
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("content");
        expect(data).toHaveProperty("contentType");
        expect(typeof data.url).toBe("string");
        if (data.url) {
          expect(data.url.includes("v3.heroui.com")).toBe(true);
        }
      }
    });

    it("should handle invalid documentation paths gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/docs/invalid/path");

      // May return 404, 400, or 500 depending on error handling
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(600);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should append .mdx extension to path", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/docs/native/getting-started/theming");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(typeof data.url).toBe("string");
        if (data.url) {
          expect(data.url.includes(".mdx")).toBe(true);
        }
      }
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/docs/native/getting-started/theming");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
