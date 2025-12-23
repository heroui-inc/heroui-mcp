/**
 * API Tests for Docs Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Docs API", () => {
  describe("GET /docs/available", () => {
    it("should return available documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/available");

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
      const res = await SELF.fetch("http://localhost:8787/docs/available");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("GET /docs/content", () => {
    it("should return 400 for missing path parameter", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/content");

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
      const errorMessage = data.error;
      expect(errorMessage.includes("Missing required query parameter: path")).toBe(true);
    });

    it("should handle valid documentation paths", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/content?path=/docs/getting-started");

      // This might return 200 or 404 depending on if the docs are available
      // The important thing is that it doesn't return 500
      expect([200, 404]).includes(res.status);

      const data = (await res.json()) as any;
      if (res.status === 200) {
        const successData = data as any;
        expect(successData).toHaveProperty("path");
        expect(successData).toHaveProperty("url");
        expect(successData).toHaveProperty("content");
        expect(successData).toHaveProperty("contentType");
      } else {
        const errorData = data as any;
        expect(errorData).toHaveProperty("error");
      }
    });

    it("should handle invalid documentation paths gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/docs/content?path=/invalid/path");

      // Should return 404 or similar, not 500
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should encode path parameters properly", async () => {
      const encodedPath = encodeURIComponent("/docs/components/button");
      const res = await SELF.fetch(`http://localhost:8787/docs/content?path=${encodedPath}`);

      // Should not return 500
      expect(res.status).toBeLessThan(500);
    });
  });
});
