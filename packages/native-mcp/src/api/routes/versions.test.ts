/**
 * API Tests for Versions Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Versions API", () => {
  describe("GET /versions", () => {
    it("should return version information", async () => {
      const res = await SELF.fetch("http://localhost:8788/versions");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("latest");
      expect(data).toHaveProperty("available");
      expect(data).toHaveProperty("count");
      expect(data.latest).toHaveProperty("components");
      expect(data.latest).toHaveProperty("theme");
      expect(Array.isArray(data.available)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/versions");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
