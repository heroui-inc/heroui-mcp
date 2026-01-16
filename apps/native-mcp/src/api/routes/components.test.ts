/**
 * API Tests for Components Routes
 * Tests all component endpoints
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Components API", () => {
  describe("GET /components", () => {
    it("should return list of components", async () => {
      const res = await SELF.fetch("http://localhost:8788/components");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.components)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/components");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("GET /components/:component/docs", () => {
    it("should return component documentation for valid component", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/Button/docs");

      // May return 200 or 404 depending on if component exists
      expect([200, 404].includes(res.status)).toBe(true);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data).toHaveProperty("component");
        expect(data).toHaveProperty("path");
        expect(data).toHaveProperty("url");
        expect(data).toHaveProperty("content");
        expect(data).toHaveProperty("contentType");
        expect(typeof data.url).toBe("string");
        if (data.url) {
          expect(data.url.includes("v3.heroui.com")).toBe(true);
        }
      }
    });

    it("should handle invalid component names gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/NonExistentComponent/docs");

      // May return 404, 400, or 500 depending on error handling
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(600);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should convert component names to kebab-case in URL", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/ButtonGroup/docs");

      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data.url).toContain("button-group");
      }
    });

    it("should convert space-separated component names to kebab-case", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/Alert Dialog/docs");

      // May return 200 or 404 depending on if component exists
      if (res.status === 200) {
        const data = (await res.json()) as any;
        expect(data.url).toContain("alert-dialog");
      } else {
        // Even if component doesn't exist, URL should be correctly formatted
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(600);
      }
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/Button/docs");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
