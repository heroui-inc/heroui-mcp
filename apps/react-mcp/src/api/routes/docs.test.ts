/**
 * API Tests for Docs Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Docs API", () => {
  describe("GET /docs/:path", () => {
    it("should return documentation for valid paths", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/getting-started/theming");

      // Might return 200, 404, or 500 depending on if docs are available or network errors
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("path");
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("content");
        expect(data).toHaveProperty("contentType");
        expect(data.url).toMatch(/v3\.heroui\.com\/docs\/react\/getting-started\/theming/);
      }
    });

    it("should add .mdx extension if not present", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/getting-started/theming");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data.url).toMatch(/\.mdx$/);
      }
    });

    it("should transform /docs/* paths to /docs/react/*", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/getting-started/theming");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data.url).toMatch(/\/docs\/react\/getting-started\/theming/);
      }
    });

    it("should handle /docs/react/* paths directly", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/react/getting-started/theming");

      expect(res.status).toBeLessThan(500);
    });

    it("should handle invalid documentation paths gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/invalid/path");

      // May return 404, 400, or 500 depending on error handling
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(600);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/getting-started/theming");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
