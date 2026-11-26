/**
 * Skills extractor: copies HeroUI Agent Skills from the HeroUI repository
 * (`skills/<name>/`) into R2, so the MCP server always serves the skills on
 * the release branch without shipping its own copy.
 */

import type {SkillsDataset} from "../../shared/types/skills";
import type {GitHubClient} from "../services/github-client";

import {HEROUI_REACT_SKILLS, HEROUI_REACT_TARGET_BRANCH} from "../constants";
import {SimpleGitHubClient} from "../services/github-client";

import {BaseExtractor} from "./base";

const OWNER = "heroui-inc";
const REPO = "heroui";

/**
 * Only instructions and references are served. `scripts/` is left out: an MCP
 * client cannot run a skill's scripts from the user's project, and the server's
 * tools fetch the same data.
 */
const EXCLUDED_DIRS = new Set(["scripts"]);
const TEXT_EXTENSIONS = [".md", ".txt"];

export class SkillsExtractor extends BaseExtractor {
  private github: GitHubClient;

  constructor(github: GitHubClient = new SimpleGitHubClient(process.env.GITHUB_TOKEN)) {
    super();
    this.github = github;
  }

  getStorageKey(): string {
    return "heroui-skills";
  }

  getStorageType(): "skills" {
    return "skills";
  }

  async extract(): Promise<{data: SkillsDataset}> {
    console.log("🧠 Extracting HeroUI skills...");

    const version = await this.getVersionFromGitHub();
    const skills: SkillsDataset["skills"] = {};

    for (const name of HEROUI_REACT_SKILLS) {
      const files = await this.extractSkill(name);

      if (!files["SKILL.md"]) {
        throw new Error(`skills/${name} has no SKILL.md on ${HEROUI_REACT_TARGET_BRANCH}`);
      }

      skills[name] = files;
      console.log(`  ✓ ${name}: ${Object.keys(files).join(", ")}`);
    }

    return {
      data: {
        version: version.startsWith("v") ? version : `v${version}`,
        timestamp: Date.now(),
        skills,
      },
    };
  }

  /** Every served file under `skills/<name>/`, keyed by its path inside the skill folder. */
  private async extractSkill(name: string): Promise<Record<string, string>> {
    const root = `skills/${name}`;
    const files: Record<string, string> = {};

    const walk = async (dir: string): Promise<void> => {
      const items = await this.github.listFiles(OWNER, REPO, dir, HEROUI_REACT_TARGET_BRANCH);

      for (const item of items) {
        const relativePath = item.path.slice(root.length + 1);

        if (item.type === "dir") {
          if (!EXCLUDED_DIRS.has(relativePath.split("/")[0])) {
            await walk(item.path);
          }
        } else if (TEXT_EXTENSIONS.some((extension) => item.name.endsWith(extension))) {
          files[relativePath] = await this.fetchText(item.path);
        }
      }
    };

    await walk(root);

    return files;
  }

  private async fetchText(path: string): Promise<string> {
    const response = await fetch(`${this.githubBase}/${path}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }

    return await response.text();
  }
}
