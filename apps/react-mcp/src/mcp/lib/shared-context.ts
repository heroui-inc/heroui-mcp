import type {SharedContext} from "../types";

import {fetchApi} from "./fetch";

let cachedContext: SharedContext | null = null;

/**
 * Fetch shared initialization context from the /v1/ctx endpoint
 * This is called once during MCP server initialization to populate
 * all tool input schemas with dynamic enums.
 */
export async function getSharedContext(apiBaseUrl?: string): Promise<SharedContext> {
  // Return cached context if available
  if (cachedContext) {
    return cachedContext;
  }

  try {
    const response = await fetchApi<{
      components: string[];
      docs: {
        paths: string[];
        categories: Array<{
          name: string;
          docs: Array<{title: string; path: string; description: string}>;
        }>;
      };
      version: string;
      timestamp: number;
    }>("/v1/ctx", apiBaseUrl);

    // Cache the context
    cachedContext = {
      componentList: response.components || [],
      docPaths: response.docs?.paths || [],
      version: response.version || "unknown",
      timestamp: response.timestamp || Date.now(),
    };

    return cachedContext;
  } catch (error) {
    console.error("Failed to fetch shared context:", error);

    // Return empty fallback context
    return {
      componentList: [],
      docPaths: [],
      version: "unknown",
      timestamp: Date.now(),
    };
  }
}

/**
 * Clear the cached context (useful for testing or forced refresh)
 */
export function clearSharedContext(): void {
  cachedContext = null;
}
