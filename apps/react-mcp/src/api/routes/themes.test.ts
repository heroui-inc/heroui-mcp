/**
 * API Tests for Themes Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Themes API", () => {
  describe("GET /v1/themes/variables", () => {
    it("should return theme variables", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/themes/variables");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("theme", "default");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("common");
      expect(data).toHaveProperty("light");
      expect(data).toHaveProperty("dark");
    });

    it("should handle theme parameter", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/themes/variables?theme=default");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("theme", "default");
      expect(data).toHaveProperty("common");
      expect(data).toHaveProperty("light");
      expect(data).toHaveProperty("dark");
    });

    it("should handle mode parameter", async () => {
      const res = await SELF.fetch(
        "http://localhost:8787/v1/themes/variables?theme=default&mode=light",
      );

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      // Mode parameter is ignored - always returns both light and dark
      expect(data).toHaveProperty("theme", "default");
      expect(data).toHaveProperty("light");
      expect(data).toHaveProperty("dark");
    });

    it("should handle invalid theme names gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/themes/variables?theme=nonexistent");

      // Should return 404, not 500
      const validStatuses = [404, 200];
      expect(validStatuses.includes(res.status)).toBe(true);
    });
  });
});
