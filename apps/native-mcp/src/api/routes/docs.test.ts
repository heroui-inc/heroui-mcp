/**
 * API Tests for Docs Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Docs API", () => {
  describe("GET /docs/:path", () => {
    it("should return 400 for missing path", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/");

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should handle valid documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/native/getting-started/theming");

      // May return 200 or 404 depending on if docs are available
      expect([200, 404].includes(res.status)).toBe(true);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("path");
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("content");
        expect(data).toHaveProperty("contentType");
        expect(data.url).toContain("v3.heroui.com");
      }
    });

    it("should handle invalid documentation paths gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/invalid/path");

      // Should return 404 or similar, not 500
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should append .mdx extension to path", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/native/getting-started/theming");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data.url).toContain(".mdx");
      }
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/native/getting-started/theming");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
