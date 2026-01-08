/**
 * API Tests for Context Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Context API", () => {
  describe("GET /ctx", () => {
    it("should return initialization context", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("examples");
      expect(data).toHaveProperty("themes");
      expect(data).toHaveProperty("docs");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("timestamp");
    });

    it("should return array of components", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      expect(Array.isArray(data.components)).toBe(true);
      expect(data.components.length).toBeGreaterThan(0);
    });

    it("should return array of examples", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      expect(Array.isArray(data.examples)).toBe(true);
      expect(data.examples.length).toBeGreaterThan(0);
    });

    it("should return array of themes", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      expect(Array.isArray(data.themes)).toBe(true);
      expect(data.themes.length).toBeGreaterThan(0);
      expect(data.themes.includes("default")).toBe(true);
    });

    it("should return docs object with paths array", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      expect(data.docs).toHaveProperty("paths");
      expect(Array.isArray(data.docs.paths)).toBe(true);
    });

    it("should return valid version string", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      expect(typeof data.version).toBe("string");
      expect(data.version.length).toBeGreaterThan(0);
      expect(data.version).not.toBe("unknown");
    });

    it("should return valid timestamp", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      expect(typeof data.timestamp).toBe("number");
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
      // Timestamp should be recent (within last minute)
      expect(Date.now() - data.timestamp).toBeLessThan(60000);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should handle errors gracefully", async () => {
      // This test verifies error handling structure
      // The endpoint should always return a response, even if some data fails
      const res = await SELF.fetch("http://localhost:8787/ctx");

      expect(res.status).toBeLessThanOrEqual(500);
      const contentType = res.headers.get("content-type");
      expect(contentType?.includes("application/json")).toBe(true);
    });

    it("should return components and examples when services are available", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      if (res.status === 200) {
        // Both components and examples should be populated
        expect(data.components.length).toBeGreaterThan(0);
        expect(data.examples.length).toBeGreaterThan(0);
      }
    });

    it("should parse doc paths from README", async () => {
      const res = await SELF.fetch("http://localhost:8787/ctx");
      const data = (await res.json()) as any;

      if (res.status === 200 && data.docs.paths.length > 0) {
        // Verify that paths are native documentation paths from v3.heroui.com
        data.docs.paths.forEach((path: string) => {
          expect(path).toMatch(/^\/docs\/native\//);
        });
      }
    });

    it("should return response within acceptable time", async () => {
      const startTime = Date.now();
      await SELF.fetch("http://localhost:8787/ctx");
      const responseTime = Date.now() - startTime;

      // Should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000);
    });
  });
});
