/**
 * Legacy API Tests for Components Routes
 * Tests legacy component endpoints (without /v1/ prefix)
 * These tests ensure legacy endpoints continue to work as expected
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Legacy Components API", () => {
  describe("GET /components", () => {
    it("should return list of components and examples", async () => {
      const res = await SELF.fetch("http://localhost:8788/components");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("components");
      expect(data).toHaveProperty("examples");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.components)).toBe(true);
      expect(Array.isArray(data.examples)).toBe(true);
      expect(typeof data.count).toBe("number");
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8788/components");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("POST /components", () => {
    it("should return component details for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {
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

    it("should validate missing components field", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({invalid: "data"}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error.issues[0].message).toBe("Required");
    });

    it("should validate empty array", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {
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
      const res = await SELF.fetch("http://localhost:8788/components", {
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

    it("should trim whitespace from component names", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["  Button  ", " Card "]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.results[0].component).toBe("Button");
      expect(data.results[1].component).toBe("Card");
    });

    it("should handle multiple valid components", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {
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

    it("should handle non-existent components gracefully", async () => {
      const res = await SELF.fetch("http://localhost:8788/components", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: ["NonExistentComponent"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.results[0]).toHaveProperty("error");
    });
  });

  describe("POST /components/props", () => {
    it("should return component props for valid components", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/props", {
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

    it("should validate request body", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/props", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({invalid: "data"}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
    });

    it("should validate empty array", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/props", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({components: []}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data.error.issues[0].message).toBe("Components array cannot be empty");
    });
  });

  describe("POST /components/examples", () => {
    it("should return component examples for valid examples", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/examples", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({examples: ["button"]}),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("results");
      expect(data).toHaveProperty("dependencies");
      expect(Array.isArray(data.results)).toBe(true);
      expect(Array.isArray(data.dependencies)).toBe(true);
    }, 15000);

    it("should validate request body", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/examples", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({invalid: "data"}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
    });

    it("should validate empty array", async () => {
      const res = await SELF.fetch("http://localhost:8788/components/examples", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({examples: []}),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data).toHaveProperty("success", false);
      expect(data.error.issues[0].message).toBe("Examples array cannot be empty");
    });
  });

  describe("Edge Cases", () => {
    it("should handle large component arrays", async () => {
      const manyComponents = Array(10).fill("Button");
      const res = await SELF.fetch("http://localhost:8788/components", {
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
