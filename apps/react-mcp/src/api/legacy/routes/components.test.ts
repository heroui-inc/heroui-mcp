/**
 * Legacy API Tests for Components Routes
 * Tests legacy component endpoints (without /v1/ prefix)
 * These tests ensure legacy endpoints continue to work as expected
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Legacy Components API", () => {
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

  describe("POST /components", () => {
    it("should return component details for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBe(1);
      expect(data.results[0]).toHaveProperty("component", "Button");
    });

    it("should validate empty string instead of array", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ""}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error.issues[0].message).toBe("Expected array, received string");
    });

    it("should validate empty array", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: []}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error.issues[0].message).toBe("Components array cannot be empty");
    });

    it("should validate empty component names", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: [""]}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error.issues[0].message).toBe("Component name cannot be empty");
    });

    it("should validate non-string component names", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: [123, null, undefined]}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
    });

    it("should handle missing components field", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
    });

    it("should handle invalid JSON", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: "invalid json",
      });

      expect(res.status).toBe(500); // Hono throws 500 for malformed JSON

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("error");
    });

    it("should handle multiple valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button", "Card"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.results).toHaveLength(2);
      expect(data.results[0].component).toBe("Button");
      expect(data.results[1].component).toBe("Card");
    });
  });

  describe("POST /components/props", () => {
    it("should return component props for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/props", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBe(1);
      expect(data.results[0]).toHaveProperty("component", "Button");
      expect(data.results[0]).toHaveProperty("props");
    });

    it("should validate request body using Zod", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/props", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ""}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error.issues[0].message).toBe("Expected array, received string");
    });

    it("should handle empty array", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/props", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: []}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error.issues[0].message).toBe("Components array cannot be empty");
    });
  });

  describe("POST /components/examples", () => {
    it("should return component examples for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components/examples", {
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
      const res = await SELF.fetch("http://localhost:8787/components/examples", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: []}),
      });

      expect(res.status).toBe(400);
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

  describe("Edge Cases", () => {
    it("should handle non-existent components gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["NonExistentComponent"]}),
      });

      expect(res.status).toBe(200); // Should return 200 but with error in result

      const data = (await res.json()) as any;
      expect(data.results[0]).toHaveProperty("error");
    });

    it("should handle mixed valid and invalid components", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["Button", "NonExistentComponent"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.results).toHaveLength(2);
      expect(data.results[0].component).toBe("Button");
      expect(data.results[1].component).toBe("NonExistentComponent");
      expect(data.results[1]).toHaveProperty("error");
    });

    it("should trim whitespace from component names", async () => {
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["  Button  ", " Card "]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.results[0].component).toBe("Button");
      expect(data.results[1].component).toBe("Card");
    });

    it("should handle large component arrays", async () => {
      // Test with many components to ensure no performance issues
      const manyComponents = Array(10).fill("Button");
      const res = await SELF.fetch("http://localhost:8787/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: manyComponents}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.results).toHaveLength(10);
    });
  });
});
