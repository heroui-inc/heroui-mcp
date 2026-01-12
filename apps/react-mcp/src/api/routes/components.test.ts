/**
 * API Tests for Components Routes
 * Tests all component endpoints with various scenarios including validation
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Components API", () => {
  describe("GET /components", () => {
    it("should return list of components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.components)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/components");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("GET /components/:component/docs", () => {
    it("should return component documentation for valid component", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/Button/docs");

      // Might return 200 or 404 depending on if docs are available
      expect([200, 404]).includes(res.status);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("component", "Button");
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("content");
        expect(data).toHaveProperty("contentType");
        expect(data.url).toMatch(/v3\.heroui\.com\/docs\/react\/components\/button\.mdx/);
      }
    });

    it("should convert PascalCase component names to kebab-case", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/ButtonGroup/docs");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data.url).toMatch(/button-group/);
      }
    });

    it("should handle non-existent components gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/NonExistentComponent/docs");

      expect(res.status).toBe(404);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/Button/docs");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("POST /components/source", () => {
    it("should return component source code for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/source", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("should validate request body", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/source", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({invalid: "data"}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /components/styles", () => {
    it("should return component styles for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/styles", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("should validate request body", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/styles", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: null}),
      });

      expect(res.status).toBe(400);
    });
  });
});
