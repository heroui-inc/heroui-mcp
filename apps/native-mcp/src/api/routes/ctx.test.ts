/**
 * API Tests for Context Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Context API", () => {
  describe("GET /v1/ctx", () => {
    it("should return initialization context", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("docs");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("timestamp");
    });

    it("should return array of components", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");
      const data = (await res.json()) as any;

      expect(Array.isArray(data.components)).toBe(true);
    });

    it("should return docs object with paths and categories", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");
      const data = (await res.json()) as any;

      expect(data.docs).toHaveProperty("paths");
      expect(data.docs).toHaveProperty("categories");
      expect(Array.isArray(data.docs.paths)).toBe(true);
      expect(Array.isArray(data.docs.categories)).toBe(true);
    });

    it("should return valid version string", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");
      const data = (await res.json()) as any;

      expect(typeof data.version).toBe("string");
      expect(data.version.length).toBeGreaterThan(0);
    });

    it("should return valid timestamp", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");
      const data = (await res.json()) as any;

      expect(typeof data.timestamp).toBe("number");
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should handle errors gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");

      expect(res.status).toBeLessThanOrEqual(500);
      const contentType = res.headers.get("content-type");
      expect(contentType?.includes("application/json")).toBe(true);
    });

    it("should parse doc paths correctly", async () => {
      const res = await SELF.fetch("http://localhost:8788/v1/ctx");
      const data = (await res.json()) as any;

      if (res.status === 200 && data.docs.paths.length > 0) {
        // Verify that paths are native documentation paths
        data.docs.paths.forEach((path: string) => {
          expect(path).toMatch(/^\/docs\/native\//);
        });
      }
    });
  });
});
