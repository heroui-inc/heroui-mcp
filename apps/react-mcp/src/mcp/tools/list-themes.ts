import type {Tool} from "../types";

import {fetchApi} from "../lib/fetch";

/**
 * Tool to list all available themes (default and user saved)
 * Premium tool - requires authentication
 * Free users cannot save themes, so this tool is premium-only
 */
export const listThemesTool: Tool = {
  name: "list_themes",
  description: `List all available HeroUI themes, including default theme and your saved themes.

⚠️ **PREMIUM TOOL**: This tool requires authentication via HEROUI_API_KEY.

**Returns:**
- Default theme (built-in HeroUI theme)
- User saved themes (themes you've saved to your account)

Use this tool to see all available themes before using \`get_theme\` to view theme details.
For default theme values and guidelines, use \`get_theme_rules\` (free).`,

  // Disable if no API key is configured (premium tool)
  disabled(config) {
    return !config.apiKey && !process.env.HEROUI_API_KEY;
  },

  exec(server, {config, name, description}) {
    // Register tool
    server.tool(name, description, {}, async () => {
      try {
        // Fetch stock themes from /themes endpoint
        let stockThemes: string[] = [];
        try {
          const themeSystem = await fetchApi<{
            themes?: Record<string, unknown>;
            latestVersion?: string;
          }>("/themes", config.apiBaseUrl);

          if (themeSystem.themes) {
            stockThemes = Object.keys(themeSystem.themes);
          } else {
            // Fallback to default if themes object is missing
            stockThemes = ["default"];
          }
        } catch {
          // If stock themes fetch fails, use default as fallback
          stockThemes = ["default"];
        }

        // Fetch custom themes from /custom-themes endpoint (requires auth)
        let customThemes: Array<{
          id: string;
          name: string;
          library: string;
          createdAt?: string;
          updatedAt?: string;
        }> = [];

        try {
          const customThemesResponse = await fetchApi<{
            success: boolean;
            data?: Array<{
              id: string;
              name: string;
              library: string;
              createdAt?: string;
              updatedAt?: string;
            }>;
          }>("/custom-themes?library=react", config.apiBaseUrl);

          if (customThemesResponse.success && Array.isArray(customThemesResponse.data)) {
            customThemes = customThemesResponse.data;
          }
        } catch {
          // If custom themes fetch fails (e.g., not authenticated), continue with stock themes only
          // This is expected for free users, but this tool is premium-only anyway
        }

        // Format the response
        let text = `# Available HeroUI Themes\n\n`;
        text += `⚠️ **PREMIUM TOOL**: This tool requires authentication.\n\n`;

        // Default theme section
        text += `## Default Theme\n\n`;
        if (stockThemes.length > 0) {
          stockThemes.forEach((theme) => {
            text += `- **${theme}** (default theme values)\n`;
          });
          text += `\n💡 **Tip**: Use \`get_theme_rules\` (free) to see all default theme variable values and guidelines.\n`;
        } else {
          text += `- No default theme available\n`;
        }

        text += `\n`;

        // User saved themes section
        text += `## User Saved Themes (${customThemes.length})\n\n`;
        if (customThemes.length > 0) {
          customThemes.forEach((theme) => {
            text += `- **${theme.name}**`;
            if (theme.createdAt) {
              const createdDate = new Date(theme.createdAt).toLocaleDateString();
              text += ` (created: ${createdDate})`;
            }
            text += `\n`;
          });
        } else {
          text += `- No saved themes yet\n`;
          text += `\n💡 **Tip**: Use \`save_theme\` to save your themes!\n`;
        }

        text += `\n---\n\n`;
        text += `**Total Themes:** ${stockThemes.length + customThemes.length}\n\n`;
        text += `- Use \`get_theme_rules\` (free) for default theme values and guidelines\n`;
        text += `- Use \`get_theme\` (premium) to view your saved themes\n`;

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error listing themes: ${error instanceof Error ? error.message : String(error)}

**Note:** This tool requires authentication. Make sure HEROUI_API_KEY environment variable is set with a valid API key.`,
            },
          ],
        };
      }
    });
  },
};
