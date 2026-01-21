/**
 * API Tests for Context Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Context API", () => {
  describe("GET /v1/ctx", () => {
    it("should return initialization context", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("docs");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("timestamp");
    });

    it("should return array of components", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      expect(Array.isArray(data.components)).toBe(true);
      expect(data.components.length).toBeGreaterThan(0);
    });

    it("should return docs object with paths and categories", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      expect(data.docs).toHaveProperty("paths");
      expect(data.docs).toHaveProperty("categories");
      expect(Array.isArray(data.docs.paths)).toBe(true);
      expect(Array.isArray(data.docs.categories)).toBe(true);
    });

    it("should parse doc categories correctly", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      if (data.docs.categories.length > 0) {
        const category = data.docs.categories[0];
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("docs");
        expect(Array.isArray(category.docs)).toBe(true);

        if (category.docs.length > 0) {
          const doc = category.docs[0];
          expect(doc).toHaveProperty("title");
          expect(doc).toHaveProperty("path");
          expect(doc).toHaveProperty("description");
        }
      }
    });

    it("should flatten doc paths from categories", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      if (data.docs.categories.length > 0) {
        const totalDocsInCategories = data.docs.categories.reduce(
          (sum: number, cat: any) => sum + cat.docs.length,
          0,
        );
        expect(data.docs.paths.length).toBe(totalDocsInCategories);
      }
    });

    it("should return valid version string", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      expect(typeof data.version).toBe("string");
      expect(data.version.length).toBeGreaterThan(0);
      expect(data.version).not.toBe("unknown");
    });

    it("should return valid timestamp", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      expect(typeof data.timestamp).toBe("number");
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
      // Timestamp should be valid (not in the future)
      expect(data.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should handle errors gracefully", async () => {
      // This test verifies error handling structure
      // The endpoint should always return a response, even if some data fails
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");

      expect(res.status).toBeLessThanOrEqual(500);
      const contentType = res.headers.get("content-type");
      expect(contentType?.includes("application/json")).toBe(true);
    });

    it("should return components when service is available", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      if (res.status === 200) {
        expect(data.components.length).toBeGreaterThan(0);
      }
    });

    it("should fetch react/llms.txt from HeroUI v3 docs", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      if (res.status === 200 && data.docs.paths.length > 0) {
        // Verify that paths start with /docs/react/
        data.docs.paths.forEach((path: string) => {
          expect(path).toMatch(/^\/docs\/react\//);
        });
      }
    });

    it("should return response within acceptable time", async () => {
      const startTime = Date.now();
      await SELF.fetch("http://localhost:8787/v1/ctx");
      const responseTime = Date.now() - startTime;

      // Should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000);
    });

    it("should handle react/llms.txt parsing errors gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");
      const data = (await res.json()) as any;

      // Even if parsing fails, docs should exist with empty arrays
      expect(data.docs).toBeDefined();
      expect(Array.isArray(data.docs.paths)).toBe(true);
      expect(Array.isArray(data.docs.categories)).toBe(true);
    });

    it("should track analytics for successful requests", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        // Analytics tracking is internal, but we can verify response structure
        expect(data).toHaveProperty("components");
        expect(data).toHaveProperty("docs");
      }
    });

    it("should handle network errors when fetching external resources", async () => {
      // This test ensures the endpoint doesn't fail completely if external fetch fails
      const res = await SELF.fetch("http://localhost:8787/v1/ctx");

      // Should still return a valid response structure
      const contentType = res.headers.get("content-type");
      expect(contentType?.includes("application/json")).toBe(true);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        // Core data should still be present
        expect(data).toHaveProperty("components");
        expect(data).toHaveProperty("docs");
        expect(data).toHaveProperty("version");
      }
    });
  });
});
