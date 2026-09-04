/**
 * Unit Tests for URL to GitHub path conversion
 */

import type {GitHubClient, GitHubFile} from "../services/github-client";

import {describe, expect, it} from "vitest";

import {findComponentFilePath, urlToGitHubPath} from "./url-to-path";

const COMPONENTS_PATH = "apps/docs/content/docs/en/react/components";

/**
 * Repository stub that only serves the paths it is given, so a wrong base path
 * fails the same way the GitHub API does (404 -> throw).
 */
function createGitHubStub(files: string[], dirs: Record<string, GitHubFile[]> = {}): GitHubClient {
  return {
    async fetchFile(_owner, _repo, path) {
      if (!files.includes(path)) {
        throw new Error(`GitHub API error: 404 Not Found for ${path}`);
      }

      return "# doc";
    },
    async listFiles(_owner, _repo, dirPath) {
      const items = dirs[dirPath];

      if (!items) {
        throw new Error(`GitHub API error: 404 Not Found for ${dirPath}`);
      }

      return items;
    },
    async getPackageVersion() {
      return "3.2.4";
    },
    async getDocsFiles() {
      return [];
    },
  };
}

describe("url-to-path", () => {
  describe("urlToGitHubPath", () => {
    it("should resolve to the locale-prefixed docs content path", () => {
      expect(urlToGitHubPath("/docs/react/components/button")).toBe(
        `${COMPONENTS_PATH}/button.mdx`,
      );
    });
  });

  describe("findComponentFilePath", () => {
    it("should find a component stored directly under the components path", async () => {
      const github = createGitHubStub([`${COMPONENTS_PATH}/button.mdx`]);

      await expect(
        findComponentFilePath(github, "/docs/react/components/button", "button"),
      ).resolves.toBe(`${COMPONENTS_PATH}/button.mdx`);
    });

    it("should find a component nested in a category folder", async () => {
      const github = createGitHubStub([`${COMPONENTS_PATH}/(buttons)/button.mdx`], {
        [COMPONENTS_PATH]: [
          {name: "(buttons)", path: `${COMPONENTS_PATH}/(buttons)`, type: "dir"},
          {name: "index.mdx", path: `${COMPONENTS_PATH}/index.mdx`, type: "file"},
        ],
      });

      await expect(
        findComponentFilePath(github, "/docs/react/components/button", "button"),
      ).resolves.toBe(`${COMPONENTS_PATH}/(buttons)/button.mdx`);
    });

    it("should return null when the component does not exist", async () => {
      const github = createGitHubStub([], {[COMPONENTS_PATH]: []});

      await expect(
        findComponentFilePath(github, "/docs/react/components/nope", "nope"),
      ).resolves.toBeNull();
    });
  });
});
