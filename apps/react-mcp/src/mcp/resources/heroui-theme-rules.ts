import type {Resource, ResourceConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {fetchApi} from "../lib/fetch";

import {formatThemeRules} from "./lib/format-theme-rules";

/**
 * HeroUI Theme Rules Resource
 *
 * Provides comprehensive theme guidelines, structure documentation, and default theme variable values.
 * This resource fetches data from R2 storage via the API endpoint and formats it for agents.
 *
 * Features:
 * - Theme structure (base, semantic, calculated layers)
 * - Variable naming conventions
 * - CSS variable format requirements
 * - Theme guides (theming, colors, styling, animation, composition, design principles)
 * - Complete default theme variable values
 * - Shared variables and animation presets
 * - Workflow guidelines for authenticated users
 */
export const heroUIThemeRulesResource: Resource = {
  name: "heroui-theme-rules",
  description:
    "HeroUI theme guidelines, structure documentation, and default theme variable values. " +
    "Includes theme structure, CSS variable format, default values, shared variables, animations, " +
    "and comprehensive theme guides. Fetched from R2 storage via API.",

  exec: (server: McpServer, {config}: {config?: ResourceConfig}) => {
    const apiBaseUrl =
      config?.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp-api.heroui.com";

    server.resource(
      "heroui://theme-rules",
      "heroui://theme-rules",
      {
        description:
          "HeroUI theme guidelines, structure documentation, and default theme variable values. " +
          "Includes theme structure, CSS variable format, default values, shared variables, animations, " +
          "and comprehensive theme guides.",
        mimeType: "text/markdown",
      },
      async (uri) => {
        try {
          // Fetch the complete theme system with guides and default theme from API
          // API endpoint reads from R2 storage via ThemeService
          const themeSystem = await fetchApi<{
            version: string;
            themes: {
              default?: {
                light: {
                  base: Array<{
                    name: string;
                    value: string;
                    description?: string;
                    category?: string;
                  }>;
                  semantic: Array<{
                    name: string;
                    value: string;
                    description?: string;
                    category?: string;
                  }>;
                  calculated: Array<{
                    name: string;
                    value: string;
                    description?: string;
                    category?: string;
                  }>;
                };
                dark: {
                  base: Array<{
                    name: string;
                    value: string;
                    description?: string;
                    category?: string;
                  }>;
                  semantic: Array<{
                    name: string;
                    value: string;
                    description?: string;
                    category?: string;
                  }>;
                  calculated: Array<{
                    name: string;
                    value: string;
                    description?: string;
                    category?: string;
                  }>;
                };
              };
            };
            sharedVariables: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            animations: {
              timings: Array<{
                name: string;
                value: string;
                description?: string;
              }>;
              presets: Array<{
                name: string;
                value: string;
                description?: string;
              }>;
            };
            guides: {
              theming?: {
                title: string;
                description: string;
                content: string;
              };
              colors?: {
                title: string;
                description: string;
                content: string;
              };
              styling?: {
                title: string;
                description: string;
                content: string;
              };
              animation?: {
                title: string;
                description: string;
                content: string;
              };
              composition?: {
                title: string;
                description: string;
                content: string;
              };
              designPrinciples?: {
                title: string;
                description: string;
                content: string;
              };
              quickStart?: {
                title: string;
                description: string;
                content: string;
              };
            };
          }>("/themes", apiBaseUrl);

          // Check authentication for workflow guidelines
          const isAuthenticated = !!(config?.apiKey || process.env.HEROUI_API_KEY);

          // Format content using shared formatter
          const content = formatThemeRules(themeSystem, isAuthenticated);

          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: "text/markdown",
                text: content,
              },
            ],
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch theme rules from API:", error);

          // Return error message as resource content
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: "text/plain",
                text: `Error loading HeroUI theme rules: ${error instanceof Error ? error.message : String(error)}

**Troubleshooting:**
- Ensure the API is accessible at ${apiBaseUrl}
- Check network connectivity
- Verify API endpoint /themes is available

Please try again later or contact support if the issue persists.`,
              },
            ],
          };
        }
      },
    );
  },
};
