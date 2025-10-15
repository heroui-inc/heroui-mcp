/**
 * API Tests for Versions Routes
 */

import type {ApiError, PackageVersionResponse, VersionsResponse} from "../types/responses";

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

describe("Versions API", () => {
  describe("GET /versions", () => {
    it("should return version information", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions");

      expect(res.status).toBe(200);

      const data = (await res.json()) as VersionsResponse;
      expect(data).toHaveProperty("heroui");
      expect(data).toHaveProperty("mcp");
      expect(data.heroui).toHaveProperty("latest");
      expect(data.heroui).toHaveProperty("versions");
      expect(data.mcp).toHaveProperty("current");
      expect(Array.isArray(data.heroui.versions)).toBe(true);
    });

    it("should have proper CORS headers", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions");

      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("GET /versions/:package", () => {
    it("should return heroui package version info", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions/heroui");

      expect(res.status).toBe(200);

      const data = (await res.json()) as PackageVersionResponse;
      expect(data).toHaveProperty("package", "heroui");
      expect(data).toHaveProperty("currentVersion");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("isLatest");
      expect(data).toHaveProperty("availableVersions");
      expect(Array.isArray(data.availableVersions)).toBe(true);
    });

    it("should return mcp package version info", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions/mcp");

      expect(res.status).toBe(200);

      const data = (await res.json()) as PackageVersionResponse;
      expect(data).toHaveProperty("package", "mcp");
      expect(data).toHaveProperty("currentVersion");
      expect(data).toHaveProperty("latestVersion");
      expect(data).toHaveProperty("isLatest", true);
    });

    it("should return 400 for invalid package names", async () => {
      const res = await SELF.fetch("http://localhost:8787/versions/invalid-package");

      expect(res.status).toBe(400);

      const data = (await res.json()) as ApiError;
      expect(data).toHaveProperty("error");
      const errorMessage = data.error;
      expect(errorMessage.includes("Invalid package")).toBe(true);
    });
  });
});
