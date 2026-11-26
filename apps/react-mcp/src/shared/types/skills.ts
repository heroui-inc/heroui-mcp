/**
 * Agent Skills extracted from the HeroUI repository (`skills/<name>/`) and
 * served to the MCP server, which publishes them over the Skills extension.
 */
export interface SkillsDataset {
  /** HeroUI React version the skills were extracted with (e.g. `v3.2.8`). */
  version: string;
  timestamp: number;
  /** Skill name → path inside the skill folder (`SKILL.md`, `references/x.md`) → file text. */
  skills: Record<string, Record<string, string>>;
}
