/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

import {ThemeDataInputSchema} from "../../shared/schemas/theme";
import {fetchApi} from "../lib/fetch";

/**
 * Tool to save a custom theme to the user's account
 * Requires authentication via HEROUI_API_KEY environment variable
 */
export const saveCustomThemeTool: Tool = {
  name: "save_custom_theme",
  description: `Save a custom HeroUI theme to your account.

⚠️ **IMPORTANT:** Use get_theme_info on "default" theme first to see the exact expected structure.

**When to use this tool:**
- User explicitly asks to save a theme
- User agrees when you proactively suggest saving
- User has created a custom theme they want to keep permanently

**After saving:**
- Confirm with the user: "✅ Your theme has been saved! You can access it later using get_theme_info with the theme name."

Required fields:
- name: string (1-100 chars) - Theme display name
- library: "react" | "native" - Target HeroUI library
- themeData: object - Theme definition with light and dark modes

The themeData object structure:
{
  "light": {
    "base": [],       // Foundational variables (colors, fonts, etc.)
    "semantic": [],   // Context-specific variables (backgrounds, text)
    "calculated": []  // Derived variables (shadows, gradients)
  },
  "dark": {           // Same structure as light
    "base": [],
    "semantic": [],
    "calculated": []
  }
}

Each variable in the arrays needs:
- name: string starting with -- (e.g., "--color-primary")
- value: string (CSS value, e.g., "oklch(0.7 0.25 260)")
- description: string (optional but recommended)
- category: "colors"|"typography"|"spacing"|"borders"|"shadows"|"animations" (optional)

🎯 Recommended workflow:
1. Call get_theme_info(theme="default") to see complete example
2. Copy the structure from themeData field
3. Modify values for your custom theme
4. Proactively suggest saving: "Would you like to save this theme to your account?"
5. If user agrees, call save_custom_theme with your data
6. After successful save, confirm: "✅ Your theme has been saved!"

Requires authentication - set HEROUI_API_KEY environment variable.
After saving, your theme will be available in get_theme_info tool.`,

  // Disable if no API key is configured
  disabled(config) {
    return !config.apiKey && !process.env.HEROUI_API_KEY;
  },

  exec(server, {config, name, description}) {
    const inputSchema = z.object({
      name: z
        .string()
        .min(1, "Theme name is required")
        .max(100, "Theme name too long")
        .describe("User-friendly name for the theme (e.g., 'My Dark Theme', 'Brand Colors')"),
      library: z
        .enum(["react", "native"], {
          errorMap: () => ({message: "Library must be 'react' or 'native'"}),
        })
        .describe("The HeroUI library this theme is for: 'react' or 'native'"),
      themeData: ThemeDataInputSchema.describe(`Theme data matching HeroUI theme structure.

Required structure (NO name field - that's in the top-level parameter):
{
  "light": {
    "base": [],       // Array of CSS variables
    "semantic": [],   // Array of CSS variables
    "calculated": []  // Array of CSS variables
  },
  "dark": {
    "base": [],
    "semantic": [],
    "calculated": []
  }
}

Each variable object needs:
- name: "--variable-name" (must start with --)
- value: "css-value" (any valid CSS value)
- description: "explanation" (optional but recommended)
- category: "colors"|"typography"|etc (optional)

Minimal example:
{
  "light": {
    "base": [
      {"name": "--color-accent", "value": "oklch(0.7 0.25 260)", "category": "colors"}
    ],
    "semantic": [],
    "calculated": []
  },
  "dark": {
    "base": [],
    "semantic": [
      {"name": "--color-background", "value": "oklch(0.2 0.02 260)"}
    ],
    "calculated": []
  }
}

💡 Pro tip: Call get_theme_info(theme="default") and copy the themeData structure directly.`),
    });

    const handler = async ({name, library, themeData}: z.infer<typeof inputSchema>) => {
      try {
        const result = await fetchApi<any>("/custom-themes", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({
            name,
            library,
            themeData,
          }),
        });

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to save theme");
        }

        const theme = result.data;

        return {
          content: [
            {
              type: "text" as const,
              text: `✅ Theme saved successfully!

**Theme ID:** ${theme.id}
**Name:** ${theme.name}
**Library:** ${theme.library}
**Created:** ${new Date(theme.createdAt).toISOString()}

Your custom theme is now available! You can access it using the \`get_theme_info\` tool by specifying the theme name "${theme.name}".`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `❌ Error saving theme: ${error instanceof Error ? error.message : String(error)}

**Note:** This tool requires authentication. Make sure HEROUI_API_KEY environment variable is set with a valid API key.`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
