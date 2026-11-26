/**
 * Skills over MCP (io.modelcontextprotocol/skills)
 *
 * Serves the HeroUI Native skill alongside the tools, so clients that support the
 * extension (Claude, Claude Code, ...) can load the HeroUI Native playbook on demand
 * without a separate install. Clients without the extension ignore it and keep
 * using the tools and server instructions.
 *
 * The skills are not bundled: the HeroUI repository's `skills/` folder is the
 * single source. The extraction pipeline copies it to R2 whenever the docs
 * deploy, `/v1/skills` serves it, and this module builds the catalog from that
 * response, refreshing it while the server runs.
 */

import type {SkillsDataset} from "../../shared/types/skills";
import type {SkillCatalog} from "@modelcontextprotocol/server/ext/skills";

import {memorySkillFiles, SkillsExtension} from "@modelcontextprotocol/server/ext/skills";

import {fetchApi} from "../lib/fetch";

/** Clients may reuse a listing for this long before asking again. */
const SKILLS_CACHE_HINT = {ttlMs: 5 * 60 * 1000, cacheScope: "public"} as const;

/** How often a running server checks the API for updated skills. */
export const SKILLS_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

/** Flattens the API response into `<skill>/<path>` keys, as a skill catalog reads them. */
export function toSkillFiles(dataset: SkillsDataset): Record<string, string> {
  const files: Record<string, string> = {};

  for (const [name, skillFiles] of Object.entries(dataset.skills ?? {})) {
    for (const [path, text] of Object.entries(skillFiles)) {
      files[`${name}/${path}`] = text;
    }
  }

  return files;
}

async function fetchSkillFiles(apiBaseUrl?: string): Promise<Record<string, string>> {
  return toSkillFiles(await fetchApi<SkillsDataset>("/v1/skills", apiBaseUrl));
}

function replaceContents(target: Record<string, string>, source: Record<string, string>): void {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, source);
}

export interface LoadedSkills {
  catalog: SkillCatalog;
  /**
   * Fetches the skills again and swaps them in. Connected clients are told
   * when the listing changes. On failure the current skills keep serving.
   */
  refresh(): Promise<void>;
}

/**
 * Loads the skills from the HeroUI API. Attach the catalog to every server
 * instance before it connects (`catalog.attach(server)`). When the API is
 * unreachable or serves invalid skills, it logs to stderr and returns
 * `undefined`, so the tools are served without skills.
 */
export async function loadSkills(apiBaseUrl?: string): Promise<LoadedSkills | undefined> {
  try {
    // The catalog re-reads this record on every reload, so a refresh updates it in place.
    const record = await fetchSkillFiles(apiBaseUrl);
    const catalog = await SkillsExtension.load(memorySkillFiles(record), {
      cacheHint: SKILLS_CACHE_HINT,
      onWarning: ({path, message}) => {
        // eslint-disable-next-line no-console
        console.error(`Skill warning (${path}): ${message}`);
      },
    });

    const refresh = async () => {
      try {
        const next = await fetchSkillFiles(apiBaseUrl);
        const previous = {...record};

        replaceContents(record, next);

        try {
          await catalog.reload();
        } catch (error) {
          // The catalog keeps serving the old skills; keep the record in step with it.
          replaceContents(record, previous);
          throw error;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to refresh skills; keeping the current ones:", error);
      }
    };

    return {catalog, refresh};
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load skills; serving tools without skills:", error);

    return undefined;
  }
}
