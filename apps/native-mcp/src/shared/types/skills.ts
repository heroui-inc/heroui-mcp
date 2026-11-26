/**
 * Agent Skills extracted from the HeroUI repository (`skills/<name>/`) and
 * served to the MCP server, which publishes them over the Skills extension.
 */
export interface SkillsDataset {
  /** HeroUI Native version the skills were extracted with (e.g. `v1.0.0`). */
  version: string;
  timestamp: number;
  /** Skill name → path inside the skill folder (`SKILL.md`, `references/x.md`) → file text. */
  skills: Record<string, Record<string, string>>;
}
