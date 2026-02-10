/**
 * Legacy API Tests for Themes Routes
 * Tests legacy theme endpoints (without /v1/ prefix)
 * These tests ensure legacy endpoints continue to work as expected
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Legacy Themes API", () => {
  describe("GET /themes", () => {
    it("should return theme system data", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("themes");
      expect(data).toHaveProperty("sharedVariables");
      expect(data).toHaveProperty("animations");
      expect(typeof data.themes).toBe("object");
    });

    it("should handle version parameter", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes?version=v3.0.0-alpha.33");

      // Should not return 500
      expect(res.status).toBeLessThan(500);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("GET /themes/variables", () => {
    it("should return theme variables", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes/variables");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("themes");
      expect(data).toHaveProperty("count");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("latestVersion");
      expect(Array.isArray(data.themes)).toBe(true);
    });

    it("should handle theme parameter", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes/variables?theme=default");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("theme", "default");
      expect(data).toHaveProperty("common");
      expect(data).toHaveProperty("light");
      expect(data).toHaveProperty("dark");
    });

    it("should handle mode parameter", async () => {
      const res = await SELF.fetch(
        "http://localhost:8787/themes/variables?theme=default&mode=light",
      );

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("theme", "default");
      expect(data).toHaveProperty("mode", "light");
      expect(data).toHaveProperty("variables");
    });

    it("should handle invalid theme names gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes/variables?theme=nonexistent");

      // Should return 404, not 500
      const validStatuses = [404, 200];
      expect(validStatuses.includes(res.status)).toBe(true);
    });
  });

  describe("GET /themes/colors", () => {
    it("should return color variables", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes/colors");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("themes");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.themes)).toBe(true);
    });

    it("should filter color variables correctly", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes/colors?theme=default&mode=light");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("colors");
      expect(Array.isArray(data.colors)).toBe(true);
    });
  });

  describe("GET /themes/animations", () => {
    it("should return animation definitions", async () => {
      const res = await SELF.fetch("http://localhost:8787/themes/animations");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("timings");
      expect(data).toHaveProperty("presets");
      expect(data).toHaveProperty("version");
      expect(Array.isArray(data.timings)).toBe(true);
      expect(Array.isArray(data.presets)).toBe(true);
    });
  });
});
