/**
 * API Tests for Skills Routes
 */

import {SELF} from "cloudflare:test";
import {describe, expect, it} from "vitest";

import {FIXTURE_SKILL_MD} from "../../../test/fixtures";

describe("Skills API", () => {
  describe("GET /v1/skills", () => {
    it("returns every skill with its files", async () => {
      const res = await SELF.fetch("http://localhost:8787/v1/skills");

      expect(res.status).toBe(200);

      const data = (await res.json()) as any;

      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("timestamp");
      expect(Object.keys(data.skills)).toEqual(["heroui-react"]);
      expect(data.skills["heroui-react"]["SKILL.md"]).toBe(FIXTURE_SKILL_MD);
    });
  });
});
