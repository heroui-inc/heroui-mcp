/**
 * API Tests for Components Routes
 * Tests all component endpoints with various scenarios including validation
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Components API", () => {
  describe("GET /v1/components", () => {
    it("should return list of components", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.components)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("POST /v1/components/docs", () => {
    it("should return component documentation for valid component", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/docs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty("component", "Button");
        expect(result).toHaveProperty("url");
        expect(result).toHaveProperty("content");
        expect(result).toHaveProperty("contentType");
        expect(result.url).toMatch(/v3\.heroui\.com\/docs\/react\/components\/button\.mdx/);
      }
    });

    it("should convert PascalCase component names to kebab-case", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/docs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["ButtonGroup"]}),
      });

      if (res.status === 200) {
        const data = (await res.json()) as any;
        if (data.results.length > 0 && data.results[0].url) {
          expect(data.results[0].url).toMatch(/button-group/);
        }
      }
    });

    it("should convert space-separated component names to kebab-case", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/docs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Alert Dialog"]}),
      });

      if (res.status === 200) {
        const data = (await res.json()) as any;
        if (data.results.length > 0 && data.results[0].url) {
          expect(data.results[0].url).toMatch(/alert-dialog/);
        }
      }
    });

    it("should handle non-existent components gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/docs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["NonExistentComponent"]}),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data).toHaveProperty("results");
      if (data.results.length > 0) {
        expect(data.results[0]).toHaveProperty("error");
      }
    });

    it("should validate request body", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/docs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({invalid: "data"}),
      });

      expect(res.status).toBe(400);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/docs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button"]}),
      });

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("POST /v1/components/source", () => {
    it("should return component source code for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/source", {
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
      const res = await SELF.fetch("http://localhost:8787/v1/components/source", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({invalid: "data"}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /v1/components/styles", () => {
    it("should return component styles for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/components/styles", {
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
      const res = await SELF.fetch("http://localhost:8787/v1/components/styles", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: null}),
      });

      expect(res.status).toBe(400);
    });
  });
});
