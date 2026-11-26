export const HEROUI_NATIVE_TARGET_BRANCH = "main";

export const HEROUI_NATIVE_GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/heroui-inc/heroui-native";

export const HEROUI_NATIVE_GITHUB_BASE = `${HEROUI_NATIVE_GITHUB_RAW_BASE}/${HEROUI_NATIVE_TARGET_BRANCH}`;

/**
 * The Agent Skills live in the HeroUI repository (`skills/<name>/` on v3), not in
 * heroui-native, so the skills extractor reads them from there.
 */
export const HEROUI_SKILLS_REPO = {owner: "heroui-inc", repo: "heroui", branch: "v3"} as const;

export const HEROUI_SKILLS_GITHUB_BASE = `https://raw.githubusercontent.com/${HEROUI_SKILLS_REPO.owner}/${HEROUI_SKILLS_REPO.repo}/refs/heads/${HEROUI_SKILLS_REPO.branch}`;

/** Skills under `skills/` in the HeroUI repository that this server publishes over MCP. */
export const HEROUI_NATIVE_SKILLS = ["heroui-native"];
