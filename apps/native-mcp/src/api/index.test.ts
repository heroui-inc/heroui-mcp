/**
 * API Tests for Main Application
 * Tests error handling, 404s, and general app behavior
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Main API Application", () => {
  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const res = await SELF.fetch("http://localhost:8788/nonexistent");

      expect(res.status).toBe(404);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error", "Not found");
      expect(data).toHaveProperty("message", "The requested endpoint does not exist");
    });

    it("should have CORS headers on 404 responses", async () => {
      const res = await SELF.fetch("http://localhost:8788/nonexistent");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should handle malformed URLs gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/%");

      // Should not return 500
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("CORS Middleware", () => {
    it("should add CORS headers to all responses", async () => {
      const endpoints = ["/", "/components", "/docs/native/getting-started/theming"];

      for (const endpoint of endpoints) {
        const res = await SELF.fetch(`http://localhost:8788${endpoint}`);
        expect(res.headers.get("access-control-allow-origin")).toBe("*");
      }
    });

    it("should handle OPTIONS requests", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {method: "OPTIONS"});

      expect(res.status).toBeLessThanOrEqual(204); // Should be 200 or 204
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("Content-Type Handling", () => {
    it("should return JSON content type", async () => {
      const res = await SELF.fetch("http://localhost:8788/");

      const contentType = res.headers.get("content-type");
      expect(contentType).toBeTruthy();
      expect(contentType?.includes("application/json")).toBe(true);
    });

    it("should handle missing Content-Type header in GET requests", async () => {
      const res = await SELF.fetch("http://localhost:8788/components");

      // Should handle gracefully, not return 500
      expect(res.status).toBeLessThan(500);
    });
  });
});
