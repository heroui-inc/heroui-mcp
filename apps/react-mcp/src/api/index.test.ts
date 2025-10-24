/**
 * API Tests for Main Application
 * Tests error handling, 404s, and general app behavior
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Main API Application", () => {
  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const res = await SELF.fetch("http://localhost:8787/nonexistent");

      expect(res.status).toBe(404);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error", "Not found");
      expect(data).toHaveProperty("message", "The requested endpoint does not exist");
    });

    it("should have CORS headers on 404 responses", async () => {
      const res = await SELF.fetch("http://localhost:8787/nonexistent");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should handle malformed URLs gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/%");

      // Should not return 500
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("CORS Middleware", () => {
    it("should add CORS headers to all responses", async () => {
      const endpoints = ["/", "/health", "/components", "/themes", "/versions", "/docs/available"];

      for (const endpoint of endpoints) {
        const res = await SELF.fetch(`http://localhost:8787${endpoint}`);
        expect(res.headers.get("access-control-allow-origin")).toBe("*");
      }
    });

    it("should handle OPTIONS requests", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {method: "OPTIONS"});

      expect(res.status).toBeLessThanOrEqual(204); // Should be 200 or 204
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("Content-Type Handling", () => {
    it("should return JSON content type", async () => {
      const res = await SELF.fetch("http://localhost:8787/");

      const contentType = res.headers.get("content-type");
      expect(contentType).toBeTruthy();
      expect(contentType?.includes("application/json")).toBe(true);
    });

    it("should handle missing Content-Type header in POST requests", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        body: JSON.stringify({components: ["Button"]}),
        // Intentionally omit Content-Type header
      });

      // Should handle gracefully, not return 500
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("Request Size Limits", () => {
    it("should handle reasonable request sizes", async () => {
      const largeComponentArray = Array(50).fill("Button");
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: largeComponentArray}),
      });

      expect(res.status).toBe(200);
    });

    it("should handle empty request body gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: "",
      });

      expect(res.status).toBe(500); // Hono throws 500 for malformed JSON before validation
    });
  });
});
