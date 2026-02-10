/**
 * API Tests for Health Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Health API", () => {
  describe("GET /", () => {
    it("should return health status", async () => {
      const res = await SELF.fetch("http://localhost:8788/health");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("status", "healthy");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("environment");
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
