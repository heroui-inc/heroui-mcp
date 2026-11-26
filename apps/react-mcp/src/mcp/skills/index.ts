/**
 * Skills over MCP (io.modelcontextprotocol/skills)
 *
 * Serves the HeroUI skills alongside the tools, so clients that support the
 * extension (Claude, Claude Code, ...) can load the HeroUI playbook on demand
 * without a separate install. Clients without the extension ignore it and keep
 * using the tools and server instructions.
 *
 * The skills are not bundled: the HeroUI repository's `skills/` folder is the
 * single source. The extraction pipeline copies it to R2 whenever the docs
 * deploy, `/v1/skills` serves it, and this module builds the catalog from that
 * response, refreshing it while the server runs.
 */

import type {SkillsDataset} from "../../shared/types/skills";
import type {SkillCatalog, SkillFiles} from "@modelcontextprotocol/server/ext/skills";

import {AsyncLocalStorage} from "node:async_hooks";

import {SkillsExtension, memorySkillFiles} from "@modelcontextprotocol/server/ext/skills";

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

/**
 * Skill files whose contents can be replaced without serving a file that does
 * not match the catalog's manifest.
 *
 * The catalog checks every file it serves against the size and digest in the
 * snapshot it last built, and reads the contents live. Swapping the contents
 * before `reload()` has built the new snapshot would make reads during the
 * reload fail that check. So reads made inside `replace` (the reload's own walk)
 * see the incoming files, every other read sees the files the current snapshot
 * was built from, and the incoming files take over once the reload commits.
 */
function replaceableSkillFiles(initial: Record<string, string>) {
  let serving = memorySkillFiles(initial);
  const incoming = new AsyncLocalStorage<SkillFiles>();
  const current = () => incoming.getStore() ?? serving;

  const files: SkillFiles = {
    list: (dir) => current().list(dir),
    read: (path) => current().read(path),
  };

  /** Runs `reload` against `next`, and serves `next` only if it succeeds. */
  const replace = async (next: Record<string, string>, reload: () => Promise<unknown>) => {
    const nextFiles = memorySkillFiles(next);

    await incoming.run(nextFiles, reload);
    // The catalog swapped its snapshot just before `reload` resolved, with no
    // I/O in between, so no read can see the new snapshot with the old files.
    serving = nextFiles;
  };

  return {files, replace};
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
    const files = replaceableSkillFiles(await fetchSkillFiles(apiBaseUrl));
    const catalog = await SkillsExtension.load(files.files, {
      cacheHint: SKILLS_CACHE_HINT,
      onWarning: ({path, message}) => {
        // eslint-disable-next-line no-console
        console.error(`Skill warning (${path}): ${message}`);
      },
    });

    const refresh = async () => {
      try {
        // On failure the catalog and the files both keep the current skills.
        await files.replace(await fetchSkillFiles(apiBaseUrl), () => catalog.reload());
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

/** How long a new connection waits for the skills before it is served without them. */
export const SKILLS_STARTUP_WAIT_MS = 5_000;

/**
 * Waits up to `ms` for `loading`, so a slow or unreachable API cannot hold up
 * the MCP handshake. If the skills are not ready by then, it resolves
 * `undefined` and the connection is served with the tools only.
 */
export async function waitForSkills(
  loading: Promise<LoadedSkills | undefined>,
  ms: number = SKILLS_STARTUP_WAIT_MS,
): Promise<LoadedSkills | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(`Skills not loaded within ${ms}ms; serving tools without skills`);
      resolve(undefined);
    }, ms);
  });

  try {
    return await Promise.race([loading, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}
