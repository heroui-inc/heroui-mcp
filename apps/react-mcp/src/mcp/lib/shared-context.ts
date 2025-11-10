import type {SharedContext} from "../types";

import {fetchApi} from "./fetch";

let cachedContext: SharedContext | null = null;

/**
 * Fetch shared initialization context from the /ctx endpoint
 * This is called once during MCP server initialization to populate
 * all tool input schemas with dynamic enums.
 *
 * Returns both the context and whether authentication was successful
 */
export async function getSharedContext(
  apiBaseUrl?: string,
): Promise<{context: SharedContext; isAuthenticated: boolean}> {
  // Return cached context if available
  if (cachedContext) {
    // If cached, check if we have an API key (indicates auth attempt was made)
    const hasApiKey = !!process.env.HEROUI_API_KEY;

    return {
      context: cachedContext,
      // If no API key, definitely not authenticated
      // If API key exists, assume it was valid when cached (optimistic)
      // In practice, invalid keys would have failed during initial fetch
      isAuthenticated: hasApiKey,
    };
  }

  try {
    const response = await fetchApi<{
      components: string[];
      themes: string[];
      docs: {
        paths: string[];
        categories: Array<{
          name: string;
          docs: Array<{title: string; path: string; description: string}>;
        }>;
      };
      version: string;
      timestamp: number;
      userId?: string; // Present if API key is valid
    }>("/ctx", apiBaseUrl);

    // Check if authentication was successful (userId present means valid API key)
    const isAuthenticated = !!response.userId;

    // Cache the context
    // Note: themes list from /ctx already includes custom themes for authenticated users
    cachedContext = {
      componentList: response.components || [],
      themeList: response.themes || ["default"],
      docPaths: response.docs?.paths || [],
      version: response.version || "unknown",
      timestamp: response.timestamp || Date.now(),
      isAuthenticated,
    };

    return {
      context: cachedContext,
      isAuthenticated,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch shared context:", error);

    // Return empty fallback context with no authentication
    const fallbackContext: SharedContext = {
      componentList: [],
      themeList: ["default"],
      docPaths: [],
      version: "unknown",
      timestamp: Date.now(),
      isAuthenticated: false,
    };

    return {
      context: fallbackContext,
      isAuthenticated: false,
    };
  }
}

/**
 * Clear the cached context (useful for testing or forced refresh)
 */
export function clearSharedContext(): void {
  cachedContext = null;
}
