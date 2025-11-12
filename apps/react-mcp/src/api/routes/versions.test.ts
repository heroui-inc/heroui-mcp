/**
 * API Tests for Versions Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Versions API", () => {
  describe("GET /versions", () => {
    it("should return version information", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("herouiReact");
      expect(data).toHaveProperty("mcp");
      expect(data.herouiReact).toHaveProperty("latest");
      expect(data.herouiReact).toHaveProperty("versions");
      expect(data.mcp).toHaveProperty("current");
      expect(Array.isArray(data.herouiReact.versions)).toBe(true);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });
});
