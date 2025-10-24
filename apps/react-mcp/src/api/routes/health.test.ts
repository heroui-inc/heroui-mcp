/**
 * API Tests for Health Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Health API", () => {
  describe("GET /", () => {
    it("should return API information", async () => {
      const res = await SELF.fetch("http://localhost:8787/");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("description");
      expect(data).toHaveProperty("endpoints");
      expect(data.name).toBe("HeroUI React MCP API");
      expect(typeof data.endpoints).toBe("object");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const res = await SELF.fetch("http://localhost:8787/health");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("status", "healthy");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("environment");
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/health");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
