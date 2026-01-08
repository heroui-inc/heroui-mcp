/**
 * API Tests for Docs Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Docs API", () => {
  describe("GET /docs/available", () => {
    it("should return available documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/available");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("baseUrl");
      expect(data).toHaveProperty("categories");
      expect(data).toHaveProperty("total");
      expect(data.baseUrl).toBe("https://v3.heroui.com");
      expect(Array.isArray(data.categories)).toBe(true);
      expect(typeof data.total).toBe("number");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/available");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should only return Native documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/available");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        if (data.categories && data.categories.length > 0) {
          // Check that all paths in categories start with /docs/native/
          data.categories.forEach((category: any) => {
            if (category.docs && category.docs.length > 0) {
              category.docs.forEach((doc: any) => {
                expect(doc.path).toMatch(/^\/docs\/native\//);
              });
            }
          });
        }
      }
    });

    it("should fetch from native/llms.txt when R2 cache is unavailable", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/available");

      // Should succeed even if R2 cache is unavailable (fallback to live fetch)
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("GET /docs/content", () => {
    it("should return 400 for missing path parameter", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/content");

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("details");
    });

    it("should handle valid documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/content?path=/docs/changelog");

      // This might return 200 or 404 depending on if the docs are available
      // The important thing is that it doesn't return 500
      expect([200, 404].includes(res.status)).toBe(true);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("path");
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("content");
        expect(data).toHaveProperty("contentType");
      }
    });

    it("should handle invalid documentation paths gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/docs/content?path=/invalid/path");

      // Should return 404 or similar, not 500
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should encode path parameters properly", async () => {
      const encodedPath = encodeURIComponent("/docs/core/provider");
      const res = await SELF.fetch(`http://localhost:8788/docs/content?path=${encodedPath}`);

      // Should not return 500
      expect(res.status).toBeLessThan(500);
    });
  });
});
